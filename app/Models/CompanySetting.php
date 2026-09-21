<?php

namespace App\Models;

use App\Services\Payroll\OvertimeTypes;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

class CompanySetting extends Model
{
    protected $fillable = [
        'company_name',
        'owner_name',
        'nif',
        'stat',
        'rcs',
        'logo_path',
        'display_theme',
        'overtime_hours_per_day',
        'overtime_hours_per_half',
        'overtime_weekly_goal',
        'overtime_divisor',
        'overtime_coefficient',
        'overtime_types',
        'overtime_enabled',
        'overtime_by_position',
        'cnaps_percent',
        'cnaps_employer_percent',
        'cnaps_employee_percent',
        'irsa_percent',
        'irsa_brackets',
        'attendance_timezone',
        'attendance_morning_start',
        'attendance_morning_end',
        'attendance_afternoon_start',
        'attendance_afternoon_end',
        'attendance_latitude',
        'attendance_longitude',
        'attendance_radius_m',
    ];

    protected function casts(): array
    {
        return [
            'display_theme' => 'array',
            'overtime_hours_per_day' => 'decimal:2',
            'overtime_hours_per_half' => 'decimal:2',
            'overtime_weekly_goal' => 'decimal:2',
            'overtime_divisor' => 'decimal:2',
            'overtime_coefficient' => 'decimal:3',
            'overtime_types' => 'array',
            'overtime_enabled' => 'boolean',
            'overtime_by_position' => 'array',
            'cnaps_percent' => 'decimal:2',
            'cnaps_employer_percent' => 'decimal:2',
            'cnaps_employee_percent' => 'decimal:2',
            'irsa_percent' => 'decimal:2',
            'irsa_brackets' => 'array',
            'attendance_latitude' => 'float',
            'attendance_longitude' => 'float',
            'attendance_radius_m' => 'integer',
        ];
    }

    public static function workdayHours(?self $settings = null): float
    {
        $settings ??= self::query()->first();

        return (float) ($settings?->overtime_hours_per_day ?: 8);
    }

    public static function halfDayHours(?self $settings = null): float
    {
        $settings ??= self::query()->first();
        $stored = Schema::hasColumn('company_settings', 'overtime_hours_per_half')
            ? (float) ($settings?->overtime_hours_per_half ?? 0)
            : 0.0;

        if ($stored > 0) {
            return round($stored, 2);
        }

        return round(self::workdayHours($settings) / 2, 2);
    }

    public static function overtimeDivisor(?self $settings = null): float
    {
        $settings ??= self::query()->first();
        $stored = Schema::hasColumn('company_settings', 'overtime_divisor')
            ? (float) ($settings?->overtime_divisor ?? 0)
            : 0.0;

        if ($stored > 0) {
            return round($stored, 2);
        }

        return 173.33;
    }

    public static function overtimePremium(?self $settings = null): float
    {
        $settings ??= self::query()->first();
        $types = OvertimeTypes::normalize($settings?->overtime_types ?? null);
        $normal = collect($types)->firstWhere('key', 'normal') ?? $types[0] ?? null;
        if ($normal) {
            return (float) $normal['premium'];
        }
        $coefficient = (float) ($settings?->overtime_coefficient ?: 1.3);

        return round(max(0, ($coefficient - 1) * 100), 1);
    }

    public static function overtimeEnabled(?self $settings = null): bool
    {
        $settings ??= self::query()->first();
        if (! Schema::hasColumn('company_settings', 'overtime_enabled')) {
            return true;
        }

        return $settings?->overtime_enabled !== false;
    }

    /**
     * @return list<array{key: string, code: string, label: string, premium: float, enabled: bool}>
     */
    public static function overtimeTypes(?self $settings = null): array
    {
        $settings ??= self::query()->first();
        if (! Schema::hasColumn('company_settings', 'overtime_types')) {
            return OvertimeTypes::defaults();
        }

        return OvertimeTypes::normalize($settings?->overtime_types);
    }

