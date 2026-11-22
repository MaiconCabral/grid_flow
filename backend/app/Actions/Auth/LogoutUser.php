<?php

namespace App\Actions\Auth;

use App\Models\User;

class LogoutUser
{
    public function handle(User $user, ?string $bearer): void
    {
        if ($bearer === null || ! str_contains($bearer, '|')) {
            $user->tokens()->delete();

            return;
        }

        [$id] = explode('|', $bearer, 2);
        $user->tokens()->whereKey($id)->delete();
    }
}
