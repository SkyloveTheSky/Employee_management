<?php

namespace App\Traits;

use App\Models\CompanySetting;
use App\Models\Payroll;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

trait GeneratesPayslipPdf
{
    use BuildsLogoDataUri;

    protected function downloadPayslip(Payroll $payroll)
    {
        $payroll->loadMissing('user');
        $settings = CompanySetting::query()->first();

        $folder   = $payroll->user->employeeFolder().'/payrolls';
        $filename = $payroll->user->payslipFileName((int) $payroll->period_month, (int) $payroll->period_year);
        $path     = "{$folder}/{$filename}";
        Storage::disk('public')->makeDirectory($folder);

        $lines = [
            ['numero' => 1, 'designation' => 'Salaire de base', 'base' => $payroll->base_salary, 'taux' => null, 'gain' => $payroll->base_salary, 'retenu' => 0],
            ['numero' => 2, 'designation' => 'Prime', 'base' => $payroll->base_salary, 'taux' => null, 'gain' => $payroll->prime_amount, 'retenu' => 0],
        ];

        $numero = 3;
        $lines[] = ['numero' => $numero++, 'designation' => 'CNAPS', 'base' => $payroll->gross_salary, 'taux' => $payroll->cnaps_rate . '%', 'gain' => 0, 'retenu' => $payroll->cnaps_amount];
        $lines[] = ['numero' => $numero++, 'designation' => 'Assurance', 'base' => $payroll->gross_salary, 'taux' => $payroll->assurance_rate . '%', 'gain' => 0, 'retenu' => $payroll->assurance_amount];
        $lines[] = ['numero' => $numero, 'designation' => 'IRSA', 'base' => max(0, (float) $payroll->gross_salary - (float) $payroll->cnaps_amount), 'taux' => 'Barème', 'gain' => 0, 'retenu' => $payroll->irsa_amount ?? 0];

        $logoDataUri = function_exists('imagecreatetruecolor')
            ? $this->buildLogoDataUri($settings)
            : null;

        $pdf = Pdf::loadView('admin.payrolls.payslip', [
            'payroll'     => $payroll,
            'employee'    => $payroll->user,
            'settings'    => $settings,
            'logoDataUri' => $logoDataUri,
            'lines'       => $lines,
        ])
            ->setPaper('a4')
            ->setOption('encoding', 'UTF-8')
            ->setOption('isHtml5ParserEnabled', true)
            ->setOption('isFontSubsettingEnabled', true);

        Storage::disk('public')->put($path, $pdf->output());

        return $pdf->download($filename);
    }
}
