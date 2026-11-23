<?php

namespace App\Actions\Workspaces;

use App\Models\Workspace;

class UpdateWorkspace
{
    public function handle(Workspace $workspace, array $data): Workspace
    {
        $workspace->update(['name' => $data['name']]);

        return $workspace->load('clients');
    }
}
