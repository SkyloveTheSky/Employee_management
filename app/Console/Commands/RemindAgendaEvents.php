<?php

namespace App\Console\Commands;

use App\Services\Agenda\AgendaReminder;
use Illuminate\Console\Command;

class RemindAgendaEvents extends Command
{
    protected $signature = 'agenda:remind';

    protected $description = 'Notifie les admins des événements d’agenda du jour';

    public function handle(AgendaReminder $reminder): int
    {
        $count = $reminder->notifyDueToday();
        $this->info($count.' rappel(s) d’agenda traité(s).');

        return self::SUCCESS;
    }
}
