<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CompanySetting;


class EntrepriseWidgetController extends Controller
{
    public function show()
    {
        $company = CompanySetting::first();

        return response()->json([
            'company_name' => $company->company_name ?? '',
            'owner_name' => $company->owner_name ?? '',
            'nif' => $company->nif ?? '',
            'stat' => $company->stat ?? '',
            'rcs' => $company->rcs ?? '',
            'logo_path' => $company->logo_path ?? null,
        ]);
    }
}
