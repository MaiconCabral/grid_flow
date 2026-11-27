<?php

namespace App\Enums;

enum ActivityStatus: string
{
    case Todo = 'todo';
    case Production = 'production';
    case Pending = 'pending';
    case Approved = 'approved';
    case Scheduled = 'scheduled';

    /** Statuses a client may see. Earlier columns stay with the agency. */
    public static function visibleToClient(): array
    {
        return [self::Pending, self::Approved, self::Scheduled];
    }

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
