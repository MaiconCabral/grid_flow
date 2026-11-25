<?php

namespace App\Support;

use App\Models\Activity;
use Illuminate\Support\Str;

class ActivityFolder
{
    /** Builds a unique public-disk folder from the brand name and a short hash. */
    public static function key(string $brand): string
    {
        $slug = Str::slug($brand, '_') ?: 'brand';

        do {
            $key = $slug.'_'.Str::lower(Str::random(6));
        } while (Activity::query()->where('storage_key', $key)->exists());

        return $key;
    }
}
