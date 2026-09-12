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
    ];

    protected function casts(): array
    {
        return [
            'display_theme' => 'array',
        ];
    }
}

