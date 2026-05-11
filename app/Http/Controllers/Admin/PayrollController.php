<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\CompanySetting;
use App\Models\Payroll;
use App\Models\User;
use App\Traits\BuildsLogoDataUri;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PayrollController extends Controller
{
    use BuildsLogoDataUri;

    public function index(): Response
    {
        $admin     = Admin::findOrFail(session('admin_id'));
        $employees = User::query()
            ->select('id', 'first_name', 'last_name', 'salary_base')
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();

        if (! Schema::hasTable('payrolls')) {
            return Inertia::render('Admin/Payrolls/Index', [
                'admin'      => $admin,
                'employees'  => $employees,
                'payrolls'   => [],
            ]);
        }

        $payrolls = Payroll::query()
            ->with(['user:id,first_name,last_name,position', 'generatedByAdmin:id,first_name_admin,name_admin'])
            ->orderByDesc('period_year')
            ->orderByDesc('period_month')
            ->orderByDesc('id')
            ->get();

        return Inertia::render('Admin/Payrolls/Index', [
            'admin'       => $admin,
            'employees'   => $employees,
            'payrolls'    => $payrolls,
            'currentPage' => 'admin.payrolls.index',
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
            'user_id'           => ['required', 'exists:users,id'],
            'period_month_year' => ['required', 'date_format:Y-m'],
            'prime_amount'      => ['nullable', 'numeric', 'min:0'],
            'overtime_amount'   => ['nullable', 'numeric', 'min:0'],
            'cnaps_rate'        => ['nullable', 'numeric', 'min:0', 'max:100'],
            'assurance_rate'    => ['nullable', 'numeric', 'min:0', 'max:100'],
            'payment_method'    => ['required', 'in:virement,especes,mobile_money,cheque,autre'],
            'payment_status'    => ['nullable', 'in:unpaid,paid'],
            'paid_at'           => ['nullable', 'date'],
            'notes'             => ['nullable', 'string', 'max:1500'],
        ]);

        [$period_year, $period_month] = explode('-', $validated['period_month_year']);

        $alreadyExists = Payroll::query()
            ->where('user_id', $validated['user_id'])
            ->where('period_month', (int) $period_month)
            ->where('period_year', (int) $period_year)
            ->exists();

        if ($alreadyExists) {
            return back()->withErrors([
                'period_month' => 'Une paie existe déjà pour cet employé sur cette période.',
            ])->withInput();
        }

        $employee = User::query()->find($validated['user_id']);
        if (! $employee) {
            return back()->withErrors(['user_id' => 'Employé introuvable.'])->withInput();
        }

        $baseSalary      = (float) ($employee->salary_base ?? 0);
        $primeAmount     = (float) ($validated['prime_amount'] ?? 0);
        $overtimeAmount  = (float) ($validated['overtime_amount'] ?? 0);
        $cnapsRate       = (float) ($validated['cnaps_rate'] ?? 1);
        $assuranceRate   = (float) ($validated['assurance_rate'] ?? 1);
        $grossSalary     = $baseSalary + $primeAmount + $overtimeAmount;
        $cnapsAmount     = $grossSalary * ($cnapsRate / 100);
        $assuranceAmount = $grossSalary * ($assuranceRate / 100);
        $totalRetenu     = $cnapsAmount + $assuranceAmount;
        $netToPay        = max(0, $grossSalary - $totalRetenu);

        Payroll::create([
            'user_id'               => $validated['user_id'],
            'generated_by_admin_id' => session('admin_id'),
            'period_month'          => (int) $period_month,
            'period_year'           => (int) $period_year,
            'base_salary'           => $baseSalary,
            'prime_amount'          => $primeAmount,
            'overtime_amount'       => $overtimeAmount,
            'gross_salary'          => $grossSalary,
            'cnaps_rate'            => $cnapsRate,
            'assurance_rate'        => $assuranceRate,
            'cnaps_amount'          => $cnapsAmount,
            'assurance_amount'      => $assuranceAmount,
            'total_retenu'          => $totalRetenu,
            'net_salary'            => $netToPay,
            'net_to_pay'            => $netToPay,
            'payment_method'        => $validated['payment_method'],
            'payment_status'        => $validated['payment_status'] ?? 'unpaid',
            'paid_at'               => $validated['paid_at'] ?? null,
            'notes'                 => $validated['notes'] ?? null,
        ]);

        return back()->with('success', 'Fiche de paie générée avec succès.');
    }

    public function edit($id): Response
    {
        $admin     = Admin::findOrFail(session('admin_id'));
        $employees = User::query()
            ->select('id', 'first_name', 'last_name', 'salary_base')
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();

        $payroll = Payroll::findOrFail($id);

        return Inertia::render('Admin/Payrolls/Edit', [
            'admin'     => $admin,
            'employees' => $employees,
            'payroll'   => $payroll,
        ]);
    }

    public function update(Request $request, $id): RedirectResponse
    {
        $payroll   = Payroll::findOrFail($id);
        $validated = $request->validate([
            'user_id'           => ['required', 'exists:users,id'],
            'period_month_year' => ['required', 'date_format:Y-m'],
            'prime_amount'      => ['nullable', 'numeric', 'min:0'],
            'overtime_amount'   => ['nullable', 'numeric', 'min:0'],
            'cnaps_rate'        => ['nullable', 'numeric', 'min:0', 'max:100'],
            'assurance_rate'    => ['nullable', 'numeric', 'min:0', 'max:100'],
            'payment_method'    => ['required', 'in:virement,especes,mobile_money,cheque,autre'],
            'payment_status'    => ['nullable', 'in:unpaid,paid'],
            'paid_at'           => ['nullable', 'date'],
            'notes'             => ['nullable', 'string', 'max:1500'],
        ]);

        [$period_year, $period_month] = explode('-', $validated['period_month_year']);

        $alreadyExists = Payroll::query()
            ->where('user_id', $validated['user_id'])
            ->where('period_month', (int) $period_month)
            ->where('period_year', (int) $period_year)
            ->where('id', '!=', $payroll->id)
            ->exists();

        if ($alreadyExists) {
            return back()->withErrors([
                'period_month' => 'Une paie existe déjà pour cet employé sur cette période.',
            ])->withInput();
        }

        $employee = User::query()->find($validated['user_id']);
        if (! $employee) {
            return back()->withErrors(['user_id' => 'Employé introuvable.'])->withInput();
        }

        $baseSalary      = (float) ($employee->salary_base ?? 0);
        $primeAmount     = (float) ($validated['prime_amount'] ?? 0);
        $overtimeAmount  = (float) ($validated['overtime_amount'] ?? 0);
        $cnapsRate       = (float) ($validated['cnaps_rate'] ?? 1);
        $assuranceRate   = (float) ($validated['assurance_rate'] ?? 1);
        $grossSalary     = $baseSalary + $primeAmount + $overtimeAmount;
        $cnapsAmount     = $grossSalary * ($cnapsRate / 100);
        $assuranceAmount = $grossSalary * ($assuranceRate / 100);
        $totalRetenu     = $cnapsAmount + $assuranceAmount;
        $netToPay        = max(0, $grossSalary - $totalRetenu);

        $payroll->update([
            'user_id'          => $validated['user_id'],
            'period_month'     => (int) $period_month,
            'period_year'      => (int) $period_year,
            'base_salary'      => $baseSalary,
            'prime_amount'     => $primeAmount,
            'overtime_amount'  => $overtimeAmount,
            'gross_salary'     => $grossSalary,
            'cnaps_rate'       => $cnapsRate,
            'assurance_rate'   => $assuranceRate,
            'cnaps_amount'     => $cnapsAmount,
            'assurance_amount' => $assuranceAmount,
            'total_retenu'     => $totalRetenu,
            'net_salary'       => $netToPay,
            'net_to_pay'       => $netToPay,
            'payment_method'   => $validated['payment_method'],
            'payment_status'   => $validated['payment_status'] ?? 'unpaid',
            'paid_at'          => $validated['paid_at'] ?? null,
            'notes'            => $validated['notes'] ?? null,
        ]);

        return redirect()->route('admin.payrolls.index')->with('success', 'Fiche de paie modifiée avec succès.');
    }

    public function destroy($id): RedirectResponse
    {
        $payroll = Payroll::findOrFail($id);
        $payroll->delete();

        return redirect()->route('admin.payrolls.index')->with('success', 'Fiche de paie supprimée avec succès.');
    }

    public function pdf($id)
{
    $payroll  = Payroll::query()->with('user')->findOrFail($id);
    $settings = CompanySetting::query()->first();

    // ── Chemin du fichier ──
    $firstName   = Str::slug($payroll->user->first_name ?? '');
    $lastName    = Str::slug($payroll->user->last_name ?? '');
    $folder      = "employees/{$firstName}-{$lastName}-{$payroll->user->id}/payrolls";
    $monthPadded = str_pad((string) $payroll->period_month, 2, '0', STR_PAD_LEFT);
    $filename    = "FP_{$monthPadded}_{$payroll->period_year}.pdf";
    $path        = "{$folder}/{$filename}";

    // ── Logo ──
    $logoDataUri = $this->buildLogoDataUri($settings);

    // ── Styles : déjà castés en array par Laravel ──
    $styles  = $settings?->payroll_styles  ?? [];
    $margins = $settings?->payroll_margins ?? [
        'top' => 20, 'bottom' => 20, 'left' => 20, 'right' => 20,
    ];

    // ── Lignes du tableau ──
    $lines = [
        ['numero' => 1, 'designation' => 'Salaire de base',        'base' => $payroll->base_salary,  'taux' => null,                           'gain' => $payroll->base_salary,     'retenu' => 0],
        ['numero' => 2, 'designation' => 'Prime',                  'base' => $payroll->base_salary,  'taux' => null,                           'gain' => $payroll->prime_amount,    'retenu' => 0],
        ['numero' => 3, 'designation' => 'Heures supplémentaires', 'base' => $payroll->base_salary,  'taux' => null,                           'gain' => $payroll->overtime_amount, 'retenu' => 0],
        ['numero' => 4, 'designation' => 'CNAPS',                  'base' => $payroll->gross_salary, 'taux' => $payroll->cnaps_rate . '%',     'gain' => 0,                         'retenu' => $payroll->cnaps_amount],
        ['numero' => 5, 'designation' => 'Assurance',              'base' => $payroll->gross_salary, 'taux' => $payroll->assurance_rate . '%', 'gain' => 0,                         'retenu' => $payroll->assurance_amount],
    ];

    $pdf = Pdf::loadView('admin.payrolls.payslip', [
    'payroll'     => $payroll,
    'employee'    => $payroll->user,
    'settings'    => $settings,
    'logoDataUri' => $logoDataUri,
    'lines'       => $lines,
    'styles'      => $styles,
    'margins'     => $margins,
])
->setPaper('a4')
->setOption('encoding', 'UTF-8')
->setOption('isHtml5ParserEnabled', true)
->setOption('isFontSubsettingEnabled', true)
->setOption('margin_top',    $margins['top']    * 2.83)
->setOption('margin_bottom', $margins['bottom'] * 2.83)
->setOption('margin_left',   $margins['left']   * 2.83)
->setOption('margin_right',  $margins['right']  * 2.83);
    Storage::disk('public')->put($path, $pdf->output());

    return $pdf->download($filename);
}
}
