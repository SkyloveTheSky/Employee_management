<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Charge extends Model
{
    public const CATEGORIES = [
        'loyer' => 'Loyer',
        'energie' => 'Électricité / Énergie',
        'eau' => 'Eau',
        'telecom' => 'Télécom',
        'fournitures' => 'Fournitures',
        'transport' => 'Transport',
        'entretien' => 'Entretien',
        'autre' => 'Autre',
    ];

    protected $fillable = [
        'admin_id',
        'title',
        'category',
        'amount',
        'incurred_on',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'incurred_on' => 'date',
        ];
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class);
    }

    public function categoryLabel(): string
    {
        return self::CATEGORIES[$this->category] ?? self::CATEGORIES['autre'];
    }
}
