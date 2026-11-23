<?php

namespace App\Models;

use App\Enums\AssetKind;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ActivityVersion extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'activity_id',
        'uploaded_by',
        'number',
        'kind',
        'name',
        'path',
        'url',
        'is_current',
    ];

    protected function casts(): array
    {
        return [
            'kind' => AssetKind::class,
            'is_current' => 'boolean',
        ];
    }

    /** Links the version to its task. */
    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }

    /** Links the version to the person who uploaded it. */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /** Lists the pins placed on this version. */
    public function annotations(): HasMany
    {
        return $this->hasMany(ActivityAnnotation::class);
    }
}
