<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\CompanySetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PayrollStyleController extends Controller
{
    public function edit(): Response
    {
        $admin = Admin::findOrFail(session('admin_id'));
        $settings = CompanySetting::first();

        $styles = $settings?->payroll_styles ?? $this->getDefaultStyles();

        return Inertia::render('Admin/Payrolls/StyleEditor', [
            'admin' => $admin,
            'styles' => $styles,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'styles' => ['required', 'array'],
        ]);

        $settings = CompanySetting::first();
        if (!$settings) {
            $settings = CompanySetting::create([
                'payroll_styles' => $validated['styles'],
            ]);
        } else {
            $settings->update([
                'payroll_styles' => $validated['styles'],
            ]);
        }

        return back()->with('success', 'Styles personnalisés appliques avec succes.');
    }

    private function getDefaultStyles(): array
    {
        return [
            'company_box' => [
                'backgroundColor' => '#fafafa',
                'borderColor' => '#999',
                'borderWidth' => '1px',
                'padding' => '8px',
                'borderRadius' => '0px',
                'fontFamily' => 'Liberation Sans, sans-serif',
            ],
            'employee_box' => [
                'backgroundColor' => '#fafafa',
                'borderColor' => '#999',
                'borderWidth' => '1px',
                'padding' => '8px',
                'borderRadius' => '0px',
                'fontFamily' => 'Liberation Sans, sans-serif',
            ],
            'title_text' => [
                'fontSize' => '18px',
                'fontWeight' => 'bold',
                'color' => '#1a1a1a',
                'textAlign' => 'center',
                'marginBottom' => '10px',
            ],
            'box_title' => [
                'fontSize' => '12px',
                'fontWeight' => 'bold',
                'color' => '#1a1a1a',
                'borderBottomColor' => '#ccc',
                'borderBottomWidth' => '1px',
                'paddingBottom' => '3px',
            ],
            'table_header' => [
                'backgroundColor' => '#e0e0e0',
                'borderColor' => '#999',
                'fontSize' => '10px',
                'fontWeight' => 'bold',
                'color' => '#1a1a1a',
            ],
            'table_body' => [
                'borderColor' => '#999',
                'fontSize' => '10px',
                'color' => '#1a1a1a',
            ],
            'table_totals' => [
                'backgroundColor' => '#f0f0f0',
                'fontSize' => '10px',
                'fontWeight' => 'bold',
                'color' => '#1a1a1a',
            ],
            'payment_info_box' => [
                'backgroundColor' => '#fafafa',
                'borderColor' => '#999',
                'borderWidth' => '1px',
                'padding' => '8px',
                'marginTop' => '18px',
            ],
        ];
    }
}
