<?php

namespace App\Actions\Activities;

use App\Enums\ActivityEventType;
use App\Enums\ActivityStatus;
use App\Enums\AssetKind;
use App\Models\Activity;
use App\Models\ActivityAsset;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

class StoreActivityAsset
{
    public function __construct(private RecordActivityEvent $events) {}

    /** Attaches a file or a YouTube link while the task is in production. */
    public function handle(Activity $activity, User $actor, array $data, ?UploadedFile $file): ActivityAsset
    {
        if ($activity->status !== ActivityStatus::Production) {
            throw ValidationException::withMessages([
                'status' => 'Assets can be added only while the task is in production.',
            ]);
        }

        $kind = AssetKind::from($data['kind']);

        if ($kind === AssetKind::Link) {
            $this->assertYoutube($data['url']);
            $asset = $activity->assets()->create([
                'tenant_id' => $activity->tenant_id,
                'uploaded_by' => $actor->id,
                'kind' => $kind,
                'name' => 'YouTube',
                'url' => $data['url'],
            ]);
        } else {
            $path = $file->store('activities/'.$activity->id, 'public');
            $asset = $activity->assets()->create([
                'tenant_id' => $activity->tenant_id,
                'uploaded_by' => $actor->id,
                'kind' => $kind,
                'name' => $file->getClientOriginalName(),
                'path' => $path,
            ]);
        }

        $this->events->handle($activity, $actor, ActivityEventType::AssetAdded, null, null, $asset->name);

        return $asset;
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
