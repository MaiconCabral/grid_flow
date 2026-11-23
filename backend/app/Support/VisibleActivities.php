<?php

namespace App\Support;

use App\Enums\UserRole;
use App\Models\Activity;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class VisibleActivities
{
    /** Limits tasks to the ones this person may see. */
    public function for(User $user): Builder
    {
        $query = Activity::query();

        if ($user->role === UserRole::Client) {
            $query->where('workspace_id', $user->workspace_id ?? 0);
        } elseif ($user->role !== UserRole::AgencyAdmin) {
            $query->where('assignee_id', $user->id);
        }

        return $query;
    }
}
