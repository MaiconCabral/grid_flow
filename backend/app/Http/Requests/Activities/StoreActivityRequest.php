<?php

namespace App\Http\Requests\Activities;

use App\Enums\ActivityChannel;
use App\Enums\ActivityFormat;
use App\Models\Activity;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreActivityRequest extends FormRequest
{
    /** Allows creation when the user may add tasks. */
    public function authorize(): bool
    {
        return $this->user()?->can('create', Activity::class) ?? false;
    }

    /** Requires the briefing fields for a new task. */
    public function rules(): array
    {
        return [
            'workspace_id' => ['required', 'integer'],
            'assignee_id' => ['nullable', 'integer'],
            'title' => ['required', 'string', 'max:160'],
            'briefing' => ['required', 'string', 'max:5000'],
            'channel' => ['required', Rule::enum(ActivityChannel::class)],
            'format' => ['required', Rule::enum(ActivityFormat::class)],
            'due_on' => ['nullable', 'date'],
        ];
    }
}
