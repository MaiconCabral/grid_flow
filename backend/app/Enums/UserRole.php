<?php

namespace App\Enums;

enum UserRole: string
{
    case AgencyAdmin = 'agency_admin';
    case Copywriter = 'copywriter';
    case Designer = 'designer';
    case Client = 'client';
}
