<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\CompanySetting;
use App\Models\User;
use App\Services\Payroll\IrsaScale;
use App\Services\Payroll\OvertimeTypes;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CompanySettingsController extends Controller
{
    public function edit(): Response
    {
        $admin = Admin::findOrFail(session('admin_id'));
        $settings = CompanySetting::query()->first();
        $positions = User::query()
            ->whereNotNull('position')
            ->where('position', '!=', '')
            ->orderBy('position')
            ->pluck('position')
            ->unique()
            ->values();
        $storedPositions = array_keys(CompanySetting::overtimeByPosition($settings));
        $positions = $positions->merge($storedPositions)->unique()->sort()->values();
        $positionMap = CompanySetting::overtimeByPosition($settings);
        $defaultTypes = CompanySetting::overtimeTypes($settings);

        return Inertia::render('Admin/Settings/Company', [
            'admin' => $admin,
            'settings' => $settings,
            'overtime_types' => $defaultTypes,
            'overtime_positions' => $positions->map(fn (string $position) => [
                'position' => $position,
                'enabled' => (bool) ($positionMap[$position]['enabled'] ?? true),
                'types' => $positionMap[$position]['types'] ?? $defaultTypes,
            ])->values(),
            'irsa_brackets' => IrsaScale::normalize(
                Schema::hasColumn('company_settings', 'irsa_brackets') ? $settings?->irsa_brackets : null
            ),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        foreach (['overtime_types', 'overtime_positions'] as $key) {
            $raw = $request->input($key.'_json');
            if (is_string($raw) && $raw !== '') {
                $decoded = json_decode($raw, true);
                if (is_array($decoded)) {
                    $request->merge([$key => $decoded]);
                }
            }
        }

        $validated = $request->validate([
            'company_name' => ['nullable', 'string', 'max:255'],
            'owner_name' => ['nullable', 'string', 'max:255'],
            'nif' => ['nullable', 'string', 'max:255'],
            'stat' => ['nullable', 'string', 'max:255'],
            'rcs' => ['nullable', 'string', 'max:255'],
            'logo' => ['nullable', 'file', 'mimes:jpg,jpeg,png', 'max:2048'],
            'overtime_hours_per_day' => ['nullable', 'numeric', 'min:0', 'max:24'],
            'overtime_hours_per_half' => ['nullable', 'numeric', 'min:0', 'max:12'],
            'overtime_enabled' => ['sometimes', 'boolean'],
            'overtime_types' => ['nullable', 'array', 'max:30'],
            'overtime_types.*.key' => ['nullable', 'string', 'max:64'],
            'overtime_types.*.code' => ['nullable', 'string', 'max:64'],
            'overtime_types.*.label' => ['required_with:overtime_types', 'string', 'max:120'],
            'overtime_types.*.premium' => ['required_with:overtime_types', 'numeric', 'min:0', 'max:400'],
            'overtime_types.*.enabled' => ['sometimes', 'boolean'],
            'overtime_positions' => ['nullable', 'array', 'max:80'],
            'overtime_positions.*.position' => ['required_with:overtime_positions', 'string', 'max:255'],
            'overtime_positions.*.enabled' => ['sometimes', 'boolean'],
            'overtime_positions.*.types' => ['nullable', 'array', 'max:30'],
            'overtime_positions.*.types.*.key' => ['nullable', 'string', 'max:64'],
            'overtime_positions.*.types.*.code' => ['nullable', 'string', 'max:64'],
            'overtime_positions.*.types.*.label' => ['nullable', 'string', 'max:120'],
            'overtime_positions.*.types.*.premium' => ['nullable', 'numeric', 'min:0', 'max:400'],
            'overtime_positions.*.types.*.enabled' => ['sometimes', 'boolean'],
            'cnaps_employer_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'cnaps_employee_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'irsa_brackets' => ['nullable', 'array', 'min:1', 'max:20'],
            'irsa_brackets.*.min' => ['required', 'numeric', 'min:0'],
            'irsa_brackets.*.max' => ['nullable', 'numeric', 'min:0'],
            'irsa_brackets.*.rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'attendance_timezone' => ['nullable', 'timezone'],
            'attendance_morning_start' => ['nullable', 'string', 'max:8'],
            'attendance_morning_end' => ['nullable', 'string', 'max:8'],
            'attendance_afternoon_start' => ['nullable', 'string', 'max:8'],
            'attendance_afternoon_end' => ['nullable', 'string', 'max:8'],
            'attendance_latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'attendance_longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'attendance_radius_m' => ['nullable', 'integer', 'min:20', 'max:5000'],
        ], [
            'logo.mimes' => 'Le logo doit être une image (jpg ou png).',
            'logo.max' => 'Le logo ne doit pas dépasser 2MB.',
        ]);

        $settings = CompanySetting::query()->first() ?? new CompanySetting;

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('company', 'public');

            if ($settings->logo_path) {
                Storage::disk('public')->delete($settings->logo_path);
            }

            $settings->logo_path = $path;
        }

        $settings->company_name = $validated['company_name'] ?? $settings->company_name;
        $settings->owner_name = $validated['owner_name'] ?? $settings->owner_name;
        $settings->nif = $validated['nif'] ?? $settings->nif;
        $settings->stat = $validated['stat'] ?? $settings->stat;
        $settings->rcs = $validated['rcs'] ?? $settings->rcs;

        if (array_key_exists('overtime_enabled', $validated)) {
            $validated['overtime_enabled'] = $request->boolean('overtime_enabled');
        }

        if (array_key_exists('overtime_types', $validated)) {
            $validated['overtime_types'] = OvertimeTypes::normalize($validated['overtime_types']);
            $normal = collect($validated['overtime_types'])->firstWhere('key', 'normal')
                ?? collect($validated['overtime_types'])->firstWhere('enabled', true);
            if ($normal) {
                $validated['overtime_coefficient'] = OvertimeTypes::coefficient((float) $normal['premium']);
            }
        }

        if (array_key_exists('overtime_positions', $validated)) {
            $map = [];
            foreach ($validated['overtime_positions'] as $row) {
                $name = trim((string) ($row['position'] ?? ''));
                if ($name === '') {
                    continue;
                }
                $map[$name] = [
                    'enabled' => filter_var($row['enabled'] ?? true, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) !== false,
                    'types' => OvertimeTypes::normalize($row['types'] ?? null),
                ];
            }
            $validated['overtime_by_position'] = $map;
            $firstEnabled = collect($map)->firstWhere('enabled', true);
            $typesForCoeff = $firstEnabled['types'] ?? ($validated['overtime_types'] ?? null);
            if ($typesForCoeff) {
                $normal = collect($typesForCoeff)->firstWhere('key', 'normal')
                    ?? collect($typesForCoeff)->firstWhere('enabled', true);
                if ($normal) {
                    $validated['overtime_coefficient'] = OvertimeTypes::coefficient((float) $normal['premium']);
                }
            }
        }

        foreach ([
            'overtime_hours_per_day',
            'overtime_hours_per_half',
            'overtime_enabled',
            'overtime_types',
            'overtime_by_position',
            'overtime_coefficient',
            'cnaps_percent',
            'cnaps_employer_percent',
            'cnaps_employee_percent',
            'irsa_brackets',
            'attendance_timezone',
            'attendance_morning_start',
            'attendance_morning_end',
            'attendance_afternoon_start',
            'attendance_afternoon_end',
            'attendance_latitude',
            'attendance_longitude',
            'attendance_radius_m',
        ] as $column) {
            if (Schema::hasColumn('company_settings', $column) && array_key_exists($column, $validated)) {
                $value = $validated[$column];
                if ($column === 'irsa_brackets') {
                    $value = IrsaScale::normalize($value);
                }
                if (in_array($column, [
                    'attendance_morning_start',
                    'attendance_morning_end',
                    'attendance_afternoon_start',
                    'attendance_afternoon_end',
                ], true)) {
                    $fallback = match ($column) {
                        'attendance_morning_start' => '06:00',
                        'attendance_morning_end' => '12:30',
                        'attendance_afternoon_start' => '12:00',
                        'attendance_afternoon_end' => '20:00',
                        default => '00:00',
                    };
                    $value = CompanySetting::normalizeClock(is_string($value) ? $value : null, $fallback);
                }
                if ($column === 'attendance_timezone') {
                    $tz = is_string($value) && $value !== '' ? $value : 'Indian/Antananarivo';
                    $value = in_array($tz, timezone_identifiers_list(), true) ? $tz : 'Indian/Antananarivo';
                }
                if (in_array($column, ['attendance_latitude', 'attendance_longitude'], true)) {
                    if ($value === '' || $value === null) {
                        continue;
                    }
                }
                $settings->{$column} = $value;
            }
        }

        if (
            Schema::hasColumn('company_settings', 'cnaps_percent')
            && Schema::hasColumn('company_settings', 'cnaps_employee_percent')
            && array_key_exists('cnaps_employee_percent', $validated)
        ) {
            $settings->cnaps_percent = $validated['cnaps_employee_percent'];
        }

        $settings->save();

        return back()->with('success', __('settings.company_updated'));
    }
}
