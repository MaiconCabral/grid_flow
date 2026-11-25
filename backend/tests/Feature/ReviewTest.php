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

class ReviewTest extends TestCase
{
    use RefreshDatabase;

    /** Shows a professional only the tasks assigned to them. */
    public function test_a_professional_sees_only_assigned_tasks(): void
    {
        [$admin, $brand, $designer] = $this->agency();
        $other = User::factory()->create([
            'tenant_id' => $admin->tenant_id,
            'role' => UserRole::Copywriter,
        ]);

        $mine = $this->task($admin, $brand, $designer);
        $theirs = $this->task($admin, $brand, $other);

        $this->as($designer)->getJson('/api/v1/activities')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $mine);

        $this->as($admin)->getJson('/api/v1/activities')
            ->assertOk()
            ->assertJsonFragment(['id' => $mine])
            ->assertJsonFragment(['id' => $theirs]);

        $this->as($designer)->getJson("/api/v1/activities/{$theirs}")->assertForbidden();
        $this->as($designer)->post("/api/v1/activities/{$theirs}/assets", [
            'files' => [UploadedFile::fake()->image('nope.jpg')],
        ])->assertForbidden();
    }

    /** Keeps a client on their own brand. */
    public function test_a_client_from_another_brand_cannot_open_the_piece(): void
    {
        [$admin, $brand, $designer, $otherBrand] = $this->agency();
        $neighbor = User::factory()->create([
            'tenant_id' => $admin->tenant_id,
            'role' => UserRole::Client,
            'workspace_id' => $otherBrand->id,
        ]);
        $id = $this->task($admin, $brand, $designer);

        $this->as($neighbor)->getJson("/api/v1/activities/{$id}")->assertForbidden();
    }

    /** Creates the next version and leaves the previous one in the history. */
    public function test_an_upload_creates_the_next_version(): void
    {
        Storage::fake('public');
        [$admin, $brand, $designer] = $this->agency();
        $id = $this->task($admin, $brand, $designer);
        $this->as($admin)->patchJson("/api/v1/activities/{$id}", ['status' => 'production'])->assertOk();

        $this->as($designer)->post("/api/v1/activities/{$id}/assets", [
            'files' => [UploadedFile::fake()->image('v1.jpg')],
        ])->assertCreated()->assertJsonPath('versions.0.number', 1)->assertJsonPath('versions.0.is_current', true);

        $this->as($designer)->post("/api/v1/activities/{$id}/assets", [
            'files' => [UploadedFile::fake()->image('v2.jpg')],
        ])->assertCreated()
            ->assertJsonPath('versions.0.is_current', false)
            ->assertJsonPath('versions.1.number', 2)
            ->assertJsonPath('versions.1.is_current', true);
    }

    /** Stores a pin with its comment and hides an internal note from the client. */
    public function test_a_pin_keeps_its_comment_and_internal_notes_stay_with_the_team(): void
    {
        Storage::fake('public');
        [$admin, $brand, $designer] = $this->agency();
        $client = User::factory()->create([
            'tenant_id' => $admin->tenant_id,
            'role' => UserRole::Client,
            'workspace_id' => $brand->id,
        ]);
        $id = $this->task($admin, $brand, $designer);
        $this->as($admin)->patchJson("/api/v1/activities/{$id}", ['status' => 'production'])->assertOk();
        $versionId = $this->as($designer)->post("/api/v1/activities/{$id}/assets", [
            'files' => [UploadedFile::fake()->image('cover.jpg')],
        ])->json('versions.0.id');

        $this->as($client)->postJson("/api/v1/activities/{$id}/versions/{$versionId}/annotations", [
            'x' => 42.5,
            'y' => 18,
            'body' => 'Move the logo up.',
        ])->assertCreated()
            ->assertJsonPath('versions.0.annotations.0.x', 42.5)
            ->assertJsonPath('versions.0.annotations.0.number', 1)
            ->assertJsonPath('comments.0.body', 'Move the logo up.')
            ->assertJsonPath('comments.0.pin', 1);

        $this->as($designer)->postJson("/api/v1/activities/{$id}/comments", [
            'body' => 'We can crop this later.',
            'version_id' => $versionId,
            'is_internal' => true,
        ])->assertCreated()->assertJsonPath('comments.1.is_internal', true);

        $this->as($client)->getJson("/api/v1/activities/{$id}")
            ->assertOk()
            ->assertJsonMissing(['body' => 'We can crop this later.']);

        $commentId = $this->as($client)->getJson("/api/v1/activities/{$id}")->json('comments.0.id');
        $resolved = $this->as($designer)->patchJson("/api/v1/activities/{$id}/comments/{$commentId}", [
            'resolved' => true,
        ]);
        $resolved->assertOk();
        $this->assertNotNull($resolved->json('comments.0.resolved_at'));
    }

    /** Creates one task assigned to a person. */
    private function task(User $admin, Workspace $brand, User $assignee): int
    {
        return $this->as($admin)->postJson('/api/v1/activities', [
            'workspace_id' => $brand->id,
            'assignee_id' => $assignee->id,
            'title' => 'Piece '.$assignee->id,
            'briefing' => 'Review this piece.',
            'channel' => 'instagram',
            'format' => 'post',
        ])->assertCreated()->json('id');
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
