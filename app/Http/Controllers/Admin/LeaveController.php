<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
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
        $admin = Admin::findOrFail(session('admin_id'));
        $status = (string) $request->input('status', 'all');
        if (! in_array($status, ['all', 'pending', 'approved', 'rejected'], true)) {
            $status = 'all';
        }

        $query = LeaveRequest::query()
            ->with('user:id,first_name,last_name,position')
            ->orderByRaw("case when status = 'pending' then 0 when status = 'approved' then 1 else 2 end")
            ->orderByDesc('created_at');

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $leaves = $query->get()->map(fn (LeaveRequest $leave) => $leave->toListArray())->values();

        return Inertia::render('Admin/Leaves/Index', [
            'admin' => $admin,
            'leaves' => $leaves,
            'filters' => ['status' => $status],
            'pending_count' => LeaveRequest::query()->where('status', LeaveRequest::STATUS_PENDING)->count(),
        ]);
    }

    public function update(Request $request, LeaveRequest $leave, LeaveService $leaves): RedirectResponse
    {
        $admin = Admin::findOrFail(session('admin_id'));
        $validated = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'review_note' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $leaves->review($leave, $admin, $validated['status'], $validated['review_note'] ?? null);
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        $message = $validated['status'] === LeaveRequest::STATUS_APPROVED
            ? 'Congé validé.'
            : 'Congé refusé.';

        return back()->with('success', $message);
    }
}
