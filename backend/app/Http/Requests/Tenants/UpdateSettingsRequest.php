<?php

namespace App\Http\Requests\Tenants;

use App\Models\Tenant;
use App\Support\AgencyPalette;
use App\Support\TenantContext;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSettingsRequest extends FormRequest
{
    /** Allows the update when the user may edit this agency. */
    public function authorize(): bool
    {
        $tenant = Tenant::query()->find(app(TenantContext::class)->id());

        return $tenant !== null && ($this->user()?->can('update', $tenant) ?? false);
    }

    /** Validates the agency name, theme, and allowed colors. */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'theme' => ['sometimes', 'required', Rule::in(['dark', 'light'])],
            'light_background' => ['sometimes', 'required', Rule::in(AgencyPalette::LIGHT)],
            'dark_background' => ['sometimes', 'required', Rule::in(AgencyPalette::DARK)],
            'accent' => ['sometimes', 'required', Rule::in(AgencyPalette::ACCENT)],
        ];
    }
}
