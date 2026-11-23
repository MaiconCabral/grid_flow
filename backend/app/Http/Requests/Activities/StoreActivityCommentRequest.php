<?php

namespace App\Http\Requests\Activities;

use App\Models\Activity;
use Illuminate\Foundation\Http\FormRequest;

class StoreActivityCommentRequest extends FormRequest
{
    /** Allows a comment when the user may see this task. */
    public function authorize(): bool
    {
        $activity = $this->route('activity');

        return $activity instanceof Activity && ($this->user()?->can('comment', $activity) ?? false);
    }

    /** Requires the comment text and accepts a reply or a version. */
    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'max:2000'],
            'parent_id' => ['nullable', 'integer'],
            'version_id' => ['nullable', 'integer'],
            'is_internal' => ['sometimes', 'boolean'],
        ];
    }
}
