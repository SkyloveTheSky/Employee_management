<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;

class EmployeWidgetController extends Controller
{
    public function index()
    {
        return response()->json(
            User::select(
                'id',
                'first_name',
                'last_name',
                'email',
                'phone',
                'position',
                'hire_date',
                'salary_base'
            )->get()
        );
    }

    public function show($id)
    {
        $user = User::findOrFail($id);

        return response()->json([
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'position' => $user->position,
            'hire_date' => $user->hire_date,
            'salary_base' => $user->salary_base,
        ]);
    }
}
