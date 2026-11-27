<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    /** Tells admins when a designer delivers, and skips the author. */
    public function test_a_delivery_notifies_admins_and_not_the_author(): void
    {
        [$admin, $brand, $designer] = $this->agency();
        $id = $this->task($admin, $brand, $designer, 'Cover line');
        $this->as($admin)->patchJson("/api/v1/activities/{$id}", ['status' => 'production'])->assertOk();

        $this->as($designer)->postJson("/api/v1/activities/{$id}/assets", [
            'url' => 'https://youtu.be/dQw4w9WgXcQ',
            'headline' => 'Cover line',
            'caption' => 'Watch it.',
        ])->assertCreated();

        $adminFeed = $this->as($admin)->getJson('/api/v1/notifications')->assertOk();
        $adminFeed->assertJsonPath('data.0.type', 'asset_added')
            ->assertJsonPath('data.0.body', 'Designer One added a delivery on Cover line.')
            ->assertJsonPath('unread', 1);
        $this->assertSame(['queued'], $this->types($designer));
        $this->assertSame([], $this->types($this->copywriter($admin)));
    }

    /** Skips an admin delivery, because only designers and copywriters raise that notice. */
    public function test_an_admin_delivery_does_not_notify_admins(): void
    {
        [$admin, $brand, $designer] = $this->agency();
        $id = $this->task($admin, $brand, $designer, 'Admin cut');

        $this->as($admin)->postJson("/api/v1/activities/{$id}/assets", [
            'url' => 'https://youtu.be/dQw4w9WgXcQ',
            'headline' => 'Admin cut',
            'caption' => 'Watch it.',
        ])->assertCreated();

        $this->assertSame([], $this->types($admin));
    }

    /** Tells only the assignee when a task enters production. */
    public function test_production_notifies_only_the_assignee(): void
    {
        [$admin, $brand, $designer, $otherBrand] = $this->agency();
        $other = User::factory()->create([
            'tenant_id' => $admin->tenant_id,
            'role' => UserRole::Designer,
            'name' => 'Other Designer',
        ]);
        $id = $this->task($admin, $brand, $designer, 'In the queue');
        $loose = $this->as($admin)->postJson('/api/v1/activities', [
            'workspace_id' => $otherBrand->id,
            'title' => 'Unassigned',
            'briefing' => 'Nobody owns this yet.',
            'channel' => 'instagram',
            'format' => 'post',
        ])->assertCreated()->json('id');

        $this->as($admin)->patchJson("/api/v1/activities/{$id}", ['status' => 'production'])->assertOk();
        $this->as($admin)->patchJson("/api/v1/activities/{$loose}", ['status' => 'production'])->assertOk();

        $feed = $this->as($designer)->getJson('/api/v1/notifications')->assertOk();
        $feed->assertJsonPath('data.0.type', 'queued')
            ->assertJsonPath('data.0.body', 'In the queue is in your queue.')
            ->assertJsonPath('data.0.href', '/'.$admin->tenant->slug.'/workspace/'.$id);
        $this->assertSame([], $this->types($other));
        $this->assertSame([], $this->types($admin));
    }

    /** Tells the brand client when a task is sent for approval. */
    public function test_pending_approval_notifies_only_that_brands_client(): void
    {
        [$admin, $brand, $designer, $otherBrand] = $this->agency();
        $client = $this->client($admin, $brand, 'Olivia Chen');
        $neighbor = $this->client($admin, $otherBrand, 'Neighbor');
        $id = $this->task($admin, $brand, $designer, 'Needs a yes');

        $this->as($admin)->patchJson("/api/v1/activities/{$id}", ['status' => 'pending'])->assertOk();

        $feed = $this->as($client)->getJson('/api/v1/notifications')->assertOk();
        $feed->assertJsonPath('data.0.type', 'pending_review')
            ->assertJsonPath('data.0.body', 'Needs a yes is ready for your review.')
            ->assertJsonPath('data.0.href', '/'.$admin->tenant->slug.'/approval/'.$id);
        $this->assertSame([], $this->types($neighbor));
    }

    /** Tells the assignee and the admins when the client approves. */
    public function test_approval_notifies_the_assignee_and_the_admins(): void
    {
        [$admin, $brand, $designer] = $this->agency();
        $client = $this->client($admin, $brand, 'Olivia Chen');
        $id = $this->task($admin, $brand, $designer, 'Ready');
        $this->as($admin)->patchJson("/api/v1/activities/{$id}", ['status' => 'pending'])->assertOk();

        $this->as($client)->postJson("/api/v1/activities/{$id}/approve")->assertOk();

        $this->assertSame(['approved'], $this->types($admin));
        $this->assertContains('approved', $this->types($designer));
        $this->assertNotContains('approved', $this->types($client));
        $this->as($admin)->getJson('/api/v1/notifications')
            ->assertJsonPath('data.0.href', '/'.$admin->tenant->slug.'/approval/'.$id)
            ->assertJsonPath('data.0.body', 'Olivia Chen approved Ready.');
    }

    /** Tells the team about revisions without a second queue notice. */
    public function test_revisions_notify_the_team_without_a_second_queue_notice(): void
    {
        [$admin, $brand, $designer] = $this->agency();
        $client = $this->client($admin, $brand, 'Olivia Chen');
        $id = $this->task($admin, $brand, $designer, 'Almost');
        $this->as($admin)->patchJson("/api/v1/activities/{$id}", ['status' => 'production'])->assertOk();
        $queued = count(array_filter($this->types($designer), fn (string $type) => $type === 'queued'));
        $this->as($admin)->patchJson("/api/v1/activities/{$id}", ['status' => 'pending'])->assertOk();

        $this->as($client)->postJson("/api/v1/activities/{$id}/request-changes", [
            'note' => 'Shorter headline.',
        ])->assertOk();

        $designerTypes = $this->types($designer);
        $this->assertSame($queued, count(array_filter($designerTypes, fn (string $type) => $type === 'queued')));
        $this->assertContains('revision_requested', $designerTypes);
        $this->assertSame(['revision_requested'], $this->types($admin));
        $this->assertNotContains('revision_requested', $this->types($client));
        $this->as($designer)->getJson('/api/v1/notifications')
            ->assertJsonFragment(['body' => 'Olivia Chen requested revisions on Almost.']);
    }

    /** Hides a notice from another person and from another agency. */
    public function test_a_notice_stays_with_its_recipient_and_agency(): void
    {
        [$admin, $brand, $designer] = $this->agency();
        $client = $this->client($admin, $brand, 'Olivia Chen');
        $id = $this->task($admin, $brand, $designer, 'Private');
        $this->as($admin)->patchJson("/api/v1/activities/{$id}", ['status' => 'pending'])->assertOk();
        $noticeId = $this->as($client)->getJson('/api/v1/notifications')->json('data.0.id');

        $outsider = User::factory()->create([
            'tenant_id' => Tenant::factory()->create()->id,
            'role' => UserRole::AgencyAdmin,
        ]);

        $this->as($designer)->patchJson("/api/v1/notifications/{$noticeId}/read")->assertNotFound();
        $this->as($outsider)->getJson('/api/v1/notifications')->assertOk()->assertJsonPath('data', []);
        $this->as($outsider)->patchJson("/api/v1/notifications/{$noticeId}/read")->assertNotFound();

        $read = $this->as($client)->patchJson("/api/v1/notifications/{$noticeId}/read")->assertOk();
        $this->assertIsString($read->json('read_at'));
        $this->as($client)->getJson('/api/v1/notifications')->assertJsonPath('unread', 0);
    }

    /** Drops notices when the task is deleted. */
    public function test_deleting_a_task_deletes_its_notices(): void
    {
        [$admin, $brand, $designer] = $this->agency();
        $id = $this->task($admin, $brand, $designer, 'Gone');
        $this->as($admin)->patchJson("/api/v1/activities/{$id}", ['status' => 'production'])->assertOk();
        $this->assertSame(['queued'], $this->types($designer));

        $this->as($admin)->deleteJson("/api/v1/activities/{$id}")->assertNoContent();

        $this->assertSame([], $this->types($designer));
    }

    /** Creates a video task assigned to someone. */
    private function task(User $admin, Workspace $brand, User $assignee, string $title): int
    {
        return $this->as($admin)->postJson('/api/v1/activities', [
            'workspace_id' => $brand->id,
            'assignee_id' => $assignee->id,
            'title' => $title,
            'briefing' => 'Notification coverage.',
            'channel' => 'youtube',
            'format' => 'video',
        ])->assertCreated()->json('id');
    }

    /** Builds an agency with two brands and a designer. */
    private function agency(): array
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => UserRole::AgencyAdmin,
            'name' => 'Jordan Miller',
        ]);
        $brand = Workspace::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Aster']);
        $designer = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => UserRole::Designer,
            'name' => 'Designer One',
        ]);
        $other = Workspace::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Northstar']);

        return [$admin, $brand, $designer, $other];
    }

    /** Creates a copywriter in the same agency. */
    private function copywriter(User $admin): User
    {
        return User::factory()->create([
            'tenant_id' => $admin->tenant_id,
            'role' => UserRole::Copywriter,
            'name' => 'Copy Writer',
        ]);
    }

    /** Creates a client tied to one brand. */
    private function client(User $admin, Workspace $brand, string $name): User
    {
        return User::factory()->create([
            'tenant_id' => $admin->tenant_id,
            'role' => UserRole::Client,
            'workspace_id' => $brand->id,
            'name' => $name,
        ]);
    }

    /** Returns the notice types visible to a person, newest first. */
    private function types(User $user): array
    {
        return $this->as($user)->getJson('/api/v1/notifications')->assertOk()->json('data.*.type');
    }

    /** Sends the following request as that user and agency. */
    private function as(User $user): static
    {
        return $this->withHeader('Authorization', 'Bearer '.$user->createToken('api')->plainTextToken)
            ->withHeader('X-Tenant-ID', (string) $user->tenant_id)
            ->withHeader('Accept', 'application/json');
    }
}
