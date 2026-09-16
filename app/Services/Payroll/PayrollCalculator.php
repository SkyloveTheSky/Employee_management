<?php

namespace App\Services\Payroll;

use App\Models\CompanySetting;
use App\Models\User;
use Illuminate\Support\Facades\Schema;

class PayrollCalculator
{
    public static function compute(
        User $employee,
        float $primeAmount = 0,
        float $overtimeHours = 0,
        float $assuranceRate = 1,
        array $overtimeByType = [],
    ): array {
        $contributions = self::contributionDefaults();
        $cnapsRate = $contributions['cnaps_rate'];
        $cnapsEmployerRate = $contributions['cnaps_employer_rate'];
        $baseSalary = (float) ($employee->salary_base ?? 0);
        $overtimeHours = 0.0;
        $overtimeAmount = 0.0;
        $overtimeLines = [];
        $grossSalary = $baseSalary + $primeAmount;
        $cnapsAmount = $grossSalary * ($cnapsRate / 100);
        $cnapsEmployerAmount = round($grossSalary * ($cnapsEmployerRate / 100), 2);
        $assuranceAmount = $grossSalary * ($assuranceRate / 100);
        $taxable = max(0, $grossSalary - $cnapsAmount);
        $irsaAmount = IrsaScale::compute($taxable, $contributions['irsa_brackets']);
        $totalRetenu = $cnapsAmount + $assuranceAmount + $irsaAmount;
        $netToPay = max(0, $grossSalary - $totalRetenu);

        $amounts = [
            'base_salary' => $baseSalary,
            'prime_amount' => $primeAmount,
            'overtime_hours' => $overtimeHours,
            'overtime_divisor' => null,
            'overtime_coefficient' => null,
            'overtime_amount' => $overtimeAmount,
            'overtime_lines' => $overtimeLines,
            'gross_salary' => $grossSalary,
            'cnaps_rate' => $cnapsRate,
            'cnaps_employer_rate' => $cnapsEmployerRate,
            'cnaps_employer_amount' => $cnapsEmployerAmount,
            'assurance_rate' => $assuranceRate,
            'irsa_rate' => 0,
            'cnaps_amount' => $cnapsAmount,
            'assurance_amount' => $assuranceAmount,
            'irsa_amount' => $irsaAmount,
            'total_retenu' => $totalRetenu,
            'net_salary' => $netToPay,
            'net_to_pay' => $netToPay,
        ];

        foreach ([
            'overtime_hours',
            'overtime_divisor',
            'overtime_coefficient',
            'overtime_lines',
            'irsa_rate',
            'irsa_amount',
            'cnaps_employer_rate',
            'cnaps_employer_amount',
        ] as $column) {
            if (! Schema::hasColumn('payrolls', $column)) {
                unset($amounts[$column]);
            }
        }

        return $amounts;
    }

    /**
     * @return array{cnaps_rate: float, cnaps_employer_rate: float, irsa_brackets: list<array{min: float, max: float|null, rate: float}>}
     */
    public static function contributionDefaults(): array
    {
        $settings = CompanySetting::query()->first();
        $employeeCnaps = Schema::hasColumn('company_settings', 'cnaps_employee_percent')
            ? $settings?->cnaps_employee_percent
            : null;
        $legacyCnaps = Schema::hasColumn('company_settings', 'cnaps_percent') ? $settings?->cnaps_percent : null;
        $cnaps = $employeeCnaps !== null && $employeeCnaps !== '' ? $employeeCnaps : $legacyCnaps;
        $employerCnaps = Schema::hasColumn('company_settings', 'cnaps_employer_percent')
            ? $settings?->cnaps_employer_percent
            : null;

        return [
            'cnaps_rate' => $cnaps !== null && $cnaps !== '' ? (float) $cnaps : 1.0,
            'cnaps_employer_rate' => $employerCnaps !== null && $employerCnaps !== '' ? (float) $employerCnaps : 13.0,
            'irsa_brackets' => Schema::hasColumn('company_settings', 'irsa_brackets')
                ? IrsaScale::normalize($settings?->irsa_brackets)
                : IrsaScale::defaults(),
        ];
    }

    /**
     * @return array{rate: float, amount: float}
     */
    public static function employerCnapsFromPayroll(object $payroll): array
    {
        $fallbackRate = self::contributionDefaults()['cnaps_employer_rate'];
        $gross = (float) ($payroll->gross_salary ?? 0);
        $storedRate = $payroll->cnaps_employer_rate ?? null;
        $storedAmount = $payroll->cnaps_employer_amount ?? null;
        $rate = $storedRate !== null && $storedRate !== '' ? (float) $storedRate : $fallbackRate;
        $computed = round($gross * ($rate / 100), 2);
        $amount = $storedAmount !== null && $storedAmount !== '' && (float) $storedAmount > 0
            ? (float) $storedAmount
            : $computed;

        return [
            'rate' => $rate,
            'amount' => $amount,
        ];
    }
}
