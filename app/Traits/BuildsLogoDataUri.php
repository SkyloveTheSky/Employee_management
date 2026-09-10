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
        if (!extension_loaded('gd')) {
            return null;
        }

        if (!$path || !Storage::disk('public')->exists($path)) {
            return null;
        }

        $content = Storage::disk('public')->get($path);
        $ext     = pathinfo($path, PATHINFO_EXTENSION) ?: 'png';

        if (strtolower($ext) === 'webp' && !function_exists('imagecreatefromwebp')) {
            return null;
        }

        return 'data:image/' . $ext . ';base64,' . base64_encode($content);
    }
}
