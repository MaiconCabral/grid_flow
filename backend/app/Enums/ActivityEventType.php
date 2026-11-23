<?php

namespace App\Enums;

enum ActivityEventType: string
{
    case Created = 'created';
    case StatusChanged = 'status_changed';
    case AssetAdded = 'asset_added';
    case Approved = 'approved';
    case RevisionRequested = 'revision_requested';
}
