<?php

namespace App\Actions\Auth;

use App\Models\Membership;
use App\Models\User;
use App\Support\AuthSession;
use Illuminate\Validation\ValidationException;

class SwitchAgency
{
    /** Returns the session for an agency the person already belongs to. */
    public function handle(User $user, int $tenantId): array
    {
        $membership = Membership::query()
            ->where('user_id', $user->id)
            ->where('tenant_id', $tenantId)
            ->first();

        if ($membership === null) {
            throw ValidationException::withMessages([
                'tenant_id' => 'You do not belong to that agency.',
            ]);
        }

        $user->adopt($membership);

        return AuthSession::payload($user);
    }
}
