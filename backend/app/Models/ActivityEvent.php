<?php

namespace App\Models;

use App\Enums\ActivityEventType;
use App\Enums\ActivityStatus;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityEvent extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'activity_id',
        'actor_id',
        'type',
        'from_status',
        'to_status',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'type' => ActivityEventType::class,
            'from_status' => ActivityStatus::class,
            'to_status' => ActivityStatus::class,
        ];
    }

    /** Links the history entry to its task. */
    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }

    /** Links the history entry to the person who caused it. */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
