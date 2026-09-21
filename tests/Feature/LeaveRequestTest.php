<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\CompanySetting;
use App\Models\LeaveRequest;
use App\Models\Payroll;
use App\Models\User;
use App\Services\Leave\LeaveCalendar;
use App\Services\Payroll\PayrollCalculator;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LeaveRequestTest extends TestCase
{
    use RefreshDatabase;

    private const LAT = -18.8792;

    private const LNG = 47.5079;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_employee_can_request_leave_and_notify_admins(): void
    {
        $user = $this->employee();

        $this->actingAs($user)
            ->from('/leaves')
            ->post('/leaves', [
                'type' => 'paid',
                'start_date' => '2026-09-21',
                'end_date' => '2026-09-23',
                'start_slot' => 'morning',
                'end_slot' => 'afternoon',
                'reason' => 'Repos',
            ])
            ->assertRedirect('/leaves')
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('leave_requests', [
            'user_id' => $user->id,
            'type' => 'paid',
            'status' => 'pending',
            'days' => 3.0,
        ]);
        $this->assertDatabaseHas('platform_notifications', [
            'audience' => 'admin',
            'type' => 'leave',
            'title' => 'Congé · Demande',
        ]);
    }

    public function test_overlapping_pending_or_approved_leave_is_rejected(): void
    {
        $user = $this->employee();
        $this->actingAs($user)->post('/leaves', $this->payload())->assertSessionHasNoErrors();

        $this->actingAs($user)
            ->from('/leaves')
            ->post('/leaves', $this->payload([
                'start_date' => '2026-09-23',
                'end_date' => '2026-09-24',
            ]))
            ->assertRedirect('/leaves')
            ->assertSessionHasErrors('start_date');

        $this->assertDatabaseCount('leave_requests', 1);
    }

    public function test_employee_can_cancel_pending_leave(): void
    {
        $user = $this->employee();
        $this->actingAs($user)->post('/leaves', $this->payload())->assertSessionHasNoErrors();
        $leave = LeaveRequest::query()->first();

        $this->actingAs($user)
            ->from('/leaves')
            ->delete('/leaves/'.$leave->id)
            ->assertRedirect('/leaves')
            ->assertSessionHasNoErrors();

        $this->assertDatabaseCount('leave_requests', 0);
    }

    public function test_admin_can_approve_leave_and_notify_employee(): void
    {
        $user = $this->employee();
        $admin = $this->admin();
        $this->actingAs($user)->post('/leaves', $this->payload())->assertSessionHasNoErrors();
        $leave = LeaveRequest::query()->first();

        $this->withSession(['admin_logged_in' => true, 'admin_id' => $admin->id])
            ->from('/admin/leaves')
            ->patch('/admin/leaves/'.$leave->id, ['status' => 'approved'])
            ->assertRedirect('/admin/leaves')
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('leave_requests', [
            'id' => $leave->id,
            'status' => 'approved',
            'reviewed_by_admin_id' => $admin->id,
        ]);
        $this->assertDatabaseHas('platform_notifications', [
            'audience' => 'user',
            'user_id' => $user->id,
            'type' => 'leave',
            'title' => 'Congé · Validé',
        ]);
    }

    public function test_employee_can_view_leaves_page(): void
    {
        $user = $this->employee();

        $this->actingAs($user)
            ->get('/leaves')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Leaves/Index'));
    }

    public function test_punch_is_rejected_on_approved_leave(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-20 08:00:00', 'Indian/Antananarivo'));
        $this->configureWorkplace();
        $user = $this->employee();
        $leave = LeaveRequest::query()->create([
            'user_id' => $user->id,
            'type' => 'paid',
            'start_date' => '2026-09-20',
            'end_date' => '2026-09-20',
            'start_slot' => 'morning',
            'end_slot' => 'morning',
            'days' => 0.5,
            'status' => 'approved',
        ]);

        $this->actingAs($user)
            ->from('/attendance')
            ->post('/attendance/punch', [
                'slot' => 'morning',
                'type' => 'in',
                'latitude' => self::LAT,
                'longitude' => self::LNG,
                'accuracy' => 12,
            ])
            ->assertRedirect('/attendance')
            ->assertSessionHasErrors('punch');

        $this->actingAs($user)
            ->get('/attendance')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('slots.morning.can_in', false)
                ->where('slots.morning.reason', 'Congé payé.')
            );

        $this->assertNotNull($leave);
        $this->assertDatabaseCount('attendance_punches', 0);
    }

    public function test_unpaid_leave_deducts_salary_over_thirty(): void
    {
        $user = $this->employee(['salary_base' => 300000]);
        LeaveRequest::query()->create([
            'user_id' => $user->id,
            'type' => 'unpaid',
            'start_date' => '2026-09-10',
            'end_date' => '2026-09-11',
            'start_slot' => 'morning',
            'end_slot' => 'afternoon',
            'days' => 2,
            'status' => 'approved',
        ]);

        $amounts = PayrollCalculator::computeForPeriod($user, 2026, 9);

        $this->assertSame(2.0, $amounts['unpaid_leave_days']);
        $this->assertEquals(20000.0, $amounts['unpaid_leave_amount']);
        $this->assertEquals(280000.0, $amounts['gross_salary']);
    }

    public function test_paid_leave_does_not_deduct_salary(): void
    {
        $user = $this->employee(['salary_base' => 300000]);
        LeaveRequest::query()->create([
            'user_id' => $user->id,
            'type' => 'paid',
            'start_date' => '2026-09-10',
            'end_date' => '2026-09-11',
            'start_slot' => 'morning',
            'end_slot' => 'afternoon',
            'days' => 2,
            'status' => 'approved',
        ]);

        $amounts = PayrollCalculator::computeForPeriod($user, 2026, 9);

        $this->assertSame(0.0, $amounts['unpaid_leave_days']);
        $this->assertEquals(0.0, $amounts['unpaid_leave_amount']);
        $this->assertEquals(300000.0, $amounts['gross_salary']);
    }

    public function test_sick_leave_does_not_deduct_salary(): void
    {
        $user = $this->employee(['salary_base' => 300000]);
        LeaveRequest::query()->create([
            'user_id' => $user->id,
            'type' => 'sick',
            'start_date' => '2026-09-10',
            'end_date' => '2026-09-11',
            'start_slot' => 'morning',
            'end_slot' => 'afternoon',
            'days' => 2,
            'status' => 'approved',
        ]);

        $amounts = PayrollCalculator::computeForPeriod($user, 2026, 9);

        $this->assertSame(0.0, $amounts['unpaid_leave_days']);
        $this->assertEquals(0.0, $amounts['unpaid_leave_amount']);
        $this->assertEquals(300000.0, $amounts['gross_salary']);
    }

    public function test_employee_can_request_sick_leave(): void
    {
        $user = $this->employee();

        $this->actingAs($user)
            ->from('/leaves')
            ->post('/leaves', $this->payload(['type' => 'sick', 'reason' => 'Fièvre']))
            ->assertRedirect('/leaves')
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('leave_requests', [
            'user_id' => $user->id,
            'type' => 'sick',
            'status' => 'pending',
        ]);
    }

    public function test_punch_is_rejected_on_approved_sick_leave(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-20 08:00:00', 'Indian/Antananarivo'));
        $this->configureWorkplace();
        $user = $this->employee();
        LeaveRequest::query()->create([
            'user_id' => $user->id,
            'type' => 'sick',
            'start_date' => '2026-09-20',
            'end_date' => '2026-09-20',
            'start_slot' => 'morning',
            'end_slot' => 'morning',
            'days' => 0.5,
            'status' => 'approved',
        ]);

        $this->actingAs($user)
            ->from('/attendance')
            ->post('/attendance/punch', [
                'slot' => 'morning',
                'type' => 'in',
                'latitude' => self::LAT,
                'longitude' => self::LNG,
                'accuracy' => 12,
            ])
            ->assertRedirect('/attendance')
            ->assertSessionHasErrors('punch');

        $this->actingAs($user)
            ->get('/attendance')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('slots.morning.can_in', false)
                ->where('slots.morning.reason', 'Repos maladie.')
            );
    }

    public function test_unpaid_leave_split_across_months_counts_september_days(): void
    {
        $user = $this->employee();
        LeaveRequest::query()->create([
            'user_id' => $user->id,
            'type' => 'unpaid',
            'start_date' => '2026-09-28',
            'end_date' => '2026-10-03',
            'start_slot' => 'morning',
            'end_slot' => 'afternoon',
            'days' => 6,
            'status' => 'approved',
        ]);

        $calendar = app(LeaveCalendar::class);

        $this->assertSame(3.0, $calendar->unpaidDaysInMonth($user->id, 2026, 9));
        $this->assertSame(3.0, $calendar->unpaidDaysInMonth($user->id, 2026, 10));
    }

    public function test_payslip_lists_approved_leaves(): void
    {
        $user = $this->employee(['salary_base' => 300000]);
        LeaveRequest::query()->create([
            'user_id' => $user->id,
            'type' => 'paid',
            'start_date' => '2026-09-22',
            'end_date' => '2026-09-22',
            'start_slot' => 'morning',
            'end_slot' => 'afternoon',
            'days' => 1,
            'status' => 'approved',
        ]);
        LeaveRequest::query()->create([
            'user_id' => $user->id,
            'type' => 'unpaid',
            'start_date' => '2026-09-10',
            'end_date' => '2026-09-11',
            'start_slot' => 'morning',
            'end_slot' => 'afternoon',
            'days' => 2,
            'status' => 'approved',
        ]);

        $payroll = new Payroll([
            'user_id' => $user->id,
            'period_month' => 9,
            'period_year' => 2026,
            'base_salary' => 300000,
            'unpaid_leave_days' => 2,
            'unpaid_leave_amount' => 20000,
            'prime_amount' => 0,
            'gross_salary' => 280000,
            'cnaps_rate' => 1,
            'assurance_rate' => 1,
            'cnaps_amount' => 0,
            'assurance_amount' => 0,
            'irsa_amount' => 0,
            'total_retenu' => 0,
            'net_to_pay' => 280000,
            'payment_status' => 'unpaid',
        ]);
        $leaves = app(LeaveCalendar::class)->approvedDayTotalsInMonth($user->id, 2026, 9);

        $html = view('admin.payrolls.payslip', [
            'payroll' => $payroll,
            'employee' => $user,
            'settings' => null,
            'logoDataUri' => null,
            'lines' => [
                ['numero' => 1, 'designation' => 'Salaire de base', 'base' => 300000, 'taux' => null, 'gain' => 300000, 'retenu' => 0],
                ['numero' => 2, 'designation' => 'Congé non payé (2 j)', 'base' => 300000, 'taux' => null, 'gain' => 0, 'retenu' => 20000],
            ],
            'leaves' => $leaves,
        ])->render();

        $this->assertStringContainsString('CONGÉS DU MOIS', $html);
        $this->assertStringContainsString('Congé payé', $html);
        $this->assertStringContainsString('Congé non payé', $html);
        $this->assertStringContainsString('Repos maladie', $html);
        $this->assertMatchesRegularExpression('/Congé payé:<\/span>\s*1/', $html);
        $this->assertMatchesRegularExpression('/Congé non payé:<\/span>\s*2/', $html);
        $this->assertMatchesRegularExpression('/Repos maladie:<\/span>\s*0/', $html);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function employee(array $overrides = []): User
    {
        return User::query()->create(array_merge([
            'first_name' => 'Jean',
            'last_name' => 'Dupont',
            'email' => 'jean.dupont@example.com',
            'password' => 'password',
            'position' => 'Chauffeur',
            'salary_base' => 300000,
        ], $overrides));
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

    private function configureWorkplace(): void
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
            'attendance_radius_m' => 150,
        ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'type' => 'unpaid',
            'start_date' => '2026-09-21',
            'end_date' => '2026-09-23',
            'start_slot' => 'morning',
            'end_slot' => 'afternoon',
            'reason' => 'Absence',
        ], $overrides);
    }
}
