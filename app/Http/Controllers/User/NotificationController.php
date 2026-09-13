<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Services\Inbox\Inbox;
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
}
