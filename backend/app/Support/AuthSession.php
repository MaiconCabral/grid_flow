<?php

namespace App\Support;

use App\Models\User;

class AuthSession
{
    public static function payload(User $user, ?string $token = null): array
    {
        $user->loadMissing('tenant');

        $payload = [
            'tenant' => [
                'id' => $user->tenant->id,
                'name' => $user->tenant->name,
                'slug' => $user->tenant->slug,
            ],
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->value,
                'workspace_id' => $user->workspace_id,
            ],
        ];

        if ($token !== null) {
            $payload = ['token' => $token] + $payload;
        }

        return $payload;
    }
}
