<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
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
        $totalUsers = User::count();
        return Inertia::render('Admin/Dashboard/Dashboard', ['admin' => $admin, 'totalUsers' => $totalUsers]);
    }

    public function employees()
    {
        $admin = Admin::findOrFail(session('admin_id'));
        $employees = \App\Models\User::all();
        return Inertia::render('Admin/Employees/Employees', ['admin' => $admin, 'employees' => $employees]);
    }

    public function showCreateEmployee()
    {
        $admin = Admin::findOrFail(session('admin_id'));
        return Inertia::render('Admin/Employees/CreateEmployee', ['admin' => $admin]);
    }

    public function createEmployee(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|unique:users,email',
            'position' => 'required|string|max:255',
            'hire_date' => 'nullable|date',
            'salary_base' => 'required|numeric|min:0',
            'password' => 'required|string|min:6',
        ], [
            'first_name.required' => 'Le prénom est obligatoire.',
            'last_name.required' => 'Le nom est obligatoire.',
            'phone.required' => 'Le numéro de téléphone est obligatoire.',
            'email.email' => 'L\'email n\'est pas valide.',
            'email.unique' => 'Cet email est déjà utilisé.',
            'position.required' => 'Le poste est obligatoire.',
            'hire_date.date' => 'La date d\'embauche est invalide.',
            'salary_base.required' => 'Le salaire de base est obligatoire.',
            'salary_base.min' => 'Le salaire de base doit être positif.',
            'password.required' => 'Le mot de passe est obligatoire.',
            'password.min' => 'Le mot de passe doit contenir au moins 6 caractères.',
        ]);

        \App\Models\User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'phone' => $request->phone,
            'email' => $request->email,
            'position' => $request->position,
            'hire_date' => $request->hire_date,
            'salary_base' => $request->salary_base,
            'password' => Hash::make($request->password),
        ]);

        return redirect()->route('admin.employees')->with('success', 'Employé créé avec succès');
    }

    public function showEditEmployee($id)
    {
        $admin = Admin::findOrFail(session('admin_id'));
        $employee = \App\Models\User::findOrFail($id);

        return Inertia::render('Admin/Employees/EditEmployee', [
            'admin' => $admin,
            'employee' => $employee,
        ]);
    }

    public function updateEmployee(Request $request, $id)
    {
        $employee = \App\Models\User::findOrFail($id);

        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|unique:users,email,' . $employee->id,
            'position' => 'required|string|max:255',
            'hire_date' => 'nullable|date',
            'salary_base' => 'required|numeric|min:0',
        ], [
            'first_name.required' => 'Le prénom est obligatoire.',
            'last_name.required' => 'Le nom est obligatoire.',
            'phone.required' => 'Le numéro de téléphone est obligatoire.',
            'email.email' => 'L\'email n\'est pas valide.',
            'email.unique' => 'Cet email est déjà utilisé.',
            'position.required' => 'Le poste est obligatoire.',
            'hire_date.date' => 'La date d\'embauche est invalide.',
            'salary_base.required' => 'Le salaire de base est obligatoire.',
            'salary_base.min' => 'Le salaire de base doit être positif.',
        ]);

        $employee->update([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'phone' => $request->phone,
            'email' => $request->email,
            'position' => $request->position,
            'hire_date' => $request->hire_date,
            'salary_base' => $request->salary_base,
        ]);

        return redirect()->route('admin.employees')->with('success', 'Employé modifié avec succès');
    }

    public function deleteEmployee($id)
    {
        $employee = \App\Models\User::findOrFail($id);
        $employee->delete();

        return redirect()->route('admin.employees')->with('success', 'Employé supprimé avec succès');
    }

    public function logout()
    {
        session()->forget(['admin_logged_in', 'admin_id']);
        return redirect()->route('admin.login');
    }

}
