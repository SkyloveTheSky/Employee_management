<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FileManagerController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $disk = $this->disk();
        $root = $this->ensureRoot($user, $disk);
        $relative = $this->normalize($request->query('path'));
        $absolute = $this->absolute($root, $relative);
        $query = mb_substr(trim((string) $request->query('q', '')), 0, 80);

        if (! $disk->directoryExists($absolute)) {
            $relative = '';
            $absolute = $root;
        }

        $needle = mb_strtolower($query);
        $searching = $needle !== '';
        $folderSources = $searching ? $disk->allDirectories($absolute) : $disk->directories($absolute);
        $fileSources = $searching ? $disk->allFiles($absolute) : $disk->files($absolute);

        $folders = collect($folderSources)
            ->filter(fn (string $directory) => $needle === '' || str_contains(mb_strtolower(basename($directory)), $needle))
            ->map(function (string $directory) use ($disk, $root, $searching) {
                $rel = $this->relative($root, $directory);
                if ($rel === null) {
                    return null;
                }

                return [
                    'name' => basename($directory),
                    'path' => $rel,
                    'type' => 'folder',
                    'location' => $searching ? dirname($rel) : '',
                    'items' => count($disk->files($directory)) + count($disk->directories($directory)),
                    'locked' => $this->isLocked($rel, true),
                ];
            })
            ->filter()
            ->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)
            ->take(80)
            ->values()
            ->all();

        $files = collect($fileSources)
            ->reject(fn (string $file) => str_starts_with(basename($file), '.'))
            ->filter(fn (string $file) => $needle === '' || str_contains(mb_strtolower(basename($file)), $needle))
            ->map(function (string $file) use ($disk, $root, $searching) {
                $rel = $this->relative($root, $file);
                if ($rel === null) {
                    return null;
                }
                try {
                    $mime = $disk->mimeType($file) ?: '';
                } catch (\Throwable) {
                    $mime = '';
                }

                return [
                    'name' => basename($file),
                    'path' => $rel,
                    'type' => 'file',
                    'location' => $searching ? dirname($rel) : '',
                    'size' => $disk->size($file),
                    'mime' => $mime,
                    'modified' => $disk->lastModified($file),
                    'url' => '/storage/'.ltrim($file, '/'),
                    'preview' => str_starts_with($mime, 'image/'),
                    'download' => '/files/download?'.http_build_query(['path' => $rel]),
                    'locked' => $this->isLocked($rel, false),
                ];
            })
            ->filter()
            ->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)
            ->take(80)
            ->values()
            ->all();

        $crumbs = [];
        $acc = '';
        foreach (array_filter(explode('/', $relative)) as $part) {
            $acc = $acc === '' ? $part : $acc.'/'.$part;
            $crumbs[] = ['name' => $part, 'path' => $acc];
        }

        return Inertia::render('Files/Index', [
            'path' => $relative,
            'crumbs' => $crumbs,
            'folders' => $folders,
            'files' => $files,
            'q' => $query,
            'canWrite' => ! $this->isReadOnlyDir($relative),
        ]);
    }

    public function upload(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'path' => ['nullable', 'string', 'max:500'],
            'file' => ['required', 'file', 'max:10240', 'mimes:jpg,jpeg,png,gif,webp,pdf,doc,docx,xls,xlsx,csv,txt,zip'],
        ]);

        $user = $request->user();
        $disk = $this->disk();
        $root = $this->ensureRoot($user, $disk);
        $parentRel = $this->normalize($validated['path'] ?? '');
        abort_if($this->isReadOnlyDir($parentRel), 403);

        $file = $request->file('file');
        $name = $this->safeName($file->getClientOriginalName());
        $parent = $this->absolute($root, $parentRel);
        $disk->putFileAs($parent, $file, $name);

        return redirect()->route('files.index', $parentRel === '' ? [] : ['path' => $parentRel])
            ->with('success', $name.' a été envoyé.');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'path' => ['required', 'string', 'max:500'],
        ]);

        $user = $request->user();
        $disk = $this->disk();
        $root = $this->ensureRoot($user, $disk);
        $rel = $this->normalize($validated['path']);
        abort_if($rel === '' || $this->isLocked($rel, true) || $this->isLocked($rel, false), 403);

        $path = $this->absolute($root, $rel);
        $parentRel = dirname($rel);
        $parentRel = $parentRel === '.' ? '' : $parentRel;

        if ($disk->directoryExists($path)) {
            $disk->deleteDirectory($path);
        } elseif ($disk->exists($path)) {
            $disk->delete($path);
        }

        return redirect()->route('files.index', $parentRel === '' ? [] : ['path' => $parentRel])
            ->with('success', 'Élément supprimé.');
    }

    public function download(Request $request): StreamedResponse
    {
        $user = $request->user();
        $disk = $this->disk();
        $root = $this->ensureRoot($user, $disk);
        $rel = $this->normalize($request->query('path'));
        abort_if($rel === '', 404);
        $path = $this->absolute($root, $rel);
        abort_unless($disk->exists($path), 404);

        return $disk->download($path);
    }

    private function disk(): FilesystemAdapter
    {
        $disk = Storage::disk('public');

        if (! $disk instanceof FilesystemAdapter) {
            abort(500, 'Le disque public est indisponible.');
        }

        return $disk;
    }

    private function ensureRoot(User $user, FilesystemAdapter $disk): string
    {
        $root = $user->employeeFolder();
        $disk->makeDirectory($root);
        $disk->makeDirectory($root.'/images');
        $disk->makeDirectory($root.'/documents');
        $disk->makeDirectory($root.'/payrolls');

        return $root;
    }

    private function absolute(string $root, string $relative): string
    {
        if ($relative === '') {
            return $root;
        }

        return $root.'/'.$relative;
    }

    private function relative(string $root, string $full): ?string
    {
        $full = trim(str_replace('\\', '/', $full), '/');
        if ($full === $root) {
            return '';
        }

        $prefix = $root.'/';
        if (! str_starts_with($full, $prefix)) {
            return null;
        }

        return substr($full, strlen($prefix));
    }

    private function isReadOnlyDir(string $relative): bool
    {
        return $relative === 'payrolls' || str_starts_with($relative, 'payrolls/');
    }

    private function isLocked(string $relative, bool $asFolder): bool
    {
        if (in_array($relative, ['images', 'documents', 'payrolls'], true)) {
            return true;
        }

        return $relative === 'payrolls' || str_starts_with($relative, 'payrolls/');
    }

    private function normalize(?string $path): string
    {
        $path = str_replace('\\', '/', (string) $path);
        $path = trim($path, '/');
        if ($path === '' || $path === '.') {
            return '';
        }

        $parts = [];
        foreach (explode('/', $path) as $part) {
            if ($part === '' || $part === '.') {
                continue;
            }
            abort_if($part === '..', 403);
            $parts[] = $part;
        }

        return implode('/', $parts);
    }

    private function safeName(string $name): string
    {
        $name = basename(str_replace('\\', '/', $name));
        $name = preg_replace('/[^\pL\pN ._-]+/u', '-', $name) ?: 'fichier';

        return trim($name, '.-') ?: 'fichier';
    }
}
