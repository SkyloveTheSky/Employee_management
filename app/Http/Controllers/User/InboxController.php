<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\InboxMessage;
use App\Services\Inbox\Inbox;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class InboxController extends Controller
{
    public function index(Request $request, Inbox $inbox): Response
    {
        $user = $request->user();
        $messages = [];

        if ($inbox->ready()) {
            $inbox->markThreadReadForUser($user->id);
            $messages = InboxMessage::query()
                ->where('user_id', $user->id)
                ->orderBy('id')
                ->get()
                ->map(fn (InboxMessage $message) => $inbox->present($message, 'messages.attachments'))
                ->values();
        }

        return Inertia::render('Messages/Index', [
            'messages' => $messages,
        ]);
    }

    public function store(Request $request, Inbox $inbox): RedirectResponse
    {
        abort_unless($inbox->ready(), 503, 'Messagerie indisponible : lancez les migrations.');

        [$body, $files] = $inbox->validateSend($request);
        $inbox->sendFromUser($request->user(), $body, $files);

        return back();
    }

    public function attachment(Request $request, Inbox $inbox, int $id, int $index): SymfonyResponse
    {
        abort_unless($inbox->ready(), 503, 'Messagerie indisponible : lancez les migrations.');

        $message = InboxMessage::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        return $inbox->download($message, $index);
    }
}
