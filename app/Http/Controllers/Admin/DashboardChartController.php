<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;


class DashboardChartController extends Controller
{
    public function index()
    {
        return response()->json([
            'total_users' => User::count(),
            'users_per_month' => User::selectRaw('COUNT(*) as total, MONTH(created_at) as month')
                ->whereYear('created_at', date('Y'))
                ->groupBy('month')
                ->orderBy('month')
                ->get(),
        ]);
    }
}
