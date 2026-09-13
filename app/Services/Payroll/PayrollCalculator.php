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
    ): array {
        $rules = self::overtimeRules();
        $contributions = self::contributionDefaults();
        $cnapsRate = $contributions['cnaps_rate'];
        $cnapsEmployerRate = $contributions['cnaps_employer_rate'];
        $baseSalary = (float) ($employee->salary_base ?? 0);
        $overtimeAmount = self::overtimeAmount($baseSalary, $overtimeHours, $rules['divisor'], $rules['coefficient']);
        $grossSalary = $baseSalary + $primeAmount + $overtimeAmount;
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
            'overtime_hours' => round($overtimeHours, 2),
            'overtime_divisor' => $rules['divisor'],
            'overtime_coefficient' => $rules['coefficient'],
            'overtime_amount' => $overtimeAmount,
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

    /**
     * @return array{divisor: float, coefficient: float}
     */
    public static function overtimeRules(?float $divisor = null, ?float $coefficient = null): array
    {
        $settings = CompanySetting::query()->first();

        return [
            'divisor' => $divisor > 0
                ? $divisor
                : (float) ($settings?->overtime_divisor ?: 173.33),
            'coefficient' => $coefficient > 0
                ? $coefficient
                : (float) ($settings?->overtime_coefficient ?: 1.3),
        ];
    }

    public static function overtimeAmount(float $baseSalary, float $hours, float $divisor, float $coefficient): float
    {
        if ($hours <= 0 || $baseSalary <= 0 || $divisor <= 0 || $coefficient <= 0) {
            return 0.0;
        }

        return round(($baseSalary / $divisor) * $hours * $coefficient, 2);
    }

    public static function hoursFromAmount(float $baseSalary, float $amount, float $divisor, float $coefficient): float
    {
        if ($amount <= 0 || $baseSalary <= 0 || $divisor <= 0 || $coefficient <= 0) {
            return 0.0;
        }

        return round(($amount * $divisor) / ($baseSalary * $coefficient), 2);
    }
}
