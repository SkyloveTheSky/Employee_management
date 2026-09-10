<?php

namespace App\Services\Payroll;

use App\Models\Payroll;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Schema;

class AnomalyDetector
{
    public function analyzeDraft(
        ?User $employee,
        array $periods,
        float $primeAmount = 0,
        float $overtimeAmount = 0,
        float $cnapsRate = 1,
        float $assuranceRate = 1,
        ?int $ignorePayrollId = null,
    ): array {
        $anomalies = [];

        if (! $employee) {
            return [[
                'code'     => 'missing_employee',
                'severity' => 'error',
                'message'  => 'Aucun employé sélectionné.',
            ]];
        }

        $amounts = PayrollCalculator::compute($employee, $primeAmount, $overtimeAmount, $cnapsRate, $assuranceRate);
        $base    = $amounts['base_salary'];

        if ($base <= 0) {
            $anomalies[] = [
                'code'     => 'zero_salary',
                'severity' => 'warning',
                'message'  => 'Le salaire de base de '.$employee->first_name.' '.$employee->last_name.' est à 0 Ar.',
            ];
        }

        $primeRatio = $base > 0 ? $primeAmount / $base : 0;
        if ($primeAmount > 0 && $primeRatio >= (float) config('payroll.prime_high_ratio', 1)) {
            $anomalies[] = [
                'code'     => 'prime_high',
                'severity' => 'warning',
                'message'  => 'Prime de '.$this->formatAr($primeAmount).' supérieure ou égale au salaire de base ('.$this->formatAr($base).').',
            ];
        } elseif ($primeAmount > 0 && $primeRatio >= (float) config('payroll.prime_warning_ratio', 0.5)) {
            $anomalies[] = [
                'code'     => 'prime_elevated',
                'severity' => 'warning',
                'message'  => 'Prime élevée : '.$this->formatAr($primeAmount).' soit '.round($primeRatio * 100).' % du salaire de base.',
            ];
        }

        $overtimeRatio = $base > 0 ? $overtimeAmount / $base : 0;
        if ($overtimeAmount > 0 && $overtimeRatio >= (float) config('payroll.overtime_warning_ratio', 0.5)) {
            $anomalies[] = [
                'code'     => 'overtime_elevated',
                'severity' => 'warning',
                'message'  => 'Heures supplémentaires élevées : '.$this->formatAr($overtimeAmount).' par rapport au salaire de base.',
            ];
        }

        $rateMin = (float) config('payroll.rate_min', 0.5);
        $rateMax = (float) config('payroll.rate_max', 5);
        if ($cnapsRate < $rateMin || $cnapsRate > $rateMax) {
            $anomalies[] = [
                'code'     => 'cnaps_rate',
                'severity' => 'warning',
                'message'  => 'Taux CNAPS inhabituel ('.$cnapsRate.' %). Plage attendue : '.$rateMin.'–'.$rateMax.' %.',
            ];
        }
        if ($assuranceRate < $rateMin || $assuranceRate > $rateMax) {
            $anomalies[] = [
                'code'     => 'assurance_rate',
                'severity' => 'warning',
                'message'  => 'Taux assurance inhabituel ('.$assuranceRate.' %). Plage attendue : '.$rateMin.'–'.$rateMax.' %.',
            ];
        }

        $expectedNet = $amounts['gross_salary'] - $amounts['total_retenu'];
        if (abs($amounts['net_to_pay'] - max(0, $expectedNet)) > 0.5) {
            $anomalies[] = [
                'code'     => 'net_inconsistent',
                'severity' => 'error',
                'message'  => 'Le net à payer ne correspond pas au brut moins les retenues.',
            ];
        }

        if ($amounts['gross_salary'] > 0 && $amounts['net_to_pay'] <= 0) {
            $anomalies[] = [
                'code'     => 'net_zero',
                'severity' => 'warning',
                'message'  => 'Le net à payer est à 0 Ar alors que le brut est de '.$this->formatAr($amounts['gross_salary']).'.',
            ];
        }

        if (Schema::hasTable('payrolls')) {
            foreach ($periods as $period) {
                if (! is_string($period) || ! preg_match('/^\d{4}-\d{2}$/', $period)) {
                    continue;
                }
                [$year, $month] = explode('-', $period);
                $exists = Payroll::query()
                    ->where('user_id', $employee->id)
                    ->where('period_year', (int) $year)
                    ->where('period_month', (int) $month)
                    ->when($ignorePayrollId, fn ($query) => $query->where('id', '!=', $ignorePayrollId))
                    ->exists();

                if ($exists) {
                    $anomalies[] = [
                        'code'     => 'duplicate_period',
                        'severity' => 'warning',
                        'message'  => 'Une fiche existe déjà pour '.$employee->first_name.' '.$employee->last_name.' en '.$this->periodLabel($period).'.',
                    ];
                }
            }
        }

        return $anomalies;
    }

