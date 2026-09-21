<?php

namespace App\Http\Controllers;

use App\Support\AppLocale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LocaleController extends Controller
{
    public function update(Request $request, string $locale): RedirectResponse
    {
        $locale = AppLocale::normalize($locale);

        $request->session()->put('locale', $locale);
        app()->setLocale($locale);

        return back()->withCookie(cookie()->forever('locale', $locale));
    }
}
