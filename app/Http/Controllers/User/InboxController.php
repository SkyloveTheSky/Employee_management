<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\InboxMessage;
use App\Services\Inbox\Inbox;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class InboxController extends Controller
{
    public function live(Request $request, Inbox $inbox): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        $payload = [
            'inbox' => $inbox->payload($request),
        ];

        if ($request->boolean('thread') && $user) {
            $payload['messages'] = $inbox->threadMessages(
                $user->id,
                'messages.attachments',
                true,
                'user',
            );
        }

        return response()->json($payload);
    }

    public function index(Request $request, Inbox $inbox): Response
    {
        $user = $request->user();

        return Inertia::render('Messages/Index', [
            'messages' => $user
                ? $inbox->threadMessages($user->id, 'messages.attachments', true, 'user')
                : [],
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

    public function destroy(Request $request, Inbox $inbox, int $id): JsonResponse|RedirectResponse
    {
        abort_unless($inbox->ready(), 503, 'Messagerie indisponible : lancez les migrations.');

        $message = InboxMessage::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);
        $inbox->deleteMessage($message);

        return $this->deletedResponse();
    }

    public function destroyThread(Request $request, Inbox $inbox): JsonResponse|RedirectResponse
    {
        abort_unless($inbox->ready(), 503, 'Messagerie indisponible : lancez les migrations.');

        $inbox->deleteThread($request->user()->id);

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
