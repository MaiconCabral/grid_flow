<?php

namespace App\Support;

use App\Models\Membership;
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
                'theme' => $user->tenant->theme,
                'light_background' => $user->tenant->light_background,
                'dark_background' => $user->tenant->dark_background,
                'accent' => $user->tenant->accent,
                'plan' => $user->tenant->plan,
            ],
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->value,
                'workspace_id' => $user->workspace_id,
            ],
            'agencies' => self::agencies($user),
        ];

        if ($token !== null) {
            $payload = ['token' => $token] + $payload;
        }

        return $payload;
    }

    /** Lists the agencies the person can open. */
    private static function agencies(User $user): array
    {
        return Membership::query()
            ->where('user_id', $user->id)
            ->with('tenant')
            ->orderBy('tenant_id')
            ->get()
            ->map(fn (Membership $membership) => [
                'id' => $membership->tenant->id,
                'name' => $membership->tenant->name,
                'slug' => $membership->tenant->slug,
            ])
            ->values()
            ->all();
    }
}
