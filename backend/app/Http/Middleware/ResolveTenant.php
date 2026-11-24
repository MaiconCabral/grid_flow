<?php

namespace App\Http\Middleware;

use App\Models\Membership;
use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->header('X-Tenant-ID');
        $user = $request->user();

        if ($header === null || $user === null) {
            abort(403, 'Tenant mismatch.');
        }

        $membership = Membership::query()
            ->where('user_id', $user->id)
            ->where('tenant_id', (int) $header)
            ->first();

        if ($membership === null) {
            abort(403, 'Tenant mismatch.');
        }

        app(TenantContext::class)->set((int) $membership->tenant_id);
        $user->adopt($membership);

        return $next($request);
    }
}
