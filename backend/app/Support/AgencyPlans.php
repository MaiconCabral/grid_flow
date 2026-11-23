<?php

namespace App\Support;

class AgencyPlans
{
    /** Returns the subscription plans shown in settings. */
    public static function all(): array
    {
        return [
            [
                'id' => 'starter',
                'name' => 'Starter',
                'price' => '$29/mo',
                'summary' => 'For an agency getting its first approvals into one place.',
                'points' => ['3 brands', '5 teammates', 'Email support'],
            ],
            [
                'id' => 'studio',
                'name' => 'Studio',
                'price' => '$79/mo',
                'summary' => 'For a studio running several brands with a shared team.',
                'points' => ['12 brands', '20 teammates', 'Approval history'],
            ],
            [
                'id' => 'agency',
                'name' => 'Agency',
                'price' => '$149/mo',
                'summary' => 'For a larger agency that needs room to grow.',
                'points' => ['Unlimited brands', 'Unlimited teammates', 'Priority support'],
            ],
        ];
    }
}
