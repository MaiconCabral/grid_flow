<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityVersionFile extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'activity_version_id',
        'position',
        'role',
        'name',
        'path',
        'url',
    ];

    /** Links the slide to its version. */
    public function version(): BelongsTo
    {
        return $this->belongsTo(ActivityVersion::class, 'activity_version_id');
    }
}
