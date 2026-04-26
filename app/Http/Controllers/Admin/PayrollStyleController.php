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

        $template = $settings?->payroll_styles ?? $this->getDefaultTemplate();

        return Inertia::render('Admin/Payrolls/PdfTemplateBuilder', [
            'admin' => $admin,
            'initialTemplate' => $template,
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

    private function getDefaultTemplate(): array
    {
        return [
            ['type' => 'company_info', 'label' => 'Informations Entreprise', 'order' => 1, 'visible' => true, 'style' => []],
            ['type' => 'employee_info', 'label' => 'Informations Employé', 'order' => 2, 'visible' => true, 'style' => []],
            ['type' => 'earnings_table', 'label' => 'Tableau des Gains', 'order' => 3, 'visible' => true, 'style' => []],
            ['type' => 'deductions_table', 'label' => 'Tableau des Retenues', 'order' => 4, 'visible' => true, 'style' => []],
            ['type' => 'summary_box', 'label' => 'Résumé', 'order' => 5, 'visible' => true, 'style' => []],
            ['type' => 'payment_info', 'label' => 'Informations Paiement', 'order' => 6, 'visible' => true, 'style' => []],
        ];
    }
}
