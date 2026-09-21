<?php

namespace App\Services\Payroll;

use App\Models\CompanySetting;
use App\Models\WorkEntry;
use App\Services\Leave\LeaveCalendar;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

class OvertimeFromTimesheet
{
    /**
     * @return array{
     *     hours: float,
     *     weekly_goal: float,
     *     hours_per_day: float,
     *     weeks: list<array<string, mixed>>,
     *     days: list<array<string, mixed>>
     * }
     */
    public function forEmployee(int $userId, int $year, int $month): array
    {
        $entries = $this->entriesInRange($year, $month, $userId);

        return $this->compute($entries->keyBy(fn (WorkEntry $entry) => $entry->date->toDateString()), $year, $month, $userId);
    }

    /**
     * Surplus quotidien (demi-journées), aligné sur Gestion des présences.
     *
     * @return array{
     *     allowed: bool,
     *     worked: float,
     *     hours: float,
     *     lines: list<array{key: string, code: string, label: string, premium: float, hours: float}>
     * }
     */
    public function presenceBreakdown(int $userId, int $year, int $month, ?string $position = null): array
    {
        $settings = CompanySetting::query()->first();
        $allowed = CompanySetting::positionAllowsOvertime($position, $settings);
        $computed = $this->forEmployee($userId, $year, $month);
        $worked = round(array_sum(array_column($computed['days'], 'hours')), 2);
        $hours = $allowed
            ? round(array_sum(array_column($computed['days'], 'overtime')), 2)
            : 0.0;

        $lines = [];
        if ($allowed && $hours > 0) {
            $types = OvertimeTypes::enabled(CompanySetting::overtimeTypesForPosition($position, $settings));
            $normal = collect($types)->firstWhere('key', 'normal') ?? ($types[0] ?? null);
            $sunday = collect($types)->firstWhere('key', 'sunday');
            $byKey = [];

            foreach ($computed['days'] as $day) {
                $ot = (float) ($day['overtime'] ?? 0);
                if ($ot <= 0 || ! $normal) {
                    continue;
                }

                $type = Carbon::parse($day['date'])->isSunday() && $sunday ? $sunday : $normal;
                $key = $type['key'];
                if (! isset($byKey[$key])) {
                    $byKey[$key] = [
                        'key' => $type['key'],
                        'code' => $type['code'],
                        'label' => $type['label'],
                        'premium' => (float) $type['premium'],
                        'hours' => 0.0,
                    ];
                }
                $byKey[$key]['hours'] = round($byKey[$key]['hours'] + $ot, 2);
            }

            $lines = array_values($byKey);
        }

        return [
            'allowed' => $allowed,
            'worked' => $worked,
            'hours' => $hours,
            'lines' => $lines,
        ];
    }

    /**
     * @return array<int, float>
     */
    public function hoursByEmployee(int $year, int $month): array
    {
        if (! Schema::hasTable('work_entries')) {
            return [];
        }

        $grouped = $this->entriesInRange($year, $month)->groupBy('user_id');
        $hours = [];

        foreach ($grouped as $userId => $rows) {
            $map = $rows->keyBy(fn (WorkEntry $entry) => $entry->date->toDateString());
            $hours[(int) $userId] = $this->compute($map, $year, $month, (int) $userId)['hours'];
        }

        return $hours;
    }

