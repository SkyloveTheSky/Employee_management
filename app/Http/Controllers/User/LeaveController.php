<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\LeaveRequest;
use App\Services\Leave\LeaveService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LeaveController extends Controller
{
    public function index(Request $request): Response
    {
        $leaves = LeaveRequest::query()
            ->where('user_id', $request->user()->id)
            ->orderByRaw("case when status = 'pending' then 0 when status = 'approved' then 1 else 2 end")
            ->orderByDesc('start_date')
            ->orderByDesc('id')
            ->get()
            ->map(fn (LeaveRequest $leave) => $leave->toListArray())
            ->values();

        return Inertia::render('Leaves/Index', [
            'leaves' => $leaves,
        ]);
    }

    public function store(Request $request, LeaveService $leaves): RedirectResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:paid,unpaid,sick'],
            'start_date' => ['required', 'date_format:Y-m-d'],
            'end_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'start_slot' => ['required', 'in:morning,afternoon'],
            'end_slot' => ['required', 'in:morning,afternoon'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $leaves->request($request->user(), $validated);

        return back()->with('success', __('leave.sent'));
    }

    public function destroy(Request $request, LeaveRequest $leave, LeaveService $leaves): RedirectResponse
    {
        try {
            $leaves->cancel($leave, $request->user());
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', __('leave.cancelled'));
    }
}
