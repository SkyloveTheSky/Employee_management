<?php

namespace App\Services\Payroll;

use App\Models\CompanySetting;
use App\Models\User;
use App\Services\Leave\LeaveCalendar;
use Illuminate\Support\Facades\Schema;

class PayrollCalculator
{
    public static function compute(
        User $employee,
        float $primeAmount = 0,
        float $overtimeHours = 0,
        float $assuranceRate = 1,
        array $overtimeByType = [],
        float $unpaidLeaveDays = 0,
    ): array {
        $settings = CompanySetting::query()->first();
        $contributions = self::contributionDefaults();
        $cnapsRate = $contributions['cnaps_rate'];
        $cnapsEmployerRate = $contributions['cnaps_employer_rate'];
        $baseSalary = (float) ($employee->salary_base ?? 0);
        $divisor = CompanySetting::overtimeDivisor($settings);
        $hourly = $divisor > 0 ? $baseSalary / $divisor : 0.0;

        $overtimeLines = [];
        $overtimeAmount = 0.0;
        $hoursTotal = 0.0;
        $mainCoeff = null;
        $source = $overtimeByType;

        if ($source === [] && $overtimeHours > 0) {
            $types = OvertimeTypes::enabled(CompanySetting::overtimeTypesForPosition($employee->position, $settings));
            $type = collect($types)->firstWhere('key', 'normal') ?? ($types[0] ?? null);
            if ($type) {
                $source = [[...$type, 'hours' => $overtimeHours]];
            } else {
                $premium = CompanySetting::overtimePremium($settings);
                $source = [[
                    'key' => 'normal',
                    'code' => 'HS_NORMAL',
                    'label' => 'HS',
                    'premium' => $premium,
                    'hours' => $overtimeHours,
                ]];
            }
        }

        foreach ($source as $row) {
            if (! is_array($row)) {
                continue;
            }

            $hours = round(max(0, (float) ($row['hours'] ?? 0)), 2);
            if ($hours <= 0) {
                continue;
            }

            $premium = (float) ($row['premium'] ?? 30);
            $coeff = isset($row['coefficient'])
                ? (float) $row['coefficient']
                : OvertimeTypes::coefficient($premium);
            $amount = round($hours * $hourly * $coeff, 2);
            $hoursTotal = round($hoursTotal + $hours, 2);
            $overtimeAmount = round($overtimeAmount + $amount, 2);
            $mainCoeff ??= $coeff;
            $overtimeLines[] = [
                'key' => (string) ($row['key'] ?? 'normal'),
                'code' => (string) ($row['code'] ?? 'HS'),
                'label' => (string) ($row['label'] ?? 'HS'),
                'hours' => $hours,
                'premium' => $premium,
                'coefficient' => $coeff,
                'hourly_rate' => round($hourly, 4),
                'amount' => $amount,
            ];
        }

        $overtimeHours = $hoursTotal;
        $unpaidLeaveDays = round(max(0, $unpaidLeaveDays), 1);
        $unpaidLeaveAmount = 0.0;
        if ($unpaidLeaveDays > 0 && $baseSalary > 0) {
            $unpaidLeaveAmount = round(min($baseSalary, $unpaidLeaveDays * ($baseSalary / 30)), 2);
        }
        $paidBase = round(max(0, $baseSalary - $unpaidLeaveAmount), 2);
        $grossSalary = $paidBase + $primeAmount + $overtimeAmount;
        $cnapsAmount = $grossSalary * ($cnapsRate / 100);
        $cnapsEmployerAmount = round($grossSalary * ($cnapsEmployerRate / 100), 2);
        $assuranceAmount = $grossSalary * ($assuranceRate / 100);
        $taxable = max(0, $grossSalary - $cnapsAmount);
        $irsaAmount = IrsaScale::compute($taxable, $contributions['irsa_brackets']);
        $totalRetenu = $cnapsAmount + $assuranceAmount + $irsaAmount;
        $netToPay = max(0, $grossSalary - $totalRetenu);

        $amounts = [
            'base_salary' => $baseSalary,
            'unpaid_leave_days' => $unpaidLeaveDays,
            'unpaid_leave_amount' => $unpaidLeaveAmount,
            'prime_amount' => $primeAmount,
            'overtime_hours' => $overtimeHours,
            'overtime_divisor' => $divisor,
            'overtime_coefficient' => $mainCoeff,
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
            'unpaid_leave_days',
            'unpaid_leave_amount',
        ] as $column) {
            if (! Schema::hasColumn('payrolls', $column)) {
                unset($amounts[$column]);
            }
        }

        return $amounts;
    }

    public static function computeForPeriod(
        User $employee,
        int $year,
        int $month,
        float $primeAmount = 0,
        float $assuranceRate = 1,
    ): array {
        $breakdown = app(OvertimeFromTimesheet::class)->presenceBreakdown(
            $employee->id,
            $year,
            $month,
            $employee->position,
        );
        $unpaidDays = app(LeaveCalendar::class)->unpaidDaysInMonth($employee->id, $year, $month);

        return self::compute(
            $employee,
            $primeAmount,
            $breakdown['hours'],
            $assuranceRate,
            $breakdown['lines'],
            $unpaidDays,
        );
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
