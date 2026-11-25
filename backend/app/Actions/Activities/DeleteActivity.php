<?php

namespace App\Actions\Activities;

use App\Models\Activity;
use Illuminate\Support\Facades\Storage;

class DeleteActivity
{
    /** Removes a task and the files stored for it. */
    public function handle(Activity $activity): void
    {
        $disk = Storage::disk('public');
        $activity->loadMissing('versions.files');

        foreach ($activity->versions as $version) {
            if ($version->path) {
                $disk->delete($version->path);
            }

            foreach ($version->files as $file) {
                if ($file->path) {
                    $disk->delete($file->path);
                }
            }
        }

        if ($activity->briefing_path) {
            $disk->delete($activity->briefing_path);
        }

        if ($activity->storage_key) {
            $disk->deleteDirectory($activity->storage_key);
        }

        $disk->deleteDirectory('activities/'.$activity->id);
        $activity->delete();
    }
}
