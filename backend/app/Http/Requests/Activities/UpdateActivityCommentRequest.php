<?php

namespace App\Http\Requests\Activities;

use App\Models\Activity;
use Illuminate\Foundation\Http\FormRequest;

class UpdateActivityCommentRequest extends FormRequest
{
    /** Allows resolving a comment when the user may see this task. */
    public function authorize(): bool
    {
        $activity = $this->route('activity');

        return $activity instanceof Activity && ($this->user()?->can('comment', $activity) ?? false);
    }

    /** Requires whether the comment is resolved. */
    public function rules(): array
    {
        return [
            'resolved' => ['required', 'boolean'],
        ];
    }
}
