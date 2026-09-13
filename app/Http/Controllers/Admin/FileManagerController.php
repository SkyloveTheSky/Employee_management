<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
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
        $admin = Admin::findOrFail(session('admin_id'));
        $path = $this->normalize($request->query('path'));
        $query = mb_substr(trim((string) $request->query('q', '')), 0, 80);
        $disk = $this->disk();

        if ($path !== '' && ! $disk->directoryExists($path) && ! $disk->exists($path)) {
            $path = '';
        }

        $needle = mb_strtolower($query);
        $searching = $needle !== '';

        $folderSources = $searching ? $disk->allDirectories($path) : $disk->directories($path);
        $fileSources = $searching ? $disk->allFiles($path) : $disk->files($path);

        $folders = collect($folderSources)
            ->filter(fn (string $directory) => $needle === '' || str_contains(mb_strtolower(basename($directory)), $needle))
            ->map(function (string $directory) use ($disk, $searching) {
                $name = basename($directory);

                return [
                    'name' => $name,
                    'path' => $directory,
                    'type' => 'folder',
                    'location' => $searching ? dirname($directory) : '',
                    'items' => count($disk->files($directory)) + count($disk->directories($directory)),
                ];
            })
            ->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)
            ->take(80)
            ->values()
            ->all();

        $files = collect($fileSources)
            ->reject(fn (string $file) => str_starts_with(basename($file), '.'))
            ->filter(fn (string $file) => $needle === '' || str_contains(mb_strtolower(basename($file)), $needle))
            ->map(function (string $file) use ($disk, $searching) {
                $name = basename($file);
                try {
                    $mime = $disk->mimeType($file) ?: '';
                } catch (\Throwable) {
                    $mime = '';
                }

                return [
                    'name' => $name,
                    'path' => $file,
                    'type' => 'file',
                    'location' => $searching ? dirname($file) : '',
                    'size' => $disk->size($file),
                    'mime' => $mime,
                    'modified' => $disk->lastModified($file),
                    'url' => '/storage/'.ltrim($file, '/'),
                    'preview' => str_starts_with($mime, 'image/'),
                    'download' => route('admin.files.download', ['path' => $file]),
                ];
            })
            ->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)
            ->take(80)
            ->values()
            ->all();

        $crumbs = [];
        $acc = '';
        foreach (array_filter(explode('/', $path)) as $part) {
            $acc = $acc === '' ? $part : $acc.'/'.$part;
            $crumbs[] = ['name' => $part, 'path' => $acc];
        }

        return Inertia::render('Admin/Files/Index', [
            'admin' => $admin,
            'path' => $path,
            'crumbs' => $crumbs,
            'folders' => $folders,
            'files' => $files,
            'q' => $query,
        ]);
    }

    public function mkdir(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'path' => ['nullable', 'string', 'max:500'],
            'name' => ['required', 'string', 'max:80', 'regex:/^[\pL\pN][\pL\pN ._-]*$/u'],
        ]);

        $parent = $this->normalize($validated['path'] ?? '');
        $name = trim($validated['name']);
        $target = $parent === '' ? $name : $parent.'/'.$name;
        $disk = $this->disk();

        if ($disk->exists($target) || $disk->directoryExists($target)) {
            return back()->withErrors(['name' => 'Ce dossier existe déjà.']);
        }

        $disk->makeDirectory($target);

        return redirect()->route('admin.files.index', ['path' => $parent])
            ->with('success', 'Dossier créé.');
    }

    public function upload(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'path' => ['nullable', 'string', 'max:500'],
            'file' => ['required', 'file', 'max:10240', 'mimes:jpg,jpeg,png,gif,webp,pdf,doc,docx,xls,xlsx,csv,txt,zip'],
        ]);

        $parent = $this->normalize($validated['path'] ?? '');
        $file = $request->file('file');
        $name = $this->safeName($file->getClientOriginalName());
        $disk = $this->disk();

        $disk->putFileAs($parent, $file, $name);

        return redirect()->route('admin.files.index', ['path' => $parent])
            ->with('success', $name.' a été envoyé.');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'path' => ['required', 'string', 'max:500'],
        ]);

        $path = $this->normalize($validated['path']);
        if ($path === '') {
            return back()->withErrors(['path' => 'Impossible de supprimer la racine.']);
        }

        $disk = $this->disk();
        $parent = dirname($path);
        $parent = $parent === '.' ? '' : $parent;

        if ($disk->directoryExists($path)) {
            $disk->deleteDirectory($path);
        } elseif ($disk->exists($path)) {
            $disk->delete($path);
        }

        return redirect()->route('admin.files.index', ['path' => $parent])
            ->with('success', 'Élément supprimé.');
    }

    public function download(Request $request): StreamedResponse
    {
        $path = $this->normalize($request->query('path'));
        $disk = $this->disk();

        abort_unless($path !== '' && $disk->exists($path), 404);

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
