<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;
use App\Models\Workspace;

class WorkspacePolicy
{
    /** Allows an agency admin to list brands. */
    public function viewAny(User $user): bool
    {
        return $this->managesAgency($user);
    }

    /** Allows an agency admin to see a brand of the same agency. */
    public function view(User $user, Workspace $workspace): bool
    {
        return $this->manages($user, $workspace);
    }

    /** Allows an agency admin to create a brand. */
    public function create(User $user): bool
    {
        return $this->managesAgency($user);
    }

    /** Allows an agency admin to change a brand of the same agency. */
    public function update(User $user, Workspace $workspace): bool
    {
        return $this->manages($user, $workspace);
    }

    /** Allows an agency admin to remove a brand of the same agency. */
    public function delete(User $user, Workspace $workspace): bool
    {
        return $this->manages($user, $workspace);
    }

    /** Checks that the user is an agency admin. */
    private function managesAgency(User $user): bool
    {
        return $user->role === UserRole::AgencyAdmin;
    }

    /** Checks that the admin belongs to the same agency as the brand. */
    private function manages(User $user, Workspace $workspace): bool
    {
        return $this->managesAgency($user) && $user->tenant_id === $workspace->tenant_id;
    }
}
