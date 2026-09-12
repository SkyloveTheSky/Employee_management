<?php

namespace App\Support;

class Theme
{
    public const DEFAULT = [
        'primary' => '#261FB3',
        'secondary' => '#161179',
        'tertiary' => '#0C0950',
        'background' => '#FFFFFF',
    ];

    public static function merge(?array $stored): array
    {
        $stored = is_array($stored) ? $stored : [];
        $theme = self::DEFAULT;

        foreach (array_keys(self::DEFAULT) as $key) {
            if (! empty($stored[$key]) && self::isHex((string) $stored[$key])) {
                $theme[$key] = strtoupper((string) $stored[$key]);
            }
        }

        return $theme;
    }

    public static function isHex(string $value): bool
    {
        return (bool) preg_match('/^#[0-9A-Fa-f]{6}$/', $value);
    }
}
