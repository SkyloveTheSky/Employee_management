<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Payroll;
use App\Traits\GeneratesPayslipPdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class PayrollController extends Controller
{
    use GeneratesPayslipPdf;

    public function index(Request $request): Response
    {
        $payrolls = [];

        if (Schema::hasTable('payrolls')) {
            $payrolls = Payroll::query()
                ->where('user_id', $request->user()->id)
                ->orderByDesc('period_year')
                ->orderByDesc('period_month')
                ->orderByDesc('id')
                ->get();
        }

        return Inertia::render('Payrolls/Index', [
            'payrolls' => $payrolls,
        ]);
    }

    public function pdf(Request $request, $id): HttpResponse
    {
        $payroll = Payroll::query()
            ->with('user')
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        return $this->downloadPayslip($payroll);
    }
}
