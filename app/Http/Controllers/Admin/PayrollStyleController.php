<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\CompanySetting;
use App\Models\Payroll;
use App\Traits\BuildsLogoDataUri;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PayrollStyleController extends Controller
{
    use BuildsLogoDataUri;

    public function edit(): Response
    {
        $admin    = Admin::findOrFail(session('admin_id'));
        $settings = CompanySetting::first();
        $template = $this->normalizeStyles($settings?->payroll_styles ?? $this->getDefaultTemplate());
        $margins  = $settings?->payroll_margins ?? $this->getDefaultMargins();

        $samplePayroll = Payroll::with('user')->latest()->first();

        $sampleData = $samplePayroll ? [
            'company_name'      => $settings?->company_name ?? 'Entreprise Demo',
            'owner_name'        => $settings?->owner_name ?? 'N/A',
            'nif'               => $settings?->nif ?? 'N/A',
            'stat'              => $settings?->stat ?? 'N/A',
            'rcs'               => $settings?->rcs ?? 'N/A',
            'logo_path'         => $settings?->logo_path ?? null,
            'employee_name'     => $samplePayroll->user->first_name . ' ' . $samplePayroll->user->last_name,
            'employee_position' => $samplePayroll->user->position,
            'period'            => $samplePayroll->period_month . '/' . $samplePayroll->period_year,
            'base_salary'       => number_format($samplePayroll->base_salary, 2),
            'prime_amount'      => number_format($samplePayroll->prime_amount, 2),
            'overtime_amount'   => number_format($samplePayroll->overtime_amount, 2),
            'gross_salary'      => number_format($samplePayroll->gross_salary, 2),
            'cnaps_rate'        => $samplePayroll->cnaps_rate,
            'assurance_rate'    => $samplePayroll->assurance_rate,
            'cnaps_amount'      => number_format($samplePayroll->cnaps_amount, 2),
            'assurance_amount'  => number_format($samplePayroll->assurance_amount, 2),
            'total_retenu'      => number_format($samplePayroll->total_retenu, 2),
            'net_to_pay'        => number_format($samplePayroll->net_to_pay, 2),
            'payment_method'    => $samplePayroll->payment_method,
            'payment_status'    => $samplePayroll->payment_status,
        ] : $this->getDefaultSampleData();

        return Inertia::render('Admin/Payrolls/PdfTemplateBuilder', [
            'admin'           => $admin,
            'initialTemplate' => $template,
            'initialMargins'  => $margins,
            'currentPage'     => 'admin.payrolls.style.edit',
            'sampleData'      => $sampleData,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'styles'  => ['required', 'array'],
            'margins' => ['required', 'array'],
            'margins.top'    => ['required', 'numeric', 'min:0', 'max:50'],
            'margins.bottom' => ['required', 'numeric', 'min:0', 'max:50'],
            'margins.left'   => ['required', 'numeric', 'min:0', 'max:50'],
            'margins.right'  => ['required', 'numeric', 'min:0', 'max:50'],
        ]);

        $settings = CompanySetting::first();
        // Normalize styles before saving to ensure every widget has a 'style' key and sane defaults
        $normalizedStyles = $this->normalizeStyles($validated['styles']);

        if (!$settings) {
            $settings = CompanySetting::create([
                'payroll_styles'  => $normalizedStyles,
                'payroll_margins' => $validated['margins'],
            ]);
        } else {
            $settings->update([
                'payroll_styles'  => $normalizedStyles,
                'payroll_margins' => $validated['margins'],
            ]);
        }

        $this->regenerateAllPdfs($settings);

        return back()->with('success', 'Styles et marges sauvegardés, PDFs régénérés avec succès.');
    }

    private function regenerateAllPdfs(CompanySetting $settings): void
    {
        $payrolls = Payroll::with('user')->get();

        foreach ($payrolls as $payroll) {
            if (!$payroll->user) {
                continue;
            }

            $firstName   = Str::slug($payroll->user->first_name ?? '');
            $lastName    = Str::slug($payroll->user->last_name ?? '');
            $folder      = "employees/{$firstName}-{$lastName}-{$payroll->user->id}/payrolls";
            $monthPadded = str_pad((string) $payroll->period_month, 2, '0', STR_PAD_LEFT);
            $filename    = "FP_{$monthPadded}_{$payroll->period_year}.pdf";
            $path        = "{$folder}/{$filename}";

            if (!Storage::disk('public')->exists($path)) {
                continue;
            }

            $logoDataUri = $this->buildLogoDataUri($settings);

            $lines = [
                ['numero' => 1, 'designation' => 'Salaire de base',        'base' => $payroll->base_salary,  'taux' => null,                           'gain' => $payroll->base_salary,     'retenu' => 0],
                ['numero' => 2, 'designation' => 'Prime',                  'base' => $payroll->base_salary,  'taux' => null,                           'gain' => $payroll->prime_amount,    'retenu' => 0],
                ['numero' => 3, 'designation' => 'Heures supplémentaires', 'base' => $payroll->base_salary,  'taux' => null,                           'gain' => $payroll->overtime_amount, 'retenu' => 0],
                ['numero' => 4, 'designation' => 'CNAPS',                  'base' => $payroll->gross_salary, 'taux' => $payroll->cnaps_rate . '%',     'gain' => 0,                         'retenu' => $payroll->cnaps_amount],
                ['numero' => 5, 'designation' => 'Assurance',              'base' => $payroll->gross_salary, 'taux' => $payroll->assurance_rate . '%', 'gain' => 0,                         'retenu' => $payroll->assurance_amount],
            ];



            $margins = $settings->payroll_margins ?? $this->getDefaultMargins();

$pdf = Pdf::loadView('admin.payrolls.payslip', [
    'payroll'     => $payroll,
    'employee'    => $payroll->user,
    'settings'    => $settings,
    'logoDataUri' => $logoDataUri,
    'lines'       => $lines,
    'styles'      => $this->normalizeStyles($settings->payroll_styles ?? []),
    'margins'     => $margins,
])
->setPaper('a4')
->setOption('encoding', 'UTF-8')
->setOption('isHtml5ParserEnabled', true)
->setOption('isFontSubsettingEnabled', true)
->setOption('margin_top',    $margins['top'])
->setOption('margin_bottom', $margins['bottom'])
->setOption('margin_left',   $margins['left'])
->setOption('margin_right',  $margins['right']);

            Storage::disk('public')->put($path, $pdf->output());
        }
    }

    private function normalizeStyles($raw = []): array
    {
        $result = [];

        // Accept JSON string or array; try to decode if string
        if (is_string($raw)) {
            $decoded = json_decode($raw, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $raw = $decoded;
            } else {
                // invalid JSON -> return empty
                return $result;
            }
        }

        if (!is_array($raw)) {
            return $result;
        }

        foreach ($raw as $widget) {
            if (!is_array($widget)) {
                continue;
            }

            $result[] = [
                'type'    => isset($widget['type']) ? (string) $widget['type'] : '',
                'label'   => isset($widget['label']) ? (string) $widget['label'] : null,
                'order'   => isset($widget['order']) ? (int) $widget['order'] : 99,
                'visible' => isset($widget['visible']) ? (bool) $widget['visible'] : true,
                'style'   => isset($widget['style']) && is_array($widget['style']) ? $widget['style'] : [],
            ];
        }

        return $result;
    }

    private function getDefaultSampleData(): array
    {
        return [
            'company_name'      => 'Entreprise Demo',
            'owner_name'        => 'John Doe',
            'nif'               => '1234567',
            'stat'              => 'N/A',
            'rcs'               => 'N/A',
            'logo_path'         => null,
            'employee_name'     => 'Jean Martin',
            'employee_position' => 'Responsable',
            'period'            => '04/2026',
            'base_salary'       => '500 000',
            'prime_amount'      => '20 000',
            'overtime_amount'   => '0',
            'gross_salary'      => '520 000',
            'cnaps_rate'        => '1',
            'assurance_rate'    => '1',
            'cnaps_amount'      => '5 200',
            'assurance_amount'  => '5 200',
            'total_retenu'      => '10 400',
            'net_to_pay'        => '509 600',
            'payment_method'    => 'Mobile Money',
            'payment_status'    => 'Non payé',
        ];
    }

    private function getDefaultTemplate(): array
    {
        return [
            ['type' => 'company_info',     'label' => 'Informations Entreprise', 'order' => 1, 'visible' => true, 'style' => []],
            ['type' => 'employee_info',    'label' => 'Informations Employé',    'order' => 2, 'visible' => true, 'style' => []],
            ['type' => 'earnings_table',   'label' => 'Tableau des Gains',       'order' => 3, 'visible' => true, 'style' => []],
            ['type' => 'deductions_table', 'label' => 'Tableau des Retenues',    'order' => 4, 'visible' => true, 'style' => []],
            ['type' => 'summary_box',      'label' => 'Résumé',                  'order' => 5, 'visible' => true, 'style' => []],
            ['type' => 'payment_info',     'label' => 'Informations Paiement',   'order' => 6, 'visible' => true, 'style' => []],
        ];
    }

    private function getDefaultMargins(): array
    {
        return [
            'top'    => 20,
            'bottom' => 20,
            'left'   => 20,
            'right'  => 20,
        ];
    }
}
