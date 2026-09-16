<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\CompanySetting;
use App\Models\User;
use App\Models\WorkEntry;
use App\Services\Payroll\OvertimeFromTimesheet;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class OvertimeController extends Controller
{
    public function index(Request $request, OvertimeFromTimesheet $timesheet): Response
    {
        $admin = Admin::findOrFail(session('admin_id'));
        $period = (string) $request->input('period', now()->format('Y-m'));
        if (! preg_match('/^\d{4}-\d{2}$/', $period)) {
            $period = now()->format('Y-m');
        }
        [$year, $month] = array_map('intval', explode('-', $period));

        $settings = CompanySetting::query()->first();
        $hoursPerDay = CompanySetting::workdayHours($settings);
        $hoursPerHalf = CompanySetting::halfDayHours($settings);

        $employees = User::query()
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name', 'position', 'photo_path']);

        $entriesByUser = collect();
        if (Schema::hasTable('work_entries')) {
            $monthStart = Carbon::create($year, $month, 1)->startOfDay();
            $monthEnd = $monthStart->copy()->endOfMonth();
            $entriesByUser = WorkEntry::query()
                ->whereBetween('date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                ->get()
                ->groupBy('user_id');
        }

        $rows = $employees->map(function (User $user) use ($timesheet, $entriesByUser, $year, $month, $settings) {
            $map = ($entriesByUser->get($user->id) ?? collect())
                ->keyBy(fn (WorkEntry $entry) => $entry->date->toDateString());
            $computed = $timesheet->compute($map, $year, $month);
            $allowsOvertime = CompanySetting::positionAllowsOvertime($user->position, $settings);
            $days = $computed['days'];
            if (! $allowsOvertime) {
                $days = array_map(function (array $day) {
                    $day['morning_overtime'] = 0;
                    $day['afternoon_overtime'] = 0;
                    $day['overtime'] = 0;

                    return $day;
                }, $days);
            }
            $worked = round(array_sum(array_column($days, 'hours')), 2);
            $overtimeHours = round(array_sum(array_column($days, 'overtime')), 2);
            $presentDays = collect($computed['days'])->sum(function (array $day) {
                $units = 0.0;
                if ((float) ($day['morning_hours'] ?? 0) > 0) {
                    $units += 0.5;
                }
                if ((float) ($day['afternoon_hours'] ?? 0) > 0) {
                    $units += 0.5;
                }

                return $units;
            });

            return [
                'id' => $user->id,
                'name' => trim($user->first_name.' '.$user->last_name),
                'position' => $user->position,
                'photo_path' => $user->photo_path,
                'worked_hours' => $worked,
                'overtime_hours' => $overtimeHours,
                'present_days' => $presentDays,
                'overtime_enabled' => $allowsOvertime,
                'days' => $days,
            ];
        })->values();

        $selectedId = (int) $request->input('user_id');
        $selected = $rows->firstWhere('id', $selectedId);
        $detail = null;
        if ($selected) {
            $detail = [
                'employee' => [
                    'id' => $selected['id'],
                    'name' => $selected['name'],
                    'position' => $selected['position'],
                    'photo_path' => $selected['photo_path'],
                ],
                'hours_per_day' => $hoursPerDay,
                'hours_per_half' => $hoursPerHalf,
                'worked_hours' => $selected['worked_hours'],
                'overtime_hours' => $selected['overtime_hours'],
                'present_days' => $selected['present_days'],
                'overtime_enabled' => $selected['overtime_enabled'],
                'overtime_types' => CompanySetting::overtimeTypesForPosition($selected['position'] ?? null, $settings),
                'days' => $selected['days'],
            ];
        }

        return Inertia::render('Admin/Overtime/Index', [
            'admin' => $admin,
            'period' => $period,
            'hours_per_day' => $hoursPerDay,
            'hours_per_half' => $hoursPerHalf,
            'overtime_enabled' => CompanySetting::overtimeEnabled($settings),
            'overtime_types' => CompanySetting::overtimeTypes($settings),
            'employees' => $rows->map(fn ($row) => collect($row)->except('days')->all())->values(),
            'detail' => $detail,
            'urls' => [
                'index' => route('admin.overtime.index'),
                'day' => route('admin.overtime.day'),
            ],
        ]);
    }

    public function updateDay(Request $request): RedirectResponse
    {
        if (! Schema::hasTable('work_entries')) {
            return back()->withErrors([
                'hours' => 'La table des heures de travail est absente. Exécutez les migrations.',
            ]);
        }

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'date' => ['required', 'date_format:Y-m-d'],
            'morning_hours' => ['nullable', 'numeric', 'min:0', 'max:12'],
            'afternoon_hours' => ['nullable', 'numeric', 'min:0', 'max:12'],
            'hours' => ['nullable', 'numeric', 'min:0', 'max:24'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        $hoursPerDay = CompanySetting::workdayHours();
        $half = CompanySetting::halfDayHours();
        $morning = $validated['morning_hours'] ?? null;
        $afternoon = $validated['afternoon_hours'] ?? null;

        if ($morning === null && $afternoon === null) {
            $total = (float) ($validated['hours'] ?? 0);
            $morning = min($total, $half);
            $afternoon = max(0, $total - $morning);
        }

        $this->persistDay(
            (int) $validated['user_id'],
            $validated['date'],
            (float) ($morning ?? 0),
            (float) ($afternoon ?? 0),
            $validated['note'] ?? null,
            (int) session('admin_id')
        );

        return back()->with('success', 'Présence enregistrée.');
    }

    private function persistDay(
        int $userId,
        string $date,
        float $morningHours,
        float $afternoonHours,
        mixed $note,
        int $adminId
    ): void {
        $morningHours = max(0, round($morningHours, 2));
        $afternoonHours = max(0, round($afternoonHours, 2));
        $hours = round($morningHours + $afternoonHours, 2);
        $note = is_string($note) && trim($note) !== '' ? trim($note) : null;

        $existing = WorkEntry::query()
            ->where('user_id', $userId)
            ->whereDate('date', $date)
            ->first();

        if ($hours <= 0 && $note === null) {
            $existing?->delete();

            return;
        }

        $payload = [
            'hours' => $hours,
            'note' => $note,
            'created_by_admin_id' => $existing?->created_by_admin_id ?: $adminId,
        ];

        if (Schema::hasColumn('work_entries', 'morning_hours')) {
            $payload['morning_hours'] = $morningHours;
            $payload['afternoon_hours'] = $afternoonHours;
        }

        WorkEntry::query()->updateOrCreate(
            [
                'user_id' => $userId,
                'date' => $date,
            ],
            $payload
        );
    }
}
