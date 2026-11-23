<?php

namespace App\Support;

use App\Enums\AssetKind;
use App\Models\Activity;
use App\Models\ActivityAsset;
use App\Models\ActivityEvent;

class ActivityPayload
{
    /** Builds the card fields returned by the board. */
    public function summary(Activity $activity): array
    {
        $cover = $activity->assets->first(fn (ActivityAsset $asset) => $asset->kind === AssetKind::Image);

        return [
            'id' => $activity->id,
            'title' => $activity->title,
            'briefing' => $activity->briefing,
            'channel' => $activity->channel->value,
            'format' => $activity->format->value,
            'status' => $activity->status->value,
            'due_on' => $activity->due_on?->toDateString(),
            'workspace' => [
                'id' => $activity->workspace?->id,
                'name' => $activity->workspace?->name,
            ],
            'assignee' => $activity->assignee === null ? null : [
                'id' => $activity->assignee->id,
                'name' => $activity->assignee->name,
            ],
            'assets_count' => $activity->assets->count(),
            'events_count' => $activity->events_count ?? $activity->events->count(),
            'cover_url' => $this->publicUrl($cover),
        ];
    }

    /** Builds the task page, including files and history. */
    public function detail(Activity $activity): array
    {
        $activity->loadMissing(['workspace', 'assignee', 'assets.uploader', 'events.actor']);

        return $this->summary($activity) + [
            'assets' => $activity->assets
                ->sortBy('id')
                ->values()
                ->map(fn (ActivityAsset $asset) => [
                    'id' => $asset->id,
                    'kind' => $asset->kind->value,
                    'name' => $asset->name,
                    'url' => $this->publicUrl($asset),
                    'author' => $asset->uploader?->name,
                    'created_at' => $asset->created_at?->toIso8601String(),
                ]),
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

    /** Turns a stored file into a path the browser can open. */
    private function publicUrl(?ActivityAsset $asset): ?string
    {
        if ($asset === null) {
            return null;
        }

        if ($asset->kind === AssetKind::Link) {
            return $asset->url;
        }

        return $asset->path ? '/storage/'.$asset->path : null;
    }
}
