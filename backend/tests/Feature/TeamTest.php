<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeamTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_manages_team_and_brands(): void
    {
        $admin = $this->admin();

        $created = $this->as($admin)->postJson('/api/v1/workspaces', ['name' => 'Lumen Atelier']);
        $created->assertCreated()->assertJsonPath('name', 'Lumen Atelier')->assertJsonPath('clients', []);
        $workspaceId = $created->json('id');

        $this->as($admin)->patchJson("/api/v1/workspaces/{$workspaceId}", ['name' => 'Lumen House'])
            ->assertOk()
            ->assertJsonPath('name', 'Lumen House');

        $this->as($admin)->postJson('/api/v1/users', [
            'name' => 'Rafael Mendes',
            'email' => 'rafael@horizon-studio.test',
            'password' => 'password',
            'role' => 'designer',
        ])->assertCreated()
            ->assertJsonPath('role', 'designer')
            ->assertJsonPath('workspace_id', null);

        $client = $this->as($admin)->postJson('/api/v1/users', [
            'name' => 'Beatriz Almeida',
            'email' => 'beatriz@lumen.test',
            'password' => 'password',
            'role' => 'client',
            'workspace_id' => $workspaceId,
        ]);
        $client->assertCreated()->assertJsonPath('workspace_name', 'Lumen House');

        $this->as($admin)->patchJson('/api/v1/users/'.$client->json('id'), [
            'name' => 'Beatriz Lima',
            'email' => 'beatriz@lumen.test',
            'role' => 'client',
            'workspace_id' => $workspaceId,
        ])->assertOk()->assertJsonPath('name', 'Beatriz Lima');

        $this->as($admin)->getJson('/api/v1/users')
            ->assertOk()
            ->assertJsonFragment(['email' => 'rafael@horizon-studio.test']);

        $this->as($admin)->getJson('/api/v1/workspaces')
            ->assertOk()
            ->assertJsonPath('data.0.clients.0.email', 'beatriz@lumen.test');

        $this->as($admin)->deleteJson("/api/v1/workspaces/{$workspaceId}")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('workspace');

        $this->as($admin)->deleteJson('/api/v1/users/'.$client->json('id'))->assertNoContent();
        $this->as($admin)->deleteJson("/api/v1/workspaces/{$workspaceId}")->assertNoContent();
        $this->assertDatabaseMissing('workspaces', ['id' => $workspaceId]);
    }

    public function test_client_requires_a_brand_from_the_agency(): void
    {
        $admin = $this->admin();
        $other = Tenant::factory()->create();
        $foreign = Workspace::factory()->create(['tenant_id' => $other->id]);

        $this->as($admin)->postJson('/api/v1/users', [
            'name' => 'No Brand',
            'email' => 'nobrand@agency.test',
            'password' => 'password',
            'role' => 'client',
        ])->assertUnprocessable()->assertJsonValidationErrors('workspace_id');

        $this->as($admin)->postJson('/api/v1/users', [
            'name' => 'Foreign Client',
            'email' => 'foreign@agency.test',
            'password' => 'password',
            'role' => 'client',
            'workspace_id' => $foreign->id,
        ])->assertUnprocessable()->assertJsonValidationErrors('workspace_id');
    }

    public function test_other_roles_cannot_manage_the_agency(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->create(['tenant_id' => $tenant->id, 'role' => UserRole::AgencyAdmin]);
        $designer = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => UserRole::Designer,
            'email' => 'sarah@agency-alpha.test',
        ]);
        $copywriter = User::factory()->create(['tenant_id' => $tenant->id, 'role' => UserRole::Copywriter]);

        $this->as($designer)->getJson('/api/v1/users')->assertForbidden();
        $this->as($designer)->getJson('/api/v1/workspaces')->assertForbidden();
        $this->as($designer)->postJson('/api/v1/users', [
            'name' => 'Extra',
            'email' => 'extra@agency.test',
            'password' => 'password',
            'role' => 'designer',
        ])->assertForbidden();
        $this->as($copywriter)->deleteJson("/api/v1/users/{$admin->id}")->assertForbidden();
    }

    public function test_records_from_another_agency_stay_hidden(): void
    {
        $admin = $this->admin();
        $other = Tenant::factory()->create();
        $foreignUser = User::factory()->create(['tenant_id' => $other->id, 'role' => UserRole::Designer]);
        $foreignWorkspace = Workspace::factory()->create(['tenant_id' => $other->id, 'name' => 'Other Brand']);

        $this->as($admin)->patchJson("/api/v1/users/{$foreignUser->id}", [
            'name' => 'Taken',
            'email' => $foreignUser->email,
            'role' => 'designer',
        ])->assertNotFound();

        $this->as($admin)->patchJson("/api/v1/workspaces/{$foreignWorkspace->id}", [
            'name' => 'Taken',
        ])->assertNotFound();

        $listed = $this->as($admin)->getJson('/api/v1/workspaces')->assertOk()->json('data');
        $this->assertNotContains('Other Brand', collect($listed)->pluck('name'));
    }

    public function test_the_last_admin_cannot_be_removed_or_demoted(): void
    {
        $admin = $this->admin();
        $second = User::factory()->create([
            'tenant_id' => $admin->tenant_id,
            'role' => UserRole::AgencyAdmin,
            'email' => 'second@agency.test',
        ]);

        $this->as($admin)->deleteJson("/api/v1/users/{$admin->id}")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('user');

        $this->as($admin)->deleteJson("/api/v1/users/{$second->id}")->assertNoContent();

        $this->as($admin)->patchJson("/api/v1/users/{$admin->id}", [
            'name' => $admin->name,
            'email' => $admin->email,
            'role' => 'designer',
        ])->assertUnprocessable()->assertJsonValidationErrors('role');
    }

    private function admin(): User
    {
        $tenant = Tenant::factory()->create();

        return User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => UserRole::AgencyAdmin,
        ]);
    }

    private function as(User $user): static
    {
        return $this->withHeader('Authorization', 'Bearer '.$user->createToken('api')->plainTextToken)
            ->withHeader('X-Tenant-ID', (string) $user->tenant_id);
    }
}
