<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        @php
            $company = $page['props']['company'] ?? [];
            $favicon = $company['logo_url'] ?? '/favicon.svg';
            $brand = filled($company['name'] ?? null)
                ? $company['name']
                : (config('app.name') === 'Laravel' ? 'Gestion RH' : config('app.name'));
        @endphp

        <link rel="icon" href="{{ $favicon }}">
        <link rel="shortcut icon" href="{{ $favicon }}">
        <link rel="apple-touch-icon" href="{{ $favicon }}">
        <meta name="application-name" content="{{ $brand }}">
        <title inertia>{{ $brand }}</title>

        @php
            $theme = $page['props']['theme'] ?? [];
            $themeColor = function (string $key, string $fallback) use ($theme): string {
                $value = $theme[$key] ?? '';
                return is_string($value) && preg_match('/^#[0-9A-Fa-f]{6}$/', $value) ? $value : $fallback;
            };
        @endphp
        <style>
            :root {
                --color-primary: {{ $themeColor('primary', '#261FB3') }};
                --color-secondary: {{ $themeColor('secondary', '#161179') }};
                --color-tertiary: {{ $themeColor('tertiary', '#0C0950') }};
                --color-background: {{ $themeColor('background', '#FFFFFF') }};
            }
        </style>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite('resources/js/app.jsx')
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
