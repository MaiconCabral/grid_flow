<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsTest extends TestCase
{
    use RefreshDatabase;

    /** Saves the agency name, theme, and color for that tenant only. */
    public function test_admin_saves_agency_settings(): void
    {
        $admin = $this->member(UserRole::AgencyAdmin);
        $other = Tenant::factory()->create(['name' => 'Other Agency']);

        $this->as($admin)->patchJson('/api/v1/settings', [
            'name' => 'North Studio',
            'theme' => 'light',
            'accent' => '#c084fc',
        ])->assertOk()
            ->assertJsonPath('name', 'North Studio')
            ->assertJsonPath('theme', 'light')
            ->assertJsonPath('accent', '#c084fc')
            ->assertJsonPath('plan', 'studio')
            ->assertJsonPath('slug', $admin->tenant->slug);

        $this->assertDatabaseHas('tenants', [
            'id' => $admin->tenant_id,
            'name' => 'North Studio',
            'theme' => 'light',
            'accent' => '#c084fc',
        ]);
        $this->assertDatabaseHas('tenants', [
            'id' => $other->id,
            'name' => 'Other Agency',
            'theme' => 'dark',
            'accent' => '#bbff52',
        ]);
    }

    /** Lets other roles read settings and blocks their updates. */
    public function test_other_roles_can_read_but_not_update(): void
    {
        $admin = $this->member(UserRole::AgencyAdmin);
        $designer = $this->member(UserRole::Designer, $admin->tenant);

        $this->as($admin)->patchJson('/api/v1/settings', ['name' => 'Shared Name'])->assertOk();

        $this->as($designer)->getJson('/api/v1/settings')
            ->assertOk()
            ->assertJsonPath('name', 'Shared Name');

        $this->as($designer)->patchJson('/api/v1/settings', ['name' => 'Taken'])->assertForbidden();
        $this->assertDatabaseHas('tenants', ['id' => $admin->tenant_id, 'name' => 'Shared Name']);
    }

    /** Rejects a color outside the allowed list. */
    public function test_colors_must_be_one_of_the_options(): void
    {
        $admin = $this->member(UserRole::AgencyAdmin);

        $this->as($admin)->patchJson('/api/v1/settings', ['accent' => '#000000'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('accent');
    }

    /** Keeps a neighboring agency on its own settings. */
    public function test_another_agency_keeps_its_own_settings(): void
    {
        $admin = $this->member(UserRole::AgencyAdmin);
        $neighbor = $this->member(UserRole::AgencyAdmin);

        $this->as($admin)->patchJson('/api/v1/settings', [
            'name' => 'Alpha House',
            'theme' => 'light',
        ])->assertOk();

        $this->as($neighbor)->getJson('/api/v1/settings')
            ->assertOk()
            ->assertJsonPath('name', $neighbor->tenant->name)
            ->assertJsonPath('theme', 'dark');
    }

    /** Creates a user in an agency. */
    private function member(UserRole $role, ?Tenant $tenant = null): User
    {
        $tenant ??= Tenant::factory()->create();

        return User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => $role,
        ]);
    }

    /** Sends the following request as that user and agency. */
    private function as(User $user): static
    {
        return $this->withHeader('Authorization', 'Bearer '.$user->createToken('api')->plainTextToken)
            ->withHeader('X-Tenant-ID', (string) $user->tenant_id);
    }
}
