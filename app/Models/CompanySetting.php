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
        'payroll_styles',
        'payroll_margins',
    ];

    protected $casts = [
        'payroll_styles' => 'array',
        'payroll_margins' => 'array',
    ];
}

