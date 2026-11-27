<?php

namespace App\Policies;

use App\Enums\ActivityStatus;
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

    /** Allows a person to open a task they are allowed to see. */
    public function view(User $user, Activity $activity): bool
    {
        return $this->sees($user, $activity);
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

    /** Allows an agency admin to remove a task that is not approved or scheduled. */
    public function delete(User $user, Activity $activity): bool
    {
        if (in_array($activity->status, [ActivityStatus::Approved, ActivityStatus::Scheduled], true)) {
            return false;
        }

        return $user->role === UserRole::AgencyAdmin && $this->sameAgency($user, $activity);
    }

    /** Allows the agency team to attach a delivery on a task they can see. */
    public function upload(User $user, Activity $activity): bool
    {
        return $this->isStaff($user) && $this->sees($user, $activity);
    }

    /** Allows a person who can see the task to comment on it. */
    public function comment(User $user, Activity $activity): bool
    {
        return $this->sees($user, $activity);
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

    /** Limits a client to their brand and a professional to their own tasks. */
    private function sees(User $user, Activity $activity): bool
    {
        if (! $this->sameAgency($user, $activity)) {
            return false;
        }

        if ($user->role === UserRole::AgencyAdmin) {
            return true;
        }

        if ($user->role === UserRole::Client) {
            return $user->workspace_id !== null
                && (int) $user->workspace_id === (int) $activity->workspace_id
                && in_array($activity->status, ActivityStatus::visibleToClient(), true);
        }

        return (int) $user->id === (int) $activity->assignee_id;
    }

    /** Checks that the user works for the agency. */
    private function isStaff(User $user): bool
    {
        return in_array($user->role, [UserRole::AgencyAdmin, UserRole::Designer, UserRole::Copywriter], true);
    }
}
