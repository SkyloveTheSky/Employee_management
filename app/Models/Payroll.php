<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payroll extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'generated_by_admin_id',
        'period_month',
        'period_year',
        'base_salary',
        'prime_amount',
        'overtime_amount',
        'gross_salary',
        'cnaps_rate',
        'assurance_rate',
        'cnaps_amount',
        'assurance_amount',
        'total_retenu',
        'net_salary',
        'net_to_pay',
        'payment_method',
        'payment_status',
        'paid_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'base_salary' => 'decimal:2',
            'prime_amount' => 'decimal:2',
            'overtime_amount' => 'decimal:2',
            'gross_salary' => 'decimal:2',
            'cnaps_rate' => 'decimal:2',
            'assurance_rate' => 'decimal:2',
            'cnaps_amount' => 'decimal:2',
            'assurance_amount' => 'decimal:2',
            'total_retenu' => 'decimal:2',
            'net_salary' => 'decimal:2',
            'net_to_pay' => 'decimal:2',
            'paid_at' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function generatedByAdmin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'generated_by_admin_id');
    }
}

