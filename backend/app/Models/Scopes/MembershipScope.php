<?php

namespace App\Models\Scopes;

use App\Support\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class MembershipScope implements Scope
{
    /** Limits users to people linked to the active agency. */
    public function apply(Builder $builder, Model $model): void
    {
        $tenantId = app(TenantContext::class)->id();

        if ($tenantId === null) {
            $builder->whereRaw('1 = 0');

            return;
        }

        $builder->whereExists(function ($query) use ($model, $tenantId): void {
            $query->selectRaw('1')
                ->from('memberships')
                ->whereColumn('memberships.user_id', $model->getTable().'.id')
                ->where('memberships.tenant_id', $tenantId);
        });
    }
}
