<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\InboxMessage;
use App\Models\User;
use App\Services\Inbox\Inbox;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class InboxController extends Controller
{
    public function index(Inbox $inbox): Response
    {
        $admin = Admin::findOrFail(session('admin_id'));
        $employees = User::query()
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name', 'position', 'photo_path']);

        $latest = collect();
        $unread = collect();

        if ($inbox->ready()) {
            $latestIds = InboxMessage::query()
                ->selectRaw('max(id) as id')
                ->groupBy('user_id')
                ->pluck('id');

            $latest = InboxMessage::query()
                ->whereIn('id', $latestIds)
                ->get()
                ->keyBy('user_id');

            $unread = InboxMessage::query()
                ->where('author', 'user')
                ->whereNull('read_at')
                ->selectRaw('user_id, count(*) as total')
                ->groupBy('user_id')
                ->pluck('total', 'user_id');
        }

        $threads = $employees->map(function (User $user) use ($latest, $unread) {
            $last = $latest->get($user->id);

            return [
                'id' => $user->id,
                'name' => trim($user->first_name.' '.$user->last_name),
                'position' => $user->position,
                'photo_path' => $user->photo_path,
                'last_body' => $last
                    ? (trim((string) $last->body) !== '' ? $last->body : 'Pièce jointe')
                    : null,
                'last_at' => $last?->created_at?->toIso8601String(),
                'last_author' => $last?->author,
                'unread' => (int) ($unread[$user->id] ?? 0),
            ];
        })->sortByDesc(function (array $thread) {
            return [$thread['unread'] > 0 ? 1 : 0, $thread['last_at'] ?? ''];
        })->values();

        return Inertia::render('Admin/Messages/Index', [
            'admin' => $admin,
            'threads' => $threads,
        ]);
    }

    public function show(Inbox $inbox, int $id): Response
    {
        $admin = Admin::findOrFail(session('admin_id'));
        $employee = User::query()->findOrFail($id);
        $messages = [];

        if ($inbox->ready()) {
            $inbox->markThreadReadForAdmin($employee->id);
            $messages = InboxMessage::query()
                ->where('user_id', $employee->id)
                ->orderBy('id')
                ->get()
                ->map(fn (InboxMessage $message) => $inbox->present($message, 'admin.messages.attachments'))
                ->values();
        }

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
}
