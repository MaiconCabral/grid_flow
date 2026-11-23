<?php

namespace App\Actions\Users;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class EnsureAgencyKeepsAdmin
{
    public function handle(User $user, UserRole $nextRole): void
    {
        if ($user->role !== UserRole::AgencyAdmin || $nextRole === UserRole::AgencyAdmin) {
            return;
        }

        $anotherAdmin = User::query()
            ->where('role', UserRole::AgencyAdmin)
            ->whereKeyNot($user->id)
            ->exists();

        if ($anotherAdmin) {
            return;
        }

        throw ValidationException::withMessages([
            'role' => 'The agency must keep at least one admin.',
        ]);
    }
}
