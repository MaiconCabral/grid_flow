<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;
use App\Models\Workspace;

class WorkspacePolicy
{
    public function viewAny(User $user): bool
    {
        return $this->managesAgency($user);
    }

    public function view(User $user, Workspace $workspace): bool
    {
        return $this->manages($user, $workspace);
    }

    public function create(User $user): bool
    {
        return $this->managesAgency($user);
    }

    public function update(User $user, Workspace $workspace): bool
    {
        return $this->manages($user, $workspace);
    }

    public function delete(User $user, Workspace $workspace): bool
    {
        return $this->manages($user, $workspace);
    }

    private function managesAgency(User $user): bool
    {
        return $user->role === UserRole::AgencyAdmin;
    }

    private function manages(User $user, Workspace $workspace): bool
    {
        return $this->managesAgency($user) && $user->tenant_id === $workspace->tenant_id;
    }
}
