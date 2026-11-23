<?php

namespace App\Http\Middleware;

use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ResetAuthState
{
    /**
     * Drop cached guards and the tenant so a replaced request starts clean.
     */
    public function handle(Request $request, Closure $next): Response
    {
        Auth::forgetGuards();
        app(TenantContext::class)->forget();

        return $next($request);
    }
}
