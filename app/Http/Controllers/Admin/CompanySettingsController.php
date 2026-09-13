<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\CompanySetting;
use App\Services\Payroll\IrsaScale;
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

        return Inertia::render('Admin/Settings/Company', [
            'admin' => $admin,
            'settings' => $settings,
            'irsa_brackets' => IrsaScale::normalize(
                Schema::hasColumn('company_settings', 'irsa_brackets') ? $settings?->irsa_brackets : null
            ),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'company_name' => ['nullable', 'string', 'max:255'],
            'owner_name' => ['nullable', 'string', 'max:255'],
            'nif' => ['nullable', 'string', 'max:255'],
            'stat' => ['nullable', 'string', 'max:255'],
            'rcs' => ['nullable', 'string', 'max:255'],
            'logo' => ['nullable', 'file', 'mimes:jpg,jpeg,png', 'max:2048'],
            'overtime_hours_per_day' => ['nullable', 'numeric', 'min:0', 'max:24'],
            'overtime_weekly_goal' => ['nullable', 'numeric', 'min:0', 'max:168'],
            'overtime_divisor' => ['nullable', 'numeric', 'min:0.01', 'max:9999'],
            'overtime_coefficient' => ['nullable', 'numeric', 'min:1', 'max:5'],
            'cnaps_employer_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'cnaps_employee_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'irsa_brackets' => ['nullable', 'array', 'min:1', 'max:20'],
            'irsa_brackets.*.min' => ['required', 'numeric', 'min:0'],
            'irsa_brackets.*.max' => ['nullable', 'numeric', 'min:0'],
            'irsa_brackets.*.rate' => ['required', 'numeric', 'min:0', 'max:100'],
        ], [
            'logo.mimes' => 'Le logo doit être une image (jpg ou png).',
            'logo.max' => 'Le logo ne doit pas dépasser 2MB.',
        ]);

        $settings = CompanySetting::query()->first() ?? new CompanySetting();

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

        foreach ([
            'overtime_hours_per_day',
            'overtime_weekly_goal',
            'overtime_divisor',
            'overtime_coefficient',
            'cnaps_percent',
            'cnaps_employer_percent',
            'cnaps_employee_percent',
            'irsa_brackets',
        ] as $column) {
            if (Schema::hasColumn('company_settings', $column) && array_key_exists($column, $validated)) {
                $value = $validated[$column];
                if ($column === 'irsa_brackets') {
                    $value = IrsaScale::normalize($value);
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

        return back()->with('success', 'Paramètres entreprise mis à jour.');
    }
}

