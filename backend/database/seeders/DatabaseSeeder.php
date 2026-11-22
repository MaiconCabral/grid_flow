<?php

namespace Database\Seeders;

use App\Enums\UserRole;
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

        $context->forget();
    }
}
