<?php

namespace Database\Seeders;

use App\Enums\ActivityChannel;
use App\Enums\ActivityEventType;
use App\Enums\ActivityFormat;
use App\Enums\ActivityStatus;
use App\Enums\AssetKind;
use App\Enums\UserRole;
use App\Models\Activity;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Workspace;
use App\Support\TenantContext;
use Illuminate\Database\Seeder;

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

        $this->task($jordan, $aster, $sarah, 'Summer launch carousel', 'Five frames for the summer drop, lime type on dark.', ActivityChannel::Instagram, ActivityFormat::Carousel, ActivityStatus::Todo, now()->toDateString());
        $film = $this->task($jordan, $aster, $john, 'Founder note', 'Short LinkedIn post in Jordan’s voice.', ActivityChannel::Linkedin, ActivityFormat::Post, ActivityStatus::Production, now()->addDay()->toDateString());
        $film->assets()->create([
            'tenant_id' => $alpha->id,
            'uploaded_by' => $john->id,
            'kind' => AssetKind::Link,
            'name' => 'YouTube',
            'url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        ]);
        $film->events()->create([
            'tenant_id' => $alpha->id,
            'actor_id' => $john->id,
            'type' => ActivityEventType::AssetAdded,
            'note' => 'YouTube',
        ]);
        $this->task($jordan, $northstar, $sarah, 'Product film', 'Cutdown of the lab walkthrough for review.', ActivityChannel::Youtube, ActivityFormat::Video, ActivityStatus::Pending, now()->addDays(2)->toDateString());
        $this->task($jordan, $kora, $john, 'Weekend caption', 'One paragraph for the Saturday story.', ActivityChannel::Facebook, ActivityFormat::Text, ActivityStatus::Approved, now()->addDays(4)->toDateString());
        $this->task($jordan, $northstar, $sarah, 'Launch reminder', 'Story frame the day before launch.', ActivityChannel::Tiktok, ActivityFormat::Story, ActivityStatus::Scheduled, now()->addDays(5)->toDateString());

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
}
