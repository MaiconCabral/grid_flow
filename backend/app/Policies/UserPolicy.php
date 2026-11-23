<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

class UserPolicy
{
    /** Allows an agency admin to list users. */
    public function viewAny(User $user): bool
    {
        return $this->managesAgency($user);
    }

    /** Allows an agency admin to see a user of the same agency. */
    public function view(User $user, User $subject): bool
    {
        return $this->manages($user, $subject);
    }

    /** Allows an agency admin to create a user. */
    public function create(User $user): bool
    {
        return $this->managesAgency($user);
    }

    /** Allows an agency admin to change a user of the same agency. */
    public function update(User $user, User $subject): bool
    {
        return $this->manages($user, $subject);
    }

    /** Allows an agency admin to remove a user of the same agency. */
    public function delete(User $user, User $subject): bool
    {
        return $this->manages($user, $subject);
    }

    /** Checks that the user is an agency admin. */
    private function managesAgency(User $user): bool
    {
        return $user->role === UserRole::AgencyAdmin;
    }

    /** Checks that the admin belongs to the same agency as the user. */
    private function manages(User $user, User $subject): bool
    {
        return $this->managesAgency($user) && $user->tenant_id === $subject->tenant_id;
    }
}
