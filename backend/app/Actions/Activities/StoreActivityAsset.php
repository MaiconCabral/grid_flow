<?php

namespace App\Actions\Activities;

use App\Actions\Notifications\NotifyActivity;
use App\Enums\ActivityEventType;
use App\Enums\ActivityFormat;
use App\Enums\ActivityStatus;
use App\Enums\AssetKind;
use App\Models\Activity;
use App\Models\ActivityVersion;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StoreActivityAsset
{
    public function __construct(private RecordActivityEvent $events, private NotifyActivity $notifications) {}

    /** Stores the next version using the file shape of the task format. */
    public function handle(Activity $activity, User $actor, array $data, array $files, ?UploadedFile $cover = null): ActivityVersion
    {
        if ($activity->format !== ActivityFormat::Video && $activity->status !== ActivityStatus::Production) {
            throw ValidationException::withMessages([
                'status' => 'Assets can be added only while the task is in production.',
            ]);
        }

        $stored = $activity->format === ActivityFormat::Video
            ? [$this->youtube($data['url'])]
            : $this->paths($activity, $files);

        if ($activity->format === ActivityFormat::Blog && $cover !== null) {
            $stored[] = [
                'name' => $cover->getClientOriginalName(),
                'url' => null,
                'path' => $cover->store($activity->storage_key, 'public'),
                'role' => 'cover',
            ];
        }

        $kind = match ($activity->format) {
            ActivityFormat::Video => AssetKind::Link,
            ActivityFormat::Blog => AssetKind::Document,
            default => AssetKind::Image,
        };

        return DB::transaction(function () use ($activity, $actor, $kind, $stored, $data) {
            $activity->versions()->update(['is_current' => false]);
            $number = ((int) $activity->versions()->max('number')) + 1;
            $first = $stored[0];

            $version = $activity->versions()->create([
                'tenant_id' => $activity->tenant_id,
                'uploaded_by' => $actor->id,
                'number' => $number,
                'kind' => $kind,
                'name' => $first['name'],
                'headline' => $data['headline'] ?? null,
                'caption' => $activity->format === ActivityFormat::Blog ? null : ($data['caption'] ?? null),
                'path' => $first['path'],
                'url' => $first['url'],
                'is_current' => true,
            ]);

            foreach ($stored as $position => $file) {
                $version->files()->create([
                    'tenant_id' => $activity->tenant_id,
                    'position' => $position,
                    'role' => $file['role'] ?? 'asset',
                    'name' => $file['name'],
                    'path' => $file['path'],
                    'url' => $file['url'],
                ]);
            }

            $this->events->handle($activity, $actor, ActivityEventType::AssetAdded, null, null, $version->name);
            $this->notifications->assetAdded($activity, $actor);

            return $version;
        });
    }

    /** Rejects links that are not hosted on YouTube. */
    private function youtube(string $url): array
    {
        $host = strtolower((string) parse_url($url, PHP_URL_HOST));
        $host = preg_replace('/^www\./', '', $host) ?? $host;

        if (! in_array($host, ['youtube.com', 'm.youtube.com', 'youtu.be', 'youtube-nocookie.com'], true)) {
            throw ValidationException::withMessages([
                'url' => 'The link must be a YouTube URL.',
            ]);
        }

        return ['name' => 'YouTube', 'url' => $url, 'path' => null, 'role' => 'asset'];
    }

    /** Puts each uploaded file in the task folder. */
    private function paths(Activity $activity, array $files): array
    {
        return array_values(array_map(function (UploadedFile $file) use ($activity) {
            return [
                'name' => $file->getClientOriginalName(),
                'url' => null,
                'path' => $file->store($activity->storage_key, 'public'),
                'role' => 'asset',
            ];
        }, $files));
    }
}
