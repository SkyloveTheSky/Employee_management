<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\CompanySetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
            'logo' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ], [
            'logo.mimes' => 'Le logo doit être une image (jpg, png, webp).',
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
        $settings->save();

        return back()->with('success', 'Paramètres entreprise mis à jour.');
    }
}

