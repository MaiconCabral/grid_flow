<?php

namespace App\Actions\Users;

use App\Enums\UserRole;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Validation\ValidationException;

class UpdateTenantUser
{
    public function __construct(private EnsureAgencyKeepsAdmin $guard) {}

    /** Updates a user and keeps the agency from losing its last admin. */
    public function handle(User $user, array $data): User
    {
        $role = UserRole::from($data['role']);
        $this->guard->handle($user, $role);

        $user->fill([
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $role,
            'workspace_id' => $this->workspaceId($role, $data['workspace_id'] ?? null),
        ]);

        if (filled($data['password'] ?? null)) {
            $user->password = $data['password'];
        }

        $user->save();

        return $user->load('workspace');
    }

    /** Resolves the brand for a client and clears it for other roles. */
    private function workspaceId(UserRole $role, mixed $workspaceId): ?int
    {
        if ($role !== UserRole::Client) {
            return null;
        }

        $workspace = Workspace::query()->find($workspaceId);

        if ($workspace === null) {
            throw ValidationException::withMessages([
                'workspace_id' => 'The selected workspace is invalid.',
            ]);
        }

        return $workspace->id;
    }
}
