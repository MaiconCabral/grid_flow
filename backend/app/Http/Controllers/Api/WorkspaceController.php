<?php

namespace App\Http\Controllers\Api;

use App\Actions\Workspaces\CreateWorkspace;
use App\Actions\Workspaces\DeleteWorkspace;
use App\Actions\Workspaces\UpdateWorkspace;
use App\Http\Controllers\Controller;
use App\Http\Requests\Workspaces\StoreWorkspaceRequest;
use App\Http\Requests\Workspaces\UpdateWorkspaceRequest;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class WorkspaceController extends Controller
{
    public function index(): JsonResponse
    {
        Gate::authorize('viewAny', Workspace::class);

        $workspaces = Workspace::query()
            ->with(['clients' => fn ($query) => $query->orderBy('name')])
            ->orderBy('name')
            ->get()
            ->map(fn (Workspace $workspace) => $this->payload($workspace));

        return response()->json(['data' => $workspaces]);
    }

    public function store(StoreWorkspaceRequest $request, CreateWorkspace $action): JsonResponse
    {
        $workspace = $action->handle($request->validated());
        $workspace->setRelation('clients', collect());

        return response()->json($this->payload($workspace), 201);
    }

    public function update(UpdateWorkspaceRequest $request, Workspace $workspace, UpdateWorkspace $action): JsonResponse
    {
        return response()->json($this->payload($action->handle($workspace, $request->validated())));
    }

    public function destroy(Workspace $workspace, DeleteWorkspace $action): Response
    {
        Gate::authorize('delete', $workspace);
        $action->handle($workspace);

        return response()->noContent();
    }

    private function payload(Workspace $workspace): array
    {
        return [
            'id' => $workspace->id,
            'name' => $workspace->name,
            'clients' => $workspace->clients->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ])->values(),
        ];
    }
}
