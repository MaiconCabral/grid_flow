<?php

namespace App\Http\Requests\Workspaces;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWorkspaceRequest extends FormRequest
{
    /** Allows the update when the user may edit that brand. */
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('workspace')) ?? false;
    }

    /** Requires the brand name. */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
        ];
    }
}
