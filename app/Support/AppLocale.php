<?php

namespace App\Support;

class AppLocale
{
    public const DEFAULT = 'fr';

    /** @var list<string> */
    public const ALLOWED = ['fr', 'en'];

    public static function normalize(?string $locale): string
    {
        $locale = strtolower(trim((string) $locale));

        return in_array($locale, self::ALLOWED, true) ? $locale : self::DEFAULT;
    }
}
