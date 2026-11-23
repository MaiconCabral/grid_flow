<?php

namespace App\Http\Requests\Workspaces;

use App\Models\Workspace;
use Illuminate\Foundation\Http\FormRequest;

class StoreWorkspaceRequest extends FormRequest
{
    /** Allows creation when the user may add brands. */
    public function authorize(): bool
    {
        return $this->user()?->can('create', Workspace::class) ?? false;
    }

    /** Requires the brand name. */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
        ];
    }
}
