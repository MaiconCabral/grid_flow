<?php

namespace App\Actions\Dashboard;

use App\Enums\ActivityStatus;
use App\Enums\UserRole;
use App\Models\Activity;
use App\Models\ActivityEvent;
use App\Models\User;
use App\Support\VisibleActivities;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class BuildDashboard
{
    public function __construct(private VisibleActivities $visible) {}

    /** Assembles the counts and lists for the tasks this person can see. */
    public function handle(User $user): array
    {
        $activities = $this->visible->for($user)
            ->with('workspace')
            ->orderBy('due_on')
            ->orderBy('id')
            ->get();

        $start = Carbon::today()->startOfWeek(CarbonInterface::MONDAY);
        $end = $start->copy()->addDays(6);

        return [
            'role' => $user->role->value,
            'counts' => $this->counts($activities, $start, $end),
            'pipeline' => $this->pipeline($activities),
            'actions' => $this->actions($activities, $user),
            'events' => $this->events($activities),
            'week' => [
                'start' => $start->toDateString(),
                'end' => $end->toDateString(),
                'days' => $this->days($activities, $start),
            ],
            'brands' => $this->brands($activities, $user),
        ];
    }

    /** Counts each column, plus tasks due this week and tasks past their date. */
    private function counts(Collection $activities, Carbon $start, Carbon $end): array
    {
        $byStatus = $activities->countBy(fn (Activity $activity) => $activity->status->value);

        return [
            'total' => $activities->count(),
            'todo' => $byStatus->get(ActivityStatus::Todo->value, 0),
            'production' => $byStatus->get(ActivityStatus::Production->value, 0),
            'pending' => $byStatus->get(ActivityStatus::Pending->value, 0),
            'approved' => $byStatus->get(ActivityStatus::Approved->value, 0),
            'scheduled' => $byStatus->get(ActivityStatus::Scheduled->value, 0),
            'due_this_week' => $activities->filter(fn (Activity $activity) => $this->dueBetween($activity, $start, $end))->count(),
            'overdue' => $activities->filter(fn (Activity $activity) => $this->overdue($activity))->count(),
        ];
    }

    /** Counts the five board columns in column order. */
    private function pipeline(Collection $activities): array
    {
        $byStatus = $activities->countBy(fn (Activity $activity) => $activity->status->value);

        return collect(ActivityStatus::cases())->map(fn (ActivityStatus $status) => [
            'status' => $status->value,
            'count' => $byStatus->get($status->value, 0),
        ])->all();
    }

    /** Picks the tasks that need a decision, a delivery, or a new date. */
    private function actions(Collection $activities, User $user): array
    {
        $picked = $activities->filter(function (Activity $activity) use ($user) {
            if ($user->role === UserRole::Client) {
                return $activity->status === ActivityStatus::Pending;
            }

            if ($user->role === UserRole::AgencyAdmin) {
                return $activity->status === ActivityStatus::Pending || $this->overdue($activity);
            }

            return $this->overdue($activity) || $activity->status === ActivityStatus::Production;
        })->sort(function (Activity $left, Activity $right) {
            $rank = $this->reasonRank($left) <=> $this->reasonRank($right);

            if ($rank !== 0) {
                return $rank;
            }

            $due = ($left->due_on?->timestamp ?? PHP_INT_MAX) <=> ($right->due_on?->timestamp ?? PHP_INT_MAX);

            return $due !== 0 ? $due : $left->id <=> $right->id;
        })->take(5);

        return $picked->map(fn (Activity $activity) => [
            'id' => $activity->id,
            'title' => $activity->title,
            'status' => $activity->status->value,
            'due_on' => $activity->due_on?->toDateString(),
            'workspace' => $activity->workspace?->name,
            'reason' => $this->reason($activity),
        ])->values()->all();
    }

    /** Returns the latest history entries for the visible tasks. */
    private function events(Collection $activities): array
    {
        if ($activities->isEmpty()) {
            return [];
        }

        return ActivityEvent::query()
            ->whereIn('activity_id', $activities->pluck('id'))
            ->with(['actor', 'activity'])
            ->orderByDesc('id')
            ->limit(8)
            ->get()
            ->map(fn (ActivityEvent $event) => [
                'id' => $event->id,
                'type' => $event->type->value,
                'activity_id' => $event->activity_id,
                'activity_title' => $event->activity?->title,
                'actor' => $event->actor?->name,
                'actor_role' => $event->actor?->role?->value,
                'from_status' => $event->from_status?->value,
                'to_status' => $event->to_status?->value,
                'note' => $event->note,
                'created_at' => $event->created_at?->toIso8601String(),
            ])
            ->all();
    }

    /** Groups due dates onto the seven days of the current week. */
    private function days(Collection $activities, Carbon $start): array
    {
        return collect(range(0, 6))->map(function (int $offset) use ($activities, $start) {
            $date = $start->copy()->addDays($offset)->toDateString();

            return [
                'date' => $date,
                'tasks' => $activities
                    ->filter(fn (Activity $activity) => $activity->due_on?->toDateString() === $date)
                    ->map(fn (Activity $activity) => [
                        'id' => $activity->id,
                        'title' => $activity->title,
                    ])
                    ->values()
                    ->all(),
            ];
        })->all();
    }

    /** Lists brands that still have open work, or the brands of a professional's tasks. */
    private function brands(Collection $activities, User $user): array
    {
        if ($user->role === UserRole::Client) {
            return [];
        }

        $rows = $activities
            ->groupBy('workspace_id')
            ->map(function (Collection $tasks) {
                $workspace = $tasks->first()?->workspace;

                return [
                    'id' => $workspace?->id,
                    'name' => $workspace?->name,
                    'open' => $tasks->filter(fn (Activity $activity) => $activity->status !== ActivityStatus::Approved)->count(),
                    'pending' => $tasks->where('status', ActivityStatus::Pending)->count(),
                ];
            })
            ->filter(fn (array $brand) => $user->role === UserRole::AgencyAdmin ? $brand['open'] > 0 : $brand['name'] !== null)
            ->sort(function (array $left, array $right) {
                $open = $right['open'] <=> $left['open'];

                return $open !== 0 ? $open : strcmp((string) $left['name'], (string) $right['name']);
            })
            ->values()
            ->all();

        return $rows;
    }

    /** Reports whether the due date falls inside the week. */
    private function dueBetween(Activity $activity, Carbon $start, Carbon $end): bool
    {
        return $activity->due_on !== null && $activity->due_on->between($start, $end);
    }

    /** Reports whether the due date passed and the task is still in progress. */
    private function overdue(Activity $activity): bool
    {
        if ($activity->due_on === null || ! $activity->due_on->lt(Carbon::today())) {
            return false;
        }

        return ! in_array($activity->status, [ActivityStatus::Approved, ActivityStatus::Scheduled], true);
    }

    /** Names why a task is on the action list. */
    private function reason(Activity $activity): string
    {
        if ($this->overdue($activity)) {
            return 'overdue';
        }

        if ($activity->status === ActivityStatus::Pending) {
            return 'pending';
        }

        return 'production';
    }

    /** Orders overdue work ahead of reviews and deliveries. */
    private function reasonRank(Activity $activity): int
    {
        return match ($this->reason($activity)) {
            'overdue' => 0,
            'pending' => 1,
            default => 2,
        };
    }
}
