<?php

namespace Tests\Feature;

use App\Models\AttendancePunch;
use App\Models\CompanySetting;
use App\Models\User;
use App\Models\WorkEntry;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AttendancePunchTest extends TestCase
{
    use RefreshDatabase;

    private const LAT = -18.8792;

    private const LNG = 47.5079;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_employee_can_view_today_attendance_page(): void
    {
        $this->freezeMorning();
        $this->configureWorkplace();
        $user = $this->employee();

        $this->actingAs($user)
            ->get('/attendance')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Attendance/Today')
                ->where('today', '2026-09-20')
                ->where('slots.morning.can_in', true)
                ->where('slots.morning.can_out', false)
            );
    }

    public function test_employee_can_clock_in_today_within_zone_and_window(): void
    {
        $this->freezeMorning();
        $this->configureWorkplace();
        $user = $this->employee();

        $this->actingAs($user)
            ->from('/attendance')
            ->post('/attendance/punch', $this->payload())
            ->assertRedirect('/attendance')
            ->assertSessionHasNoErrors();

        $this->assertTrue(
            AttendancePunch::query()
                ->where('user_id', $user->id)
                ->whereDate('date', '2026-09-20')
                ->where('slot', 'morning')
                ->where('type', 'in')
                ->exists()
        );
        $this->assertDatabaseHas('platform_notifications', [
            'audience' => 'admin',
            'type' => 'attendance',
            'title' => 'Présence · Arrivée',
        ]);
    }

    public function test_client_date_yesterday_or_tomorrow_is_ignored(): void
    {
        $this->freezeMorning();
        $this->configureWorkplace();
        $user = $this->employee();

        $this->actingAs($user)
            ->from('/attendance')
            ->post('/attendance/punch', array_merge($this->payload(), ['date' => '2026-09-19']))
            ->assertSessionHasNoErrors();

        $this->actingAs($user)
            ->from('/attendance')
            ->post('/attendance/punch', array_merge($this->payload('afternoon', 'in'), [
                'date' => '2026-09-21',
                'slot' => 'morning',
                'type' => 'out',
            ]))
            ->assertSessionHasNoErrors();

        $this->assertSame(
            ['2026-09-20'],
            AttendancePunch::query()->get()->map(fn (AttendancePunch $punch) => $punch->date->toDateString())->unique()->values()->all()
        );
        $this->assertDatabaseCount('attendance_punches', 2);
    }

    public function test_clock_in_outside_window_is_rejected(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-20 21:10:00', 'Indian/Antananarivo'));
        $this->configureWorkplace();
        $user = $this->employee();

        $this->actingAs($user)
            ->from('/attendance')
            ->post('/attendance/punch', $this->payload())
            ->assertRedirect('/attendance')
            ->assertSessionHasErrors('punch');

        $this->assertDatabaseCount('attendance_punches', 0);
    }

    public function test_clock_in_outside_geofence_is_rejected(): void
    {
        $this->freezeMorning();
        $this->configureWorkplace();
        $user = $this->employee();

        $this->actingAs($user)
            ->from('/attendance')
            ->post('/attendance/punch', $this->payload(latitude: self::LAT + 1))
            ->assertSessionHasErrors('punch');

        $this->assertDatabaseCount('attendance_punches', 0);
    }

    public function test_clock_in_beyond_configured_radius_is_rejected(): void
    {
        $this->freezeMorning();
        $this->configureWorkplace(50);
        $user = $this->employee();

        $this->actingAs($user)
            ->from('/attendance')
            ->post('/attendance/punch', $this->payload(latitude: self::LAT + 0.0008))
            ->assertSessionHasErrors('punch');

        $this->assertDatabaseCount('attendance_punches', 0);
    }

    public function test_clock_in_inside_configured_radius_is_accepted(): void
    {
        $this->freezeMorning();
        $this->configureWorkplace(150);
        $user = $this->employee();

        $this->actingAs($user)
            ->post('/attendance/punch', $this->payload(latitude: self::LAT + 0.0004))
            ->assertSessionHasNoErrors();

        $this->assertDatabaseCount('attendance_punches', 1);
    }

    public function test_double_clock_in_is_rejected(): void
    {
        $this->freezeMorning();
        $this->configureWorkplace();
        $user = $this->employee();

        $this->actingAs($user)->post('/attendance/punch', $this->payload())->assertSessionHasNoErrors();
        $this->actingAs($user)
            ->from('/attendance')
            ->post('/attendance/punch', $this->payload())
            ->assertSessionHasErrors('punch');

        $this->assertDatabaseCount('attendance_punches', 1);
    }

    public function test_clock_out_without_clock_in_is_rejected(): void
    {
        $this->freezeMorning();
        $this->configureWorkplace();
        $user = $this->employee();

        $this->actingAs($user)
            ->from('/attendance')
            ->post('/attendance/punch', $this->payload(type: 'out'))
            ->assertSessionHasErrors('punch');
    }

    public function test_clock_out_updates_work_entry_hours(): void
    {
        $this->freezeMorning();
        $this->configureWorkplace();
        $user = $this->employee();

        $this->actingAs($user)->post('/attendance/punch', $this->payload())->assertSessionHasNoErrors();

        Carbon::setTestNow(Carbon::parse('2026-09-20 12:00:00', 'Indian/Antananarivo'));
        $this->actingAs($user)
            ->post('/attendance/punch', $this->payload(type: 'out'))
            ->assertSessionHasNoErrors();

        $entry = WorkEntry::query()->where('user_id', $user->id)->first();
        $this->assertNotNull($entry);
        $this->assertEquals(4.0, (float) $entry->morning_hours);
        $this->assertEquals(4.0, (float) $entry->hours);
    }

    private function freezeMorning(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-20 08:00:00', 'Indian/Antananarivo'));
    }

    private function configureWorkplace(int $radius = 150): void
    {
        CompanySetting::query()->create([
            'company_name' => 'Test Co',
            'attendance_timezone' => 'Indian/Antananarivo',
            'attendance_morning_start' => '06:00',
            'attendance_morning_end' => '12:30',
            'attendance_afternoon_start' => '12:00',
            'attendance_afternoon_end' => '20:00',
            'attendance_latitude' => self::LAT,
            'attendance_longitude' => self::LNG,
            'attendance_radius_m' => $radius,
        ]);
    }

    private function employee(): User
    {
        return User::query()->create([
            'first_name' => 'Jean',
            'last_name' => 'Dupont',
            'email' => 'jean.dupont@example.com',
            'password' => 'password',
            'position' => 'Chauffeur',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(string $slot = 'morning', string $type = 'in', ?float $latitude = null, ?float $longitude = null): array
    {
        return [
            'slot' => $slot,
            'type' => $type,
            'latitude' => $latitude ?? self::LAT,
            'longitude' => $longitude ?? self::LNG,
            'accuracy' => 12,
        ];
    }
}
