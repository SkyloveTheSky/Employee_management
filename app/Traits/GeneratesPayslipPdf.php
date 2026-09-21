<?php

namespace App\Traits;

use App\Models\CompanySetting;
use App\Models\Payroll;
use App\Services\Leave\LeaveCalendar;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

trait GeneratesPayslipPdf
{
    use BuildsLogoDataUri;

    /**
     * @return array{
     *     payroll: Payroll,
     *     employee: \App\Models\User,
     *     settings: ?CompanySetting,
     *     logoDataUri: ?string,
     *     lines: list<array<string, mixed>>,
     *     leaves: list<array{type: string, type_label: string, days: float}>
     * }
     */
    protected function payslipViewData(Payroll $payroll): array
    {
        $payroll->loadMissing('user');
        $settings = CompanySetting::query()->first();

        $lines = [
            ['numero' => 1, 'designation' => 'Salaire de base', 'base' => $payroll->base_salary, 'taux' => null, 'gain' => $payroll->base_salary, 'retenu' => 0],
        ];

        $numero = 2;
        $unpaidDays = (float) ($payroll->unpaid_leave_days ?? 0);
        $unpaidAmount = (float) ($payroll->unpaid_leave_amount ?? 0);
        if ($unpaidDays > 0 || $unpaidAmount > 0) {
            $daysLabel = rtrim(rtrim(number_format($unpaidDays, 1, ',', ' '), '0'), ',');
            $lines[] = [
                'numero' => $numero++,
                'designation' => 'Congé non payé ('.$daysLabel.' j)',
                'base' => $payroll->base_salary,
                'taux' => null,
                'gain' => 0,
                'retenu' => $unpaidAmount,
            ];
        }

        $lines[] = ['numero' => $numero++, 'designation' => 'Prime', 'base' => $payroll->base_salary, 'taux' => null, 'gain' => $payroll->prime_amount, 'retenu' => 0];
        $overtimeLines = is_array($payroll->overtime_lines) ? $payroll->overtime_lines : [];
        if ($overtimeLines !== []) {
            foreach ($overtimeLines as $line) {
                $hours = (float) ($line['hours'] ?? 0);
                $premium = (float) ($line['premium'] ?? 0);
                $label = (string) ($line['label'] ?? 'HS');
                $hoursLabel = rtrim(rtrim(number_format($hours, 2, ',', ' '), '0'), ',');
                $lines[] = [
                    'numero' => $numero++,
                    'designation' => $label.' ('.$hoursLabel.' h)',
                    'base' => $payroll->base_salary,
                    'taux' => '+'.rtrim(rtrim(number_format($premium, 1, ',', ' '), '0'), ',').' %',
                    'gain' => $line['amount'] ?? 0,
                    'retenu' => 0,
                ];
            }
        } elseif ((float) ($payroll->overtime_amount ?? 0) > 0 || (float) ($payroll->overtime_hours ?? 0) > 0) {
            $hours = (float) ($payroll->overtime_hours ?? 0);
            $coeff = (float) ($payroll->overtime_coefficient ?? 0);
            $premium = $coeff > 0 ? round(($coeff - 1) * 100, 1) : 30;
            $hoursLabel = rtrim(rtrim(number_format($hours, 2, ',', ' '), '0'), ',');
            $lines[] = [
                'numero' => $numero++,
                'designation' => 'HS ('.$hoursLabel.' h)',
                'base' => $payroll->base_salary,
                'taux' => '+'.rtrim(rtrim(number_format($premium, 1, ',', ' '), '0'), ',').' %',
                'gain' => $payroll->overtime_amount ?? 0,
                'retenu' => 0,
            ];
        }

        $lines[] = ['numero' => $numero++, 'designation' => 'CNAPS', 'base' => $payroll->gross_salary, 'taux' => $payroll->cnaps_rate . '%', 'gain' => 0, 'retenu' => $payroll->cnaps_amount];
        $lines[] = ['numero' => $numero++, 'designation' => 'Assurance', 'base' => $payroll->gross_salary, 'taux' => $payroll->assurance_rate . '%', 'gain' => 0, 'retenu' => $payroll->assurance_amount];
        $lines[] = ['numero' => $numero, 'designation' => 'IRSA', 'base' => max(0, (float) $payroll->gross_salary - (float) $payroll->cnaps_amount), 'taux' => 'Barème', 'gain' => 0, 'retenu' => $payroll->irsa_amount ?? 0];

        $leaves = app(LeaveCalendar::class)->approvedDayTotalsInMonth(
            (int) $payroll->user_id,
            (int) $payroll->period_year,
            (int) $payroll->period_month,
        );

        $logoDataUri = function_exists('imagecreatetruecolor')
            ? $this->buildLogoDataUri($settings)
            : null;

        return [
            'payroll'     => $payroll,
            'employee'    => $payroll->user,
            'settings'    => $settings,
            'logoDataUri' => $logoDataUri,
            'lines'       => $lines,
            'leaves'      => $leaves,
        ];
    }

    protected function downloadPayslip(Payroll $payroll)
    {
        $data = $this->payslipViewData($payroll);

        $folder   = $payroll->user->employeeFolder().'/payrolls';
        $filename = $payroll->user->payslipFileName((int) $payroll->period_month, (int) $payroll->period_year);
        $path     = "{$folder}/{$filename}";
        Storage::disk('public')->makeDirectory($folder);

        $pdf = Pdf::loadView('admin.payrolls.payslip', $data)
            ->setPaper('a4')
            ->setOption('encoding', 'UTF-8')
            ->setOption('isHtml5ParserEnabled', true)
            ->setOption('isFontSubsettingEnabled', true);

        Storage::disk('public')->put($path, $pdf->output());

        return $pdf->download($filename);
    }
}
