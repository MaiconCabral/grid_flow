<?php

namespace App\Actions\Workspaces;

use App\Enums\UserRole;
use App\Models\Membership;
use App\Models\Workspace;
use Illuminate\Validation\ValidationException;

class DeleteWorkspace
{
    /** Deletes a brand that has no client users. */
    public function handle(Workspace $workspace): void
    {
        $hasClients = Membership::query()
            ->where('workspace_id', $workspace->id)
            ->where('role', UserRole::Client)
            ->exists();

        if ($hasClients) {
            throw ValidationException::withMessages([
                'workspace' => 'Remove the client users before deleting this brand.',
            ]);
        }

        $workspace->delete();
    }
}
