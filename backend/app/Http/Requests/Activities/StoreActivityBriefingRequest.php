<?php

namespace App\Http\Requests\Activities;

use App\Models\Activity;
use Illuminate\Foundation\Http\FormRequest;

class StoreActivityBriefingRequest extends FormRequest
{
    /** Allows a briefing file when the user may attach files to the task. */
    public function authorize(): bool
    {
        $activity = $this->route('activity');

        return $activity instanceof Activity && ($this->user()?->can('upload', $activity) ?? false);
    }

    /** Requires a PDF or Word briefing. */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:10240', 'extensions:pdf,doc,docx'],
        ];
    }
}
