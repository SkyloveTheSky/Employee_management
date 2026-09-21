<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\Payroll;
use App\Models\User;
use App\Services\Inbox\Inbox;
use App\Services\Payroll\AnomalyDetector;
use App\Services\Payroll\PayrollAssistant;
use App\Services\Payroll\PayrollCalculator;
use App\Traits\GeneratesPayslipPdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class PayrollController extends Controller
{
    use GeneratesPayslipPdf;

    public function index(Request $request): Response
    {
        $admin     = Admin::findOrFail(session('admin_id'));
        $employees = User::query()
            ->select('id', 'first_name', 'last_name', 'salary_base')
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();

        $filters = [
            'period'          => $request->input('period', now()->format('Y-m')),
            'filter_user_id'  => $request->input('filter_user_id', ''),
            'filter_status'   => $request->input('filter_status', 'all'),
        ];

        if ($filters['period'] !== '' && $filters['period'] !== null && ! preg_match('/^\d{4}-\d{2}$/', $filters['period'])) {
            $filters['period'] = now()->format('Y-m');
        }

        if (! in_array($filters['filter_status'], ['all', 'paid', 'unpaid'], true)) {
            $filters['filter_status'] = 'all';
        }

        if (! Schema::hasTable('payrolls')) {
            return Inertia::render('Admin/Payrolls/Index', [
                'admin'     => $admin,
                'employees' => $employees,
                'payrolls'  => [
                    'data'  => [],
                    'links' => [],
                    'from'  => null,
                    'to'    => null,
                    'total' => 0,
                ],
                'filters' => $filters,
                'insights' => ['period' => $filters['period'], 'unpaid' => [], 'missing' => []],
                'covered_periods' => [],
            ]);
        }

        $query = Payroll::query()
            ->with(['user:id,first_name,last_name,position', 'generatedByAdmin:id,first_name_admin,name_admin'])
            ->orderByDesc('period_year')
            ->orderByDesc('period_month')
            ->orderByDesc('id');

        if ($filters['period']) {
            [$year, $month] = explode('-', $filters['period']);
            $query->where('period_year', (int) $year)->where('period_month', (int) $month);
        }

        if ($filters['filter_user_id'] !== '' && $filters['filter_user_id'] !== null) {
            $query->where('user_id', $filters['filter_user_id']);
        }

        if ($filters['filter_status'] !== 'all') {
            $query->where('payment_status', $filters['filter_status']);
        }

        return Inertia::render('Admin/Payrolls/Index', [
            'admin'       => $admin,
            'employees'   => $employees,
            'payrolls'    => $query->paginate(15)->withQueryString(),
            'filters'     => $filters,
            'insights'    => app(AnomalyDetector::class)->overview($filters['period'] ?: now()->format('Y-m')),
            'covered_periods' => $this->coveredPeriods(),
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
            'user_id'              => ['required', 'exists:users,id'],
            'period_month_years'   => ['required', 'array', 'min:1'],
            'period_month_years.*' => ['required', 'date_format:Y-m', 'distinct'],
            'prime_amount'         => ['nullable', 'numeric', 'min:0'],
            'assurance_rate'       => ['nullable', 'numeric', 'min:0', 'max:100'],
            'payment_method'       => ['required', 'in:virement,especes,mobile_money,cheque,autre'],
            'payment_status'       => ['nullable', 'in:unpaid,paid'],
            'paid_at'              => ['nullable', 'date'],
            'notes'                => ['nullable', 'string', 'max:1500'],
            'confirm_anomalies'    => ['sometimes', 'boolean'],
        ]);

        $employee = User::query()->find($validated['user_id']);
        if (! $employee) {
            return back()->withErrors(['user_id' => 'Employé introuvable.'])->withInput();
        }

        $periods = collect($validated['period_month_years'])->unique()->sort()->values();
        $anomalies = app(AnomalyDetector::class)->analyzeDraft(
            $employee,
            $periods->all(),
            (float) ($validated['prime_amount'] ?? 0),
            0,
            (float) ($validated['assurance_rate'] ?? 1),
            null,
        );

        $blocking = collect($anomalies)->where('severity', 'error')->values();
        if ($blocking->isNotEmpty()) {
            return back()->withErrors([
                'prime_amount' => $blocking->pluck('message')->implode(' '),
            ])->with('payroll_warnings', $anomalies)->withInput();
        }

        $warnings = collect($anomalies)->where('severity', 'warning')->values();
        if ($warnings->isNotEmpty() && ! $request->boolean('confirm_anomalies')) {
            return back()->with('payroll_warnings', $warnings->all())->withInput();
        }

        $existingLabels = [];
        foreach ($periods as $period) {
            [$year, $month] = explode('-', $period);
            $exists = Payroll::query()
                ->where('user_id', $validated['user_id'])
                ->where('period_month', (int) $month)
                ->where('period_year', (int) $year)
                ->exists();

            if ($exists) {
                $existingLabels[] = $this->formatPeriodLabel($period);
            }
        }

        $toCreate = $periods->reject(function (string $period) use ($existingLabels) {
            return in_array($this->formatPeriodLabel($period), $existingLabels, true);
        });

        if ($toCreate->isEmpty()) {
            return back()->withErrors([
                'period_month_years' => 'Une paie existe déjà pour cet employé sur '.($existingLabels === [] ? 'cette période.' : implode(', ', $existingLabels).'.'),
            ])->withInput();
        }

        DB::transaction(function () use ($validated, $toCreate, $employee) {
            foreach ($toCreate as $period) {
                [$period_year, $period_month] = explode('-', $period);
                $amounts = PayrollCalculator::computeForPeriod(
                    $employee,
                    (int) $period_year,
                    (int) $period_month,
                    (float) ($validated['prime_amount'] ?? 0),
                    (float) ($validated['assurance_rate'] ?? 1),
                );

                Payroll::create([
                    'user_id'               => $validated['user_id'],
                    'generated_by_admin_id' => session('admin_id'),
                    'period_month'          => (int) $period_month,
                    'period_year'           => (int) $period_year,
                    ...$amounts,
                    'payment_method'        => $validated['payment_method'],
                    'payment_status'        => $validated['payment_status'] ?? 'unpaid',
                    'paid_at'               => $this->resolvePaidAt($validated['payment_status'] ?? 'unpaid', $validated['paid_at'] ?? null),
                    'notes'                 => $validated['notes'] ?? null,
                ]);
            }
        });

        $createdCount = $toCreate->count();
        $message      = $createdCount > 1
            ? "{$createdCount} fiches de paie générées avec succès."
            : 'Fiche de paie générée avec succès.';

        if ($existingLabels !== []) {
            $message .= ' Déjà existantes : '.implode(', ', $existingLabels).'.';
        }

        $periodText = $toCreate->map(fn (string $period) => $this->formatPeriodLabel($period))->implode(', ');
        app(Inbox::class)->notifyUser(
            (int) $validated['user_id'],
            'payroll_created',
            $createdCount > 1 ? 'Nouvelles fiches de paie' : 'Nouvelle fiche de paie',
            $createdCount > 1
                ? "{$createdCount} fiches ont été ajoutées ({$periodText})."
                : "Votre fiche {$periodText} est disponible.",
            route('payrolls.index', absolute: false),
        );

        if (($validated['payment_status'] ?? 'unpaid') === 'paid') {
            app(Inbox::class)->notifyUser(
                (int) $validated['user_id'],
                'payroll_paid',
                'Paiement confirmé',
                'Une ou plusieurs fiches viennent d’être marquées comme payées.',
                route('payrolls.index', absolute: false),
            );
        }

        return back()->with('success', $message);
    }

    /**
     * @return array<int|string, list<string>>
     */
    private function coveredPeriods(): array
    {
        if (! Schema::hasTable('payrolls')) {
            return [];
        }

        return Payroll::query()
            ->get(['user_id', 'period_year', 'period_month'])
            ->groupBy('user_id')
            ->map(fn ($rows) => $rows
                ->map(fn (Payroll $payroll) => sprintf('%04d-%02d', $payroll->period_year, $payroll->period_month))
                ->unique()
                ->values()
                ->all())
            ->all();
    }

    private function formatPeriodLabel(string $period): string
    {
        return Carbon::createFromFormat('Y-m', $period)
            ->locale('fr')
            ->translatedFormat('F Y');
    }

    public function edit(int $id): Response
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

    public function update(Request $request, int $id): RedirectResponse
    {
        $payroll   = Payroll::findOrFail($id);
        $validated = $request->validate([
            'user_id'           => ['required', 'exists:users,id'],
            'period_month_year' => ['required', 'date_format:Y-m'],
            'prime_amount'      => ['nullable', 'numeric', 'min:0'],
            'assurance_rate'    => ['nullable', 'numeric', 'min:0', 'max:100'],
            'payment_method'    => ['required', 'in:virement,especes,mobile_money,cheque,autre'],
            'payment_status'    => ['nullable', 'in:unpaid,paid'],
            'paid_at'           => ['nullable', 'date'],
            'notes'             => ['nullable', 'string', 'max:1500'],
            'confirm_anomalies' => ['sometimes', 'boolean'],
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

        $anomalies = app(AnomalyDetector::class)->analyzeDraft(
            $employee,
            [$validated['period_month_year']],
            (float) ($validated['prime_amount'] ?? 0),
            0,
            (float) ($validated['assurance_rate'] ?? 1),
            $payroll->id,
        );

        $blocking = collect($anomalies)->where('severity', 'error')->values();
        if ($blocking->isNotEmpty()) {
            return back()->withErrors([
                'prime_amount' => $blocking->pluck('message')->implode(' '),
            ])->with('payroll_warnings', $anomalies)->withInput();
        }

        $warnings = collect($anomalies)->where('severity', 'warning')->values();
        if ($warnings->isNotEmpty() && ! $request->boolean('confirm_anomalies')) {
            return back()->with('payroll_warnings', $warnings->all())->withInput();
        }

        $amounts = PayrollCalculator::computeForPeriod(
            $employee,
            (int) $period_year,
            (int) $period_month,
            (float) ($validated['prime_amount'] ?? 0),
            (float) ($validated['assurance_rate'] ?? 1),
        );

        $becamePaid = $payroll->payment_status !== 'paid' && ($validated['payment_status'] ?? 'unpaid') === 'paid';

        $payroll->update([
            'user_id'          => $validated['user_id'],
            'period_month'     => (int) $period_month,
            'period_year'      => (int) $period_year,
            ...$amounts,
            'payment_method'   => $validated['payment_method'],
            'payment_status'   => $validated['payment_status'] ?? 'unpaid',
            'paid_at'          => $this->resolvePaidAt($validated['payment_status'] ?? 'unpaid', $validated['paid_at'] ?? null),
            'notes'            => $validated['notes'] ?? null,
        ]);

        if ($becamePaid) {
            $label = $this->formatPeriodLabel(sprintf('%04d-%02d', (int) $period_year, (int) $period_month));
            app(Inbox::class)->notifyUser(
                (int) $validated['user_id'],
                'payroll_paid',
                'Paiement confirmé',
                "Votre fiche {$label} a été marquée comme payée.",
                route('payrolls.index', absolute: false),
            );
        }

        return redirect()->route('admin.payrolls.index')->with('success', 'Fiche de paie modifiée avec succès.');
    }

    public function destroy(int $id): RedirectResponse
    {
        $payroll = Payroll::findOrFail($id);
        $payroll->delete();

        return redirect()->route('admin.payrolls.index')->with('success', 'Fiche de paie supprimée avec succès.');
    }

    public function markPayment(Request $request, int $id): RedirectResponse
    {
        $payroll   = Payroll::findOrFail($id);
        $validated = $request->validate([
            'payment_status' => ['required', 'in:unpaid,paid'],
            'paid_at'        => ['nullable', 'date'],
        ]);

        $payroll->update([
            'payment_status' => $validated['payment_status'],
            'paid_at'        => $this->resolvePaidAt($validated['payment_status'], $validated['paid_at'] ?? null),
        ]);

        $message = $validated['payment_status'] === 'paid'
            ? 'Fiche marquée comme payée.'
            : 'Fiche marquée comme non payée.';

        if ($validated['payment_status'] === 'paid') {
            $label = $this->formatPeriodLabel(sprintf('%04d-%02d', $payroll->period_year, $payroll->period_month));
            app(Inbox::class)->notifyUser(
                (int) $payroll->user_id,
                'payroll_paid',
                'Paiement confirmé',
                "Votre fiche {$label} a été marquée comme payée.",
                route('payrolls.index', absolute: false),
            );
        }

        return back()->with('success', $message);
    }

    private function resolvePaidAt(?string $status, mixed $paidAt): ?string
    {
        if ($status !== 'paid') {
            return null;
        }

        return $paidAt ?: now()->toDateString();
    }

    public function assistant(Request $request, PayrollAssistant $assistant): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:1000'],
        ]);

        return response()->json($assistant->ask($validated['message']));
    }

    public function generateMissing(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'period'     => ['required', 'date_format:Y-m'],
            'user_ids'   => ['required', 'array', 'min:1'],
            'user_ids.*' => ['required', 'exists:users,id'],
        ]);

        [$year, $month] = explode('-', $validated['period']);
        $created        = 0;

        $notified = [];

        DB::transaction(function () use ($validated, $year, $month, &$created, &$notified) {
            foreach ($validated['user_ids'] as $userId) {
                $exists = Payroll::query()
                    ->where('user_id', $userId)
                    ->where('period_year', (int) $year)
                    ->where('period_month', (int) $month)
                    ->exists();

                if ($exists) {
                    continue;
                }

                $employee = User::query()->find($userId);
                if (! $employee) {
                    continue;
                }

                $amounts = PayrollCalculator::computeForPeriod($employee, (int) $year, (int) $month, 0, 1);

                Payroll::create([
                    'user_id'               => $employee->id,
                    'generated_by_admin_id' => session('admin_id'),
                    'period_month'          => (int) $month,
                    'period_year'           => (int) $year,
                    ...$amounts,
                    'payment_method'        => 'virement',
                    'payment_status'        => 'unpaid',
                    'paid_at'               => null,
                    'notes'                 => null,
                ]);
                $created++;
                $notified[] = $employee->id;
            }
        });

        $label = app(AnomalyDetector::class)->periodLabel($validated['period']);
        $inbox = app(Inbox::class);
        foreach (array_unique($notified) as $userId) {
            $inbox->notifyUser(
                (int) $userId,
                'payroll_created',
                'Nouvelle fiche de paie',
                'Votre fiche '.$label.' est disponible.',
                route('payrolls.index', absolute: false),
            );
        }

        return back()->with('success', $created > 0
            ? $created.' fiche(s) générée(s) pour '.$label.'. Statut : non payé.'
            : 'Aucune nouvelle fiche à générer pour '.$label.'.');
    }

    public function pdf(int $id)
    {
        $payroll = Payroll::query()->with('user')->findOrFail($id);

        return $this->downloadPayslip($payroll);
    }
}
