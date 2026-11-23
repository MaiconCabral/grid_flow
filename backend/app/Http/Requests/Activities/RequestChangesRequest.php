<?php

namespace App\Http\Requests\Activities;

use App\Models\Activity;
use Illuminate\Foundation\Http\FormRequest;

class RequestChangesRequest extends FormRequest
{
    /** Allows a revision request from the brand client. */
    public function authorize(): bool
    {
        $activity = $this->route('activity');

        return $activity instanceof Activity && ($this->user()?->can('approve', $activity) ?? false);
    }

    /** Requires the note that explains the requested change. */
    public function rules(): array
    {
        return [
            'note' => ['required', 'string', 'max:2000'],
        ];
    }
}