    /**
     * @param  Collection<string, WorkEntry>  $byDate
     * @return array{
     *     hours: float,
     *     weekly_goal: float,
     *     hours_per_day: float,
     *     weeks: list<array<string, mixed>>,
     *     days: list<array<string, mixed>>
     * }
     */
    public function compute(Collection $byDate, int $year, int $month, ?int $userId = null): array
    {
        $settings = CompanySetting::query()->first();
        $weeklyGoal = (float) ($settings?->overtime_weekly_goal ?: 40);
        $hoursPerDay = CompanySetting::workdayHours($settings);
        $hoursPerHalf = CompanySetting::halfDayHours($settings);

        $monthStart = Carbon::create($year, $month, 1)->startOfDay();
        $monthEnd = $monthStart->copy()->endOfMonth();
        $leaveMap = [];
        if ($userId) {
            $leaveMap = app(LeaveCalendar::class)->approvedSlotsForUsers(
                [$userId],
                $monthStart,
                $monthEnd,
            )[$userId] ?? [];
        }
        $cursor = $monthStart->copy()->startOfWeek(Carbon::MONDAY);
        $rangeEnd = $monthEnd->copy()->endOfWeek(Carbon::SUNDAY);

        $weeks = [];
        $days = [];
        $totalOt = 0.0;

        while ($cursor->lte($rangeEnd)) {
            $weekStart = $cursor->copy();
            $weekEnd = $cursor->copy()->endOfWeek(Carbon::SUNDAY);
            $weekHours = 0.0;
            $daysInMonth = 0;
            $weekDays = [];

            for ($day = $weekStart->copy(); $day->lte($weekEnd); $day->addDay()) {
                $inMonth = $day->month === $month && $day->year === $year;
                if (! $inMonth) {
                    continue;
                }

                $key = $day->toDateString();
                $entry = $byDate->get($key);
                [$morningHours, $afternoonHours] = $this->halfDayHours($entry, $hoursPerDay);
                $morningLeave = $leaveMap[$key]['morning'] ?? null;
                $afternoonLeave = $leaveMap[$key]['afternoon'] ?? null;
                if ($morningLeave) {
                    $morningHours = 0.0;
                }
                if ($afternoonLeave) {
                    $afternoonHours = 0.0;
                }
                $hours = round($morningHours + $afternoonHours, 2);
                $morningOvertime = self::overtimeFromHalf($morningHours, $hoursPerHalf);
                $afternoonOvertime = self::overtimeFromHalf($afternoonHours, $hoursPerHalf);
                $dayOvertime = round($morningOvertime + $afternoonOvertime, 2);
                $daysInMonth++;
                $weekHours += $hours;

                $row = [
                    'date' => $key,
                    'hours' => $hours,
                    'morning_hours' => $morningHours,
                    'afternoon_hours' => $afternoonHours,
                    'morning_overtime' => $morningOvertime,
                    'afternoon_overtime' => $afternoonOvertime,
                    'overtime' => $dayOvertime,
                    'over_daily' => $hoursPerDay > 0 && $hours > $hoursPerDay,
                    'note' => $entry?->note,
                    'id' => $entry?->id,
                    'morning_leave' => $morningLeave,
                    'afternoon_leave' => $afternoonLeave,
                ];
                $weekDays[] = $row;
                $days[] = $row;
            }

            $goal = $daysInMonth > 0 ? round($weeklyGoal * ($daysInMonth / 7), 2) : 0.0;
            $overtime = round(max(0, $weekHours - $goal), 2);
            $totalOt += $overtime;

            $weeks[] = [
                'start' => $weekStart->toDateString(),
                'end' => $weekEnd->toDateString(),
                'hours' => round($weekHours, 2),
                'goal' => $goal,
                'overtime' => $overtime,
                'days' => $weekDays,
            ];

            $cursor->addWeek();
        }

        return [
            'hours' => round($totalOt, 2),
            'weekly_goal' => $weeklyGoal,
            'hours_per_day' => $hoursPerDay,
            'hours_per_half' => $hoursPerHalf,
            'weeks' => $weeks,
            'days' => $days,
        ];
    }

    /**
     * @return Collection<int, WorkEntry>
     */
    private function entriesInRange(int $year, int $month, ?int $userId = null): Collection
    {
        if (! Schema::hasTable('work_entries')) {
            return collect();
        }

        $monthStart = Carbon::create($year, $month, 1)->startOfDay();
        $monthEnd = $monthStart->copy()->endOfMonth();

        $query = WorkEntry::query()->whereBetween('date', [
            $monthStart->toDateString(),
            $monthEnd->toDateString(),
        ]);

        if ($userId) {
            $query->where('user_id', $userId);
        }

        return $query->get();
    }

    public static function overtimeFromHalf(float $hours, float $half): float
    {
        if ($half <= 0) {
            return 0.0;
        }

        return round(max(0, $hours - $half), 2);
    }

    /**
     * @return array{0: float, 1: float}
     */
    private function halfDayHours(?WorkEntry $entry, float $hoursPerDay): array
    {
        if (! $entry) {
            return [0.0, 0.0];
        }

        $half = round($hoursPerDay / 2, 2);
        $hasSplit = Schema::hasColumn('work_entries', 'morning_hours');
        $morning = $hasSplit ? (float) $entry->morning_hours : 0.0;
        $afternoon = $hasSplit ? (float) $entry->afternoon_hours : 0.0;
        $total = (float) $entry->hours;

        if ($morning <= 0 && $afternoon <= 0 && $total > 0) {
            $morning = round(min($total, $half), 2);
            $afternoon = round(max(0, $total - $morning), 2);
        }

        return [round($morning, 2), round($afternoon, 2)];
    }
}
