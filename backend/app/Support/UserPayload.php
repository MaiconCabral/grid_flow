<?php

namespace App\Support;

use App\Models\User;

class UserPayload
{
    /** Shapes a user for the API response. */
    public static function from(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role->value,
            'workspace_id' => $user->workspace_id,
            'workspace_name' => $user->workspace?->name,
        ];
    }
}
