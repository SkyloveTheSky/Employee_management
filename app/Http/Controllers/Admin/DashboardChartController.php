<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payroll;
use App\Models\User;
use Illuminate\Support\Facades\Schema;

class DashboardChartController extends Controller
{
    public function index()
    {
        $year = (int) date('Y');

        $payrollPerMonth = [];
        if (Schema::hasTable('payrolls')) {
            $payrollPerMonth = Payroll::query()
                ->selectRaw('period_month as month, SUM(net_to_pay) as total')
                ->where('period_year', $year)
                ->groupBy('period_month')
                ->orderBy('period_month')
                ->get();
        }

        return response()->json([
            'total_users' => User::count(),
            'users_per_month' => User::selectRaw('COUNT(*) as total, MONTH(created_at) as month')
                ->whereYear('created_at', $year)
                ->groupBy('month')
                ->orderBy('month')
                ->get(),
            'payroll_per_month' => $payrollPerMonth,
        ]);
    }
}
