<?php

namespace App\Http\Controllers\Api;

use App\Actions\Dashboard\BuildDashboard;
use App\Http\Controllers\Controller;
use App\Models\Activity;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class DashboardController extends Controller
{
    public function __construct(private BuildDashboard $dashboard) {}

    /** Returns the dashboard for the signed-in person. */
    public function show(): JsonResponse
    {
        Gate::authorize('viewAny', Activity::class);

        return response()->json($this->dashboard->handle(request()->user()));
    }
}
