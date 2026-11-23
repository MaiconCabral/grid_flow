<?php

namespace App\Actions\Workspaces;

use App\Models\User;
use App\Models\Workspace;
use Illuminate\Validation\ValidationException;

class DeleteWorkspace
{
    public function handle(Workspace $workspace): void
    {
        $hasClients = User::query()->where('workspace_id', $workspace->id)->exists();

        if ($hasClients) {
            throw ValidationException::withMessages([
                'workspace' => 'Remove the client users before deleting this brand.',
            ]);
        }

        $workspace->delete();
    }
}
