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

    /** Lets the team attach the delivery that matches the format. */
    public function test_the_team_can_attach_a_delivery(): void
    {
        Storage::fake('public');
        [$admin, $brand, $designer] = $this->agency();
        $client = User::factory()->create([
            'tenant_id' => $admin->tenant_id,
            'role' => UserRole::Client,
            'workspace_id' => $brand->id,
        ]);
        $created = $this->as($admin)->post('/api/v1/activities', [
            'workspace_id' => $brand->id,
            'assignee_id' => $designer->id,
            'title' => 'In the studio',
            'briefing' => 'Attach the cut.',
            'channel' => 'youtube',
            'format' => 'video',
            'briefing_file' => UploadedFile::fake()->create('brief.pdf', 12, 'application/pdf'),
        ]);
        $created->assertCreated()
            ->assertJsonPath('briefing_file.name', 'brief.pdf')
            ->assertJsonStructure(['cover_from', 'cover_to']);
        $id = $created->json('id');

        $this->as($admin)->patchJson("/api/v1/activities/{$id}", ['status' => 'pending'])->assertOk();
        $this->as($designer)->postJson("/api/v1/activities/{$id}/assets", [
            'url' => 'https://youtu.be/dQw4w9WgXcQ',
        ])->assertCreated()
            ->assertJsonPath('assets.0.url', 'https://youtu.be/dQw4w9WgXcQ')
            ->assertJsonPath('video_url', 'https://youtu.be/dQw4w9WgXcQ');

        $this->as($admin)->patchJson("/api/v1/activities/{$id}", ['status' => 'production'])->assertOk();

        $this->as($designer)->post("/api/v1/activities/{$id}/assets", [
            'files' => [UploadedFile::fake()->image('cover.jpg')],
        ])->assertUnprocessable();

        $stored = $this->as($designer)->postJson("/api/v1/activities/{$id}/assets", [
            'url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        ]);
        $stored->assertCreated()->assertJsonPath('assets.0.kind', 'link');

        $this->as($designer)->postJson("/api/v1/activities/{$id}/assets", [
            'url' => 'https://example.com/video',
        ])->assertUnprocessable()->assertJsonValidationErrors('url');

        $this->as($client)->postJson("/api/v1/activities/{$id}/assets", [
            'url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        ])->assertForbidden();

        $this->assertStringContainsString('/storage/aster_', (string) $created->json('briefing_file.url'));
        Storage::disk('public')->assertExists(ltrim(str_replace('/storage/', '', (string) $created->json('briefing_file.url')), '/'));
    }

    /** Stores every carousel image in one version and a document on a text task. */
    public function test_a_carousel_keeps_several_images_and_text_keeps_a_document(): void
    {
        Storage::fake('public');
        [$admin, $brand, $designer] = $this->agency();
        $carousel = $this->as($admin)->postJson('/api/v1/activities', [
            'workspace_id' => $brand->id,
            'assignee_id' => $designer->id,
            'title' => 'Frames',
            'briefing' => 'Three frames.',
            'channel' => 'instagram',
            'format' => 'carousel',
        ])->json('id');
        $this->as($admin)->patchJson("/api/v1/activities/{$carousel}", ['status' => 'production'])->assertOk();

        $slides = $this->as($designer)->post("/api/v1/activities/{$carousel}/assets", [
            'files' => [
                UploadedFile::fake()->image('one.jpg'),
                UploadedFile::fake()->image('two.jpg'),
                UploadedFile::fake()->image('three.jpg'),
            ],
        ]);
        $slides->assertCreated()
            ->assertJsonCount(3, 'versions.0.files')
            ->assertJsonCount(3, 'slides');
        $this->assertStringContainsString('/storage/aster_', (string) $slides->json('slides.0'));

        $text = $this->as($admin)->postJson('/api/v1/activities', [
            'workspace_id' => $brand->id,
            'assignee_id' => $designer->id,
            'title' => 'Caption',
            'briefing' => 'The words.',
            'channel' => 'facebook',
            'format' => 'text',
        ])->json('id');
        $this->as($admin)->patchJson("/api/v1/activities/{$text}", ['status' => 'production'])->assertOk();
        $docx = $this->as($designer)->post("/api/v1/activities/{$text}/assets", [
            'files' => [UploadedFile::fake()->create('caption.docx', 20, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')],
        ]);
        $docx->assertCreated()
            ->assertJsonPath('assets.0.kind', 'document')
            ->assertJsonPath('cover_url', null)
            ->assertJsonPath('document.name', 'caption.docx');
        $this->as($designer)->get("/api/v1/activities/{$text}/document")->assertOk();

        $this->as($designer)->post("/api/v1/activities/{$text}/assets", [
            'files' => [UploadedFile::fake()->create('caption.pdf', 20, 'application/pdf')],
        ])->assertCreated()
            ->assertJsonPath('document.name', 'caption.pdf')
            ->assertJsonPath('cover_url', null);
        $this->assertStringContainsString('/storage/', (string) $this->as($designer)->getJson("/api/v1/activities/{$text}")->json('document.url'));
        $this->as($designer)->get('/api/v1/activities/'.$text.'/document?version='.$docx->json('assets.0.id'))->assertOk();

        $intruder = User::factory()->create(['role' => UserRole::AgencyAdmin]);
        $this->withHeader('Authorization', 'Bearer '.$intruder->createToken('api')->plainTextToken)
            ->withHeader('X-Tenant-ID', (string) $admin->tenant_id)
            ->get("/api/v1/activities/{$text}/document")
            ->assertForbidden();
    }

    /** Lets an admin delete a task and its stored files. */
    public function test_an_admin_can_delete_a_task(): void
    {
        Storage::fake('public');
        [$admin, $brand, $designer] = $this->agency();
        $id = $this->as($admin)->post('/api/v1/activities', [
            'workspace_id' => $brand->id,
            'assignee_id' => $designer->id,
            'title' => 'Throwaway',
            'briefing' => 'Remove me.',
            'channel' => 'instagram',
            'format' => 'post',
            'briefing_file' => UploadedFile::fake()->create('brief.pdf', 12, 'application/pdf'),
        ])->json('id');
        $this->as($admin)->patchJson("/api/v1/activities/{$id}", ['status' => 'production'])->assertOk();
        $stored = $this->as($designer)->post("/api/v1/activities/{$id}/assets", [
            'files' => [UploadedFile::fake()->image('cover.jpg')],
        ])->assertCreated();
        $relative = ltrim(str_replace('/storage/', '', (string) $stored->json('cover_url')), '/');

        $this->as($designer)->deleteJson("/api/v1/activities/{$id}")->assertForbidden();
        $this->as($admin)->deleteJson("/api/v1/activities/{$id}")->assertNoContent();
        $this->as($admin)->getJson("/api/v1/activities/{$id}")->assertNotFound();
        Storage::disk('public')->assertMissing($relative);
    }

    /** Keeps approved and scheduled tasks on the board. */
    public function test_an_admin_cannot_delete_an_approved_or_scheduled_task(): void
    {
        [$admin, $brand] = $this->agency();
        $client = User::factory()->create([
            'tenant_id' => $admin->tenant_id,
            'role' => UserRole::Client,
            'workspace_id' => $brand->id,
        ]);
        $approved = $this->as($admin)->postJson('/api/v1/activities', [
            'workspace_id' => $brand->id,
            'title' => 'Signed off',
            'briefing' => 'The client already approved this.',
            'channel' => 'instagram',
            'format' => 'post',
        ])->json('id');
        $this->as($admin)->patchJson("/api/v1/activities/{$approved}", ['status' => 'pending'])->assertOk();
        $this->as($client)->postJson("/api/v1/activities/{$approved}/approve")->assertOk();

        $scheduled = $this->as($admin)->postJson('/api/v1/activities', [
            'workspace_id' => $brand->id,
            'title' => 'On the calendar',
            'briefing' => 'Already booked.',
            'channel' => 'tiktok',
            'format' => 'story',
        ])->json('id');
        $this->as($admin)->patchJson("/api/v1/activities/{$scheduled}", ['status' => 'scheduled'])->assertOk();

        $this->as($admin)->deleteJson("/api/v1/activities/{$approved}")->assertForbidden();
        $this->as($admin)->deleteJson("/api/v1/activities/{$scheduled}")->assertForbidden();
        $this->as($admin)->getJson("/api/v1/activities/{$approved}")->assertOk();
        $this->as($admin)->getJson("/api/v1/activities/{$scheduled}")->assertOk();
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
