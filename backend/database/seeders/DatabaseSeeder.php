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

        $newton = Tenant::query()->create([
            'name' => 'Newton',
            'slug' => 'newton',
        ]);
        $context->set($newton->id);

        $hernandez = Workspace::query()->create(['name' => 'Hernandez']);
        $febrasgo = Workspace::query()->create(['name' => 'Febrasgo']);
        $momentum = Workspace::query()->create(['name' => 'Momentum']);

        User::query()->create([
            'name' => 'Thais',
            'email' => 'thais@newton.ag',
            'password' => 'password',
            'role' => UserRole::AgencyAdmin,
        ]);
        User::query()->create([
            'name' => 'Caique',
            'email' => 'caique.lemos@newton.ag',
            'password' => 'password',
            'role' => UserRole::Designer,
        ]);
        User::query()->create([
            'name' => 'Juliana',
            'email' => 'juliana.brito@newton.ag',
            'password' => 'password',
            'role' => UserRole::Copywriter,
        ]);
        User::query()->create([
            'name' => 'Paulo',
            'email' => 'paulo@hernandez.com',
            'password' => 'password',
            'role' => UserRole::Client,
            'workspace_id' => $hernandez->id,
        ]);
        User::query()->create([
            'name' => 'Pedro',
            'email' => 'pedro@febrasgo.com',
            'password' => 'password',
            'role' => UserRole::Client,
            'workspace_id' => $febrasgo->id,
        ]);
        User::query()->create([
            'name' => 'João',
            'email' => 'joao@momentum.com',
            'password' => 'password',
            'role' => UserRole::Client,
            'workspace_id' => $momentum->id,
        ]);

        $this->seedActivities();
        $context->forget();
    }

    /** Places sample tasks on Agency Alpha, Horizon Studio, and Newton. */
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
        $this->slides($carousel, $sarah, ['slide-1.png', 'slide-2.png', 'slide-3.png'], 'Lime on dark', 'Five frames for the summer drop. Save the set for launch week.');
        $this->briefing($carousel);
        $note = $this->task($jordan, $aster, $john, 'Founder note', 'Short LinkedIn post in Jordan’s voice.', ActivityChannel::Linkedin, ActivityFormat::Post, ActivityStatus::Production, now()->addDay()->toDateString());
        $this->slides($note, $john, ['founder.png'], 'From the founder', 'We started in a small room. This is the note I wish I had posted sooner.');
        $film = $this->task($jordan, $northstar, $sarah, 'Product film', 'Cutdown of the lab walkthrough for review.', ActivityChannel::Youtube, ActivityFormat::Video, ActivityStatus::Pending, now()->addDays(2)->toDateString());
        $this->video($film, $sarah, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Inside the lab', 'A short walk through the week we shipped the new line.');
        $caption = $this->task($jordan, $kora, $john, 'Weekend caption', 'One paragraph for the Saturday story.', ActivityChannel::Facebook, ActivityFormat::Blog, ActivityStatus::Approved, now()->addDays(4)->toDateString());
        $this->document($caption, $john, 'The Saturday note');
        $reminder = $this->task($jordan, $northstar, $sarah, 'Launch reminder', 'Story frame the day before launch.', ActivityChannel::Tiktok, ActivityFormat::Story, ActivityStatus::Scheduled, now()->addDays(5)->toDateString());
        $this->slides($reminder, $sarah, ['story.png'], 'Tomorrow', 'Launch day is tomorrow. Tap in and set a reminder.');
        $cutdown = $this->task($jordan, $aster, $maya, 'Shared cutdown', 'A fifteen second cut Maya finishes for Aster.', ActivityChannel::Instagram, ActivityFormat::Video, ActivityStatus::Production, now()->toDateString());
        $this->video($cutdown, $maya, 'https://www.youtube.com/watch?v=jNQXAC9IVRw', 'Fifteen seconds', 'The cut Maya finishes for Aster. Watch it once before it goes out.');

        $horizon = Tenant::query()->where('slug', 'horizon-studio')->firstOrFail();
        $context->set($horizon->id);
        $lumen = Workspace::query()->where('name', 'Lumen Atelier')->firstOrFail();
        $vela = Workspace::query()->where('name', 'Vela Market')->firstOrFail();
        $porto = Workspace::query()->where('name', 'Porto & Pine')->firstOrFail();
        $helena = User::query()->where('email', 'helena@horizon-studio.test')->firstOrFail();
        $rafael = User::query()->where('email', 'rafael@horizon-studio.test')->firstOrFail();
        $clara = User::query()->where('email', 'clara@horizon-studio.test')->firstOrFail();

        $lookbook = $this->task($helena, $lumen, $rafael, 'Atelier lookbook', 'Carousel of the new linen set.', ActivityChannel::Instagram, ActivityFormat::Carousel, ActivityStatus::Production, now()->toDateString());
        $this->slides($lookbook, $rafael, ['linen-1.png', 'linen-2.png', 'linen-3.png'], 'Linen, quietly', 'Three frames from the new set. Soft light, no logo lockup.');
        $reel = $this->task($helena, $vela, $clara, 'Market reel', 'Fifteen seconds from the Saturday stall.', ActivityChannel::Tiktok, ActivityFormat::Video, ActivityStatus::Pending, now()->addDays(1)->toDateString());
        $this->video($reel, $clara, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Saturday stall', 'Fifteen seconds from the market, before the crowd arrives.');
        $this->task($helena, $porto, $rafael, 'Pine story', 'A quiet frame for the weekend menu.', ActivityChannel::Facebook, ActivityFormat::Story, ActivityStatus::Todo, now()->addDays(3)->toDateString());
        $this->task($helena, $lumen, $maya, 'Studio still', 'One frame Maya retouches for the atelier.', ActivityChannel::Instagram, ActivityFormat::Post, ActivityStatus::Todo, now()->toDateString());

        $context->set(Tenant::query()->where('slug', 'newton')->firstOrFail()->id);
        $hernandez = Workspace::query()->where('name', 'Hernandez')->firstOrFail();
        $febrasgo = Workspace::query()->where('name', 'Febrasgo')->firstOrFail();
        $momentum = Workspace::query()->where('name', 'Momentum')->firstOrFail();
        $thais = User::query()->where('email', 'thais@newton.ag')->firstOrFail();
        $caique = User::query()->where('email', 'caique.lemos@newton.ag')->firstOrFail();
        $juliana = User::query()->where('email', 'juliana.brito@newton.ag')->firstOrFail();

        $summer = $this->task($thais, $hernandez, $caique, 'Coleção de verão', 'Peça de abertura da coleção, sem preço no criativo.', ActivityChannel::Instagram, ActivityFormat::Post, ActivityStatus::Production, now()->toDateString());
        $this->slides($summer, $caique, ['hernandez.png'], 'Verão Hernandez', 'A nova coleção chega esta semana. Veja as peças que abrem a estação.');
        $congress = $this->task($thais, $febrasgo, $juliana, 'Congresso Febrasgo', 'Três frames com a programação. O texto interno fica no briefing.', ActivityChannel::Instagram, ActivityFormat::Carousel, ActivityStatus::Production, now()->addDay()->toDateString());
        $this->slides($congress, $juliana, ['febrasgo-1.png', 'febrasgo-2.png', 'febrasgo-3.png'], 'Congresso Febrasgo', 'Três frames com a programação da semana. Salve para não perder o horário.');
        $note = $this->task($thais, $hernandez, $juliana, 'Nota da Hernandez', 'Artigo curto para o blog da marca.', ActivityChannel::Facebook, ActivityFormat::Blog, ActivityStatus::Approved, now()->addDays(2)->toDateString());
        $this->document($note, $juliana, 'Nota da Hernandez');
        $move = $this->task($thais, $momentum, $caique, 'Momentum em movimento', 'Vídeo de um minuto para a revisão do cliente.', ActivityChannel::Youtube, ActivityFormat::Video, ActivityStatus::Pending, now()->addDays(3)->toDateString());
        $this->video($move, $caique, 'https://www.youtube.com/watch?v=jNQXAC9IVRw', 'Momentum em movimento', 'Um minuto com o time e o que vem no próximo ciclo.');
        $opening = $this->task($thais, $febrasgo, $caique, 'Amanhã começa', 'Story da véspera do encontro.', ActivityChannel::Tiktok, ActivityFormat::Story, ActivityStatus::Scheduled, now()->addDays(4)->toDateString());
        $this->slides($opening, $caique, ['febrasgo-story.png'], 'Amanhã começa', 'O encontro abre amanhã. Separe o horário.');
        $this->task($thais, $momentum, $juliana, 'Próximo ciclo', 'Post ainda sem entrega. O título publicado entra com o arquivo.', ActivityChannel::Linkedin, ActivityFormat::Post, ActivityStatus::Todo, now()->addDays(5)->toDateString());

        $look = $this->task($thais, $hernandez, $caique, 'Look da semana', 'Dois frames para o Paulo revisar a ordem.', ActivityChannel::Instagram, ActivityFormat::Carousel, ActivityStatus::Pending, now()->toDateString());
        $this->slides($look, $caique, ['look-1.png', 'look-2.png'], 'Look da semana', 'Dois frames do look que abre a semana. O cliente escolhe a ordem.');
        $backstage = $this->task($thais, $hernandez, $juliana, 'Bastidores Hernandez', 'Vídeo curto para o Paulo aprovar antes de publicar.', ActivityChannel::Youtube, ActivityFormat::Video, ActivityStatus::Pending, now()->addDay()->toDateString());
        $this->video($backstage, $juliana, 'https://www.youtube.com/watch?v=jNQXAC9IVRw', 'Bastidores Hernandez', 'Um minuto nos bastidores da coleção, pronto para a revisão.');

        $invite = $this->task($thais, $febrasgo, $juliana, 'Convite Febrasgo', 'Post do convite para o Pedro revisar o tom.', ActivityChannel::Linkedin, ActivityFormat::Post, ActivityStatus::Pending, now()->toDateString());
        $this->slides($invite, $juliana, ['convite.png'], 'Convite Febrasgo', 'O texto do convite já está na peça. Falta o ok para publicar.');
        $summary = $this->task($thais, $febrasgo, $caique, 'Resumo do congresso', 'Artigo para o Pedro ler antes de sair.', ActivityChannel::Facebook, ActivityFormat::Blog, ActivityStatus::Pending, now()->addDay()->toDateString());
        $this->document($summary, $caique, 'Resumo do congresso');

        $openingPost = $this->task($thais, $momentum, $caique, 'Abertura Momentum', 'Post de abertura para o João revisar.', ActivityChannel::Instagram, ActivityFormat::Post, ActivityStatus::Pending, now()->toDateString());
        $this->slides($openingPost, $caique, ['abertura.png'], 'Abertura Momentum', 'A frase de abertura do ciclo. Revise o tom antes de sair.');
        $countdown = $this->task($thais, $momentum, $juliana, 'Contagem Momentum', 'Story da contagem para o João conferir o horário.', ActivityChannel::Tiktok, ActivityFormat::Story, ActivityStatus::Pending, now()->addDay()->toDateString());
        $this->slides($countdown, $juliana, ['contagem.png'], 'Contagem Momentum', 'O frame da contagem. Confira o horário no texto.');
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
    private function slides(Activity $activity, User $author, array $names, string $headline, string $caption): void
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
            $files[] = ['name' => $name, 'path' => $path, 'url' => null, 'role' => 'asset'];
        }
        $this->version($activity, $author, AssetKind::Image, $files, null, $headline, $caption);
    }

    /** Stores a YouTube address as the video delivery. */
    private function video(Activity $activity, User $author, string $url, string $headline, string $caption): void
    {
        $this->version($activity, $author, AssetKind::Link, [
            ['name' => 'YouTube', 'path' => null, 'url' => $url, 'role' => 'asset'],
        ], $url, $headline, $caption);
    }

    /** Stores a cover and a short Word file as the blog delivery. */
    private function document(Activity $activity, User $author, string $headline): void
    {
        $path = $activity->storage_key.'/article.docx';
        $cover = $activity->storage_key.'/cover.png';
        Storage::disk('public')->put($path, $this->docx($headline));
        Storage::disk('public')->put($cover, base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='));
        $this->version($activity, $author, AssetKind::Document, [
            ['name' => 'article.docx', 'path' => $path, 'url' => null, 'role' => 'asset'],
            ['name' => 'cover.png', 'path' => $cover, 'url' => null, 'role' => 'cover'],
        ], null, $headline);
    }

    /** Stores an optional PDF next to the task files. */
    private function briefing(Activity $activity): void
    {
        $path = $activity->storage_key.'/briefing.pdf';
        Storage::disk('public')->put($path, "%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF");
        $activity->forceFill(['briefing_name' => 'briefing.pdf', 'briefing_path' => $path])->save();
    }

    /** Writes one version and its files. */
    private function version(Activity $activity, User $author, AssetKind $kind, array $files, ?string $url, ?string $headline = null, ?string $caption = null): void
    {
        $first = $files[0];
        $stored = $activity->versions()->create([
            'tenant_id' => $activity->tenant_id,
            'uploaded_by' => $author->id,
            'number' => 1,
            'kind' => $kind,
            'name' => $first['name'],
            'headline' => $headline,
            'caption' => $caption,
            'path' => $first['path'],
            'url' => $url,
            'is_current' => true,
        ]);
        foreach ($files as $position => $file) {
            $stored->files()->create([
                'tenant_id' => $activity->tenant_id,
                'position' => $position,
                'role' => $file['role'] ?? 'asset',
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
