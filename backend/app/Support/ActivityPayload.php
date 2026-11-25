<?php

namespace App\Support;

use App\Enums\AssetKind;
use App\Enums\UserRole;
use App\Models\Activity;
use App\Models\ActivityAnnotation;
use App\Models\ActivityComment;
use App\Models\ActivityEvent;
use App\Models\ActivityVersion;
use App\Models\ActivityVersionFile;
use App\Models\User;

class ActivityPayload
{
    /** Builds the card fields returned by the board. */
    public function summary(Activity $activity): array
    {
        $activity->loadMissing('versions.files');
        $current = $activity->versions->firstWhere('is_current', true);
        $slides = $this->slides($current);

        return [
            'id' => $activity->id,
            'title' => $activity->title,
            'briefing' => $activity->briefing,
            'channel' => $activity->channel->value,
            'format' => $activity->format->value,
            'status' => $activity->status->value,
            'due_on' => $activity->due_on?->toDateString(),
            'cover_from' => $activity->cover_from,
            'cover_to' => $activity->cover_to,
            'briefing_file' => $activity->briefing_path === null ? null : [
                'name' => $activity->briefing_name,
                'url' => '/storage/'.$activity->briefing_path,
            ],
            'workspace' => [
                'id' => $activity->workspace?->id,
                'name' => $activity->workspace?->name,
            ],
            'assignee' => $activity->assignee === null ? null : [
                'id' => $activity->assignee->id,
                'name' => $activity->assignee->name,
            ],
            'assets_count' => $activity->versions->count(),
            'events_count' => $activity->events_count ?? $activity->events->count(),
            'cover_url' => $slides[0] ?? null,
            'video_url' => $this->videoUrl($current),
            'slides' => $slides,
        ];
    }

    /** Builds the task page, including versions, pins, comments, and history. */
    public function detail(Activity $activity, User $viewer): array
    {
        $activity->loadMissing([
            'workspace',
            'assignee',
            'versions.uploader',
            'versions.files',
            'versions.annotations.author',
            'versions.annotations.comments',
            'comments.author',
            'comments.annotation',
            'events.actor',
        ]);

        $comments = $this->visibleComments($activity, $viewer);

        return $this->summary($activity) + [
            'assets' => $activity->versions
                ->sortBy('number')
                ->values()
                ->map(fn (ActivityVersion $version) => $this->assetRow($version)),
            'versions' => $activity->versions
                ->sortBy('number')
                ->values()
                ->map(fn (ActivityVersion $version) => $this->versionRow($version, $viewer)),
            'comments' => $comments->map(fn (ActivityComment $comment) => $this->commentRow($comment))->values(),
            'events' => $activity->events
                ->sortBy('id')
                ->values()
                ->map(fn (ActivityEvent $event) => [
                    'id' => $event->id,
                    'type' => $event->type->value,
                    'from_status' => $event->from_status?->value,
                    'to_status' => $event->to_status?->value,
                    'note' => $event->note,
                    'actor' => $event->actor?->name,
                    'created_at' => $event->created_at?->toIso8601String(),
                ]),
        ];
    }

    /** Hides internal notes from a client. */
    private function visibleComments(Activity $activity, User $viewer)
    {
        return $activity->comments
            ->sortBy('id')
            ->filter(function (ActivityComment $comment) use ($viewer) {
                if ($viewer->role === UserRole::Client && $comment->is_internal) {
                    return false;
                }

                return true;
            })
            ->values();
    }

    /** Builds the delivery row still used by the task page. */
    private function assetRow(ActivityVersion $version): array
    {
        return [
            'id' => $version->id,
            'kind' => $version->kind->value,
            'name' => $version->name,
            'url' => $this->address($version->path, $version->url),
            'author' => $version->uploader?->name,
            'created_at' => $version->created_at?->toIso8601String(),
            'files' => $version->files->sortBy('position')->values()->map(fn (ActivityVersionFile $file) => [
                'id' => $file->id,
                'position' => $file->position,
                'name' => $file->name,
                'url' => $this->address($file->path, $file->url),
            ]),
        ];
    }

    /** Builds one version, including the pins the viewer may see. */
    private function versionRow(ActivityVersion $version, User $viewer): array
    {
        $annotations = $version->annotations->sortBy('number')->filter(function (ActivityAnnotation $annotation) use ($viewer) {
            if ($viewer->role !== UserRole::Client) {
                return true;
            }

            return $annotation->comments->contains(fn (ActivityComment $comment) => ! $comment->is_internal);
        });

        return $this->assetRow($version) + [
            'number' => $version->number,
            'is_current' => $version->is_current,
            'annotations' => $annotations->values()->map(fn (ActivityAnnotation $annotation) => [
                'id' => $annotation->id,
                'number' => $annotation->number,
                'file_id' => $annotation->activity_version_file_id,
                'x' => $annotation->x,
                'y' => $annotation->y,
                'author' => $annotation->author?->name,
            ]),
        ];
    }

    /** Builds one comment for the thread. */
    private function commentRow(ActivityComment $comment): array
    {
        return [
            'id' => $comment->id,
            'body' => $comment->body,
            'parent_id' => $comment->parent_id,
            'version_id' => $comment->activity_version_id,
            'annotation_id' => $comment->annotation_id,
            'pin' => $comment->annotation?->number,
            'is_internal' => $comment->is_internal,
            'resolved_at' => $comment->resolved_at?->toIso8601String(),
            'author' => $comment->author?->name,
            'role' => $comment->author?->role?->value,
            'created_at' => $comment->created_at?->toIso8601String(),
        ];
    }

    /** Returns the YouTube address when the current version is a link. */
    private function videoUrl(?ActivityVersion $version): ?string
    {
        if ($version === null || $version->kind !== AssetKind::Link) {
            return null;
        }

        return $this->address($version->path, $version->url);
    }

    /** Lists the image addresses of the current version. */
    private function slides(?ActivityVersion $version): array
    {
        if ($version === null || $version->kind !== AssetKind::Image) {
            return [];
        }

        return $version->files
            ->sortBy('position')
            ->map(fn (ActivityVersionFile $file) => $this->address($file->path, $file->url))
            ->filter()
            ->values()
            ->all();
    }

    /** Turns a stored file or a remote link into a path the browser can open. */
    private function address(?string $path, ?string $url): ?string
    {
        if ($url) {
            return $url;
        }

        return $path ? '/storage/'.$path : null;
    }
}
