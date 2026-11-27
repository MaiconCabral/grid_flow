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
        ])->assertUnprocessable()->assertJsonValidationErrors(['headline', 'caption']);
        $this->as($designer)->postJson("/api/v1/activities/{$id}/assets", [
            'url' => 'https://youtu.be/dQw4w9WgXcQ',
            'headline' => 'In the studio',
            'caption' => 'Watch the cut.',
        ])->assertCreated()
            ->assertJsonPath('assets.0.url', 'https://youtu.be/dQw4w9WgXcQ')
            ->assertJsonPath('video_url', 'https://youtu.be/dQw4w9WgXcQ')
            ->assertJsonPath('headline', 'In the studio')
            ->assertJsonPath('caption', 'Watch the cut.');

        $this->as($admin)->patchJson("/api/v1/activities/{$id}", ['status' => 'production'])->assertOk();

        $this->as($designer)->post("/api/v1/activities/{$id}/assets", [
            'files' => [UploadedFile::fake()->image('cover.jpg')],
        ])->assertUnprocessable();

        $stored = $this->as($designer)->postJson("/api/v1/activities/{$id}/assets", [
            'url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'headline' => 'In the studio',
            'caption' => 'Watch the cut.',
        ]);
        $stored->assertCreated()->assertJsonPath('assets.0.kind', 'link');

        $this->as($designer)->postJson("/api/v1/activities/{$id}/assets", [
            'url' => 'https://example.com/video',
            'headline' => 'In the studio',
            'caption' => 'Watch the cut.',
        ])->assertUnprocessable()->assertJsonValidationErrors('url');

        $this->as($client)->postJson("/api/v1/activities/{$id}/assets", [
            'url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        ])->assertForbidden();

        $this->assertStringContainsString('/storage/aster_', (string) $created->json('briefing_file.url'));
        Storage::disk('public')->assertExists(ltrim(str_replace('/storage/', '', (string) $created->json('briefing_file.url')), '/'));
    }

    /** Stores every carousel image in one version and a cover plus a document on a blog. */
    public function test_a_carousel_keeps_several_images_and_a_blog_keeps_a_cover_and_a_document(): void
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
            'headline' => 'Summer frames',
            'caption' => 'Three frames for the drop.',
            'files' => [
                UploadedFile::fake()->image('one.jpg'),
                UploadedFile::fake()->image('two.jpg'),
                UploadedFile::fake()->image('three.jpg'),
            ],
        ]);
        $slides->assertCreated()
            ->assertJsonPath('headline', 'Summer frames')
            ->assertJsonPath('caption', 'Three frames for the drop.')
            ->assertJsonCount(3, 'versions.0.files')
            ->assertJsonCount(3, 'slides');
        $this->assertStringContainsString('/storage/aster_', (string) $slides->json('slides.0'));

        $text = $this->as($admin)->postJson('/api/v1/activities', [
            'workspace_id' => $brand->id,
            'assignee_id' => $designer->id,
            'title' => 'Caption',
            'briefing' => 'The words.',
            'channel' => 'facebook',
            'format' => 'blog',
        ])->json('id');
        $this->as($admin)->patchJson("/api/v1/activities/{$text}", ['status' => 'production'])->assertOk();
        $docx = $this->as($designer)->post("/api/v1/activities/{$text}/assets", [
            'headline' => 'Saturday story',
            'files' => [UploadedFile::fake()->create('caption.docx', 20, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')],
            'cover' => UploadedFile::fake()->image('cover.jpg'),
        ]);
        $docx->assertCreated()
            ->assertJsonPath('assets.0.kind', 'document')
            ->assertJsonPath('headline', 'Saturday story')
            ->assertJsonPath('caption', null)
            ->assertJsonPath('document.name', 'caption.docx')
            ->assertJsonPath('versions.0.files.1.role', 'cover');
        $this->assertStringContainsString('/storage/', (string) $docx->json('cover_url'));
        $this->as($designer)->get("/api/v1/activities/{$text}/document")->assertOk();

        $this->as($designer)->post("/api/v1/activities/{$text}/assets", [
            'headline' => 'Saturday story',
            'files' => [UploadedFile::fake()->create('caption.pdf', 20, 'application/pdf')],
            'cover' => UploadedFile::fake()->image('cover.jpg'),
        ])->assertCreated()
            ->assertJsonPath('document.name', 'caption.pdf');
        $this->assertStringContainsString('/storage/', (string) $this->as($designer)->getJson("/api/v1/activities/{$text}")->json('cover_url'));
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
            'headline' => 'Throwaway',
            'caption' => 'Remove me.',
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

    /** Updates the published copy of the current version without a new file. */
    public function test_published_copy_can_change_without_a_new_file(): void
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
            'title' => 'Launch line',
            'briefing' => 'Internal brief.',
            'channel' => 'instagram',
            'format' => 'post',
        ])->json('id');
        $this->as($admin)->patchJson("/api/v1/activities/{$id}", ['status' => 'production'])->assertOk();
        $versionId = $this->as($designer)->post("/api/v1/activities/{$id}/assets", [
            'headline' => 'First line',
            'caption' => 'First caption.',
            'files' => [UploadedFile::fake()->image('cover.jpg')],
        ])->json('versions.0.id');

        $this->as($designer)->patchJson("/api/v1/activities/{$id}/versions/{$versionId}", [
            'headline' => 'Final line',
            'caption' => 'Final caption.',
        ])->assertOk()
            ->assertJsonPath('headline', 'Final line')
            ->assertJsonPath('caption', 'Final caption.')
            ->assertJsonCount(1, 'versions');

        $blog = $this->as($admin)->postJson('/api/v1/activities', [
            'workspace_id' => $brand->id,
            'assignee_id' => $designer->id,
            'title' => 'Journal',
            'briefing' => 'Internal brief.',
            'channel' => 'facebook',
            'format' => 'blog',
        ])->json('id');
        $this->as($admin)->patchJson("/api/v1/activities/{$blog}", ['status' => 'production'])->assertOk();
        $delivered = $this->as($designer)->post("/api/v1/activities/{$blog}/assets", [
            'headline' => 'Journal title',
            'files' => [UploadedFile::fake()->create('article.pdf', 20, 'application/pdf')],
            'cover' => UploadedFile::fake()->image('cover.jpg'),
        ])->assertCreated();
        $coverId = $delivered->json('versions.0.files.1.id');
        $blogVersion = $delivered->json('versions.0.id');
        $this->as($admin)->patchJson("/api/v1/activities/{$blog}", ['status' => 'pending'])->assertOk();

        $this->as($client)->postJson("/api/v1/activities/{$blog}/versions/{$blogVersion}/annotations", [
            'x' => 10,
            'y' => 20,
            'file_id' => $coverId,
            'body' => 'Crop the cover.',
        ])->assertCreated()
            ->assertJsonPath('comments.0.scope', 'asset')
            ->assertJsonPath('versions.0.annotations.0.file_id', $coverId);

        $this->as($client)->postJson("/api/v1/activities/{$blog}/versions/{$blogVersion}/annotations", [
            'x' => 10,
            'y' => 20,
            'file_id' => $delivered->json('versions.0.files.0.id'),
            'body' => 'This file is the article.',
        ])->assertUnprocessable();
    }

    /** Hides To Do and In Production from the brand client. */
    public function test_a_client_sees_only_pieces_past_production(): void
    {
        [$admin, $brand, $designer] = $this->agency();
        $client = User::factory()->create([
            'tenant_id' => $admin->tenant_id,
            'role' => UserRole::Client,
            'workspace_id' => $brand->id,
        ]);

        $draft = $this->task($admin, $brand, 'Still a draft', 'todo');
        $making = $this->task($admin, $brand, 'In the studio', 'production', $designer->id);
        $review = $this->task($admin, $brand, 'Please review', 'pending');
        $live = $this->task($admin, $brand, 'Going out', 'scheduled');

        $this->as($client)->getJson('/api/v1/activities')
            ->assertOk()
            ->assertJsonMissing(['title' => 'Still a draft'])
            ->assertJsonMissing(['title' => 'In the studio'])
            ->assertJsonFragment(['title' => 'Please review'])
            ->assertJsonFragment(['title' => 'Going out']);

        $this->as($client)->getJson("/api/v1/activities/{$draft}")->assertForbidden();
        $this->as($client)->getJson("/api/v1/activities/{$making}")->assertForbidden();
        $this->as($client)->getJson("/api/v1/activities/{$review}")->assertOk();

        $this->as($designer)->getJson("/api/v1/activities/{$making}")->assertOk();
        $this->as($admin)->getJson('/api/v1/activities')
            ->assertJsonFragment(['title' => 'Still a draft'])
            ->assertJsonFragment(['title' => 'In the studio']);

        $this->as($client)->getJson("/api/v1/activities/{$live}")->assertOk();
    }

    /** Creates a task and moves it when the test needs another column. */
    private function task(User $admin, Workspace $brand, string $title, string $status, ?int $assigneeId = null): int
    {
        $id = $this->as($admin)->postJson('/api/v1/activities', [
            'workspace_id' => $brand->id,
            'assignee_id' => $assigneeId,
            'title' => $title,
            'briefing' => 'Client visibility coverage.',
            'channel' => 'instagram',
            'format' => 'post',
        ])->assertCreated()->json('id');

        if ($status !== 'todo') {
            $this->as($admin)->patchJson("/api/v1/activities/{$id}", ['status' => $status])->assertOk();
        }

        return $id;
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
