<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ActivityComment extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'activity_id',
        'activity_version_id',
        'annotation_id',
        'parent_id',
        'user_id',
        'body',
        'is_internal',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'is_internal' => 'boolean',
            'resolved_at' => 'datetime',
        ];
    }

    /** Links the comment to its task. */
    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }

    /** Links the comment to the version it refers to. */
    public function version(): BelongsTo
    {
        return $this->belongsTo(ActivityVersion::class, 'activity_version_id');
    }

    /** Links the comment to a pin. */
    public function annotation(): BelongsTo
    {
        return $this->belongsTo(ActivityAnnotation::class, 'annotation_id');
    }

    /** Links a reply to the comment it answers. */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /** Lists replies to this comment. */
    public function replies(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    /** Links the comment to the person who wrote it. */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
