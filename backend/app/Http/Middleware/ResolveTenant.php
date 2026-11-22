<?php

namespace App\Http\Middleware;

use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->header('X-Tenant-ID');
        $tenantId = $request->user()?->tenant_id;

        if ($header === null || $tenantId === null || (int) $header !== (int) $tenantId) {
            abort(403, 'Tenant mismatch.');
        }

        app(TenantContext::class)->set((int) $tenantId);

        return $next($request);
    }
}
