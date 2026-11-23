<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Workspace;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    /** Counts every task in the agency and leaves the neighbor agency out. */
    public function test_an_admin_counts_the_agency_only(): void
    {
        [$admin, $brand, $designer, $other] = $this->agency();
        $copywriter = User::factory()->create([
            'tenant_id' => $admin->tenant_id,
            'role' => UserRole::Copywriter,
        ]);
        $week = Carbon::today()->startOfWeek(CarbonInterface::MONDAY);

        $overdue = $this->task($admin, $brand, $designer, 'Late cut', 'production', '2020-01-01');
        $review = $this->task($admin, $brand, $copywriter, 'Needs a yes', 'pending', $week->copy()->addDays(6)->toDateString());
        $this->task($admin, $other, $designer, 'Goes live', 'scheduled', null);

        $neighbor = User::factory()->create(['role' => UserRole::AgencyAdmin]);

        $this->as($admin)->getJson('/api/v1/dashboard')
            ->assertOk()
            ->assertJsonPath('role', 'agency_admin')
            ->assertJsonPath('counts.total', 3)
            ->assertJsonPath('counts.production', 1)
            ->assertJsonPath('counts.pending', 1)
            ->assertJsonPath('counts.scheduled', 1)
            ->assertJsonPath('counts.overdue', 1)
            ->assertJsonPath('counts.due_this_week', 1)
            ->assertJsonPath('actions.0.id', $overdue)
            ->assertJsonPath('actions.0.reason', 'overdue')
            ->assertJsonPath('actions.1.id', $review)
            ->assertJsonPath('week.days.0.date', $week->toDateString())
            ->assertJsonCount(5, 'pipeline')
            ->assertJsonCount(2, 'brands')
            ->assertJsonFragment(['activity_title' => 'Late cut']);

        $this->as($neighbor)->getJson('/api/v1/dashboard')
            ->assertOk()
            ->assertJsonPath('counts.total', 0)
            ->assertJsonPath('actions', [])
            ->assertJsonPath('events', []);
    }

    /** Counts only the tasks assigned to the designer. */
    public function test_a_designer_counts_only_assigned_tasks(): void
    {
        [$admin, $brand, $designer] = $this->agency();
        $copywriter = User::factory()->create([
            'tenant_id' => $admin->tenant_id,
            'role' => UserRole::Copywriter,
        ]);

        $mine = $this->task($admin, $brand, $designer, 'My frame', 'production', '2020-01-01');
        $this->task($admin, $brand, $copywriter, 'Their line', 'pending', null);

        $this->as($designer)->getJson('/api/v1/dashboard')
            ->assertOk()
            ->assertJsonPath('counts.total', 1)
            ->assertJsonPath('counts.production', 1)
            ->assertJsonPath('counts.pending', 0)
            ->assertJsonPath('counts.overdue', 1)
            ->assertJsonPath('actions.0.id', $mine)
            ->assertJsonPath('brands.0.name', $brand->name)
            ->assertJsonMissing(['activity_title' => 'Their line']);
    }

    /** Counts only the tasks of the client's brand. */
    public function test_a_client_counts_only_their_brand(): void
    {
        [$admin, $brand, $designer, $other] = $this->agency();
        $client = User::factory()->create([
            'tenant_id' => $admin->tenant_id,
            'role' => UserRole::Client,
            'workspace_id' => $brand->id,
        ]);

        $review = $this->task($admin, $brand, $designer, 'Please review', 'pending', null);
        $this->task($admin, $other, $designer, 'Other brand', 'production', null);

        $this->as($client)->getJson('/api/v1/dashboard')
            ->assertOk()
            ->assertJsonPath('role', 'client')
            ->assertJsonPath('counts.total', 1)
            ->assertJsonPath('counts.pending', 1)
            ->assertJsonPath('counts.production', 0)
            ->assertJsonPath('actions.0.id', $review)
            ->assertJsonPath('actions.0.reason', 'pending')
            ->assertJsonPath('brands', [])
            ->assertJsonMissing(['activity_title' => 'Other brand']);
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

    /** Creates a task and moves it when the test needs another column. */
    private function task(User $admin, Workspace $brand, User $assignee, string $title, string $status, ?string $due): int
    {
        $id = $this->as($admin)->postJson('/api/v1/activities', [
            'workspace_id' => $brand->id,
            'assignee_id' => $assignee->id,
            'title' => $title,
            'briefing' => 'Dashboard coverage.',
            'channel' => 'instagram',
            'format' => 'post',
            'due_on' => $due,
        ])->assertCreated()->json('id');

        if ($status !== 'todo') {
            $this->as($admin)->patchJson("/api/v1/activities/{$id}", ['status' => $status])->assertOk();
        }

        return $id;
    }

    /** Sends the following request as that user and agency. */
    private function as(User $user): static
    {
        return $this->withHeader('Authorization', 'Bearer '.$user->createToken('api')->plainTextToken)
            ->withHeader('X-Tenant-ID', (string) $user->tenant_id)
            ->withHeader('Accept', 'application/json');
    }
}
