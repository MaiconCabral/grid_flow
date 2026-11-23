<?php

namespace App\Actions\Activities;

use App\Enums\ActivityChannel;
use App\Enums\ActivityEventType;
use App\Enums\ActivityFormat;
use App\Enums\ActivityStatus;
use App\Enums\UserRole;
use App\Models\Activity;
use App\Models\User;
use App\Models\Workspace;
use App\Support\TenantContext;
use Illuminate\Validation\ValidationException;

class CreateActivity
{
    public function __construct(private RecordActivityEvent $events) {}

    /** Creates a task in To Do for a brand of the current agency. */
    public function handle(User $author, array $data): Activity
    {
        $workspace = Workspace::query()->find($data['workspace_id'] ?? null);

        if ($workspace === null) {
            throw ValidationException::withMessages([
                'workspace_id' => 'The selected brand is invalid.',
            ]);
        }

        $assignee = $this->assignee($data['assignee_id'] ?? null);

        $activity = Activity::query()->create([
            'tenant_id' => app(TenantContext::class)->id(),
            'workspace_id' => $workspace->id,
            'created_by' => $author->id,
            'assignee_id' => $assignee?->id,
            'title' => $data['title'],
            'briefing' => $data['briefing'],
            'channel' => ActivityChannel::from($data['channel']),
            'format' => ActivityFormat::from($data['format']),
            'status' => ActivityStatus::Todo,
            'due_on' => $data['due_on'] ?? null,
        ]);

        $this->events->handle($activity, $author, ActivityEventType::Created, null, ActivityStatus::Todo);

        return $activity;
    }

    /** Resolves a designer, copywriter, or admin of this agency. */
    private function assignee(mixed $id): ?User
    {
        if ($id === null || $id === '') {
            return null;
        }

        $user = User::query()->find($id);

        if ($user === null || $user->role === UserRole::Client) {
            throw ValidationException::withMessages([
                'assignee_id' => 'The assignee must be a member of the agency team.',
            ]);
        }

        return $user;
    }
}
