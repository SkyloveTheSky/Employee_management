<?php

namespace App\Services\Agenda;

use App\Models\AgendaNote;
use App\Models\CompanySetting;
use App\Models\User;
use App\Services\Inbox\Inbox;
use Illuminate\Support\Facades\Schema;

class AgendaReminder
{
    public function __construct(private Inbox $inbox)
    {
    }

    public function notifyDueToday(): int
    {
        if (! Schema::hasTable('platform_notifications')) {
            return 0;
        }

        $now = CompanySetting::attendanceNow();
        $today = $now->toDateString();
        $link = route('admin.agenda', [
            'month' => $now->month,
            'year' => $now->year,
        ], false);
        $sent = 0;

        if (Schema::hasTable('agenda_notes')) {
            $notes = AgendaNote::query()->whereDate('date', $today)->orderBy('id')->get();
            foreach ($notes as $note) {
                $body = trim((string) $note->note);
                $this->inbox->notifyAdmins(
                    'agenda',
                    'Agenda · '.$note->title,
                    $body !== '' ? $body : 'Événement prévu aujourd’hui.',
                    $link,
                    'agenda:note:'.$note->id.':'.$today,
                );
                $sent++;
            }
        }

        if (Schema::hasColumn('users', 'hire_date')) {
            $employees = User::query()
                ->whereNotNull('hire_date')
                ->whereMonth('hire_date', $now->month)
                ->whereDay('hire_date', $now->day)
                ->orderBy('id')
                ->get(['id', 'first_name', 'last_name', 'hire_date']);

            foreach ($employees as $employee) {
                $name = trim($employee->first_name.' '.$employee->last_name) ?: 'Employé';
                $this->inbox->notifyAdmins(
                    'agenda',
                    'Agenda · Anniversaire d’embauche',
                    $name.' a été embauché le '.$employee->hire_date->format('d/m/Y').'.',
                    $link,
                    'agenda:hire:'.$employee->id.':'.$today,
                );
                $sent++;
            }
        }

        return $sent;
    }
}
