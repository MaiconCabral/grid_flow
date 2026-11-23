<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->managesAgency($user);
    }

    public function view(User $user, User $subject): bool
    {
        return $this->manages($user, $subject);
    }

    public function create(User $user): bool
    {
        return $this->managesAgency($user);
    }

    public function update(User $user, User $subject): bool
    {
        return $this->manages($user, $subject);
    }

    public function delete(User $user, User $subject): bool
    {
        return $this->manages($user, $subject);
    }

    private function managesAgency(User $user): bool
    {
        return $user->role === UserRole::AgencyAdmin;
    }

    private function manages(User $user, User $subject): bool
    {
        return $this->managesAgency($user) && $user->tenant_id === $subject->tenant_id;
    }
}
