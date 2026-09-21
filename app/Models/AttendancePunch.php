<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendancePunch extends Model
{
    protected $fillable = [
        'user_id',
        'date',
        'slot',
        'type',
        'punched_at',
        'latitude',
        'longitude',
        'accuracy',
        'distance_m',
        'ip',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'punched_at' => 'datetime',
            'latitude' => 'float',
            'longitude' => 'float',
            'accuracy' => 'float',
            'distance_m' => 'float',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
