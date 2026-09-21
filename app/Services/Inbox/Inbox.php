<?php

namespace App\Services\Inbox;

use App\Models\InboxMessage;
use App\Models\PlatformNotification;
use App\Models\User;
use App\Services\Agenda\AgendaReminder;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class Inbox
{
    public function ready(): bool
    {
        return Schema::hasTable('inbox_messages') && Schema::hasTable('platform_notifications');
    }

    public function payload(Request $request, bool $preview = true): array
    {
        $empty = [
            'role' => null,
            'unread_messages' => 0,
            'unread_notifications' => 0,
            'messages' => [],
            'notifications' => [],
            'messages_url' => null,
        ];

        if (! $this->ready()) {
            return $empty;
        }

        if (session('admin_logged_in') && session('admin_id')) {
            return $this->adminPayload($preview);
        }

        $user = $request->user();
        if ($user) {
            return $this->userPayload($user, $preview);
        }

        return $empty;
    }

    public function live(Request $request): array
    {
        $isAdmin = session('admin_logged_in') && session('admin_id');
        $preview = $request->boolean('preview');
        $threads = $isAdmin && $request->boolean('threads');
        $thread = ! $isAdmin && $request->boolean('thread');
        $userId = $isAdmin ? $request->integer('user_id') : 0;
        $since = (string) $request->query('since', '');
        $revision = $this->revision($request, $userId);

        if ($since !== '' && $since === $revision) {
            return [
                'unchanged' => true,
                'revision' => $revision,
            ];
        }

        $payload = [
            'revision' => $revision,
            'inbox' => $this->payload($request, $preview),
        ];

        if ($threads) {
            $payload['threads'] = $this->adminThreads();
        }

        if ($userId > 0) {
            User::query()->findOrFail($userId);
            $payload['messages'] = $this->threadMessages(
                $userId,
                'admin.messages.attachments',
                false,
                'admin',
            );
        }

        if ($thread && $request->user()) {
            $payload['messages'] = $this->threadMessages(
                $request->user()->id,
                'messages.attachments',
                false,
                'user',
            );
        }

        return $payload;
    }

    public function sendFromAdmin(int $userId, int $adminId, string $body, array $files = []): InboxMessage
    {
        $payload = [
            'user_id' => $userId,
            'admin_id' => $adminId,
            'author' => 'admin',
            'body' => $body,
        ];
        if (Schema::hasColumn('inbox_messages', 'attachments')) {
            $payload['attachments'] = $this->storeAttachments($userId, $files);
        }

        $message = InboxMessage::query()->create($payload);

        $this->notifyUser(
            $userId,
            'message',
            'Nouveau message de la RH',
            Str::limit($body !== '' ? $body : 'Pièce jointe', 140),
            route('messages.index', absolute: false),
        );

        return $message;
    }

    public function sendFromUser(User $user, string $body, array $files = []): InboxMessage
    {
        $payload = [
            'user_id' => $user->id,
            'admin_id' => null,
            'author' => 'user',
            'body' => $body,
        ];
        if (Schema::hasColumn('inbox_messages', 'attachments')) {
            $payload['attachments'] = $this->storeAttachments($user->id, $files);
        }

        $message = InboxMessage::query()->create($payload);

        $name = trim(($user->first_name ?? '').' '.($user->last_name ?? ''));
        $this->notifyAdmins(
            'message',
            'Message de '.$name,
            Str::limit($body !== '' ? $body : 'Pièce jointe', 140),
            route('admin.messages.show', $user->id, absolute: false),
        );

        return $message;
    }

    /**
     * @return array{0: string, 1: list<UploadedFile>}
     */
    public function validateSend(Request $request): array
    {
        $request->validate([
            'body' => ['nullable', 'string', 'max:2000'],
            'attachments' => ['nullable', 'array', 'max:5'],
            'attachments.*' => ['file', 'max:10240', 'mimes:jpg,jpeg,png,gif,webp,pdf,doc,docx,xls,xlsx,csv,txt,zip'],
        ]);

        $body = trim((string) $request->input('body', ''));
        $files = $request->file('attachments', []);
        if (! is_array($files)) {
            $files = $files ? [$files] : [];
        }
        $files = array_values(array_filter($files));

        if ($body === '' && $files === []) {
            throw ValidationException::withMessages([
                'body' => 'Écrivez un message ou joignez un fichier.',
            ]);
        }

        return [$body, $files];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function adminThreads(): array
    {
        $employees = User::query()
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name', 'position', 'photo_path']);

        $latest = collect();
        $unread = collect();

        if ($this->ready()) {
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

        return $employees->map(function (User $user) use ($latest, $unread) {
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
        })->values()->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function threadMessages(int $userId, string $downloadRoute, bool $markRead = false, ?string $reader = null): array
    {
        if (! $this->ready()) {
            return [];
        }

        if ($markRead && $reader === 'admin') {
            $this->markThreadReadForAdmin($userId);
        }

        if ($markRead && $reader === 'user') {
            $this->markThreadReadForUser($userId);
        }

        return InboxMessage::query()
            ->where('user_id', $userId)
            ->orderBy('id')
            ->get()
            ->map(fn (InboxMessage $message) => $this->present($message, $downloadRoute))
            ->values()
            ->all();
    }

    public function present(InboxMessage $message, string $downloadRoute): array
    {
        $files = [];
        foreach (array_values($message->attachments ?? []) as $index => $file) {
            $mime = (string) ($file['mime'] ?? '');
            $files[] = [
                'name' => $file['name'] ?? 'fichier',
                'size' => (int) ($file['size'] ?? 0),
                'preview' => str_starts_with($mime, 'image/'),
                'url' => route($downloadRoute, ['id' => $message->id, 'index' => $index], false),
            ];
        }

        return [
            'id' => $message->id,
            'author' => $message->author,
            'body' => $message->body,
            'at' => $message->created_at?->toIso8601String(),
            'attachments' => $files,
        ];
    }

    public function download(InboxMessage $message, int $index)
    {
        $file = ($message->attachments ?? [])[$index] ?? null;
        abort_unless(is_array($file) && ! empty($file['path']), 404);

        $disk = $this->disk();
        abort_unless($disk->exists($file['path']), 404);

        $name = $file['name'] ?? basename($file['path']);
        $mime = $file['mime'] ?? 'application/octet-stream';

        if (str_starts_with((string) $mime, 'image/')) {
            return $disk->response($file['path'], $name, [
                'Content-Type' => $mime,
            ], 'inline');
        }

        return $disk->download($file['path'], $name, [
            'Content-Type' => $mime,
        ]);
    }

    public function markThreadReadForAdmin(int $userId): void
    {
        if (! Schema::hasTable('inbox_messages')) {
            return;
        }

        InboxMessage::query()
            ->where('user_id', $userId)
            ->where('author', 'user')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    public function markThreadReadForUser(int $userId): void
    {
        if (! Schema::hasTable('inbox_messages')) {
            return;
        }

        InboxMessage::query()
            ->where('user_id', $userId)
            ->where('author', 'admin')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    public function notifyUser(int $userId, string $type, string $title, string $body, ?string $link = null): void
    {
        if (! Schema::hasTable('platform_notifications')) {
            return;
        }

        PlatformNotification::query()->create([
            'audience' => 'user',
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'link' => $link,
        ]);
    }

    public function notifyAdmins(string $type, string $title, string $body, ?string $link = null, ?string $dedupeKey = null): void
    {
        if (! Schema::hasTable('platform_notifications')) {
            return;
        }

        $payload = [
            'audience' => 'admin',
            'user_id' => null,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'link' => $link,
        ];

        if (Schema::hasColumn('platform_notifications', 'dedupe_key')) {
            if (is_string($dedupeKey) && $dedupeKey !== '') {
                $already = PlatformNotification::query()->where('dedupe_key', $dedupeKey)->exists();
                if ($already) {
                    return;
                }
                $payload['dedupe_key'] = $dedupeKey;
            }
        }

        PlatformNotification::query()->create($payload);
    }

    public function markNotification(int $id, string $audience, ?int $userId = null): void
    {
        $query = PlatformNotification::query()
            ->where('id', $id)
            ->where('audience', $audience);

        if ($audience === 'user') {
            $query->where('user_id', $userId);
        }

        $query->whereNull('read_at')->update(['read_at' => now()]);
    }

    public function markAllNotifications(string $audience, ?int $userId = null): void
    {
        $query = PlatformNotification::query()
            ->where('audience', $audience)
            ->whereNull('read_at');

        if ($audience === 'user') {
            $query->where('user_id', $userId);
        }

        $query->update(['read_at' => now()]);
    }

    public function deleteMessage(InboxMessage $message): void
    {
        $this->deleteAttachments($message);
        $message->delete();
    }

    public function deleteThread(int $userId): void
    {
        if (! Schema::hasTable('inbox_messages')) {
            return;
        }

        InboxMessage::query()
            ->where('user_id', $userId)
            ->get()
            ->each(fn (InboxMessage $message) => $this->deleteMessage($message));
    }

    public function deleteNotification(int $id, string $audience, ?int $userId = null): void
    {
        $query = PlatformNotification::query()
            ->where('id', $id)
            ->where('audience', $audience);

        if ($audience === 'user') {
            $query->where('user_id', $userId);
        }

        $query->delete();
    }

    public function deleteAllNotifications(string $audience, ?int $userId = null): void
    {
        $query = PlatformNotification::query()->where('audience', $audience);

        if ($audience === 'user') {
            $query->where('user_id', $userId);
        }

        $query->delete();
    }

    private function deleteAttachments(InboxMessage $message): void
    {
        foreach ($message->attachments ?? [] as $file) {
            $path = $file['path'] ?? null;
            if (is_string($path) && $path !== '' && $this->disk()->exists($path)) {
                $this->disk()->delete($path);
            }
        }
    }

    private function userPayload(User $user, bool $preview = true): array
    {
        $payload = [
            'role' => 'user',
            'unread_messages' => InboxMessage::query()
                ->where('user_id', $user->id)
                ->where('author', 'admin')
                ->whereNull('read_at')
                ->count(),
            'unread_notifications' => $this->unreadNotifications('user', $user->id),
            'messages_url' => route('messages.index'),
        ];

        if (! $preview) {
            return $payload;
        }

        $payload['messages'] = InboxMessage::query()
            ->where('user_id', $user->id)
            ->orderByDesc('id')
            ->limit(8)
            ->get()
            ->map(fn (InboxMessage $message) => [
                'id' => $message->id,
                'user_id' => $message->user_id,
                'preview' => $this->previewText($message),
                'from' => $message->author === 'admin' ? 'RH' : 'Vous',
                'at' => $message->created_at?->toIso8601String(),
                'unread' => $message->author === 'admin' && $message->read_at === null,
                'href' => route('messages.index'),
            ])
            ->values()
            ->all();
        $payload['notifications'] = $this->recentNotifications('user', $user->id);

        return $payload;
    }

    private function adminPayload(bool $preview = true): array
    {
        app(AgendaReminder::class)->notifyDueToday();

        $payload = [
            'role' => 'admin',
            'unread_messages' => InboxMessage::query()
                ->where('author', 'user')
                ->whereNull('read_at')
                ->count(),
            'unread_notifications' => $this->unreadNotifications('admin'),
            'messages_url' => route('admin.messages.index'),
        ];

        if (! $preview) {
            return $payload;
        }

        $latest = InboxMessage::query()
            ->with('user:id,first_name,last_name')
            ->orderByDesc('id')
            ->limit(40)
            ->get()
            ->unique('user_id')
            ->take(8)
            ->values();

        $payload['messages'] = $latest->map(function (InboxMessage $message) {
            $name = trim(($message->user->first_name ?? '').' '.($message->user->last_name ?? '')) ?: 'Employé';

            return [
                'id' => $message->id,
                'user_id' => $message->user_id,
                'preview' => $this->previewText($message),
                'from' => $name,
                'at' => $message->created_at?->toIso8601String(),
                'unread' => $message->author === 'user' && $message->read_at === null,
                'href' => route('admin.messages.show', $message->user_id),
            ];
        })->all();
        $payload['notifications'] = $this->recentNotifications('admin');

        return $payload;
    }

    private function revision(Request $request, int $userId): string
    {
        if (! $this->ready()) {
            return '0';
        }

        if (session('admin_logged_in') && session('admin_id')) {
            $parts = [
                (int) InboxMessage::query()->max('id'),
                (int) InboxMessage::query()->count(),
                (int) PlatformNotification::query()->where('audience', 'admin')->max('id'),
                (int) PlatformNotification::query()->where('audience', 'admin')->count(),
                (int) InboxMessage::query()->where('author', 'user')->whereNull('read_at')->count(),
                $this->unreadNotifications('admin'),
            ];

            if ($userId > 0) {
                $parts[] = (int) InboxMessage::query()->where('user_id', $userId)->max('id');
                $parts[] = (int) InboxMessage::query()->where('user_id', $userId)->count();
            }

            return implode('-', $parts);
        }

        $user = $request->user();
        if (! $user) {
            return '0';
        }

        $parts = [
            (int) InboxMessage::query()->where('user_id', $user->id)->max('id'),
            (int) InboxMessage::query()->where('user_id', $user->id)->count(),
            (int) PlatformNotification::query()->where('audience', 'user')->where('user_id', $user->id)->max('id'),
            (int) PlatformNotification::query()->where('audience', 'user')->where('user_id', $user->id)->count(),
            (int) InboxMessage::query()
                ->where('user_id', $user->id)
                ->where('author', 'admin')
                ->whereNull('read_at')
                ->count(),
            $this->unreadNotifications('user', $user->id),
        ];

        return implode('-', $parts);
    }

    private function unreadNotifications(string $audience, ?int $userId = null): int
    {
        $query = PlatformNotification::query()
            ->where('audience', $audience)
            ->whereNull('read_at');

        if ($audience === 'user') {
            $query->where('user_id', $userId);
        }

        return $query->count();
    }

    private function recentNotifications(string $audience, ?int $userId = null): array
    {
        $query = PlatformNotification::query()
            ->where('audience', $audience)
            ->orderByDesc('id')
            ->limit(8);

        if ($audience === 'user') {
            $query->where('user_id', $userId);
        }

        return $query->get()->map(fn (PlatformNotification $item) => [
            'id' => $item->id,
            'title' => $item->title,
            'preview' => Str::limit((string) $item->body, 90),
            'at' => $item->created_at?->toIso8601String(),
            'unread' => $item->read_at === null,
            'href' => $item->link,
        ])->all();
    }

    /**
     * @param  list<UploadedFile>  $files
     * @return list<array{path: string, name: string, mime: string, size: int}>
     */
    private function storeAttachments(int $userId, array $files): array
    {
        if ($files === [] || ! Schema::hasColumn('inbox_messages', 'attachments')) {
            return [];
        }

        $stored = [];
        foreach ($files as $file) {
            if (! $file instanceof UploadedFile) {
                continue;
            }

            $name = $this->safeAttachmentName($file->getClientOriginalName());
            $path = $file->storeAs('inbox/'.$userId, uniqid('', true).'-'.$name, 'local');
            if (! $path) {
                continue;
            }

            $stored[] = [
                'path' => $path,
                'name' => $file->getClientOriginalName(),
                'mime' => $file->getMimeType() ?: 'application/octet-stream',
                'size' => $file->getSize() ?: 0,
            ];
        }

        return $stored;
    }

    private function disk(): FilesystemAdapter
    {
        $disk = Storage::disk('local');

        if (! $disk instanceof FilesystemAdapter) {
            abort(500, 'Le disque local est indisponible.');
        }

        return $disk;
    }

    private function previewText(InboxMessage $message): string
    {
        $body = trim((string) $message->body);
        if ($body !== '') {
            return Str::limit($body, 90);
        }

        $first = $message->attachments[0]['name'] ?? null;

        return $first ? 'Pièce jointe · '.$first : 'Pièce jointe';
    }

    private function safeAttachmentName(string $name): string
    {
        $name = basename(str_replace('\\', '/', $name));
        $name = preg_replace('/[^\pL\pN ._-]+/u', '-', $name) ?: 'fichier';

        return trim($name, '.-') ?: 'fichier';
    }
}
