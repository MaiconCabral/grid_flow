<?php

namespace App\Http\Controllers\Api;

use App\Actions\Users\CreateTenantUser;
use App\Http\Controllers\Controller;
use App\Http\Requests\Users\StoreUserRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        Gate::authorize('viewAny', User::class);

        $users = User::query()->orderBy('name')->get()->map(fn (User $user) => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role->value,
            'workspace_id' => $user->workspace_id,
        ]);

        return response()->json(['data' => $users]);
    }

    public function store(StoreUserRequest $request, CreateTenantUser $action): JsonResponse
    {
        $user = $action->handle($request->validated());

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role->value,
            'workspace_id' => $user->workspace_id,
        ], 201);
    }
}