    /**
     * @return array<string, array{enabled: bool, types: list<array{key: string, code: string, label: string, premium: float, enabled: bool}>}>
     */
    public static function overtimeByPosition(?self $settings = null): array
    {
        $settings ??= self::query()->first();
        if (! Schema::hasColumn('company_settings', 'overtime_by_position')) {
            return [];
        }

        return OvertimeTypes::normalizePositions(
            $settings?->overtime_by_position,
            $settings?->overtime_types
        );
    }

    /**
     * @return list<array{key: string, code: string, label: string, premium: float, enabled: bool}>
     */
    public static function overtimeTypesForPosition(?string $position, ?self $settings = null): array
    {
        $map = self::overtimeByPosition($settings);
        $key = trim((string) $position);
        if ($key !== '' && isset($map[$key]['types'])) {
            return $map[$key]['types'];
        }

        return self::overtimeTypes($settings);
    }

    public static function positionAllowsOvertime(?string $position, ?self $settings = null): bool
    {
        if (! self::overtimeEnabled($settings)) {
            return false;
        }

        $map = self::overtimeByPosition($settings);
        $key = trim((string) $position);
        if ($key === '' || $map === []) {
            return true;
        }

        return (bool) ($map[$key]['enabled'] ?? true);
    }

    public static function attendanceTimezone(?self $settings = null): string
    {
        $settings ??= self::query()->first();
        $tz = Schema::hasColumn('company_settings', 'attendance_timezone')
            ? (string) ($settings?->attendance_timezone ?: '')
            : '';
        $tz = $tz !== '' ? $tz : 'Indian/Antananarivo';

        return in_array($tz, timezone_identifiers_list(), true) ? $tz : 'Indian/Antananarivo';
    }

    public static function attendanceNow(?self $settings = null): Carbon
    {
        return Carbon::now(self::attendanceTimezone($settings));
    }

    /**
     * @return array{morning: array{start: string, end: string}, afternoon: array{start: string, end: string}}
     */
    public static function attendanceWindows(?self $settings = null): array
    {
        $settings ??= self::query()->first();
        $has = Schema::hasColumn('company_settings', 'attendance_morning_start');

        return [
            'morning' => [
                'start' => $has ? self::normalizeClock($settings?->attendance_morning_start, '06:00') : '06:00',
                'end' => $has ? self::normalizeClock($settings?->attendance_morning_end, '12:30') : '12:30',
            ],
            'afternoon' => [
                'start' => $has ? self::normalizeClock($settings?->attendance_afternoon_start, '12:00') : '12:00',
                'end' => $has ? self::normalizeClock($settings?->attendance_afternoon_end, '20:00') : '20:00',
            ],
        ];
    }

    public static function attendanceRadius(?self $settings = null): int
    {
        $settings ??= self::query()->first();
        if (! Schema::hasColumn('company_settings', 'attendance_radius_m')) {
            return 150;
        }
        $radius = (int) ($settings?->attendance_radius_m ?: 0);

        return $radius > 0 ? $radius : 150;
    }

    /**
     * @return array{latitude: float, longitude: float}|null
     */
    public static function attendanceWorkplace(?self $settings = null): ?array
    {
        $settings ??= self::query()->first();
        if (
            ! Schema::hasColumn('company_settings', 'attendance_latitude')
            || $settings?->attendance_latitude === null
            || $settings?->attendance_longitude === null
        ) {
            return null;
        }

        return [
            'latitude' => (float) $settings->attendance_latitude,
            'longitude' => (float) $settings->attendance_longitude,
        ];
    }

    public static function normalizeClock(?string $value, string $fallback): string
    {
        if (is_string($value) && preg_match('/^(\d{2}):(\d{2})/', $value, $match)) {
            $hour = max(0, min(23, (int) $match[1]));
            $minute = max(0, min(59, (int) $match[2]));

            return sprintf('%02d:%02d', $hour, $minute);
        }

        return $fallback;
    }
}
