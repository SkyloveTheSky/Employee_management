<?php

namespace App\Services\Payroll;

class IrsaScale
{
    /**
     * Barème IRSA par défaut (tranches 2026, Madagascar).
     *
     * @return list<array{min: float, max: float|null, rate: float}>
     */
    public static function defaults(): array
    {
        return [
            ['min' => 0, 'max' => 350000, 'rate' => 0],
            ['min' => 350001, 'max' => 400000, 'rate' => 5],
            ['min' => 400001, 'max' => 500000, 'rate' => 10],
            ['min' => 500001, 'max' => 600000, 'rate' => 15],
            ['min' => 600001, 'max' => 4000000, 'rate' => 20],
            ['min' => 4000001, 'max' => null, 'rate' => 25],
        ];
    }

    /**
     * @param  mixed  $brackets
     * @return list<array{min: float, max: float|null, rate: float}>
     */
    public static function normalize(mixed $brackets): array
    {
        if (! is_array($brackets) || $brackets === []) {
            return self::defaults();
        }

        $rows = [];
        foreach (array_values($brackets) as $row) {
            if (! is_array($row)) {
                continue;
            }

            $min = isset($row['min']) && $row['min'] !== '' ? (float) $row['min'] : 0.0;
            $max = isset($row['max']) && $row['max'] !== '' && $row['max'] !== null
                ? (float) $row['max']
                : null;
            $rate = isset($row['rate']) && $row['rate'] !== '' ? (float) $row['rate'] : 0.0;

            $rows[] = [
                'min' => $min,
                'max' => $max,
                'rate' => $rate,
            ];
        }

        return $rows === [] ? self::defaults() : $rows;
    }

    /**
     * @param  list<array{min: float, max: float|null, rate: float}>|null  $brackets
     */
    public static function compute(float $income, mixed $brackets = null): float
    {
        if ($income <= 0) {
            return 0.0;
        }

        $tax = 0.0;
        foreach (self::normalize($brackets) as $row) {
            $min = (float) $row['min'];
            $max = $row['max'];
            $rate = (float) $row['rate'];
            $upper = $max === null ? $income : (float) $max;
            $floor = $min > 0 ? $min - 1 : 0;
            $portion = min($income, $upper) - $floor;
            if ($portion <= 0) {
                continue;
            }

            $tax += $portion * ($rate / 100);
        }

        return round($tax, 2);
    }
}
