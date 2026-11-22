<?php

namespace App\Actions\Auth;

use App\Enums\UserRole;
use App\Models\Tenant;
use App\Models\User;
use App\Support\AuthSession;
use Illuminate\Support\Facades\DB;

class RegisterAgency
{
    public function handle(array $data): array
    {
        $user = DB::transaction(function () use ($data) {
            $tenant = Tenant::query()->create([
                'name' => $data['agency_name'],
                'slug' => $data['agency_slug'],
            ]);

            return User::withoutGlobalScopes()->create([
                'tenant_id' => $tenant->id,
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => UserRole::AgencyAdmin,
            ]);
        });

        return AuthSession::payload($user, $user->createToken('api')->plainTextToken);
    }
}
