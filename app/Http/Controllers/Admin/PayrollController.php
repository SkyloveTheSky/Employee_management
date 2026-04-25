<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\Payroll;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class PayrollController extends Controller
{
    public function index(): Response
    {
        $admin = Admin::findOrFail(session('admin_id'));
        $employees = User::query()
            ->select('id', 'first_name', 'last_name', 'salary_base')
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();

        if (! Schema::hasTable('payrolls')) {
            return Inertia::render('Admin/Payrolls/Index', [
                'admin' => $admin,
                'employees' => $employees,
                'payrolls' => [],
            ]);
        }

        $payrolls = Payroll::query()
            ->with(['user:id,first_name,last_name,position', 'generatedByAdmin:id,first_name_admin,name_admin'])
            ->orderByDesc('period_year')
            ->orderByDesc('period_month')
            ->orderByDesc('id')
            ->get();

        return Inertia::render('Admin/Payrolls/Index', [
            'admin' => $admin,
            'employees' => $employees,
            'payrolls' => $payrolls,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        if (! Schema::hasTable('payrolls')) {
            return back()->withErrors([
                'prime_amount' => 'La table payrolls est absente. Exécutez les migrations.',
            ])->withInput();
        }

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'period_month' => ['required', 'integer', 'between:1,12'],
            'period_year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'prime_amount' => ['nullable', 'numeric', 'min:0'],
            'overtime_amount' => ['nullable', 'numeric', 'min:0'],
            'cnaps_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'assurance_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'payment_method' => ['required', 'in:virement,especes,mobile_money,cheque,autre'],
            'payment_status' => ['nullable', 'in:unpaid,paid'],
            'paid_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:1500'],
        ]);

        $alreadyExists = Payroll::query()
            ->where('user_id', $validated['user_id'])
            ->where('period_month', $validated['period_month'])
            ->where('period_year', $validated['period_year'])
            ->exists();

        if ($alreadyExists) {
            return back()->withErrors([
                'period_month' => 'Une paie existe déjà pour cet employé sur cette période.',
            ])->withInput();
        }

        $employee = User::query()->find($validated['user_id']);
        if (! $employee) {
            return back()->withErrors([
                'user_id' => 'Employé introuvable.',
            ])->withInput();
        }

        $baseSalary = (float) ($employee->salary_base ?? 0);
        $primeAmount = (float) ($validated['prime_amount'] ?? 0);
        $overtimeAmount = (float) ($validated['overtime_amount'] ?? 0);
        $cnapsRate = (float) ($validated['cnaps_rate'] ?? 1);
        $assuranceRate = (float) ($validated['assurance_rate'] ?? 1);

        $grossSalary = $baseSalary + $primeAmount + $overtimeAmount;
        $cnapsAmount = $grossSalary * ($cnapsRate / 100);
        $assuranceAmount = $grossSalary * ($assuranceRate / 100);
        $totalRetenu = $cnapsAmount + $assuranceAmount;
        $netToPay = max(0, $grossSalary - $totalRetenu);

        Payroll::create([
            'user_id' => $validated['user_id'],
            'generated_by_admin_id' => session('admin_id'),
            'period_month' => $validated['period_month'],
            'period_year' => $validated['period_year'],
            'base_salary' => $baseSalary,
            'prime_amount' => $primeAmount,
            'overtime_amount' => $overtimeAmount,
            'gross_salary' => $grossSalary,
            'cnaps_rate' => $cnapsRate,
            'assurance_rate' => $assuranceRate,
            'cnaps_amount' => $cnapsAmount,
            'assurance_amount' => $assuranceAmount,
            'total_retenu' => $totalRetenu,
            'net_to_pay' => $netToPay,
            'payment_method' => $validated['payment_method'],
            'payment_status' => $validated['payment_status'] ?? 'unpaid',
            'paid_at' => $validated['paid_at'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return back()->with('success', 'Fiche de paie générée avec succès.');
    }

    public function edit($id): Response
    {
        $admin = Admin::findOrFail(session('admin_id'));
        $employees = User::query()
            ->select('id', 'first_name', 'last_name', 'salary_base')
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();

        $payroll = Payroll::findOrFail($id);

        return Inertia::render('Admin/Payrolls/Edit', [
            'admin' => $admin,
            'employees' => $employees,
            'payroll' => $payroll,
        ]);
    }

    public function update(Request $request, $id): RedirectResponse
    {
        $payroll = Payroll::findOrFail($id);

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'period_month' => ['required', 'integer', 'between:1,12'],
            'period_year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'prime_amount' => ['nullable', 'numeric', 'min:0'],
            'overtime_amount' => ['nullable', 'numeric', 'min:0'],
            'cnaps_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'assurance_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'payment_method' => ['required', 'in:virement,especes,mobile_money,cheque,autre'],
            'payment_status' => ['nullable', 'in:unpaid,paid'],
            'paid_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:1500'],
        ]);

        $alreadyExists = Payroll::query()
            ->where('user_id', $validated['user_id'])
            ->where('period_month', $validated['period_month'])
            ->where('period_year', $validated['period_year'])
            ->where('id', '!=', $payroll->id)
            ->exists();

        if ($alreadyExists) {
            return back()->withErrors([
                'period_month' => 'Une paie existe déjà pour cet employé sur cette période.',
            ])->withInput();
        }

        $employee = User::query()->find($validated['user_id']);
        if (! $employee) {
            return back()->withErrors([
                'user_id' => 'Employé introuvable.',
            ])->withInput();
        }

        $baseSalary = (float) ($employee->salary_base ?? 0);
        $primeAmount = (float) ($validated['prime_amount'] ?? 0);
        $overtimeAmount = (float) ($validated['overtime_amount'] ?? 0);
        $cnapsRate = (float) ($validated['cnaps_rate'] ?? 1);
        $assuranceRate = (float) ($validated['assurance_rate'] ?? 1);

        $grossSalary = $baseSalary + $primeAmount + $overtimeAmount;
        $cnapsAmount = $grossSalary * ($cnapsRate / 100);
        $assuranceAmount = $grossSalary * ($assuranceRate / 100);
        $totalRetenu = $cnapsAmount + $assuranceAmount;
        $netToPay = max(0, $grossSalary - $totalRetenu);

        $payroll->update([
            'user_id' => $validated['user_id'],
            'period_month' => $validated['period_month'],
            'period_year' => $validated['period_year'],
            'base_salary' => $baseSalary,
            'prime_amount' => $primeAmount,
            'overtime_amount' => $overtimeAmount,
            'gross_salary' => $grossSalary,
            'cnaps_rate' => $cnapsRate,
            'assurance_rate' => $assuranceRate,
            'cnaps_amount' => $cnapsAmount,
            'assurance_amount' => $assuranceAmount,
            'total_retenu' => $totalRetenu,
            'net_to_pay' => $netToPay,
            'payment_method' => $validated['payment_method'],
            'payment_status' => $validated['payment_status'] ?? 'unpaid',
            'paid_at' => $validated['paid_at'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->route('admin.payrolls.index')->with('success', 'Fiche de paie modifiée avec succès.');
    }

    public function destroy($id): RedirectResponse
    {
        $payroll = Payroll::findOrFail($id);
        $payroll->delete();

        return redirect()->route('admin.payrolls.index')->with('success', 'Fiche de paie supprimée avec succès.');
    }
}

