<?php

namespace Database\Seeders;

use App\Enums\ActivityChannel;
use App\Enums\ActivityEventType;
use App\Enums\ActivityFormat;
use App\Enums\ActivityStatus;
use App\Enums\AssetKind;
use App\Enums\UserRole;
use App\Models\Activity;
use App\Models\Membership;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Workspace;
use App\Support\ActivityFolder;
use App\Support\CoverPalette;
use App\Support\TenantContext;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $context = app(TenantContext::class);

        $alpha = Tenant::query()->create([
            'name' => 'Agency Alpha',
            'slug' => 'agency-alpha',
        ]);
        $context->set($alpha->id);

        $aster = Workspace::query()->create(['name' => 'Aster & Co.']);
        Workspace::query()->create(['name' => 'Northstar Labs']);
        Workspace::query()->create(['name' => 'Kora House']);

        User::query()->create([
            'name' => 'Jordan Miller',
            'email' => 'jordan@agency-alpha.test',
            'password' => 'password',
            'role' => UserRole::AgencyAdmin,
        ]);
        User::query()->create([
            'name' => 'Sarah Reyes',
            'email' => 'sarah@agency-alpha.test',
            'password' => 'password',
            'role' => UserRole::Designer,
        ]);
        User::query()->create([
            'name' => 'John Park',
            'email' => 'john@agency-alpha.test',
            'password' => 'password',
            'role' => UserRole::Copywriter,
        ]);
        User::query()->create([
            'name' => 'Olivia Chen',
            'email' => 'olivia@aster.test',
            'password' => 'password',
            'role' => UserRole::Client,
            'workspace_id' => $aster->id,
        ]);

        $horizon = Tenant::query()->create([
            'name' => 'Horizon Studio',
            'slug' => 'horizon-studio',
        ]);
        $context->set($horizon->id);

        $lumen = Workspace::query()->create(['name' => 'Lumen Atelier']);
        $vela = Workspace::query()->create(['name' => 'Vela Market']);
        $porto = Workspace::query()->create(['name' => 'Porto & Pine']);

        User::query()->create([
            'name' => 'Helena Rocha',
            'email' => 'helena@horizon-studio.test',
            'password' => 'password',
            'role' => UserRole::AgencyAdmin,
        ]);
        User::query()->create([
            'name' => 'Rafael Mendes',
            'email' => 'rafael@horizon-studio.test',
            'password' => 'password',
            'role' => UserRole::Designer,
        ]);
        User::query()->create([
            'name' => 'Clara Nunes',
            'email' => 'clara@horizon-studio.test',
            'password' => 'password',
            'role' => UserRole::Copywriter,
        ]);
        User::query()->create([
            'name' => 'Beatriz Almeida',
            'email' => 'beatriz@lumen.test',
            'password' => 'password',
            'role' => UserRole::Client,
            'workspace_id' => $lumen->id,
        ]);
        User::query()->create([
            'name' => 'Diego Santos',
            'email' => 'diego@vela.test',
            'password' => 'password',
            'role' => UserRole::Client,
            'workspace_id' => $vela->id,
        ]);
        User::query()->create([
            'name' => 'Inês Carvalho',
            'email' => 'ines@porto.test',
            'password' => 'password',
            'role' => UserRole::Client,
            'workspace_id' => $porto->id,
        ]);

        $this->seedActivities();
        $context->forget();
    }

    /** Places sample tasks on Agency Alpha and Horizon Studio. */
    private function seedActivities(): void
    {
        $context = app(TenantContext::class);

        $alpha = Tenant::query()->where('slug', 'agency-alpha')->firstOrFail();
        $context->set($alpha->id);
        $aster = Workspace::query()->where('name', 'Aster & Co.')->firstOrFail();
        $northstar = Workspace::query()->where('name', 'Northstar Labs')->firstOrFail();
        $kora = Workspace::query()->where('name', 'Kora House')->firstOrFail();
        $jordan = User::query()->where('email', 'jordan@agency-alpha.test')->firstOrFail();
        $sarah = User::query()->where('email', 'sarah@agency-alpha.test')->firstOrFail();
        $john = User::query()->where('email', 'john@agency-alpha.test')->firstOrFail();
        $horizonId = Tenant::query()->where('slug', 'horizon-studio')->value('id');
        $maya = User::query()->create([
            'name' => 'Maya Costa',
            'email' => 'maya@studios.test',
            'password' => 'password',
            'role' => UserRole::Designer,
        ]);
        Membership::query()->create([
            'user_id' => $maya->id,
            'tenant_id' => $horizonId,
            'role' => UserRole::Designer,
        ]);

        $carousel = $this->task($jordan, $aster, $sarah, 'Summer launch carousel', 'Five frames for the summer drop, lime type on dark.', ActivityChannel::Instagram, ActivityFormat::Carousel, ActivityStatus::Production, now()->toDateString());
        $this->slides($carousel, $sarah, ['slide-1.png', 'slide-2.png', 'slide-3.png']);
        $this->briefing($carousel);
        $this->task($jordan, $aster, $john, 'Founder note', 'Short LinkedIn post in Jordan’s voice.', ActivityChannel::Linkedin, ActivityFormat::Post, ActivityStatus::Production, now()->addDay()->toDateString());
        $this->task($jordan, $northstar, $sarah, 'Product film', 'Cutdown of the lab walkthrough for review.', ActivityChannel::Youtube, ActivityFormat::Video, ActivityStatus::Pending, now()->addDays(2)->toDateString());
        $caption = $this->task($jordan, $kora, $john, 'Weekend caption', 'One paragraph for the Saturday story.', ActivityChannel::Facebook, ActivityFormat::Text, ActivityStatus::Approved, now()->addDays(4)->toDateString());
        $this->document($caption, $john);
        $this->task($jordan, $northstar, $sarah, 'Launch reminder', 'Story frame the day before launch.', ActivityChannel::Tiktok, ActivityFormat::Story, ActivityStatus::Scheduled, now()->addDays(5)->toDateString());
        $cutdown = $this->task($jordan, $aster, $maya, 'Shared cutdown', 'A fifteen second cut Maya finishes for Aster.', ActivityChannel::Instagram, ActivityFormat::Video, ActivityStatus::Production, now()->toDateString());
        $this->video($cutdown, $maya, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');

        $horizon = Tenant::query()->where('slug', 'horizon-studio')->firstOrFail();
        $context->set($horizon->id);
        $lumen = Workspace::query()->where('name', 'Lumen Atelier')->firstOrFail();
        $vela = Workspace::query()->where('name', 'Vela Market')->firstOrFail();
        $porto = Workspace::query()->where('name', 'Porto & Pine')->firstOrFail();
        $helena = User::query()->where('email', 'helena@horizon-studio.test')->firstOrFail();
        $rafael = User::query()->where('email', 'rafael@horizon-studio.test')->firstOrFail();
        $clara = User::query()->where('email', 'clara@horizon-studio.test')->firstOrFail();

        $this->task($helena, $lumen, $rafael, 'Atelier lookbook', 'Carousel of the new linen set.', ActivityChannel::Instagram, ActivityFormat::Carousel, ActivityStatus::Production, now()->toDateString());
        $this->task($helena, $vela, $clara, 'Market reel', 'Fifteen seconds from the Saturday stall.', ActivityChannel::Tiktok, ActivityFormat::Video, ActivityStatus::Pending, now()->addDays(1)->toDateString());
        $this->task($helena, $porto, $rafael, 'Pine story', 'A quiet frame for the weekend menu.', ActivityChannel::Facebook, ActivityFormat::Story, ActivityStatus::Todo, now()->addDays(3)->toDateString());
        $this->task($helena, $lumen, $maya, 'Studio still', 'One frame Maya retouches for the atelier.', ActivityChannel::Instagram, ActivityFormat::Post, ActivityStatus::Todo, now()->toDateString());
    }

    /** Creates one task and its opening history entry. */
    private function task(
        User $author,
        Workspace $workspace,
        User $assignee,
        string $title,
        string $briefing,
        ActivityChannel $channel,
        ActivityFormat $format,
        ActivityStatus $status,
        string $dueOn,
    ): Activity {
        $tone = CoverPalette::pick();
        $activity = Activity::query()->create([
            'workspace_id' => $workspace->id,
            'created_by' => $author->id,
            'assignee_id' => $assignee->id,
            'title' => $title,
            'briefing' => $briefing,
            'channel' => $channel,
            'format' => $format,
            'status' => $status,
            'due_on' => $dueOn,
            'storage_key' => ActivityFolder::key($workspace->name),
            'cover_from' => $tone['from'],
            'cover_to' => $tone['to'],
        ]);

        $activity->events()->create([
            'tenant_id' => $activity->tenant_id,
            'actor_id' => $author->id,
            'type' => ActivityEventType::Created,
            'to_status' => ActivityStatus::Todo,
        ]);

        if ($status !== ActivityStatus::Todo) {
            $activity->events()->create([
                'tenant_id' => $activity->tenant_id,
                'actor_id' => $author->id,
                'type' => ActivityEventType::StatusChanged,
                'from_status' => ActivityStatus::Todo,
                'to_status' => $status,
            ]);
        }

        return $activity;
    }

    /** Stores three cover images as one carousel version. */
    private function slides(Activity $activity, User $author, array $names): void
    {
        $colors = [
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        ];
        $files = [];
        foreach ($names as $index => $name) {
            $path = $activity->storage_key.'/'.$name;
            Storage::disk('public')->put($path, base64_decode($colors[$index % count($colors)]));
            $files[] = ['name' => $name, 'path' => $path, 'url' => null];
        }
        $this->version($activity, $author, AssetKind::Image, $files, null);
    }

    /** Stores a YouTube address as the video delivery. */
    private function video(Activity $activity, User $author, string $url): void
    {
        $this->version($activity, $author, AssetKind::Link, [
            ['name' => 'YouTube', 'path' => null, 'url' => $url],
        ], $url);
    }

    /** Stores a short Word file as the text delivery. */
    private function document(Activity $activity, User $author): void
    {
        $path = $activity->storage_key.'/weekend-caption.docx';
        Storage::disk('public')->put($path, $this->docx('Weekend caption'));
        $this->version($activity, $author, AssetKind::Document, [
            ['name' => 'weekend-caption.docx', 'path' => $path, 'url' => null],
        ], null);
    }

    /** Stores an optional PDF next to the task files. */
    private function briefing(Activity $activity): void
    {
        $path = $activity->storage_key.'/briefing.pdf';
        Storage::disk('public')->put($path, "%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF");
        $activity->forceFill(['briefing_name' => 'briefing.pdf', 'briefing_path' => $path])->save();
    }

    /** Writes one version and its files. */
    private function version(Activity $activity, User $author, AssetKind $kind, array $files, ?string $url): void
    {
        $first = $files[0];
        $stored = $activity->versions()->create([
            'tenant_id' => $activity->tenant_id,
            'uploaded_by' => $author->id,
            'number' => 1,
            'kind' => $kind,
            'name' => $first['name'],
            'path' => $first['path'],
            'url' => $url,
            'is_current' => true,
        ]);
        foreach ($files as $position => $file) {
            $stored->files()->create([
                'tenant_id' => $activity->tenant_id,
                'position' => $position,
                'name' => $file['name'],
                'path' => $file['path'],
                'url' => $file['url'],
            ]);
        }
        $activity->events()->create([
            'tenant_id' => $activity->tenant_id,
            'actor_id' => $author->id,
            'type' => ActivityEventType::AssetAdded,
            'note' => $first['name'],
        ]);
    }

    /** Builds a tiny Word document the seeder can store. */
    private function docx(string $text): string
    {
        $tmp = tempnam(sys_get_temp_dir(), 'gridflow');
        unlink($tmp);
        $zip = new \ZipArchive;
        $zip->open($tmp, \ZipArchive::CREATE);
        $zip->addFromString('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
        $zip->addFromString('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
        $zip->addFromString('word/document.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>'.htmlspecialchars($text, ENT_XML1).'</w:t></w:r></w:p></w:body></w:document>');
        $zip->close();
        $bytes = (string) file_get_contents($tmp);
        unlink($tmp);

        return $bytes;
    }
}
