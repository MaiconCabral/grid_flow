<?php

namespace App\Models;

use App\Enums\NotificationType;
use App\Enums\UserRole;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserNotification extends Model
{
    use BelongsToTenant;

    protected $table = 'notifications';

    protected $fillable = [
        'tenant_id',
        'user_id',
        'activity_id',
        'actor_id',
        'type',
        'title',
        'body',
        'read_at',
    ];

    /** Casts the notice type and the moment it was read. */
    protected function casts(): array
    {
        return [
            'type' => NotificationType::class,
            'read_at' => 'datetime',
        ];
    }

    /** Limits route binding to the signed-in recipient inside the active agency. */
    public function resolveRouteBinding($value, $field = null): ?self
    {
        return $this->where($field ?? $this->getRouteKeyName(), $value)
            ->where('user_id', auth()->id())
            ->first();
    }

    /** Links the notice to the person who should see it. */
    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** Links the notice to the task it is about. */
    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }

    /** Links the notice to the person who caused it. */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    /** Builds the API row, including the screen this person should open. */
    public function present(string $slug, UserRole $role): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'activity_id' => $this->activity_id,
            'title' => $this->title,
            'body' => $this->body,
            'href' => $this->href($slug, $role),
            'read_at' => $this->read_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }

    /** Picks the task screen for this recipient. */
    private function href(string $slug, UserRole $role): string
    {
        $approval = $role === UserRole::Client
            || in_array($this->type, [NotificationType::Approved, NotificationType::RevisionRequested], true);
        $section = $approval ? 'approval' : 'workspace';

        return "/{$slug}/{$section}/{$this->activity_id}";
    }
}
