<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\AgendaNote;
use App\Models\Payroll;
use App\Models\User;
use App\Services\Agenda\AgendaReminder;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class AgendaController extends Controller
{
    public function index(Request $request): Response
    {
        $admin = Admin::findOrFail(session('admin_id'));

        $month = (int) $request->input('month', now()->month);
        $year = (int) $request->input('year', now()->year);
        if ($month < 1 || $month > 12) {
            $month = (int) now()->month;
        }
        if ($year < 2000 || $year > 2100) {
            $year = (int) now()->year;
        }

        $start = Carbon::create($year, $month, 1)->startOfDay();
        $end = $start->copy()->endOfMonth();

        $events = [];
        $summaries = [
            'unpaid' => 0,
            'paid' => 0,
            'period' => sprintf('%04d-%02d', $year, $month),
        ];

        if (Schema::hasTable('payrolls')) {
            $payrolls = Payroll::query()
                ->with('user:id,first_name,last_name')
                ->where(function ($query) use ($month, $year, $start, $end) {
                    $query->where(function ($period) use ($month, $year) {
                        $period->where('period_month', $month)->where('period_year', $year);
                    })->orWhere(function ($paid) use ($start, $end) {
                        $paid->whereNotNull('paid_at')->whereBetween('paid_at', [$start, $end]);
                    });
                })
                ->get();

            $paymentsByDate = [];

            foreach ($payrolls as $payroll) {
                $employee = trim(($payroll->user->first_name ?? '').' '.($payroll->user->last_name ?? ''));
                $period = str_pad((string) $payroll->period_month, 2, '0', STR_PAD_LEFT).'/'.$payroll->period_year;

                if ($payroll->period_month === $month && $payroll->period_year === $year) {
                    if ($payroll->payment_status === 'paid') {
                        $summaries['paid']++;
                    } else {
                        $summaries['unpaid']++;
                    }
                }

                if ($payroll->payment_status === 'paid' && $payroll->paid_at) {
                    $paidAt = $payroll->paid_at->copy();
                    if ($paidAt->month === $month && $paidAt->year === $year) {
                        $date = $paidAt->toDateString();
                        $paymentsByDate[$date][] = [
                            'label' => $employee.' ('.$period.')',
                            'href' => route('admin.payrolls.edit', $payroll->id),
                        ];
                    }
                }
            }

            foreach ($paymentsByDate as $date => $items) {
                $count = count($items);
                $events[] = [
                    'date' => $date,
                    'type' => 'paid',
                    'label' => $count === 1
                        ? 'Paie versée · '.$items[0]['label']
                        : $count.' paies versées',
                    'items' => $items,
                    'href' => $count === 1 ? $items[0]['href'] : route('admin.payrolls.index', [
                        'period' => sprintf('%04d-%02d', $year, $month),
                        'filter_status' => 'paid',
                    ]),
                ];
            }
        }

        if (Schema::hasTable('agenda_notes')) {
            $notes = AgendaNote::query()
                ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
                ->orderBy('date')
                ->get();

            foreach ($notes as $note) {
                $events[] = [
                    'id' => $note->id,
                    'date' => $note->date->toDateString(),
                    'type' => 'note',
                    'label' => $note->title,
                    'note' => $note->note,
                    'href' => null,
                ];
            }
        }

        if (Schema::hasColumn('users', 'hire_date')) {
            $hiresByDate = [];
            $employees = User::query()
                ->whereNotNull('hire_date')
                ->whereMonth('hire_date', $month)
                ->get(['id', 'first_name', 'last_name', 'hire_date']);

            foreach ($employees as $employee) {
                $day = (int) $employee->hire_date->format('d');
                $maxDay = $end->day;
                $date = Carbon::create($year, $month, min($day, $maxDay))->toDateString();
                $hiresByDate[$date][] = [
                    'label' => trim($employee->first_name.' '.$employee->last_name).' ('.$employee->hire_date->format('d/m/Y').')',
                    'href' => route('admin.employees.edit', $employee->id),
                ];
            }

            foreach ($hiresByDate as $date => $items) {
                $count = count($items);
                $events[] = [
                    'date' => $date,
                    'type' => 'hire',
                    'label' => $count === 1
                        ? 'Embauche · '.$items[0]['label']
                        : $count.' embauches',
                    'items' => $items,
                    'href' => $count === 1 ? $items[0]['href'] : route('admin.employees'),
                ];
            }
        }

        usort($events, fn ($a, $b) => strcmp($a['date'], $b['date']));

        return Inertia::render('Admin/Agenda/Index', [
            'admin' => $admin,
            'month' => $month,
            'year' => $year,
            'events' => $events,
            'summaries' => $summaries,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatedNote($request);
        $validated['admin_id'] = session('admin_id');

        AgendaNote::query()->create($validated);

        app(AgendaReminder::class)->notifyDueToday();

        return $this->redirectToMonth($validated['date']);
    }

    public function update(Request $request, AgendaNote $agendaNote): RedirectResponse
    {
        $validated = $this->validatedNote($request);
        $agendaNote->update($validated);

        return $this->redirectToMonth($validated['date']);
    }

    public function destroy(AgendaNote $agendaNote): RedirectResponse
    {
        $date = $agendaNote->date->toDateString();
        $agendaNote->delete();

        return $this->redirectToMonth($date);
    }

    private function validatedNote(Request $request): array
    {
        return $request->validate([
            'date' => ['required', 'date'],
            'title' => ['required', 'string', 'max:120'],
            'note' => ['nullable', 'string', 'max:2000'],
        ]);
    }

    private function redirectToMonth(string $date): RedirectResponse
    {
        $parsed = Carbon::parse($date);

        return redirect()->route('admin.agenda', [
            'month' => $parsed->month,
            'year' => $parsed->year,
        ]);
    }
}
