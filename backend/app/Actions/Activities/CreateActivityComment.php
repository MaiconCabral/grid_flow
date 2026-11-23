<?php

namespace App\Actions\Activities;

use App\Enums\UserRole;
use App\Models\Activity;
use App\Models\ActivityComment;
use App\Models\ActivityVersion;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class CreateActivityComment
{
    /** Adds a comment, a reply, or an internal note on a task. */
    public function handle(Activity $activity, User $actor, array $data): ActivityComment
    {
        $internal = (bool) ($data['is_internal'] ?? false);
        $this->guardInternal($actor, $internal);

        $parent = $this->parent($activity, $data['parent_id'] ?? null);
        if ($parent?->is_internal) {
            $internal = true;
        }

        $version = $this->version($activity, $data['version_id'] ?? null);

        return $activity->comments()->create([
            'tenant_id' => $activity->tenant_id,
            'activity_version_id' => $version?->id,
            'parent_id' => $parent?->id,
            'user_id' => $actor->id,
            'body' => $data['body'],
            'is_internal' => $internal,
        ]);
    }

    /** Rejects an internal note from someone outside the agency team. */
    private function guardInternal(User $actor, bool $internal): void
    {
        if ($internal && $actor->role === UserRole::Client) {
            throw ValidationException::withMessages([
                'is_internal' => 'Only the agency team can write an internal note.',
            ]);
        }
    }

    /** Resolves a reply target that belongs to this task. */
    private function parent(Activity $activity, mixed $id): ?ActivityComment
    {
        if ($id === null || $id === '') {
            return null;
        }

        $parent = ActivityComment::query()->where('activity_id', $activity->id)->find($id);

        if ($parent === null) {
            throw ValidationException::withMessages([
                'parent_id' => 'The selected comment is invalid.',
            ]);
        }

        return $parent;
    }

    /** Resolves a version that belongs to this task. */
    private function version(Activity $activity, mixed $id): ?ActivityVersion
    {
        if ($id === null || $id === '') {
            return null;
        }

        $version = $activity->versions()->find($id);

        if ($version === null) {
            throw ValidationException::withMessages([
                'version_id' => 'The selected version is invalid.',
            ]);
        }

        return $version;
    }
}
