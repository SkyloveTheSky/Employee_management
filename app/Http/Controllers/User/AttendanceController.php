<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Services\Attendance\PunchRecorder;
use App\Services\Attendance\PunchRejectedException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    public function index(Request $request, PunchRecorder $recorder): Response
    {
        return Inertia::render('Attendance/Today', $recorder->todayState($request->user()));
    }

    public function punch(Request $request, PunchRecorder $recorder): RedirectResponse
    {
        $validated = $request->validate([
            'slot' => ['required', 'in:morning,afternoon'],
            'type' => ['required', 'in:in,out'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'accuracy' => ['required', 'numeric', 'min:0', 'max:5000'],
        ]);

        try {
            $recorder->punch($request->user(), $validated, $request);
        } catch (PunchRejectedException $e) {
            return back()->withErrors(['punch' => $e->getMessage()]);
        }

        return back()->with('success', $validated['type'] === 'in' ? __('attendance.in_saved') : __('attendance.out_saved'));
    }
}
