<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Inbox\Inbox;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function read(Request $request, Inbox $inbox, int $id): RedirectResponse
    {
        $inbox->markNotification($id, 'admin');

        $to = $request->query('to');
        if (is_string($to) && str_starts_with($to, '/') && ! str_starts_with($to, '//')) {
            return redirect($to);
        }

        return back();
    }

    public function readAll(Inbox $inbox): RedirectResponse
    {
        $inbox->markAllNotifications('admin');

        return back();
    }

    public function destroy(Inbox $inbox, int $id): JsonResponse|RedirectResponse
    {
        $inbox->deleteNotification($id, 'admin');

        return $this->deletedResponse();
    }

    public function destroyAll(Inbox $inbox): JsonResponse|RedirectResponse
    {
        $inbox->deleteAllNotifications('admin');

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
