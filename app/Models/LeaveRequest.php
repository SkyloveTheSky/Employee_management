<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveRequest extends Model
{
    public const TYPE_PAID = 'paid';

    public const TYPE_UNPAID = 'unpaid';

    public const TYPE_SICK = 'sick';

    public const SLOT_MORNING = 'morning';

    public const SLOT_AFTERNOON = 'afternoon';

    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'user_id',
        'type',
        'start_date',
        'end_date',
        'start_slot',
        'end_slot',
        'days',
        'reason',
        'status',
        'reviewed_by_admin_id',
        'reviewed_at',
        'review_note',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'days' => 'decimal:1',
            'reviewed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewedByAdmin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'reviewed_by_admin_id');
    }

    public function typeLabel(): string
    {
        return match ($this->type) {
            self::TYPE_UNPAID => __('leave.unpaid'),
            self::TYPE_SICK => __('leave.sick'),
            default => __('leave.paid'),
        };
    }

    public function statusLabel(): string
    {
        return match ($this->status) {
            self::STATUS_APPROVED => __('leave.approved'),
            self::STATUS_REJECTED => __('leave.rejected'),
            default => __('leave.pending'),
        };
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * @return array<string, mixed>
     */
    public function toListArray(): array
    {
        $timezone = (string) config('app.timezone');

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'employee_name' => trim(($this->user?->first_name ?? '').' '.($this->user?->last_name ?? '')),
            'position' => $this->user?->position,
            'type' => $this->type,
            'type_label' => $this->typeLabel(),
            'start_date' => $this->start_date->toDateString(),
            'end_date' => $this->end_date->toDateString(),
            'start_slot' => $this->start_slot,
            'end_slot' => $this->end_slot,
            'days' => (float) $this->days,
            'reason' => $this->reason,
            'status' => $this->status,
            'status_label' => $this->statusLabel(),
            'review_note' => $this->review_note,
            'reviewed_at' => $this->reviewed_at?->timezone($timezone)->format('d/m/Y H:i'),
            'created_at' => $this->created_at?->timezone($timezone)->format('d/m/Y H:i'),
            'can_cancel' => $this->isPending(),
        ];
    }
}
