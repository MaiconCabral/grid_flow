<?php

namespace App\Http\Controllers\Api;

use App\Actions\Activities\ApproveActivity;
use App\Actions\Activities\CreateActivity;
use App\Actions\Activities\CreateActivityAnnotation;
use App\Actions\Activities\CreateActivityComment;
use App\Actions\Activities\MoveActivity;
use App\Actions\Activities\RequestActivityChanges;
use App\Actions\Activities\ResolveActivityComment;
use App\Actions\Activities\StoreActivityAsset;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Activities\RequestChangesRequest;
use App\Http\Requests\Activities\StoreActivityAnnotationRequest;
use App\Http\Requests\Activities\StoreActivityAssetRequest;
use App\Http\Requests\Activities\StoreActivityCommentRequest;
use App\Http\Requests\Activities\StoreActivityRequest;
use App\Http\Requests\Activities\UpdateActivityCommentRequest;
use App\Http\Requests\Activities\UpdateActivityRequest;
use App\Models\Activity;
use App\Models\ActivityComment;
use App\Models\ActivityVersion;
use App\Models\User;
use App\Models\Workspace;
use App\Support\ActivityPayload;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class ActivityController extends Controller
{
    public function __construct(private ActivityPayload $payload) {}

    /** Lists the tasks, brands, and counts the signed-in user may see. */
    public function index(): JsonResponse
    {
        Gate::authorize('viewAny', Activity::class);

        $user = request()->user();
        $activities = $this->visible($user)
            ->with(['workspace', 'assignee', 'versions'])
            ->withCount('events')
            ->orderBy('due_on')
            ->orderBy('id')
            ->get();

        $counts = $activities->countBy(fn (Activity $activity) => $activity->status->value);

        return response()->json([
            'data' => $activities->map(fn (Activity $activity) => $this->payload->summary($activity))->values(),
            'brands' => $this->brands($user),
            'metrics' => [
                'production' => $counts->get('production', 0),
                'pending' => $counts->get('pending', 0),
                'approved' => $counts->get('approved', 0),
                'scheduled' => $counts->get('scheduled', 0),
            ],
        ]);
    }

    /** Returns one task with its files and history. */
    public function show(Activity $activity): JsonResponse
    {
        Gate::authorize('view', $activity);

        return response()->json($this->payload->detail($activity, request()->user()));
    }

    /** Creates a task that starts in To Do. */
    public function store(StoreActivityRequest $request, CreateActivity $action): JsonResponse
    {
        $activity = $action->handle($request->user(), $request->validated());

        return response()->json($this->payload->detail($activity, $request->user()), 201);
    }

    /** Moves a task to another column, except Approved. */
    public function update(UpdateActivityRequest $request, Activity $activity, MoveActivity $action): JsonResponse
    {
        $activity = $action->handle($activity, $request->user(), $request->validated('status'));

        return response()->json($this->payload->detail($activity, $request->user()));
    }

    /** Stores the next version of a piece. */
    public function storeAsset(StoreActivityAssetRequest $request, Activity $activity, StoreActivityAsset $action): JsonResponse
    {
        $action->handle($activity, $request->user(), $request->validated(), $request->file('file'));

        return response()->json($this->payload->detail($activity->refresh(), $request->user()), 201);
    }

    /** Adds a comment that is not tied to a new pin. */
    public function storeComment(StoreActivityCommentRequest $request, Activity $activity, CreateActivityComment $action): JsonResponse
    {
        $action->handle($activity, $request->user(), $request->validated());

        return response()->json($this->payload->detail($activity->refresh(), $request->user()), 201);
    }

    /** Places a pin and its first comment on one image version. */
    public function storeAnnotation(StoreActivityAnnotationRequest $request, Activity $activity, ActivityVersion $version, CreateActivityAnnotation $action): JsonResponse
    {
        $action->handle($activity, $version, $request->user(), $request->validated());

        return response()->json($this->payload->detail($activity->refresh(), $request->user()), 201);
    }

    /** Resolves a comment or opens it again. */
    public function updateComment(UpdateActivityCommentRequest $request, Activity $activity, ActivityComment $comment, ResolveActivityComment $action): JsonResponse
    {
        $action->handle($activity, $comment, $request->boolean('resolved'));

        return response()->json($this->payload->detail($activity->refresh(), $request->user()));
    }

    /** Approves a task that is waiting on the brand client. */
    public function approve(Activity $activity, ApproveActivity $action): JsonResponse
    {
        Gate::authorize('approve', $activity);
        $activity = $action->handle($activity, request()->user());

        return response()->json($this->payload->detail($activity, request()->user()));
    }

    /** Returns a task to production with the client's note. */
    public function requestChanges(RequestChangesRequest $request, Activity $activity, RequestActivityChanges $action): JsonResponse
    {
        $activity = $action->handle($activity, $request->user(), $request->validated('note'));

        return response()->json($this->payload->detail($activity, $request->user()));
    }

    /** Limits the query to the tasks this person is allowed to see. */
    private function visible(User $user)
    {
        $query = Activity::query();

        if ($user->role === UserRole::Client) {
            $query->where('workspace_id', $user->workspace_id ?? 0);
        } elseif ($user->role !== UserRole::AgencyAdmin) {
            $query->where('assignee_id', $user->id);
        }

        return $query;
    }

    /** Lists the brands that may appear in the board filter. */
    private function brands(User $user): array
    {
        $query = Workspace::query()->orderBy('name');

        if ($user->role === UserRole::Client) {
            $query->whereKey($user->workspace_id ?? 0);
        } elseif ($user->role !== UserRole::AgencyAdmin) {
            $query->whereIn('id', $this->visible($user)->pluck('workspace_id'));
        }

        return $query->get(['id', 'name'])->map(fn (Workspace $workspace) => [
            'id' => $workspace->id,
            'name' => $workspace->name,
        ])->all();
    }
}
