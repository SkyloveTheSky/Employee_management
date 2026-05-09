<?php

namespace App\Traits;

use App\Models\CompanySetting;
use Illuminate\Support\Facades\Storage;

trait BuildsLogoDataUri
{
    private function buildLogoDataUri(?CompanySetting $settings): ?string
    {
        if (!$settings?->logo_path || !Storage::disk('public')->exists($settings->logo_path)) {
            return null;
        }

        $content = Storage::disk('public')->get($settings->logo_path);
        $ext     = pathinfo($settings->logo_path, PATHINFO_EXTENSION) ?: 'png';

        if (strtolower($ext) === 'webp' && !function_exists('imagecreatefromwebp')) {
            return null;
        }

        return 'data:image/' . $ext . ';base64,' . base64_encode($content);
    }
}
