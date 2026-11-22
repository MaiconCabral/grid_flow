<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\MorphTo;
use Laravel\Sanctum\PersonalAccessToken;

class AccessToken extends PersonalAccessToken
{
    protected $table = 'personal_access_tokens';

    public function tokenable(): MorphTo
    {
        return $this->morphTo('tokenable')->withoutGlobalScopes();
    }
}
