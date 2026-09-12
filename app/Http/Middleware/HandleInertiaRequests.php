<?php

namespace App\Http\Middleware;

use App\Models\CompanySetting;
use App\Support\Theme;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $settings = CompanySetting::query()->first();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'company' => [
                'name' => $settings?->company_name,
                'logo_url' => $settings?->logo_path && Storage::disk('public')->exists($settings->logo_path)
                    ? Storage::url($settings->logo_path)
                    : null,
            ],
            'theme' => Theme::merge(
                $settings && Schema::hasColumn('company_settings', 'display_theme')
                    ? $settings->display_theme
                    : null
            ),
            'flash' => [
                'success' => $request->session()->get('success'),
                'payroll_warnings' => $request->session()->get('payroll_warnings'),
            ],
        ];
    }
}
