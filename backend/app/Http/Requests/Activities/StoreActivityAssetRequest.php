<?php

namespace App\Http\Requests\Activities;

use App\Enums\ActivityFormat;
use App\Models\Activity;
use Illuminate\Foundation\Http\FormRequest;

class StoreActivityAssetRequest extends FormRequest
{
    /** Allows an upload when the user may attach a delivery. */
    public function authorize(): bool
    {
        $activity = $this->route('activity');

        return $activity instanceof Activity && ($this->user()?->can('upload', $activity) ?? false);
    }

    /** Requires the file shape and the published copy for the task format. */
    public function rules(): array
    {
        $activity = $this->route('activity');
        $format = $activity instanceof Activity ? $activity->format : ActivityFormat::Post;

        if ($format === ActivityFormat::Video) {
            return $this->copyRules($format) + [
                'url' => ['required', 'url', 'max:500'],
            ];
        }

        if ($format === ActivityFormat::Blog) {
            return $this->copyRules($format) + [
                'files' => ['required', 'array', 'size:1'],
                'files.*' => ['file', 'max:10240', 'extensions:pdf,doc,docx'],
                'cover' => ['required', 'file', 'max:10240', 'extensions:jpg,jpeg,png,webp,gif'],
            ];
        }

        $limit = $format === ActivityFormat::Carousel ? 10 : 1;

        return $this->copyRules($format) + [
            'files' => ['required', 'array', 'min:1', 'max:'.$limit],
            'files.*' => ['file', 'max:10240', 'extensions:jpg,jpeg,png,webp,gif'],
        ];
    }

    /** Requires the title, and the caption on every format except a blog. */
    private function copyRules(ActivityFormat $format): array
    {
        $rules = [
            'headline' => ['required', 'string', 'max:160'],
        ];

        if ($format !== ActivityFormat::Blog) {
            $rules['caption'] = ['required', 'string', 'max:5000'];
        }

        return $rules;
    }
}
