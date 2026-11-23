<?php

namespace App\Http\Requests\Activities;

use App\Models\Activity;
use Illuminate\Foundation\Http\FormRequest;

class StoreActivityAnnotationRequest extends FormRequest
{
    /** Allows a pin when the user may see this task. */
    public function authorize(): bool
    {
        $activity = $this->route('activity');

        return $activity instanceof Activity && ($this->user()?->can('comment', $activity) ?? false);
    }

    /** Requires a point on the image and the comment for that pin. */
    public function rules(): array
    {
        return [
            'x' => ['required', 'numeric', 'min:0', 'max:100'],
            'y' => ['required', 'numeric', 'min:0', 'max:100'],
            'body' => ['required', 'string', 'max:2000'],
            'is_internal' => ['sometimes', 'boolean'],
        ];
    }
}
