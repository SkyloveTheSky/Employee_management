<?php

namespace App\Http\Middleware;

use App\Models\CompanySetting;
use App\Services\Inbox\Inbox;
use App\Services\Payroll\IrsaScale;
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
                    ? '/storage/'.ltrim($settings->logo_path, '/')
                    : null,
                'overtime' => Schema::hasColumn('company_settings', 'overtime_hours_per_day')
                    ? [
                        'enabled' => CompanySetting::overtimeEnabled($settings),
                        'hours_per_day' => $settings?->overtime_hours_per_day,
                        'hours_per_half' => CompanySetting::halfDayHours($settings),
                        'coefficient' => $settings?->overtime_coefficient,
                        'premium' => CompanySetting::overtimePremium($settings),
                        'types' => CompanySetting::overtimeTypes($settings),
                    ]
                    : null,
                'contributions' => Schema::hasColumn('company_settings', 'cnaps_percent')
                    ? [
                        'cnaps' => Schema::hasColumn('company_settings', 'cnaps_employee_percent')
                            && $settings?->cnaps_employee_percent !== null
                            ? $settings->cnaps_employee_percent
                            : $settings?->cnaps_percent,
                        'cnaps_employer' => Schema::hasColumn('company_settings', 'cnaps_employer_percent')
                            ? $settings?->cnaps_employer_percent
                            : null,
                        'cnaps_employee' => Schema::hasColumn('company_settings', 'cnaps_employee_percent')
                            ? $settings?->cnaps_employee_percent
                            : $settings?->cnaps_percent,
                        'irsa' => $settings?->irsa_percent,
                        'irsa_brackets' => Schema::hasColumn('company_settings', 'irsa_brackets')
                            ? IrsaScale::normalize($settings?->irsa_brackets)
                            : IrsaScale::defaults(),
                    ]
                    : null,
            ],
            'theme' => Theme::merge(
                $settings && Schema::hasColumn('company_settings', 'display_theme')
                    ? $settings->display_theme
                    : null
            ),
            'inbox' => $request->routeIs('messages.live', 'admin.messages.live')
                ? []
                : app(Inbox::class)->payload($request),
            'locale' => app()->getLocale(),
            'flash' => [
                'success' => $request->session()->get('success'),
                'payroll_warnings' => $request->session()->get('payroll_warnings'),
            ],
        ];
    }
}
