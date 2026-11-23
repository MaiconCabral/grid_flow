<?php

namespace App\Http\Requests\Activities;

use App\Enums\AssetKind;
use App\Models\Activity;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreActivityAssetRequest extends FormRequest
{
    /** Allows an upload when the user may attach a delivery. */
    public function authorize(): bool
    {
        $activity = $this->route('activity');

        return $activity instanceof Activity && ($this->user()?->can('upload', $activity) ?? false);
    }

    /** Requires either a file of the chosen kind or a link. */
    public function rules(): array
    {
        return [
            'kind' => ['required', Rule::enum(AssetKind::class)],
            'url' => ['exclude_unless:kind,link', 'required', 'url', 'max:500'],
            'file' => $this->fileRules(),
        ];
    }

    /** Matches the uploaded file to the declared kind. */
    private function fileRules(): array
    {
        return match ($this->input('kind')) {
            AssetKind::Image->value => ['required', 'file', 'max:10240', 'mimes:jpg,jpeg,png,webp,gif'],
            AssetKind::Pdf->value => ['required', 'file', 'max:10240', 'mimes:pdf'],
            AssetKind::Document->value => ['required', 'file', 'max:10240', 'mimes:doc,docx'],
            default => ['nullable'],
        };
    }
}
