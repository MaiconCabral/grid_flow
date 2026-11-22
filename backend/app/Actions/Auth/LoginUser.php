<?php

namespace App\Actions\Auth;

use App\Models\User;
use App\Support\AuthSession;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class LoginUser
{
    public function handle(string $email, string $password): array
    {
        $user = User::withoutGlobalScopes()->where('email', $email)->first();

        if ($user === null || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => 'These credentials do not match our records.',
            ]);
        }

        return AuthSession::payload($user, $user->createToken('api')->plainTextToken);
    }
}
