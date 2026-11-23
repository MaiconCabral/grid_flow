<?php

namespace App\Actions\Activities;

use App\Enums\ActivityEventType;
use App\Enums\ActivityStatus;
use App\Models\Activity;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class RequestActivityChanges
{
    public function __construct(private RecordActivityEvent $events) {}

    /** Sends a pending task back to production with the client's note. */
    public function handle(Activity $activity, User $actor, string $note): Activity
    {
        if ($activity->status !== ActivityStatus::Pending) {
            throw ValidationException::withMessages([
                'status' => 'Only a task pending approval can be sent back.',
            ]);
        }

        $from = $activity->status;
        $activity->status = ActivityStatus::Production;
        $activity->save();

        $this->events->handle(
            $activity,
            $actor,
            ActivityEventType::RevisionRequested,
            $from,
            ActivityStatus::Production,
            $note,
        );

        return $activity;
    }
}
