<?php

namespace App\Actions\Activities;

use App\Enums\ActivityFormat;
use App\Enums\ActivityStatus;
use App\Models\Activity;
use App\Models\ActivityVersion;
use Illuminate\Validation\ValidationException;

class UpdateActivityCopy
{
    /** Updates the published title and caption of the current delivery. */
    public function handle(Activity $activity, ActivityVersion $version, array $data): ActivityVersion
    {
        if ((int) $version->activity_id !== (int) $activity->id || ! $version->is_current) {
            abort(404);
        }

        if ($activity->format !== ActivityFormat::Video && $activity->status !== ActivityStatus::Production) {
            throw ValidationException::withMessages([
                'status' => 'Copy can be edited only while the task is in production.',
            ]);
        }

        $version->update([
            'headline' => $data['headline'],
            'caption' => $activity->format === ActivityFormat::Blog ? null : $data['caption'],
        ]);

        return $version;
    }
}
