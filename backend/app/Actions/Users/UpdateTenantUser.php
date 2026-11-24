<?php

namespace App\Actions\Users;

use App\Enums\UserRole;
use App\Models\Membership;
use App\Models\User;
use App\Models\Workspace;
use App\Support\TenantContext;
use Illuminate\Validation\ValidationException;

class UpdateTenantUser
{
    public function __construct(private EnsureAgencyKeepsAdmin $guard) {}

    /** Updates the person and the role they hold in the active agency. */
    public function handle(User $user, array $data): User
    {
        $role = UserRole::from($data['role']);
        $this->guard->handle($user, $role);
        $workspaceId = $this->workspaceId($role, $data['workspace_id'] ?? null);
        $tenantId = app(TenantContext::class)->id();

        Membership::query()
            ->where('user_id', $user->id)
            ->where('tenant_id', $tenantId)
            ->firstOrFail()
            ->fill([
                'role' => $role,
                'workspace_id' => $workspaceId,
            ])
            ->save();

        $user->name = $data['name'];
        $user->email = $data['email'];

        if ($user->homeTenantId === null || (int) $user->homeTenantId === (int) $tenantId) {
            $user->role = $role;
            $user->workspace_id = $workspaceId;
        }

        if (filled($data['password'] ?? null)) {
            $user->password = $data['password'];
        }

        $user->save();
        $user->role = $role;
        $user->workspace_id = $workspaceId;
        $user->syncOriginalAttribute('role');
        $user->syncOriginalAttribute('workspace_id');
        $user->unsetRelation('workspace');

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
