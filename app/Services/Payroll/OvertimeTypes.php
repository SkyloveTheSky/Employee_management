<?php

namespace App\Services\Payroll;

class OvertimeTypes
{
    /**
     * @return list<array{key: string, code: string, label: string, premium: float, enabled: bool}>
     */
    public static function defaults(): array
    {
        return [
            ['key' => 'normal', 'code' => 'HS_NORMAL', 'label' => 'HS normale', 'premium' => 30, 'enabled' => true],
            ['key' => 'night', 'code' => 'HS_NUIT', 'label' => 'HS de nuit', 'premium' => 50, 'enabled' => true],
            ['key' => 'sunday', 'code' => 'HS_DIMANCHE', 'label' => 'HS dimanche', 'premium' => 50, 'enabled' => true],
            ['key' => 'holiday', 'code' => 'HS_FERIE', 'label' => 'HS jour férié', 'premium' => 100, 'enabled' => true],
            ['key' => 'night_holiday', 'code' => 'HS_NUIT_FERIE', 'label' => 'HS nuit + férié', 'premium' => 100, 'enabled' => true],
        ];
    }

    /**
     * @param  mixed  $source
     * @return list<array{key: string, code: string, label: string, premium: float, enabled: bool}>
     */
    public static function normalize(mixed $source): array
    {
        $defaults = collect(self::defaults())->keyBy('key');
        $rows = [];

        if (is_array($source)) {
            $list = array_is_list($source) ? $source : array_values($source);
            foreach ($list as $index => $row) {
                if (! is_array($row)) {
                    continue;
                }
                $normalized = self::normalizeRow($row, $index, $defaults);
                if ($normalized) {
                    $rows[] = $normalized;
                }
            }
        }

        if ($rows === []) {
            return self::defaults();
        }

        return self::uniqueKeys($rows);
    }

    /**
     * @param  mixed  $source
     * @return array<string, array{enabled: bool, types: list<array{key: string, code: string, label: string, premium: float, enabled: bool}>}>
     */
    public static function normalizePositions(mixed $source, mixed $fallbackTypes = null): array
    {
        $fallback = self::normalize($fallbackTypes);
        if (! is_array($source)) {
            return [];
        }

        $map = [];
        foreach ($source as $key => $row) {
            $position = '';
            $payload = $row;
            if (is_string($key) && $key !== '' && ! is_numeric($key)) {
                $position = trim($key);
            } elseif (is_array($row)) {
                $position = trim((string) ($row['position'] ?? $row['name'] ?? ''));
            }
            if ($position === '') {
                continue;
            }

            if (! is_array($payload)) {
                $map[$position] = [
                    'enabled' => (bool) $payload,
                    'types' => $fallback,
                ];
                continue;
            }

            $types = $payload['types'] ?? null;
            $map[$position] = [
                'enabled' => filter_var($payload['enabled'] ?? true, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) !== false,
                'types' => is_array($types) && $types !== [] ? self::normalize($types) : $fallback,
            ];
        }

        return $map;
    }

    /**
     * @return list<array{key: string, code: string, label: string, premium: float, enabled: bool}>
     */
    public static function enabled(mixed $source): array
    {
        return array_values(array_filter(
            self::normalize($source),
            fn (array $row) => $row['enabled']
        ));
    }

    public static function coefficient(float $premium): float
    {
        return round(1 + max(0, $premium) / 100, 3);
    }

    /**
     * @param  array<string, mixed>  $row
     * @param  \Illuminate\Support\Collection<string, array<string, mixed>>  $defaults
     * @return array{key: string, code: string, label: string, premium: float, enabled: bool}|null
     */
    private static function normalizeRow(array $row, int $index, $defaults): ?array
    {
        $key = self::slug((string) ($row['key'] ?? $row['code'] ?? $row['label'] ?? ''), 'hs_'.$index);
        if ($key === '') {
            return null;
        }

        $fallback = $defaults->get($key) ?? [];
        $premium = $row['premium'] ?? $row['rate'] ?? $fallback['premium'] ?? 30;
        $enabled = array_key_exists('enabled', $row)
            ? filter_var($row['enabled'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE)
            : true;

        return [
            'key' => $key,
            'code' => strtoupper(self::slug((string) ($row['code'] ?? $fallback['code'] ?? $key), $key, '_')),
            'label' => trim((string) ($row['label'] ?? $fallback['label'] ?? $key)) ?: $key,
            'premium' => round(max(0, min(400, (float) $premium)), 1),
            'enabled' => $enabled !== false,
        ];
    }

    /**
     * @param  list<array{key: string, code: string, label: string, premium: float, enabled: bool}>  $rows
     * @return list<array{key: string, code: string, label: string, premium: float, enabled: bool}>
     */
    private static function uniqueKeys(array $rows): array
    {
        $seen = [];
        $unique = [];
        foreach ($rows as $row) {
            $base = $row['key'];
            $key = $base;
            $i = 2;
            while (isset($seen[$key])) {
                $key = $base.'_'.$i;
                $i++;
            }
            $seen[$key] = true;
            $row['key'] = $key;
            $unique[] = $row;
        }

        return $unique;
    }

    private static function slug(string $value, string $fallback, string $separator = '_'): string
    {
        $value = strtolower(trim($value));
        $value = preg_replace('/[^a-z0-9]+/i', $separator, $value) ?? '';
        $value = trim($value, $separator);

        return $value !== '' ? $value : $fallback;
    }
}
