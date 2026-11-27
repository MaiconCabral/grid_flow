<?php

namespace App\Actions\Notifications;

use App\Enums\NotificationType;
use App\Enums\UserRole;
use App\Models\Activity;
use App\Models\Membership;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Support\Collection;

class NotifyActivity
{
    /** Tells agency admins that a designer or copywriter delivered a version. */
    public function assetAdded(Activity $activity, User $actor): void
    {
        if (! in_array($actor->role, [UserRole::Designer, UserRole::Copywriter], true)) {
            return;
        }

        $this->send(
            $activity,
            $actor,
            $this->adminIds($activity)->all(),
            NotificationType::AssetAdded,
            "{$actor->name} added a delivery on {$activity->title}.",
        );
    }

    /** Tells the assignee that the task entered their production queue. */
    public function queued(Activity $activity, User $actor): void
    {
        if ($activity->assignee_id === null) {
            return;
        }

        $this->send(
            $activity,
            $actor,
            [$activity->assignee_id],
            NotificationType::Queued,
            "{$activity->title} is in your queue.",
        );
    }

    /** Tells the brand clients that a task is waiting for their review. */
    public function pendingReview(Activity $activity, User $actor): void
    {
        $this->send(
            $activity,
            $actor,
            $this->clientIds($activity),
            NotificationType::PendingReview,
            "{$activity->title} is ready for your review.",
        );
    }

    /** Tells the assignee and the admins that the client approved the task. */
    public function approved(Activity $activity, User $actor): void
    {
        $this->send(
            $activity,
            $actor,
            $this->involvedIds($activity),
            NotificationType::Approved,
            "{$actor->name} approved {$activity->title}.",
        );
    }

    /** Tells the assignee and the admins that the client asked for revisions. */
    public function revisionRequested(Activity $activity, User $actor): void
    {
        $this->send(
            $activity,
            $actor,
            $this->involvedIds($activity),
            NotificationType::RevisionRequested,
            "{$actor->name} requested revisions on {$activity->title}.",
        );
    }

    /** Stores one unread notice for each recipient except the actor. */
    private function send(Activity $activity, User $actor, array $userIds, NotificationType $type, string $body): void
    {
        collect($userIds)
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->reject(fn (int $id) => $id === (int) $actor->id)
            ->each(fn (int $id) => $this->store($activity, $actor, $id, $type, $body));
    }

    /** Writes one unread notice for a recipient. */
    private function store(Activity $activity, User $actor, int $userId, NotificationType $type, string $body): void
    {
        UserNotification::query()->create([
            'tenant_id' => $activity->tenant_id,
            'user_id' => $userId,
            'activity_id' => $activity->id,
            'actor_id' => $actor->id,
            'type' => $type,
            'title' => $activity->title,
            'body' => $body,
        ]);
    }

    /** Collects the assignee and every agency admin on the task. */
    private function involvedIds(Activity $activity): array
    {
        return $this->adminIds($activity)
            ->when($activity->assignee_id !== null, fn (Collection $ids) => $ids->push($activity->assignee_id))
            ->all();
    }

    /** Collects the agency admins. */
    private function adminIds(Activity $activity): Collection
    {
        return $this->members($activity, UserRole::AgencyAdmin)->pluck('user_id');
    }

    /** Collects the clients of the task's brand. */
    private function clientIds(Activity $activity): array
    {
        return $this->members($activity, UserRole::Client)
            ->where('workspace_id', $activity->workspace_id)
            ->pluck('user_id')
            ->all();
    }

    /** Loads memberships of one role in the task's agency. */
    private function members(Activity $activity, UserRole $role): Collection
    {
        return Membership::query()
            ->where('tenant_id', $activity->tenant_id)
            ->where('role', $role->value)
            ->get();
    }
}
