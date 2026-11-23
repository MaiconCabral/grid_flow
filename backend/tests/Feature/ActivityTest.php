<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ActivityTest extends TestCase
{
    use RefreshDatabase;

    /** Covers creation by an admin and rejection of the other roles. */
    public function test_only_an_admin_can_create_a_task(): void
    {
        [$admin, $brand, $designer] = $this->agency();
        $client = User::factory()->create([
            'tenant_id' => $admin->tenant_id,
            'role' => UserRole::Client,
            'workspace_id' => $brand->id,
        ]);

        $payload = [
            'workspace_id' => $brand->id,
            'assignee_id' => $designer->id,
            'title' => 'Summer launch',
            'briefing' => 'Five frames for the drop.',
            'channel' => 'instagram',
            'format' => 'carousel',
            'due_on' => '2026-08-19',
        ];

        $created = $this->as($admin)->postJson('/api/v1/activities', $payload);
        $created->assertCreated()
            ->assertJsonPath('status', 'todo')
            ->assertJsonPath('workspace.name', $brand->name)
            ->assertJsonPath('events.0.type', 'created');

        $this->as($designer)->postJson('/api/v1/activities', $payload)->assertForbidden();
        $this->as($client)->postJson('/api/v1/activities', $payload)->assertForbidden();

        $this->as($admin)->patchJson('/api/v1/activities/'.$created->json('id'), [
            'status' => 'approved',
        ])->assertUnprocessable()->assertJsonValidationErrors('status');
    }

    /** Hides one agency's tasks from another agency. */
    public function test_tasks_stay_inside_the_agency(): void
    {
        [$admin, $brand] = $this->agency();
        $id = $this->as($admin)->postJson('/api/v1/activities', [
            'workspace_id' => $brand->id,
            'title' => 'Private task',
            'briefing' => 'Only Alpha should see this.',
            'channel' => 'linkedin',
            'format' => 'post',
        ])->assertCreated()->json('id');

        $other = User::factory()->create(['role' => UserRole::AgencyAdmin]);

        $this->as($other)->getJson('/api/v1/activities')
            ->assertOk()
            ->assertJsonPath('data', []);

        $this->as($other)->getJson("/api/v1/activities/{$id}")->assertNotFound();
    }

    /** Lets the brand client approve and blocks the admin and other brands. */
    public function test_only_the_brand_client_can_approve(): void
    {
        [$admin, $brand, $designer, $otherBrand] = $this->agency();
        $client = User::factory()->create([
            'tenant_id' => $admin->tenant_id,
            'role' => UserRole::Client,
            'workspace_id' => $brand->id,
        ]);
        $neighbor = User::factory()->create([
            'tenant_id' => $admin->tenant_id,
            'role' => UserRole::Client,
            'workspace_id' => $otherBrand->id,
        ]);

        $id = $this->as($admin)->postJson('/api/v1/activities', [
            'workspace_id' => $brand->id,
            'title' => 'Needs a yes',
            'briefing' => 'Ready for the client.',
            'channel' => 'facebook',
            'format' => 'post',
        ])->json('id');

        $this->as($admin)->patchJson("/api/v1/activities/{$id}", ['status' => 'pending'])->assertOk();

        $this->as($admin)->postJson("/api/v1/activities/{$id}/approve")->assertForbidden();
        $this->as($neighbor)->postJson("/api/v1/activities/{$id}/approve")->assertForbidden();
        $this->as($neighbor)->getJson("/api/v1/activities/{$id}")->assertForbidden();

        $this->as($client)->postJson("/api/v1/activities/{$id}/approve")
            ->assertOk()
            ->assertJsonPath('status', 'approved')
            ->assertJsonPath('events.2.type', 'approved');

        $this->as($client)->getJson('/api/v1/activities')
            ->assertOk()
            ->assertJsonPath('data.0.title', 'Needs a yes')
            ->assertJsonMissing(['name' => $otherBrand->name]);
    }

    /** Sends a task back to production with the client's note. */
    public function test_the_client_can_request_changes(): void
    {
        [$admin, $brand] = $this->agency();
        $client = User::factory()->create([
            'tenant_id' => $admin->tenant_id,
            'role' => UserRole::Client,
            'workspace_id' => $brand->id,
        ]);
        $id = $this->as($admin)->postJson('/api/v1/activities', [
            'workspace_id' => $brand->id,
            'title' => 'Needs a note',
            'briefing' => 'Almost there.',
            'channel' => 'tiktok',
            'format' => 'video',
        ])->json('id');

        $this->as($admin)->patchJson("/api/v1/activities/{$id}", ['status' => 'pending'])->assertOk();

        $this->as($client)->postJson("/api/v1/activities/{$id}/request-changes", [
            'note' => 'The headline is too long.',
        ])->assertOk()
            ->assertJsonPath('status', 'production')
            ->assertJsonPath('events.2.type', 'revision_requested')
            ->assertJsonPath('events.2.note', 'The headline is too long.');
    }

    /** Lets the team attach a file and a YouTube link during production. */
    public function test_the_team_can_attach_a_delivery(): void
    {
        Storage::fake('public');
        [$admin, $brand, $designer] = $this->agency();
        $client = User::factory()->create([
            'tenant_id' => $admin->tenant_id,
            'role' => UserRole::Client,
            'workspace_id' => $brand->id,
        ]);
        $id = $this->as($admin)->postJson('/api/v1/activities', [
            'workspace_id' => $brand->id,
            'assignee_id' => $designer->id,
            'title' => 'In the studio',
            'briefing' => 'Attach the cut.',
            'channel' => 'youtube',
            'format' => 'video',
        ])->json('id');

        $this->as($admin)->patchJson("/api/v1/activities/{$id}", ['status' => 'production'])->assertOk();

        $stored = $this->as($designer)->post("/api/v1/activities/{$id}/assets", [
            'kind' => 'image',
            'file' => UploadedFile::fake()->image('cover.jpg'),
        ]);
        $stored->assertCreated()->assertJsonPath('assets.0.kind', 'image');

        $this->as($designer)->postJson("/api/v1/activities/{$id}/assets", [
            'kind' => 'link',
            'url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        ])->assertCreated()->assertJsonPath('assets.1.kind', 'link');

        $this->as($designer)->postJson("/api/v1/activities/{$id}/assets", [
            'kind' => 'link',
            'url' => 'https://example.com/video',
        ])->assertUnprocessable()->assertJsonValidationErrors('url');

        $this->as($client)->post("/api/v1/activities/{$id}/assets", [
            'kind' => 'image',
            'file' => UploadedFile::fake()->image('nope.jpg'),
        ])->assertForbidden();

        $relative = ltrim((string) str_replace('/storage/', '', $stored->json('assets.0.url')), '/');
        Storage::disk('public')->assertExists($relative);
    }

    /** Builds an agency with two brands and a designer. */
    private function agency(): array
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => UserRole::AgencyAdmin,
        ]);
        $brand = Workspace::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Aster']);
        $designer = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => UserRole::Designer,
        ]);
        $other = Workspace::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Northstar']);

        return [$admin, $brand, $designer, $other];
    }

    /** Sends the following request as that user and agency. */
    private function as(User $user): static
    {
        return $this->withHeader('Authorization', 'Bearer '.$user->createToken('api')->plainTextToken)
            ->withHeader('X-Tenant-ID', (string) $user->tenant_id)
            ->withHeader('Accept', 'application/json');
    }
}
