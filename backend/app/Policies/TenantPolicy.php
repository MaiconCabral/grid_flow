<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Tenant;
use App\Models\User;

class TenantPolicy
{
    /** Allows the agency admin to read their own agency settings. */
    public function view(User $user, Tenant $tenant): bool
    {
        return $user->role === UserRole::AgencyAdmin && $user->tenant_id === $tenant->id;
    }

    /** Allows the agency admin to change their own agency settings. */
    public function update(User $user, Tenant $tenant): bool
    {
        return $user->role === UserRole::AgencyAdmin && $user->tenant_id === $tenant->id;
    }
}
