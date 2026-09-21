<?php

namespace App\Services\Leave;

use App\Models\Admin;
use App\Models\LeaveRequest;
use App\Models\User;
use App\Services\Inbox\Inbox;
use Illuminate\Validation\ValidationException;

class LeaveService
{
    public function __construct(private LeaveCalendar $calendar) {}

    /**
     * @param  array{type: string, start_date: string, end_date: string, start_slot: string, end_slot: string, reason?: string|null}  $payload
     */
    public function request(User $user, array $payload): LeaveRequest
    {
        $type = $payload['type'];
        $startDate = $payload['start_date'];
        $endDate = $payload['end_date'];
        $startSlot = $payload['start_slot'];
        $endSlot = $payload['end_slot'];

        $days = $this->calendar->days($startDate, $endDate, $startSlot, $endSlot);
        if ($this->calendar->overlaps($user->id, $startDate, $endDate, $startSlot, $endSlot)) {
            throw ValidationException::withMessages([
                'start_date' => __('leave.overlap'),
            ]);
        }

        $leave = LeaveRequest::query()->create([
            'user_id' => $user->id,
            'type' => $type,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'start_slot' => $startSlot,
            'end_slot' => $endSlot,
            'days' => $days,
            'reason' => $this->cleanText($payload['reason'] ?? null),
            'status' => LeaveRequest::STATUS_PENDING,
        ]);

        $name = trim($user->first_name.' '.$user->last_name) ?: 'Un employé';
        app(Inbox::class)->notifyAdmins(
            'leave',
            'Congé · Demande',
            $name.' demande un '.$this->calendar->typeLabel($leave->type).' : '.$this->calendar->periodLabel($leave).'.',
            route('admin.leaves.index', absolute: false),
        );

        return $leave;
    }

    public function cancel(LeaveRequest $leave, User $user): void
    {
        if ($leave->user_id !== $user->id) {
            throw ValidationException::withMessages([
                'leave' => __('leave.not_yours'),
            ]);
        }
        if (! $leave->isPending()) {
            throw ValidationException::withMessages([
                'leave' => __('leave.pending_only'),
            ]);
        }

        $leave->delete();
    }

    public function review(LeaveRequest $leave, Admin $admin, string $status, ?string $note = null): LeaveRequest
    {
        if (! $leave->isPending()) {
            throw ValidationException::withMessages([
                'status' => __('leave.already_reviewed'),
            ]);
        }

        if (! in_array($status, [LeaveRequest::STATUS_APPROVED, LeaveRequest::STATUS_REJECTED], true)) {
            throw ValidationException::withMessages([
                'status' => __('leave.invalid_decision'),
            ]);
        }

        if ($status === LeaveRequest::STATUS_APPROVED
            && $this->calendar->overlaps(
                $leave->user_id,
                $leave->start_date->toDateString(),
                $leave->end_date->toDateString(),
                $leave->start_slot,
                $leave->end_slot,
                $leave->id,
            )) {
            throw ValidationException::withMessages([
                'status' => __('leave.overlap_approved'),
            ]);
        }

        $leave->update([
            'status' => $status,
            'reviewed_by_admin_id' => $admin->id,
            'reviewed_at' => now(),
            'review_note' => $this->cleanText($note),
        ]);

        $leave->refresh();
        $verb = $status === LeaveRequest::STATUS_APPROVED ? 'validé' : 'refusé';
        $body = 'Votre '.$this->calendar->typeLabel($leave->type).' ('.$this->calendar->periodLabel($leave).') a été '.$verb.'.';
        if ($leave->review_note) {
            $body .= ' '.$leave->review_note;
        }

        app(Inbox::class)->notifyUser(
            $leave->user_id,
            'leave',
            'Congé · '.($status === LeaveRequest::STATUS_APPROVED ? 'Validé' : 'Refusé'),
            $body,
            route('leaves.index', absolute: false),
        );

        return $leave;
    }

    private function cleanText(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $text = trim($value);

        return $text === '' ? null : $text;
    }
}
