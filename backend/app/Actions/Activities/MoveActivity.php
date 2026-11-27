<?php

namespace App\Actions\Activities;

use App\Actions\Notifications\NotifyActivity;
use App\Enums\ActivityEventType;
use App\Enums\ActivityStatus;
use App\Models\Activity;
use App\Models\User;

class MoveActivity
{
    public function __construct(private RecordActivityEvent $events, private NotifyActivity $notifications) {}

    /** Moves a task to a column the admin is allowed to set. */
    public function handle(Activity $activity, User $actor, string $status): Activity
    {
        $next = ActivityStatus::from($status);

        if ($activity->status === $next) {
            return $activity;
        }

        $from = $activity->status;
        $activity->status = $next;
        $activity->save();

        $this->events->handle($activity, $actor, ActivityEventType::StatusChanged, $from, $next);
        $this->notify($activity, $actor, $next);

        return $activity;
    }

    /** Alerts the assignee or the brand clients when the column is one they watch. */
    private function notify(Activity $activity, User $actor, ActivityStatus $next): void
    {
        if ($next === ActivityStatus::Production) {
            $this->notifications->queued($activity, $actor);
        }

        if ($next === ActivityStatus::Pending) {
            $this->notifications->pendingReview($activity, $actor);
        }
    }
}
