<?php

namespace App\Actions\Activities;

use App\Enums\ActivityEventType;
use App\Enums\ActivityStatus;
use App\Models\Activity;
use App\Models\ActivityEvent;
use App\Models\User;

class RecordActivityEvent
{
    /** Appends one history entry to a task. */
    public function handle(
        Activity $activity,
        User $actor,
        ActivityEventType $type,
        ?ActivityStatus $from = null,
        ?ActivityStatus $to = null,
        ?string $note = null,
    ): ActivityEvent {
        return $activity->events()->create([
            'tenant_id' => $activity->tenant_id,
            'actor_id' => $actor->id,
            'type' => $type,
            'from_status' => $from,
            'to_status' => $to,
            'note' => $note,
        ]);
    }
}
