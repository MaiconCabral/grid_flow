<?php

namespace App\Models;

use App\Enums\ActivityChannel;
use App\Enums\ActivityFormat;
use App\Enums\ActivityStatus;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Activity extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'workspace_id',
        'created_by',
        'assignee_id',
        'title',
        'briefing',
        'channel',
        'format',
        'status',
        'due_on',
    ];

    protected function casts(): array
    {
        return [
            'channel' => ActivityChannel::class,
            'format' => ActivityFormat::class,
            'status' => ActivityStatus::class,
            'due_on' => 'date',
        ];
    }

    /** Links the task to its brand. */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /** Links the task to the person who created it. */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** Links the task to the staff member responsible for it. */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    /** Lists files and links attached to the task. */
    public function assets(): HasMany
    {
        return $this->hasMany(ActivityAsset::class);
    }

    /** Lists the history entries of the task. */
    public function events(): HasMany
    {
        return $this->hasMany(ActivityEvent::class);
    }
}
