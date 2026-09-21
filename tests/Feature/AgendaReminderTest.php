<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\AgendaNote;
use App\Models\PlatformNotification;
use App\Models\User;
use App\Services\Agenda\AgendaReminder;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AgendaReminderTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_today_note_notifies_admins_once(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-20 10:00:00', 'Indian/Antananarivo'));
        $admin = $this->admin();

        AgendaNote::query()->create([
            'admin_id' => $admin->id,
            'date' => '2026-09-20',
            'title' => 'Réunion RH',
            'note' => 'Salle 2',
        ]);
        AgendaNote::query()->create([
            'admin_id' => $admin->id,
            'date' => '2026-09-21',
            'title' => 'Demain',
        ]);

        $reminder = app(AgendaReminder::class);
        $reminder->notifyDueToday();
        $reminder->notifyDueToday();

        $this->assertDatabaseCount('platform_notifications', 1);
        $this->assertDatabaseHas('platform_notifications', [
            'audience' => 'admin',
            'type' => 'agenda',
            'title' => 'Agenda · Réunion RH',
            'body' => 'Salle 2',
        ]);
    }

    public function test_hire_anniversary_notifies_admins(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-20 10:00:00', 'Indian/Antananarivo'));

        User::query()->create([
            'first_name' => 'Tiana',
            'last_name' => 'Razafy',
            'email' => 'tiana@example.com',
            'password' => 'password',
            'hire_date' => '2020-09-20',
        ]);

        app(AgendaReminder::class)->notifyDueToday();

        $this->assertDatabaseHas('platform_notifications', [
            'audience' => 'admin',
            'type' => 'agenda',
            'title' => 'Agenda · Anniversaire d’embauche',
        ]);
    }

    public function test_agenda_remind_command_runs(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-20 10:00:00', 'Indian/Antananarivo'));
        $admin = $this->admin();
        AgendaNote::query()->create([
            'admin_id' => $admin->id,
            'date' => '2026-09-20',
            'title' => 'Visite',
        ]);

        $this->artisan('agenda:remind')->assertSuccessful();
        $this->assertDatabaseCount('platform_notifications', 1);
    }

    private function admin(): Admin
    {
        return Admin::query()->create([
            'name_admin' => 'Brandon',
            'first_name_admin' => 'Villanova',
            'email_admin' => 'admin@example.com',
            'password_admin' => 'password',
            'post_admin' => 'RH',
            'number_phone_admin' => '0340000000',
        ]);
    }
}
