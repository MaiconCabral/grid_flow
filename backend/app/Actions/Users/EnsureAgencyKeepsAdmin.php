<?php

namespace App\Actions\Users;

use App\Enums\UserRole;
use App\Models\Membership;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Validation\ValidationException;

class EnsureAgencyKeepsAdmin
{
    /** Rejects a change that would leave the agency without an admin. */
    public function handle(User $user, UserRole $nextRole): void
    {
        $tenantId = app(TenantContext::class)->id();
        $membership = Membership::query()
            ->where('user_id', $user->id)
            ->where('tenant_id', $tenantId)
            ->first();

        if ($membership === null || $membership->role !== UserRole::AgencyAdmin || $nextRole === UserRole::AgencyAdmin) {
            return;
        }

        $anotherAdmin = Membership::query()
            ->where('tenant_id', $tenantId)
            ->where('role', UserRole::AgencyAdmin)
            ->where('user_id', '!=', $user->id)
            ->exists();

        if ($anotherAdmin) {
            return;
        }

        throw ValidationException::withMessages([
            'role' => 'The agency must keep at least one admin.',
        ]);
    }
}
