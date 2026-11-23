<?php

namespace App\Actions\Users;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class DeleteTenantUser
{
    public function __construct(private EnsureAgencyKeepsAdmin $guard) {}

    public function handle(User $actor, User $user): void
    {
        if ($actor->is($user)) {
            throw ValidationException::withMessages([
                'user' => 'You cannot remove your own account.',
            ]);
        }

        $this->guard->handle($user, UserRole::Designer);
        $user->tokens()->delete();
        $user->delete();
    }
}
