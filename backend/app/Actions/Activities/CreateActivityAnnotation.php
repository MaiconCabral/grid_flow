<?php

namespace App\Actions\Activities;

use App\Enums\AssetKind;
use App\Models\Activity;
use App\Models\ActivityAnnotation;
use App\Models\ActivityVersion;
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

        return DB::transaction(function () use ($activity, $version, $actor, $data) {
            $number = ((int) $version->annotations()->max('number')) + 1;

            $annotation = $version->annotations()->create([
                'tenant_id' => $activity->tenant_id,
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
}
