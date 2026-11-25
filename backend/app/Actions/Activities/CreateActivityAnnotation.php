<?php

namespace App\Actions\Activities;

use App\Enums\AssetKind;
use App\Models\Activity;
use App\Models\ActivityAnnotation;
use App\Models\ActivityVersion;
use App\Models\ActivityVersionFile;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateActivityAnnotation
{
    public function __construct(private CreateActivityComment $comments) {}

    /** Places a pin on an image version and stores its first comment. */
    public function handle(Activity $activity, ActivityVersion $version, User $actor, array $data): ActivityAnnotation
    {
        if ((int) $version->activity_id !== (int) $activity->id) {
            abort(404);
        }

        if ($version->kind !== AssetKind::Image) {
            throw ValidationException::withMessages([
                'version' => 'Pins can be placed only on an image.',
            ]);
        }

        $file = $this->slide($version, $data['file_id'] ?? null);

        return DB::transaction(function () use ($activity, $version, $actor, $data, $file) {
            $number = ((int) $version->annotations()->max('number')) + 1;

            $annotation = $version->annotations()->create([
                'tenant_id' => $activity->tenant_id,
                'activity_version_file_id' => $file?->id,
                'user_id' => $actor->id,
                'number' => $number,
                'x' => $data['x'],
                'y' => $data['y'],
            ]);

            $this->comments->handle($activity, $actor, [
                'body' => $data['body'],
                'version_id' => $version->id,
                'is_internal' => $data['is_internal'] ?? false,
            ])->forceFill(['annotation_id' => $annotation->id])->save();

            return $annotation;
        });
    }

    /** Resolves the slide a pin belongs to, defaulting to the first image. */
    private function slide(ActivityVersion $version, mixed $fileId): ?ActivityVersionFile
    {
        $files = $version->files()->orderBy('position')->get();

        if ($fileId === null || $fileId === '') {
            return $files->first();
        }

        $file = $files->firstWhere('id', (int) $fileId);

        if ($file === null) {
            throw ValidationException::withMessages([
                'file_id' => 'The selected slide does not belong to this version.',
            ]);
        }

        return $file;
    }
}
