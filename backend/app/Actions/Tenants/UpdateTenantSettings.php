<?php

namespace App\Actions\Tenants;

use App\Models\Tenant;

class UpdateTenantSettings
{
    /** Saves the agency name, theme, and colors on the tenant row. */
    public function handle(Tenant $tenant, array $data): Tenant
    {
        $tenant->fill($data);
        $tenant->save();

        return $tenant;
    }
}
