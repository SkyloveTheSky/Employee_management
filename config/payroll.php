<?php

return [
    'openai_key' => env('OPENAI_API_KEY'),
    'openai_model' => env('OPENAI_MODEL', 'gpt-4o-mini'),
    'prime_warning_ratio' => 0.5,
    'prime_high_ratio' => 1,
    'overtime_warning_ratio' => 0.5,
    'rate_min' => 0.5,
    'rate_max' => 5,
    'missing_months' => 2,
];
