<?php

namespace App\Services\Attendance;

use App\Models\AttendancePunch;
use App\Models\CompanySetting;
use App\Models\User;
use App\Models\WorkEntry;
use App\Services\Inbox\Inbox;
use App\Services\Leave\LeaveCalendar;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class PunchRecorder
{
    /**
     * @return array{
     *     today: string,
     *     now: string,
     *     timezone: string,
     *     workplace_ready: bool,
     *     radius_m: int,
     *     slots: array<string, array<string, mixed>>
     * }
     */
    public function todayState(User $user): array
    {
        $settings = CompanySetting::query()->first();
        $tz = CompanySetting::attendanceTimezone($settings);
        $now = CompanySetting::attendanceNow($settings);
        $today = $now->toDateString();
        $windows = CompanySetting::attendanceWindows($settings);
        $workplace = CompanySetting::attendanceWorkplace($settings);
        $radius = CompanySetting::attendanceRadius($settings);

        $punches = Schema::hasTable('attendance_punches')
            ? AttendancePunch::query()
                ->where('user_id', $user->id)
                ->whereDate('date', $today)
                ->orderBy('punched_at')
                ->get()
            : collect();

        $slots = [];
        foreach (['morning', 'afternoon'] as $slot) {
            $label = __('attendance.'.$slot);
            $window = $windows[$slot];
            $in = $punches->first(fn (AttendancePunch $punch) => $punch->slot === $slot && $punch->type === 'in');
            $out = $punches->first(fn (AttendancePunch $punch) => $punch->slot === $slot && $punch->type === 'out');
            $inWindow = $this->isInWindow($now, $window['start'], $window['end']);
            $leaveType = app(LeaveCalendar::class)->slotType($user->id, $today, $slot);

            $canIn = false;
            $canOut = false;
            $reason = null;

            if ($leaveType) {
                $reason = app(LeaveCalendar::class)->slotReason($leaveType);
            } elseif (! $workplace) {
                $reason = __('attendance.workplace_missing');
            } elseif ($in && $out) {
                $reason = __('attendance.slot_done');
            } elseif (! $inWindow) {
                $reason = $this->windowReason($now, $window['start'], $window['end']);
            } elseif (! $in) {
                $canIn = true;
            } else {
                $canOut = true;
            }

            $slots[$slot] = [
                'key' => $slot,
                'label' => $label,
                'start' => $window['start'],
                'end' => $window['end'],
                'in' => $in ? $this->publicPunch($in, $tz) : null,
                'out' => $out ? $this->publicPunch($out, $tz) : null,
                'can_in' => $canIn,
                'can_out' => $canOut,
                'reason' => $reason,
            ];
        }

        return [
            'today' => $today,
            'now' => $now->format('H:i'),
            'timezone' => $tz,
            'workplace_ready' => $workplace !== null,
            'radius_m' => $radius,
            'slots' => $slots,
        ];
    }

    /**
     * @param  array{slot: string, type: string, latitude: float, longitude: float, accuracy?: float|null}  $payload
     */
    public function punch(User $user, array $payload, Request $request): AttendancePunch
    {
        if (! Schema::hasTable('attendance_punches')) {
            throw new PunchRejectedException(__('attendance.unavailable'));
        }

        $settings = CompanySetting::query()->first();
        $now = CompanySetting::attendanceNow($settings);
        $today = $now->toDateString();
        $slot = $payload['slot'];
        $type = $payload['type'];
        $windows = CompanySetting::attendanceWindows($settings);
        $window = $windows[$slot] ?? null;
        $workplace = CompanySetting::attendanceWorkplace($settings);
        $radius = CompanySetting::attendanceRadius($settings);

        if (! $window) {
            throw ValidationException::withMessages(['slot' => __('attendance.invalid_slot')]);
        }

        if (! $workplace) {
            throw new PunchRejectedException(__('attendance.workplace_missing'));
        }

        $leaveType = app(LeaveCalendar::class)->slotType($user->id, $today, $slot);
        if ($leaveType) {
            throw new PunchRejectedException(app(LeaveCalendar::class)->slotReason($leaveType) ?? __('attendance.leave_approved'));
        }

        if (! $this->isInWindow($now, $window['start'], $window['end'])) {
            throw new PunchRejectedException($this->windowReason($now, $window['start'], $window['end']));
        }

        $existingIn = AttendancePunch::query()
            ->where('user_id', $user->id)
            ->whereDate('date', $today)
            ->where('slot', $slot)
            ->where('type', 'in')
            ->first();
        $existingOut = AttendancePunch::query()
            ->where('user_id', $user->id)
            ->whereDate('date', $today)
            ->where('slot', $slot)
            ->where('type', 'out')
            ->first();

        if ($type === 'in' && $existingIn) {
            throw new PunchRejectedException(__('attendance.already_in'));
        }
        if ($type === 'out' && ! $existingIn) {
            throw new PunchRejectedException(__('attendance.need_in'));
        }
        if ($type === 'out' && $existingOut) {
            throw new PunchRejectedException(__('attendance.already_out'));
        }
        if ($type === 'out' && $existingIn && $now->lte($existingIn->punched_at)) {
            throw new PunchRejectedException(__('attendance.out_after_in'));
        }

        $accuracy = isset($payload['accuracy']) ? (float) $payload['accuracy'] : null;
        if ($accuracy === null || $accuracy < 0) {
            throw new PunchRejectedException(__('attendance.gps_missing'));
        }
        if ($accuracy > $radius) {
            throw new PunchRejectedException(__('attendance.gps_weak'));
        }

        $distance = $this->haversineMeters(
            (float) $payload['latitude'],
            (float) $payload['longitude'],
            $workplace['latitude'],
            $workplace['longitude']
        );
        if ($distance > $radius) {
            throw new PunchRejectedException(__('attendance.outside_zone', ['radius' => $radius]));
        }

        $punch = AttendancePunch::query()->create([
            'user_id' => $user->id,
            'date' => $today,
            'slot' => $slot,
            'type' => $type,
            'punched_at' => $now->copy()->utc(),
            'latitude' => round((float) $payload['latitude'], 7),
            'longitude' => round((float) $payload['longitude'], 7),
            'accuracy' => round($accuracy, 2),
            'distance_m' => round($distance, 1),
            'ip' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 1000),
        ]);

        if ($type === 'out') {
            $this->syncHours($user->id, $today, $slot, $existingIn, $punch);
        }

        $this->notifyAdmins($user, $punch, $slot, $type, $now);

        return $punch;
    }

    public function isInWindow(Carbon $now, string $start, string $end): bool
    {
        $minutes = $now->hour * 60 + $now->minute;
        $from = $this->clockToMinutes($start);
        $to = $this->clockToMinutes($end);

        return $minutes >= $from && $minutes <= $to;
    }

    public function haversineMeters(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earth = 6371000.0;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return $earth * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    private function windowReason(Carbon $now, string $start, string $end): string
    {
        $minutes = $now->hour * 60 + $now->minute;
        if ($minutes < $this->clockToMinutes($start)) {
            return __('attendance.too_early', ['start' => $start]);
        }

        return __('attendance.too_late', ['end' => $end]);
    }

    private function clockToMinutes(string $clock): int
    {
        [$hour, $minute] = array_map('intval', explode(':', CompanySetting::normalizeClock($clock, '00:00')));

        return ($hour * 60) + $minute;
    }

    /**
     * @return array{type: string, at: string, distance_m: float}
     */
    private function publicPunch(AttendancePunch $punch, string $tz): array
    {
        return [
            'type' => $punch->type,
            'at' => $punch->punched_at->copy()->timezone($tz)->format('H:i'),
            'distance_m' => (float) $punch->distance_m,
        ];
    }

    private function syncHours(int $userId, string $date, string $slot, AttendancePunch $in, AttendancePunch $out): void
    {
        if (! Schema::hasTable('work_entries')) {
            return;
        }

        $seconds = abs($out->punched_at->diffInSeconds($in->punched_at));
        $hours = min(12, round($seconds / 3600, 2));

        $entry = WorkEntry::query()->firstOrNew([
            'user_id' => $userId,
            'date' => $date,
        ]);

        if ($slot === 'morning') {
            $entry->morning_hours = $hours;
        } else {
            $entry->afternoon_hours = $hours;
        }

        $entry->hours = round((float) ($entry->morning_hours ?: 0) + (float) ($entry->afternoon_hours ?: 0), 2);
        $entry->save();
    }

    private function notifyAdmins(User $user, AttendancePunch $punch, string $slot, string $type, Carbon $now): void
    {
        $name = trim($user->first_name.' '.$user->last_name) ?: 'Un employé';
        $when = $now->format('H:i');
        $periodLabel = $slot === 'afternoon' ? 'après-midi' : 'matin';
        $action = $type === 'out' ? 'le départ' : 'l’arrivée';

        app(Inbox::class)->notifyAdmins(
            'attendance',
            'Présence · '.($type === 'out' ? 'Départ' : 'Arrivée'),
            $name.' a pointé '.$action.' ('.$periodLabel.') à '.$when.'.',
            route('admin.overtime.index', ['period' => $now->format('Y-m')], false),
            'attendance:punch:'.$punch->id,
        );
    }
}
