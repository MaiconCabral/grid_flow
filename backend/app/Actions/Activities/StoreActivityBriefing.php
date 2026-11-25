<?php

namespace App\Actions\Activities;

use App\Models\Activity;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class StoreActivityBriefing
{
    /** Stores or replaces the optional briefing file in the task folder. */
    public function handle(Activity $activity, UploadedFile $file): Activity
    {
        if ($activity->briefing_path) {
            Storage::disk('public')->delete($activity->briefing_path);
        }

        $activity->forceFill([
            'briefing_name' => $file->getClientOriginalName(),
            'briefing_path' => $file->store($activity->storage_key, 'public'),
        ])->save();

        return $activity;
    }
}
