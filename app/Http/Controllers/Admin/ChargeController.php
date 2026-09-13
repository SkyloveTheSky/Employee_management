<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\Payroll;
use App\Services\Payroll\PayrollCalculator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class ChargeController extends Controller
{
    public function index(Request $request): Response
    {
        $admin = Admin::findOrFail(session('admin_id'));
        $period = (string) $request->input('period', now()->format('Y-m'));
        if (! preg_match('/^\d{4}-\d{2}$/', $period)) {
            $period = now()->format('Y-m');
        }

        $view = $request->input('view') === 'employees' ? 'employees' : 'global';
        [$year, $month] = array_map('intval', explode('-', $period));
        $defaults = PayrollCalculator::contributionDefaults();

        $employees = [];
        if (Schema::hasTable('payrolls')) {
            $employees = Payroll::query()
                ->with('user:id,first_name,last_name,position')
                ->where('period_year', $year)
                ->where('period_month', $month)
                ->orderBy('id')
                ->get()
                ->map(function (Payroll $payroll) {
                    $employer = PayrollCalculator::employerCnapsFromPayroll($payroll);
                    $gross = (float) $payroll->gross_salary;
                    $name = trim(($payroll->user->first_name ?? '').' '.($payroll->user->last_name ?? ''));

                    return [
                        'payroll_id' => $payroll->id,
                        'user_id' => $payroll->user_id,
                        'name' => $name !== '' ? $name : 'Employé',
                        'position' => $payroll->user->position ?? '',
                        'gross_salary' => $gross,
                        'cnaps_employer_rate' => $employer['rate'],
                        'cnaps_employer_amount' => $employer['amount'],
                        'employer_charge' => $gross + $employer['amount'],
                    ];
                })
                ->values()
                ->all();
        }

        $cnapsEmployerTotal = array_sum(array_column($employees, 'cnaps_employer_amount'));
        $grossTotal = array_sum(array_column($employees, 'gross_salary'));

        return Inertia::render('Admin/Charges/Index', [
            'admin' => $admin,
            'period' => $period,
            'view' => $view,
            'employees' => $employees,
            'global' => [
                'employee_count' => count($employees),
                'gross_total' => $grossTotal,
                'cnaps_employer_rate' => $defaults['cnaps_employer_rate'],
                'cnaps_employer_total' => $cnapsEmployerTotal,
                'employer_charge_total' => $grossTotal + $cnapsEmployerTotal,
            ],
        ]);
    }
}
