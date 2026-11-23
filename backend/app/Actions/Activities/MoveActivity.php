<?php

namespace App\Actions\Activities;

use App\Enums\ActivityEventType;
use App\Enums\ActivityStatus;
use App\Models\Activity;
use App\Models\User;

class MoveActivity
{
    public function __construct(private RecordActivityEvent $events) {}

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

        return $activity;
    }
}
