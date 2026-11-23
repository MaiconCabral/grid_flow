<?php

namespace App\Http\Requests\Users;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    /** Allows creation when the user may add people to the agency. */
    public function authorize(): bool
    {
        return $this->user()?->can('create', User::class) ?? false;
    }

    /** Requires name, email, password, role, and a brand for clients. */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::enum(UserRole::class)],
            'workspace_id' => ['nullable', 'integer', 'required_if:role,client'],
        ];
    }
}
