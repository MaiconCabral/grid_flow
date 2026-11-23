<?php

namespace App\Actions\Activities;

use App\Enums\ActivityEventType;
use App\Enums\ActivityStatus;
use App\Models\Activity;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class ApproveActivity
{
    public function __construct(private RecordActivityEvent $events) {}

    /** Marks a pending task as approved by its brand client. */
    public function handle(Activity $activity, User $actor): Activity
    {
        if ($activity->status !== ActivityStatus::Pending) {
            throw ValidationException::withMessages([
                'status' => 'Only a task pending approval can be approved.',
            ]);
        }

        $from = $activity->status;
        $activity->status = ActivityStatus::Approved;
        $activity->save();

        $this->events->handle($activity, $actor, ActivityEventType::Approved, $from, ActivityStatus::Approved);

        return $activity;
    }
}
