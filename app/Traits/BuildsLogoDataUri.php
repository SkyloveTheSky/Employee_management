<?php

namespace App\Traits;

use App\Models\CompanySetting;
use Illuminate\Support\Facades\Storage;

trait BuildsLogoDataUri
{
    private function buildLogoDataUri(?CompanySetting $settings): ?string
    {
        if (!$settings?->logo_path) {
            return null;
        }

        return $this->buildPublicImageDataUri($settings->logo_path);
    }

    private function buildPublicImageDataUri(?string $path): ?string
    {
        if (!$path || !Storage::disk('public')->exists($path)) {
            return null;
        }

        $content = Storage::disk('public')->get($path);
        if (!$content) {
            return null;
        }

        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION) ?: 'png');
        $mime = match ($ext) {
            'jpg', 'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            default => 'image/png',
        };

        if ($mime === 'image/webp') {
            return null;
        }

        return 'data:' . $mime . ';base64,' . base64_encode($content);
    }
}
