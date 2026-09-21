<?php

namespace App\Http\Middleware;

use App\Support\AppLocale;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $locale = AppLocale::normalize(
            $request->session()->get('locale') ?? $request->cookie('locale')
        );

        $request->session()->put('locale', $locale);
        app()->setLocale($locale);

        return $next($request);
    }
}
