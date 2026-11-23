<?php

namespace App\Actions\Activities;

use App\Enums\ActivityEventType;
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
    public function __construct(private RecordActivityEvent $events) {}

    /** Stores the next version of the piece while the task is in production. */
    public function handle(Activity $activity, User $actor, array $data, ?UploadedFile $file): ActivityVersion
    {
        if ($activity->status !== ActivityStatus::Production) {
            throw ValidationException::withMessages([
                'status' => 'Assets can be added only while the task is in production.',
            ]);
        }

        $kind = AssetKind::from($data['kind']);
        $stored = $kind === AssetKind::Link
            ? ['name' => 'YouTube', 'url' => $data['url'], 'path' => null]
            : ['name' => $file->getClientOriginalName(), 'url' => null, 'path' => $file->store('activities/'.$activity->id, 'public')];

        if ($kind === AssetKind::Link) {
            $this->assertYoutube($data['url']);
        }

        return DB::transaction(function () use ($activity, $actor, $kind, $stored) {
            $activity->versions()->update(['is_current' => false]);
            $number = ((int) $activity->versions()->max('number')) + 1;

            $version = $activity->versions()->create([
                'tenant_id' => $activity->tenant_id,
                'uploaded_by' => $actor->id,
                'number' => $number,
                'kind' => $kind,
                'name' => $stored['name'],
                'path' => $stored['path'],
                'url' => $stored['url'],
                'is_current' => true,
            ]);

            $this->events->handle($activity, $actor, ActivityEventType::AssetAdded, null, null, $version->name);

            return $version;
        });
    }

    /** Rejects links that are not hosted on YouTube. */
    private function assertYoutube(string $url): void
    {
        $host = strtolower((string) parse_url($url, PHP_URL_HOST));
        $host = preg_replace('/^www\./', '', $host) ?? $host;

        if (! in_array($host, ['youtube.com', 'm.youtube.com', 'youtu.be', 'youtube-nocookie.com'], true)) {
            throw ValidationException::withMessages([
                'url' => 'The link must be a YouTube URL.',
            ]);
        }
    }
}
