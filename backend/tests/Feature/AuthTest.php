<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Workspace;
use App\Support\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_creates_an_agency_and_its_admin(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'agency_name' => 'North Studio',
            'agency_slug' => 'north-studio',
            'name' => 'Ana Costa',
            'email' => 'ana@northstudio.test',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertCreated()
            ->assertJsonPath('tenant.slug', 'north-studio')
            ->assertJsonPath('user.role', 'agency_admin')
            ->assertJsonPath('user.email', 'ana@northstudio.test');

        $this->assertNotEmpty($response->json('token'));
        $this->assertDatabaseHas('tenants', ['slug' => 'north-studio']);
    }

    public function test_login_and_logout(): void
    {
        $user = User::factory()->create([
            'email' => 'jordan@agency-alpha.test',
            'password' => 'password',
        ]);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => 'jordan@agency-alpha.test',
            'password' => 'password',
        ]);

        $login->assertOk()
            ->assertJsonPath('user.email', $user->email)
            ->assertJsonPath('tenant.id', $user->tenant_id);

        $token = $login->json('token');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/v1/auth/logout')
            ->assertNoContent();

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized();
    }

    public function test_login_rejects_a_wrong_password(): void
    {
        User::factory()->create([
            'email' => 'jordan@agency-alpha.test',
            'password' => 'password',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'jordan@agency-alpha.test',
            'password' => 'nope-nope',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_me_requires_the_matching_tenant_header(): void
    {
        $user = User::factory()->create();
        $other = Tenant::factory()->create();
        $token = $user->createToken('api')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/auth/me')
            ->assertForbidden();

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->withHeader('X-Tenant-ID', (string) $other->id)
            ->getJson('/api/v1/auth/me')
            ->assertForbidden();

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->withHeader('X-Tenant-ID', (string) $user->tenant_id)
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('tenant.slug', $user->tenant->slug);
    }

    public function test_users_are_isolated_by_tenant_and_role(): void
    {
        $alpha = Tenant::factory()->create();
        app(TenantContext::class)->set($alpha->id);
        $workspace = Workspace::factory()->create(['tenant_id' => $alpha->id, 'name' => 'Aster & Co.']);
        $admin = User::factory()->create([
            'tenant_id' => $alpha->id,
            'role' => UserRole::AgencyAdmin,
        ]);
        User::factory()->create([
            'tenant_id' => $alpha->id,
            'role' => UserRole::Designer,
            'email' => 'sarah@agency-alpha.test',
        ]);

        $horizon = Tenant::factory()->create();
        app(TenantContext::class)->set($horizon->id);
        User::factory()->create([
            'tenant_id' => $horizon->id,
            'email' => 'helena@horizon-studio.test',
            'role' => UserRole::AgencyAdmin,
        ]);
        app(TenantContext::class)->forget();

        $this->assertSame(0, User::query()->count());

        app(TenantContext::class)->set($alpha->id);
        $this->assertSame(2, User::query()->count());

        $token = $admin->createToken('api')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->withHeader('X-Tenant-ID', (string) $horizon->id)
            ->getJson('/api/v1/users')
            ->assertForbidden();

        $listed = $this->withHeader('Authorization', 'Bearer '.$token)
            ->withHeader('X-Tenant-ID', (string) $alpha->id)
            ->getJson('/api/v1/users');

        $listed->assertOk();
        $emails = collect($listed->json('data'))->pluck('email');
        $this->assertTrue($emails->contains('sarah@agency-alpha.test'));
        $this->assertFalse($emails->contains('helena@horizon-studio.test'));

        $designer = User::withoutGlobalScopes()->where('email', 'sarah@agency-alpha.test')->first();
        $designerToken = $designer->createToken('api')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$designerToken)
            ->withHeader('X-Tenant-ID', (string) $alpha->id)
            ->getJson('/api/v1/users')
            ->assertForbidden();

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->withHeader('X-Tenant-ID', (string) $alpha->id)
            ->postJson('/api/v1/users', [
                'name' => 'Olivia Chen',
                'email' => 'olivia@aster.test',
                'password' => 'password',
                'role' => 'client',
                'workspace_id' => $workspace->id,
            ])->assertCreated()
            ->assertJsonPath('role', 'client')
            ->assertJsonPath('workspace_id', $workspace->id);
    }
}
