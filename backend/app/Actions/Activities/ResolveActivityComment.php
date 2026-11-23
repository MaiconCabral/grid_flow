<?php

namespace App\Actions\Activities;

use App\Models\Activity;
use App\Models\ActivityComment;

class ResolveActivityComment
{
    /** Marks a comment resolved or opens it again. */
    public function handle(Activity $activity, ActivityComment $comment, bool $resolved): ActivityComment
    {
        if ((int) $comment->activity_id !== (int) $activity->id) {
            abort(404);
        }

        $comment->resolved_at = $resolved ? now() : null;
        $comment->save();

        return $comment;
    }
}
