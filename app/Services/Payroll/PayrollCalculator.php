<?php

namespace App\Services\Payroll;

use App\Models\User;

class PayrollCalculator
{
    public static function compute(
        User $employee,
        float $primeAmount = 0,
        float $overtimeAmount = 0,
        float $cnapsRate = 1,
        float $assuranceRate = 1,
    ): array {
        $baseSalary      = (float) ($employee->salary_base ?? 0);
        $grossSalary     = $baseSalary + $primeAmount + $overtimeAmount;
        $cnapsAmount     = $grossSalary * ($cnapsRate / 100);
        $assuranceAmount = $grossSalary * ($assuranceRate / 100);
        $totalRetenu     = $cnapsAmount + $assuranceAmount;
        $netToPay        = max(0, $grossSalary - $totalRetenu);

        return [
            'base_salary'       => $baseSalary,
            'prime_amount'      => $primeAmount,
            'overtime_amount'   => $overtimeAmount,
            'gross_salary'      => $grossSalary,
            'cnaps_rate'        => $cnapsRate,
            'assurance_rate'    => $assuranceRate,
            'cnaps_amount'      => $cnapsAmount,
            'assurance_amount'  => $assuranceAmount,
            'total_retenu'      => $totalRetenu,
            'net_salary'        => $netToPay,
            'net_to_pay'        => $netToPay,
        ];
    }
}
