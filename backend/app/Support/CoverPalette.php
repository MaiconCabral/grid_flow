<?php

namespace App\Support;

class CoverPalette
{
    /** Pairs used when a task has no image yet. */
    private const TONES = [
        ['#1f4d3a', '#bbff52'],
        ['#243056', '#9ed9ef'],
        ['#4a2348', '#f5a8bf'],
        ['#3d2a12', '#f7d37c'],
        ['#1c3330', '#7ddec3'],
        ['#2a2140', '#d6c4ff'],
    ];

    /** Picks one gradient for a new task. */
    public static function pick(): array
    {
        $tone = self::TONES[random_int(0, count(self::TONES) - 1)];

        return ['from' => $tone[0], 'to' => $tone[1]];
    }
}
