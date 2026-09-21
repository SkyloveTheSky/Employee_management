<?php

namespace App\Services\Leave;

use App\Models\LeaveRequest;
use Carbon\Carbon;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class LeaveCalendar
{
    public function days(string $startDate, string $endDate, string $startSlot, string $endSlot): float
    {
        $this->assertRange($startDate, $endDate, $startSlot, $endSlot);
        $from = $this->halfIndex($startDate, $startSlot);
        $to = $this->halfIndex($endDate, $endSlot);

        return round(($to - $from + 1) / 2, 1);
    }

    public function assertRange(string $startDate, string $endDate, string $startSlot, string $endSlot): void
    {
        if (! in_array($startSlot, [LeaveRequest::SLOT_MORNING, LeaveRequest::SLOT_AFTERNOON], true)) {
            throw ValidationException::withMessages(['start_slot' => __('leave.invalid_start_slot')]);
        }
        if (! in_array($endSlot, [LeaveRequest::SLOT_MORNING, LeaveRequest::SLOT_AFTERNOON], true)) {
            throw ValidationException::withMessages(['end_slot' => __('leave.invalid_end_slot')]);
        }

        $from = $this->halfIndex($startDate, $startSlot);
        $to = $this->halfIndex($endDate, $endSlot);
        if ($to < $from) {
            throw ValidationException::withMessages([
                'end_date' => __('leave.end_before_start'),
            ]);
        }

        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->startOfDay();
        if ($start->diffInDays($end) > 90) {
            throw ValidationException::withMessages([
                'end_date' => __('leave.too_long'),
            ]);
        }
    }

    public function overlaps(
        int $userId,
        string $startDate,
        string $endDate,
        string $startSlot,
        string $endSlot,
        ?int $ignoreId = null,
    ): bool {
        if (! Schema::hasTable('leave_requests')) {
            return false;
        }

        $from = $this->halfIndex($startDate, $startSlot);
        $to = $this->halfIndex($endDate, $endSlot);

        $existing = LeaveRequest::query()
            ->where('user_id', $userId)
            ->whereIn('status', [LeaveRequest::STATUS_PENDING, LeaveRequest::STATUS_APPROVED])
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->whereDate('start_date', '<=', $endDate)
            ->whereDate('end_date', '>=', $startDate)
            ->get();

        foreach ($existing as $leave) {
            $otherFrom = $this->halfIndex($leave->start_date->toDateString(), $leave->start_slot);
            $otherTo = $this->halfIndex($leave->end_date->toDateString(), $leave->end_slot);
            if ($from <= $otherTo && $otherFrom <= $to) {
                return true;
            }
        }

        return false;
    }

    public function unpaidDaysInMonth(int $userId, int $year, int $month): float
    {
        if (! Schema::hasTable('leave_requests')) {
            return 0.0;
        }

        $monthStart = Carbon::create($year, $month, 1)->startOfDay();
        $monthEnd = $monthStart->copy()->endOfMonth()->startOfDay();
        $clipFrom = $this->halfIndex($monthStart->toDateString(), LeaveRequest::SLOT_MORNING);
        $clipTo = $this->halfIndex($monthEnd->toDateString(), LeaveRequest::SLOT_AFTERNOON);

        $leaves = LeaveRequest::query()
            ->where('user_id', $userId)
            ->where('type', LeaveRequest::TYPE_UNPAID)
            ->where('status', LeaveRequest::STATUS_APPROVED)
            ->whereDate('start_date', '<=', $monthEnd->toDateString())
            ->whereDate('end_date', '>=', $monthStart->toDateString())
            ->get();

        $halves = 0;
        foreach ($leaves as $leave) {
            $from = max($this->halfIndex($leave->start_date->toDateString(), $leave->start_slot), $clipFrom);
            $to = min($this->halfIndex($leave->end_date->toDateString(), $leave->end_slot), $clipTo);
            if ($to >= $from) {
                $halves += ($to - $from + 1);
            }
        }

        return round($halves / 2, 1);
    }

    /**
     * @return list<array{type: string, type_label: string, days: float, period: string}>
     */
    public function approvedSummariesInMonth(int $userId, int $year, int $month): array
    {
        if (! Schema::hasTable('leave_requests')) {
            return [];
        }

        $monthStart = Carbon::create($year, $month, 1)->startOfDay();
        $monthEnd = $monthStart->copy()->endOfMonth()->startOfDay();
        $clipFrom = $this->halfIndex($monthStart->toDateString(), LeaveRequest::SLOT_MORNING);
        $clipTo = $this->halfIndex($monthEnd->toDateString(), LeaveRequest::SLOT_AFTERNOON);

        $leaves = LeaveRequest::query()
            ->where('user_id', $userId)
            ->where('status', LeaveRequest::STATUS_APPROVED)
            ->whereDate('start_date', '<=', $monthEnd->toDateString())
            ->whereDate('end_date', '>=', $monthStart->toDateString())
            ->orderBy('start_date')
            ->get();

        $rows = [];
        foreach ($leaves as $leave) {
            $from = max($this->halfIndex($leave->start_date->toDateString(), $leave->start_slot), $clipFrom);
            $to = min($this->halfIndex($leave->end_date->toDateString(), $leave->end_slot), $clipTo);
            if ($to < $from) {
                continue;
            }

            $days = round(($to - $from + 1) / 2, 1);
            $rows[] = [
                'type' => $leave->type,
                'type_label' => $leave->typeLabel(),
                'days' => $days,
                'period' => $this->periodLabel($leave),
            ];
        }

        return $rows;
    }

    /**
     * @return list<array{type: string, type_label: string, days: float}>
     */
    public function approvedDayTotalsInMonth(int $userId, int $year, int $month): array
    {
        $totals = [
            LeaveRequest::TYPE_PAID => 0.0,
            LeaveRequest::TYPE_UNPAID => 0.0,
            LeaveRequest::TYPE_SICK => 0.0,
        ];

        foreach ($this->approvedSummariesInMonth($userId, $year, $month) as $row) {
            $type = $row['type'];
            if (! array_key_exists($type, $totals)) {
                continue;
            }
            $totals[$type] = round($totals[$type] + (float) $row['days'], 1);
        }

        return [
            ['type' => LeaveRequest::TYPE_PAID, 'type_label' => 'Congé payé', 'days' => $totals[LeaveRequest::TYPE_PAID]],
            ['type' => LeaveRequest::TYPE_UNPAID, 'type_label' => 'Congé non payé', 'days' => $totals[LeaveRequest::TYPE_UNPAID]],
            ['type' => LeaveRequest::TYPE_SICK, 'type_label' => 'Repos maladie', 'days' => $totals[LeaveRequest::TYPE_SICK]],
        ];
    }

    public function slotType(int $userId, string $date, string $slot): ?string
    {
        $day = Carbon::parse($date)->startOfDay();
        $map = $this->approvedSlotsForUsers([$userId], $day, $day);

        return $map[$userId][$date][$slot] ?? null;
    }

    public function typeLabel(string $type): string
    {
        return match ($type) {
            LeaveRequest::TYPE_UNPAID => 'congé non payé',
            LeaveRequest::TYPE_SICK => 'repos maladie',
            default => 'congé payé',
        };
    }

    public function slotReason(?string $type): ?string
    {
        return match ($type) {
            LeaveRequest::TYPE_UNPAID => __('leave.reason_unpaid'),
            LeaveRequest::TYPE_SICK => __('leave.reason_sick'),
            LeaveRequest::TYPE_PAID => __('leave.reason_paid'),
            default => null,
        };
    }

    public function periodLabel(LeaveRequest $leave): string
    {
        $start = $leave->start_date->format('d/m/Y');
        $end = $leave->end_date->format('d/m/Y');
        $days = rtrim(rtrim(number_format((float) $leave->days, 1, ',', ' '), '0'), ',');

        if ($start === $end) {
            $slot = $leave->start_slot === $leave->end_slot
                ? ($leave->start_slot === LeaveRequest::SLOT_AFTERNOON ? 'après-midi' : 'matin')
                : 'journée';

            return $start.' ('.$slot.', '.$days.' j)';
        }

        return $start.' – '.$end.' ('.$days.' j)';
    }

    /**
     * @param  list<int>  $userIds
     * @return array<int, array<string, array{morning: ?string, afternoon: ?string}>>
     */
    public function approvedSlotsForUsers(array $userIds, Carbon $start, Carbon $end): array
    {
        $map = [];
        if ($userIds === [] || ! Schema::hasTable('leave_requests')) {
            return $map;
        }

        $fromDate = $start->copy()->startOfDay()->toDateString();
        $toDate = $end->copy()->startOfDay()->toDateString();

        $leaves = LeaveRequest::query()
            ->whereIn('user_id', $userIds)
            ->where('status', LeaveRequest::STATUS_APPROVED)
            ->whereDate('start_date', '<=', $toDate)
            ->whereDate('end_date', '>=', $fromDate)
            ->get();

        $clipFrom = $this->halfIndex($fromDate, LeaveRequest::SLOT_MORNING);
        $clipTo = $this->halfIndex($toDate, LeaveRequest::SLOT_AFTERNOON);

        foreach ($leaves as $leave) {
            $from = max($this->halfIndex($leave->start_date->toDateString(), $leave->start_slot), $clipFrom);
            $to = min($this->halfIndex($leave->end_date->toDateString(), $leave->end_slot), $clipTo);
            for ($index = $from; $index <= $to; $index++) {
                [$date, $slot] = $this->indexToDateSlot($index);
                $map[$leave->user_id][$date][$slot] = $leave->type;
            }
        }

        return $map;
    }

    private function halfIndex(string $date, string $slot): int
    {
        $days = intdiv((int) Carbon::parse($date.' 00:00:00', 'UTC')->getTimestamp(), 86400);

        return ($days * 2) + ($slot === LeaveRequest::SLOT_AFTERNOON ? 1 : 0);
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function indexToDateSlot(int $index): array
    {
        $days = intdiv($index, 2);
        $slot = $index % 2 === 1 ? LeaveRequest::SLOT_AFTERNOON : LeaveRequest::SLOT_MORNING;
        $date = Carbon::createFromTimestampUTC($days * 86400)->toDateString();

        return [$date, $slot];
    }
}
