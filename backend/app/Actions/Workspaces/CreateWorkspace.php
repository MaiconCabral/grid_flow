<?php

namespace App\Actions\Workspaces;

use App\Models\Workspace;
use App\Support\TenantContext;

class CreateWorkspace
{
    /** Creates a brand in the current agency. */
    public function handle(array $data): Workspace
    {
        return Workspace::query()->create([
            'tenant_id' => app(TenantContext::class)->id(),
            'name' => $data['name'],
        ]);
    }
}
