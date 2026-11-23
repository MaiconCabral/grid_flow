<?php

namespace App\Models;

use App\Enums\AssetKind;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityAsset extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'activity_id',
        'uploaded_by',
        'kind',
        'name',
        'path',
        'url',
    ];

    protected function casts(): array
    {
        return [
            'kind' => AssetKind::class,
        ];
    }

    /** Links the file or link to its task. */
    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }

    /** Links the file or link to the person who added it. */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
