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

    /** Requires the file shape that matches the task format. */
    public function rules(): array
    {
        $activity = $this->route('activity');
        $format = $activity instanceof Activity ? $activity->format : ActivityFormat::Post;

        if ($format === ActivityFormat::Video) {
            return [
                'url' => ['required', 'url', 'max:500'],
            ];
        }

        $limit = $format === ActivityFormat::Carousel ? 10 : 1;
        $extensions = $format === ActivityFormat::Text ? 'doc,docx' : 'jpg,jpeg,png,webp,gif';

        return [
            'files' => ['required', 'array', 'min:1', 'max:'.$limit],
            'files.*' => ['file', 'max:10240', 'extensions:'.$extensions],
        ];
    }
}
