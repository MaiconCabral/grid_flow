<?php

namespace App\Enums;

enum NotificationType: string
{
    case AssetAdded = 'asset_added';
    case Queued = 'queued';
    case PendingReview = 'pending_review';
    case Approved = 'approved';
    case RevisionRequested = 'revision_requested';
}
