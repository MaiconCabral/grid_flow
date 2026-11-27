<?php

namespace App\Enums;

enum ActivityFormat: string
{
    case Post = 'post';
    case Carousel = 'carousel';
    case Story = 'story';
    case Video = 'video';
    case Blog = 'blog';
}
