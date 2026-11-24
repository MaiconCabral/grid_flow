<?php

namespace App\Actions\Users;

use App\Enums\UserRole;
use App\Models\Membership;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Validation\ValidationException;

class DeleteTenantUser
{
    public function __construct(private EnsureAgencyKeepsAdmin $guard) {}

    /** Removes the agency link, and the account when it was the last one. */
    public function handle(User $actor, User $user): void
    {
        if ($actor->is($user)) {
            throw ValidationException::withMessages([
                'user' => 'You cannot remove your own account.',
            ]);
        }

        $this->guard->handle($user, UserRole::Designer);

        $tenantId = app(TenantContext::class)->id();
        $remaining = Membership::query()
            ->where('user_id', $user->id)
            ->where('tenant_id', '!=', $tenantId)
            ->orderBy('id')
            ->get();

        if ($remaining->isEmpty()) {
            $user->tokens()->delete();
            $user->delete();

            return;
        }

        if ($user->homeTenantId !== null && (int) $user->homeTenantId === (int) $tenantId) {
            $next = $remaining->first();
            $user->tenant_id = $next->tenant_id;
            $user->role = $next->role;
            $user->workspace_id = $next->workspace_id;
            $user->save();
        }

        Membership::query()
            ->where('user_id', $user->id)
            ->where('tenant_id', $tenantId)
            ->delete();
    }
}
