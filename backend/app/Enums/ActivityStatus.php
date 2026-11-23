<?php

namespace App\Enums;

enum ActivityStatus: string
{
    case Todo = 'todo';
    case Production = 'production';
    case Pending = 'pending';
    case Approved = 'approved';
    case Scheduled = 'scheduled';

    /** Statuses an admin may set by moving a card. */
    public static function movable(): array
    {
        return [
            self::Todo->value,
            self::Production->value,
            self::Pending->value,
            self::Scheduled->value,
        ];
    }
}
