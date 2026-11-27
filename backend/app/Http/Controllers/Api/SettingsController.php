<?php

namespace App\Http\Controllers\Api;

use App\Actions\Tenants\UpdateTenantSettings;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenants\UpdateSettingsRequest;
use App\Models\Tenant;
use App\Support\AgencyPlans;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class SettingsController extends Controller
{
    /** Returns the signed-in agency settings. */
    public function show(): JsonResponse
    {
        $tenant = $this->tenant();
        Gate::authorize('view', $tenant);

        return response()->json($this->payload($tenant));
    }

    /** Updates the signed-in agency settings. */
    public function update(UpdateSettingsRequest $request, UpdateTenantSettings $action): JsonResponse
    {
        $tenant = $action->handle($this->tenant(), $request->validated());

        return response()->json($this->payload($tenant));
    }

    /** Loads the agency resolved for this request. */
    private function tenant(): Tenant
    {
        return Tenant::query()->findOrFail(app(TenantContext::class)->id());
    }

    /** Shapes the agency settings for the API response. */
    private function payload(Tenant $tenant): array
    {
        return [
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'theme' => $tenant->theme,
            'light_background' => $tenant->light_background,
            'dark_background' => $tenant->dark_background,
            'accent' => $tenant->accent,
            'plan' => $tenant->plan,
            'locale' => $tenant->locale ?? 'en',
            'plans' => AgencyPlans::all(),
        ];
    }
}
