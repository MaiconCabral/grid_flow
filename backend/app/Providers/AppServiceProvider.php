<?php

namespace App\Providers;

use App\Auth\TenantUserProvider;
use App\Models\AccessToken;
use App\Support\TenantContext;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(TenantContext::class);

        Auth::provider('tenant-eloquent', function ($app, array $config) {
            return new TenantUserProvider($app['hash'], $config['model']);
        });
    }

    public function boot(): void
    {
        Sanctum::usePersonalAccessTokenModel(AccessToken::class);
    }
}
