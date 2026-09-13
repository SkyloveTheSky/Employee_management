<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Inbox\Inbox;
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
}
