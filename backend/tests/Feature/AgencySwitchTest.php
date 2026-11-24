<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Membership;
use App\Models\Tenant;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AgencySwitchTest extends TestCase
{
    use RefreshDatabase;

    /** Lets one person open each agency they belong to and no other. */
    public function test_a_person_can_open_each_linked_agency(): void
    {
        $alpha = Tenant::factory()->create(['name' => 'Agency Alpha', 'slug' => 'agency-alpha']);
        $horizon = Tenant::factory()->create(['name' => 'Horizon Studio', 'slug' => 'horizon-studio']);
        $other = Tenant::factory()->create();
        $alphaAdmin = User::factory()->create([
            'tenant_id' => $alpha->id,
            'role' => UserRole::AgencyAdmin,
        ]);
        $horizonAdmin = User::factory()->create([
            'tenant_id' => $horizon->id,
            'role' => UserRole::AgencyAdmin,
        ]);
        $maya = User::factory()->create([
            'tenant_id' => $alpha->id,
            'role' => UserRole::Designer,
            'email' => 'maya@studios.test',
            'password' => 'password',
        ]);
        Membership::query()->create([
            'user_id' => $maya->id,
            'tenant_id' => $horizon->id,
            'role' => UserRole::Copywriter,
        ]);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => 'maya@studios.test',
            'password' => 'password',
        ]);

        $login->assertOk()
            ->assertJsonPath('tenant.id', $alpha->id)
            ->assertJsonPath('user.role', 'designer');
        $this->assertEqualsCanonicalizing(
            ['agency-alpha', 'horizon-studio'],
            collect($login->json('agencies'))->pluck('slug')->all(),
        );

        $token = $login->json('token');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->withHeader('X-Tenant-ID', (string) $horizon->id)
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('tenant.slug', 'horizon-studio')
            ->assertJsonPath('user.role', 'copywriter');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->withHeader('X-Tenant-ID', (string) $other->id)
            ->getJson('/api/v1/auth/me')
            ->assertForbidden();

        $alphaTeam = $this->as($alphaAdmin)->getJson('/api/v1/users')->assertOk()->json('data');
        $this->assertSame('designer', collect($alphaTeam)->firstWhere('email', 'maya@studios.test')['role']);

        $horizonTeam = $this->as($horizonAdmin)->getJson('/api/v1/users')->assertOk()->json('data');
        $this->assertSame('copywriter', collect($horizonTeam)->firstWhere('email', 'maya@studios.test')['role']);

        $switched = $this->withHeader('Authorization', 'Bearer '.$token)
            ->withHeader('X-Tenant-ID', (string) $alpha->id)
            ->postJson('/api/v1/auth/switch-agency', ['tenant_id' => $horizon->id]);

        $switched->assertOk()
            ->assertJsonPath('tenant.id', $horizon->id)
            ->assertJsonPath('user.role', 'copywriter');
        $this->assertArrayNotHasKey('token', $switched->json());

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->withHeader('X-Tenant-ID', (string) $alpha->id)
            ->postJson('/api/v1/auth/switch-agency', ['tenant_id' => $other->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('tenant_id');

        $this->as($horizonAdmin)->patchJson("/api/v1/users/{$maya->id}", [
            'name' => 'Maya Costa',
            'email' => 'maya@studios.test',
            'role' => 'agency_admin',
        ])->assertOk()->assertJsonPath('role', 'agency_admin');

        $this->assertDatabaseHas('users', [
            'id' => $maya->id,
            'role' => 'designer',
            'tenant_id' => $alpha->id,
        ]);
        $this->assertDatabaseHas('memberships', [
            'user_id' => $maya->id,
            'tenant_id' => $horizon->id,
            'role' => 'agency_admin',
        ]);
    }

    /** Drops one agency link and keeps the account for the other agency. */
    public function test_removing_one_agency_keeps_the_account(): void
    {
        $alpha = Tenant::factory()->create();
        $horizon = Tenant::factory()->create();
        $admin = User::factory()->create([
            'tenant_id' => $alpha->id,
            'role' => UserRole::AgencyAdmin,
        ]);
        $maya = User::factory()->create([
            'tenant_id' => $alpha->id,
            'role' => UserRole::Designer,
            'email' => 'maya@studios.test',
        ]);
        Membership::query()->create([
            'user_id' => $maya->id,
            'tenant_id' => $horizon->id,
            'role' => UserRole::Designer,
        ]);

        $this->as($admin)->deleteJson("/api/v1/users/{$maya->id}")->assertNoContent();

        $this->assertDatabaseHas('users', ['id' => $maya->id, 'tenant_id' => $horizon->id, 'role' => 'designer']);
        $this->assertDatabaseMissing('memberships', ['user_id' => $maya->id, 'tenant_id' => $alpha->id]);
        $this->assertDatabaseHas('memberships', ['user_id' => $maya->id, 'tenant_id' => $horizon->id]);

        app(TenantContext::class)->forget();
        $this->assertSame(0, User::query()->count());
    }

    /** Sends the following request as that user and agency. */
    private function as(User $user): static
    {
        return $this->withHeader('Authorization', 'Bearer '.$user->createToken('api')->plainTextToken)
            ->withHeader('X-Tenant-ID', (string) $user->tenant_id);
    }
}
