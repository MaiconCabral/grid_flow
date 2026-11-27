<?php

namespace App\Http\Requests\Activities;

use App\Enums\ActivityFormat;
use App\Models\Activity;
use Illuminate\Foundation\Http\FormRequest;

class UpdateActivityCopyRequest extends FormRequest
{
    /** Allows a copy edit when the user may attach a delivery. */
    public function authorize(): bool
    {
        $activity = $this->route('activity');

        return $activity instanceof Activity && ($this->user()?->can('upload', $activity) ?? false);
    }

    /** Requires the published title, and the caption on every format except a blog. */
    public function rules(): array
    {
        $activity = $this->route('activity');
        $format = $activity instanceof Activity ? $activity->format : ActivityFormat::Post;

        if ($format === ActivityFormat::Blog) {
            return [
                'headline' => ['required', 'string', 'max:160'],
            ];
        }

        return [
            'headline' => ['required', 'string', 'max:160'],
            'caption' => ['required', 'string', 'max:5000'],
        ];
    }
}
