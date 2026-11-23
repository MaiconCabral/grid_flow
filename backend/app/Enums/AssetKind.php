<?php

namespace App\Enums;

enum AssetKind: string
{
    case Image = 'image';
    case Pdf = 'pdf';
    case Document = 'document';
    case Link = 'link';
}
