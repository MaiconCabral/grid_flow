<?php

namespace App\Actions\Users;

use App\Enums\UserRole;
use App\Models\User;
use App\Models\Workspace;
use App\Support\TenantContext;
use Illuminate\Validation\ValidationException;

class CreateTenantUser
{
    public function handle(array $data): User
    {
        $role = UserRole::from($data['role']);
        $workspaceId = null;

        if ($role === UserRole::Client) {
            $workspace = Workspace::query()->find($data['workspace_id'] ?? null);

            if ($workspace === null) {
                throw ValidationException::withMessages([
                    'workspace_id' => 'The selected workspace is invalid.',
                ]);
            }

            $workspaceId = $workspace->id;
        }

        return User::query()->create([
            'tenant_id' => app(TenantContext::class)->id(),
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => $role,
            'workspace_id' => $workspaceId,
        ]);
    }
}
