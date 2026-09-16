<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Services\Inbox\Inbox;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function read(Request $request, Inbox $inbox, int $id): RedirectResponse
    {
        $inbox->markNotification($id, 'user', $request->user()->id);

        $to = $request->query('to');
        if (is_string($to) && str_starts_with($to, '/') && ! str_starts_with($to, '//')) {
            return redirect($to);
        }

        return back();
    }

    public function readAll(Request $request, Inbox $inbox): RedirectResponse
    {
        $inbox->markAllNotifications('user', $request->user()->id);

        return back();
    }

    public function destroy(Request $request, Inbox $inbox, int $id): JsonResponse|RedirectResponse
    {
        $inbox->deleteNotification($id, 'user', $request->user()->id);

        return $this->deletedResponse();
    }

    public function destroyAll(Request $request, Inbox $inbox): JsonResponse|RedirectResponse
    {
        $inbox->deleteAllNotifications('user', $request->user()->id);

        return $this->deletedResponse();
    }

    private function deletedResponse(): JsonResponse|RedirectResponse
    {
        if (request()->expectsJson()) {
            return response()->json(['ok' => true]);
        }

        return back();
    }
}
