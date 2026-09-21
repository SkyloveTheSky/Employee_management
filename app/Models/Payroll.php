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
        'unpaid_leave_days',
        'unpaid_leave_amount',
        'prime_amount',
        'overtime_hours',
        'overtime_divisor',
        'overtime_coefficient',
        'overtime_amount',
        'overtime_lines',
        'gross_salary',
        'cnaps_rate',
        'cnaps_employer_rate',
        'assurance_rate',
        'irsa_rate',
        'cnaps_amount',
        'cnaps_employer_amount',
        'assurance_amount',
        'irsa_amount',
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
            'unpaid_leave_days' => 'decimal:1',
            'unpaid_leave_amount' => 'decimal:2',
            'prime_amount' => 'decimal:2',
            'overtime_hours' => 'decimal:2',
            'overtime_divisor' => 'decimal:2',
            'overtime_coefficient' => 'decimal:3',
            'overtime_amount' => 'decimal:2',
            'overtime_lines' => 'array',
            'gross_salary' => 'decimal:2',
            'cnaps_rate' => 'decimal:2',
            'cnaps_employer_rate' => 'decimal:2',
            'assurance_rate' => 'decimal:2',
            'irsa_rate' => 'decimal:2',
            'cnaps_amount' => 'decimal:2',
            'cnaps_employer_amount' => 'decimal:2',
            'assurance_amount' => 'decimal:2',
            'irsa_amount' => 'decimal:2',
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

