<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ActivityAnnotation extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'activity_version_id',
        'activity_version_file_id',
        'user_id',
        'number',
        'x',
        'y',
    ];

    protected function casts(): array
    {
        return [
            'x' => 'float',
            'y' => 'float',
        ];
    }

    /** Links the pin to the version it was placed on. */
    public function version(): BelongsTo
    {
        return $this->belongsTo(ActivityVersion::class, 'activity_version_id');
    }

    /** Links the pin to the person who placed it. */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** Lists comments attached to this pin. */
    public function comments(): HasMany
    {
        return $this->hasMany(ActivityComment::class, 'annotation_id');
    }
}
