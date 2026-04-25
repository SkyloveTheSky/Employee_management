<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;


class AuthController extends Controller
{
    public function showLogin()
    {
        return Inertia::render('Admin/Login');
    }
    public function login(Request $request)
    {
        $request->validate([
        'email_admin'    => 'required|email',
        'password_admin' => 'required|string|min:6',
        ], [
        'email_admin.required'    => 'L\'email est obligatoire.',
        'email_admin.email'       => 'L\'email n\'est pas valide.',
        'password_admin.required' => 'Le mot de passe est obligatoire.',
        'password_admin.min'      => 'Le mot de passe doit contenir au moins 6 caractères.',
    ]);

    $admin = Admin::where('email_admin', $request->email_admin)->first();

    if (!$admin || !$admin->checkPassword($request->password_admin)) {
        return back()->withErrors([
            'email_admin' => 'Email ou mot de passe incorrect.',
        ]);
    }

        session(['admin_logged_in' => true, 'admin_id' => $admin->id]);

        return redirect()->route('admin.dashboard');
    }
    public function dashboard()
    {
        $admin = Admin::findOrFail(session('admin_id'));
        return Inertia::render('Admin/Dashboard/Dashboard', ['admin' => $admin]);
    }

    public function logout()
    {
        session()->forget(['admin_logged_in', 'admin_id']);
        return redirect()->route('admin.login');
    }
}
