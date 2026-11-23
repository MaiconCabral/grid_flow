<?php

namespace App\Http\Requests\Activities;

use App\Enums\ActivityStatus;
use App\Models\Activity;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateActivityRequest extends FormRequest
{
    /** Allows a move when the user may change this task. */
    public function authorize(): bool
    {
        $activity = $this->route('activity');

        return $activity instanceof Activity && ($this->user()?->can('update', $activity) ?? false);
    }

    /** Accepts a column the admin may set, never Approved. */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(ActivityStatus::movable())],
        ];
    }
}
