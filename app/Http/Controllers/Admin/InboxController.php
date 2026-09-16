<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\InboxMessage;
use App\Models\User;
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
        $payload = [
            'inbox' => $inbox->payload($request),
        ];

        if ($request->boolean('threads')) {
            $payload['threads'] = $inbox->adminThreads();
        }

        $userId = $request->integer('user_id');
        if ($userId > 0) {
            User::query()->findOrFail($userId);
            $payload['messages'] = $inbox->threadMessages(
                $userId,
                'admin.messages.attachments',
                true,
                'admin',
            );
        }

        return response()->json($payload);
    }

    public function index(Inbox $inbox): Response
    {
        $admin = Admin::findOrFail(session('admin_id'));

        return Inertia::render('Admin/Messages/Index', [
            'admin' => $admin,
            'threads' => $inbox->adminThreads(),
        ]);
    }

    public function show(Inbox $inbox, int $id): Response
    {
        $admin = Admin::findOrFail(session('admin_id'));
        $employee = User::query()->findOrFail($id);
        $messages = $inbox->threadMessages($employee->id, 'admin.messages.attachments', true, 'admin');

        return Inertia::render('Admin/Messages/Show', [
            'admin' => $admin,
            'employee' => [
                'id' => $employee->id,
                'name' => trim($employee->first_name.' '.$employee->last_name),
                'position' => $employee->position,
                'photo_path' => $employee->photo_path,
            ],
            'messages' => $messages,
        ]);
    }

    public function store(Request $request, Inbox $inbox, int $id): RedirectResponse
    {
        abort_unless($inbox->ready(), 503, 'Messagerie indisponible : lancez les migrations.');

        $employee = User::query()->findOrFail($id);
        [$body, $files] = $inbox->validateSend($request);
        $inbox->sendFromAdmin($employee->id, (int) session('admin_id'), $body, $files);

        return back();
    }

    public function attachment(Inbox $inbox, int $id, int $index): SymfonyResponse
    {
        abort_unless($inbox->ready(), 503, 'Messagerie indisponible : lancez les migrations.');

        $message = InboxMessage::query()->findOrFail($id);

        return $inbox->download($message, $index);
    }

    public function destroy(Inbox $inbox, int $id): JsonResponse|RedirectResponse
    {
        abort_unless($inbox->ready(), 503, 'Messagerie indisponible : lancez les migrations.');

        $message = InboxMessage::query()->findOrFail($id);
        $inbox->deleteMessage($message);

        return $this->deletedResponse();
    }

    public function destroyThread(Inbox $inbox, int $id): JsonResponse|RedirectResponse
    {
        abort_unless($inbox->ready(), 503, 'Messagerie indisponible : lancez les migrations.');

        User::query()->findOrFail($id);
        $inbox->deleteThread($id);

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
