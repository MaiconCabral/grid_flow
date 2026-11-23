<?php

namespace App\Http\Controllers\Api;

use App\Actions\Users\CreateTenantUser;
use App\Actions\Users\DeleteTenantUser;
use App\Actions\Users\UpdateTenantUser;
use App\Http\Controllers\Controller;
use App\Http\Requests\Users\StoreUserRequest;
use App\Http\Requests\Users\UpdateUserRequest;
use App\Models\User;
use App\Support\UserPayload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class UserController extends Controller
{
    /** Lists the users of the signed-in agency. */
    public function index(): JsonResponse
    {
        Gate::authorize('viewAny', User::class);

        $users = User::query()->with('workspace')->orderBy('name')->get()->map(fn (User $user) => UserPayload::from($user));

        return response()->json(['data' => $users]);
    }

    /** Creates a user in the signed-in agency. */
    public function store(StoreUserRequest $request, CreateTenantUser $action): JsonResponse
    {
        $user = $action->handle($request->validated())->load('workspace');

        return response()->json(UserPayload::from($user), 201);
    }

    /** Updates a user in the signed-in agency. */
    public function update(UpdateUserRequest $request, User $user, UpdateTenantUser $action): JsonResponse
    {
        return response()->json(UserPayload::from($action->handle($user, $request->validated())));
    }

    /** Removes a user from the signed-in agency. */
    public function destroy(Request $request, User $user, DeleteTenantUser $action): Response
    {
        Gate::authorize('delete', $user);
        $action->handle($request->user(), $user);

        return response()->noContent();
    }
}