    public function overview(?string $period = null): array
    {
        $period = $period ?: now()->format('Y-m');
        [$year, $month] = explode('-', $period);

        $unpaid = [];
        $missing = [];

        if (Schema::hasTable('payrolls')) {
            $unpaid = Payroll::query()
                ->with('user:id,first_name,last_name')
                ->where('period_year', (int) $year)
                ->where('period_month', (int) $month)
                ->where('payment_status', 'unpaid')
                ->get()
                ->map(fn (Payroll $payroll) => [
                    'id'   => $payroll->id,
                    'name' => trim(($payroll->user->first_name ?? '').' '.($payroll->user->last_name ?? '')),
                    'net'  => $payroll->net_to_pay,
                ])
                ->values()
                ->all();
        }

        $lookback = (int) config('payroll.missing_months', 2);
        $months   = [];
        for ($i = 0; $i < $lookback; $i++) {
            $date     = Carbon::now()->startOfMonth()->subMonths($i);
            $months[] = ['year' => $date->year, 'month' => $date->month, 'label' => $date->locale('fr')->translatedFormat('F Y')];
        }

        foreach (User::query()->select('id', 'first_name', 'last_name')->orderBy('first_name')->get() as $user) {
            $hasRecent = false;
            if (Schema::hasTable('payrolls')) {
                foreach ($months as $slot) {
                    $exists = Payroll::query()
                        ->where('user_id', $user->id)
                        ->where('period_year', $slot['year'])
                        ->where('period_month', $slot['month'])
                        ->exists();
                    if ($exists) {
                        $hasRecent = true;
                        break;
                    }
                }
            }

            if (! $hasRecent) {
                $missing[] = [
                    'id'     => $user->id,
                    'name'   => trim($user->first_name.' '.$user->last_name),
                    'months' => collect($months)->pluck('label')->implode(', '),
                ];
            }
        }

        return [
            'period'  => $period,
            'unpaid'  => $unpaid,
            'missing' => $missing,
        ];
    }

    public function employeesWithoutPayroll(string $period): array
    {
        [$year, $month] = explode('-', $period);
        $users          = User::query()->select('id', 'first_name', 'last_name', 'salary_base')->orderBy('first_name')->get();

        return $users->filter(function (User $user) use ($year, $month) {
            if (! Schema::hasTable('payrolls')) {
                return true;
            }

            return ! Payroll::query()
                ->where('user_id', $user->id)
                ->where('period_year', (int) $year)
                ->where('period_month', (int) $month)
                ->exists();
        })->map(fn (User $user) => [
            'id'          => $user->id,
            'name'        => trim($user->first_name.' '.$user->last_name),
            'salary_base' => $user->salary_base,
        ])->values()->all();
    }

    public function periodLabel(string $period): string
    {
        return Carbon::createFromFormat('Y-m', $period)->locale('fr')->translatedFormat('F Y');
    }

    private function formatAr(float $value): string
    {
        return number_format($value, 0, ',', ' ').' Ar';
    }
}
