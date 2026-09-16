<?php

namespace App\Services\Payroll;

use App\Models\CompanySetting;
use App\Models\WorkEntry;
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

        return $this->compute($entries->keyBy(fn (WorkEntry $entry) => $entry->date->toDateString()), $year, $month);
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
            $hours[(int) $userId] = $this->compute($map, $year, $month)['hours'];
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
    public function compute(Collection $byDate, int $year, int $month): array
    {
        $settings = CompanySetting::query()->first();
        $weeklyGoal = (float) ($settings?->overtime_weekly_goal ?: 40);
        $hoursPerDay = CompanySetting::workdayHours($settings);
        $hoursPerHalf = CompanySetting::halfDayHours($settings);

        $monthStart = Carbon::create($year, $month, 1)->startOfDay();
        $monthEnd = $monthStart->copy()->endOfMonth();
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
