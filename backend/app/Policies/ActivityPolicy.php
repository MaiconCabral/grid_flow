<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Activity;
use App\Models\User;

class ActivityPolicy
{
    /** Allows anyone in the agency to open the board. */
    public function viewAny(User $user): bool
    {
        return $user->tenant_id !== null;
    }

    /** Allows staff to see every task, and a client only their brand. */
    public function view(User $user, Activity $activity): bool
    {
        return $this->sameAgency($user, $activity) && $this->seesBrand($user, $activity);
    }

    /** Allows only an agency admin to create a task. */
    public function create(User $user): bool
    {
        return $user->role === UserRole::AgencyAdmin;
    }

    /** Allows only an agency admin to move a task between columns. */
    public function update(User $user, Activity $activity): bool
    {
        return $user->role === UserRole::AgencyAdmin && $this->sameAgency($user, $activity);
    }

    /** Allows the agency team to attach a delivery. */
    public function upload(User $user, Activity $activity): bool
    {
        return $this->isStaff($user) && $this->sameAgency($user, $activity);
    }

    /** Allows only the client of that brand to approve or request changes. */
    public function approve(User $user, Activity $activity): bool
    {
        return $user->role === UserRole::Client
            && $user->workspace_id !== null
            && (int) $user->workspace_id === (int) $activity->workspace_id
            && $this->sameAgency($user, $activity);
    }

    /** Checks that the user belongs to the task's agency. */
    private function sameAgency(User $user, Activity $activity): bool
    {
        return (int) $user->tenant_id === (int) $activity->tenant_id;
    }

    /** Hides other brands from a client login. */
    private function seesBrand(User $user, Activity $activity): bool
    {
        if ($user->role !== UserRole::Client) {
            return true;
        }

        return (int) $user->workspace_id === (int) $activity->workspace_id;
    }

    /** Checks that the user works for the agency. */
    private function isStaff(User $user): bool
    {
        return in_array($user->role, [UserRole::AgencyAdmin, UserRole::Designer, UserRole::Copywriter], true);
    }
}
