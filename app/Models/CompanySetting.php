<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanySetting extends Model
{
    protected $fillable = [
        'company_name',
        'owner_name',
        'nif',
        'stat',
        'rcs',
        'logo_path',
        'display_theme',
        'overtime_hours_per_day',
        'overtime_weekly_goal',
        'overtime_divisor',
        'overtime_coefficient',
        'cnaps_percent',
        'cnaps_employer_percent',
        'cnaps_employee_percent',
        'irsa_percent',
        'irsa_brackets',
    ];

    protected function casts(): array
    {
        return [
            'display_theme' => 'array',
            'overtime_hours_per_day' => 'decimal:2',
            'overtime_weekly_goal' => 'decimal:2',
            'overtime_divisor' => 'decimal:2',
            'overtime_coefficient' => 'decimal:3',
            'cnaps_percent' => 'decimal:2',
            'cnaps_employer_percent' => 'decimal:2',
            'cnaps_employee_percent' => 'decimal:2',
            'irsa_percent' => 'decimal:2',
            'irsa_brackets' => 'array',
        ];
    }
}

