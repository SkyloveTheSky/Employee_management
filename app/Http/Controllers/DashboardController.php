<?php

namespace App\Http\Controllers;

use App\Models\Payroll;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $latestPayroll = null;
        $unpaidCount   = 0;

        if (Schema::hasTable('payrolls')) {
            $query = Payroll::query()->where('user_id', $user->id);

            $latestPayroll = (clone $query)
                ->orderByDesc('period_year')
                ->orderByDesc('period_month')
                ->orderByDesc('id')
                ->first();

            $unpaidCount = (clone $query)->where('payment_status', 'unpaid')->count();
        }

        return Inertia::render('Dashboard', [
            'latestPayroll' => $latestPayroll,
            'unpaidCount'   => $unpaidCount,
        ]);
    }
}
