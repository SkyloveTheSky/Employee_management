<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\CompanySetting;
use App\Models\Payroll;
use App\Models\User;
use App\Support\Theme;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
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
        'email_admin.required'    => __('auth.admin_email_required'),
        'email_admin.email'       => __('auth.admin_email_invalid'),
        'password_admin.required' => __('auth.admin_password_required'),
        'password_admin.min'      => __('auth.admin_password_min'),
    ]);

    $admin = Admin::where('email_admin', $request->email_admin)->first();

    if (!$admin || !$admin->checkPassword($request->password_admin)) {
        return back()->withErrors([
            'email_admin' => __('auth.admin_failed'),
        ]);
    }

        session(['admin_logged_in' => true, 'admin_id' => $admin->id]);

        return redirect()->route('admin.dashboard');
    }
    public function dashboard()
    {
        $admin = Admin::findOrFail(session('admin_id'));
        $totalUsers = User::count();

        $month = (int) now()->month;
        $year = (int) now()->year;
        $payrollMass = 0;
        $unpaidCount = 0;
        $unpaidAmount = 0;

        if (Schema::hasTable('payrolls')) {
            $monthQuery = Payroll::query()
                ->where('period_month', $month)
                ->where('period_year', $year);

            $payrollMass = (float) (clone $monthQuery)->sum('net_to_pay');
            $unpaidCount = (clone $monthQuery)->where('payment_status', 'unpaid')->count();
            $unpaidAmount = (float) (clone $monthQuery)->where('payment_status', 'unpaid')->sum('net_to_pay');
        }

        return Inertia::render('Admin/Dashboard/Dashboard', [
            'admin' => $admin,
            'totalUsers' => $totalUsers,
            'payrollMass' => $payrollMass,
            'unpaidCount' => $unpaidCount,
            'unpaidAmount' => $unpaidAmount,
            'periodMonth' => $month,
            'periodYear' => $year,
        ]);
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
            'photo' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
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
            'photo.image' => 'La photo doit être une image.',
            'photo.mimes' => 'La photo doit être au format jpg ou png.',
            'photo.max' => 'La photo ne doit pas dépasser 2 Mo.',
        ]);

        $employee = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'phone' => $request->phone,
            'email' => $request->email,
            'position' => $request->position,
            'hire_date' => $request->hire_date,
            'salary_base' => $request->salary_base,
            'password' => Hash::make($request->password),
        ]);

        if ($request->hasFile('photo')) {
            $this->storeEmployeePhoto($employee, $request->file('photo'));
        }

        return redirect()->route('admin.employees')->with('success', 'Employé créé avec succès');
    }

    public function showEditEmployee(int $id)
    {
        $admin = Admin::findOrFail(session('admin_id'));
        $employee = \App\Models\User::findOrFail($id);

        return Inertia::render('Admin/Employees/EditEmployee', [
            'admin' => $admin,
            'employee' => $employee,
        ]);
    }

    public function updateEmployee(Request $request, int $id)
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
            'password' => 'nullable|string|min:6|confirmed',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
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
            'password.min' => 'Le mot de passe doit contenir au moins 6 caractères.',
            'password.confirmed' => 'La confirmation du mot de passe ne correspond pas.',
            'photo.image' => 'La photo doit être une image.',
            'photo.mimes' => 'La photo doit être au format jpg ou png.',
            'photo.max' => 'La photo ne doit pas dépasser 2 Mo.',
        ]);

        $payload = [
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'phone' => $request->phone,
            'email' => $request->email,
            'position' => $request->position,
            'hire_date' => $request->hire_date,
            'salary_base' => $request->salary_base,
        ];

        if ($request->filled('password')) {
            $payload['password'] = $request->password;
        }

        $employee->update($payload);

        if ($request->hasFile('photo')) {
            $this->storeEmployeePhoto($employee, $request->file('photo'));
        }

        return redirect()->route('admin.employees')->with('success', 'Employé modifié avec succès');
    }

    public function deleteEmployee(int $id)
    {
        $employee = \App\Models\User::findOrFail($id);
        $employee->delete();

        return redirect()->route('admin.employees')->with('success', 'Employé supprimé avec succès');
    }

    public function showSettings()
    {
        $admin = Admin::findOrFail(session('admin_id'));

        return Inertia::render('Admin/Settings/Account', [
            'admin' => $admin,
        ]);
    }

    public function updatePassword(Request $request)
    {
        $admin = Admin::findOrFail(session('admin_id'));

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ], [
            'current_password.required' => __('settings.current_required'),
            'password.required' => __('settings.new_required'),
            'password.min' => __('settings.password_min'),
            'password.confirmed' => __('settings.password_confirmed'),
        ]);

        if (! $admin->checkPassword($validated['current_password'])) {
            return back()->withErrors([
                'current_password' => __('settings.current_invalid'),
            ]);
        }

        $admin->password_admin = $validated['password'];
        $admin->save();

        return back()->with('success', __('settings.password_updated'));
    }

    public function updateTheme(Request $request)
    {
        $hex = ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'];

        $validated = $request->validate([
            'primary' => $hex,
            'secondary' => $hex,
            'tertiary' => $hex,
            'background' => $hex,
        ], [
            'primary.regex' => __('settings.primary_hex'),
            'secondary.regex' => __('settings.secondary_hex'),
            'tertiary.regex' => __('settings.tertiary_hex'),
            'background.regex' => __('settings.background_hex'),
        ]);

        $settings = CompanySetting::query()->first() ?? new CompanySetting();
        if (! Schema::hasColumn('company_settings', 'display_theme')) {
            return back()->withErrors([
                'primary' => __('settings.theme_migration'),
            ]);
        }
        $settings->display_theme = Theme::merge($validated);
        $settings->save();

        return back()->with('success', __('settings.theme_saved'));
    }

    public function logout()
    {
        session()->forget(['admin_logged_in', 'admin_id']);
        return redirect()->route('admin.login');
    }

    private function storeEmployeePhoto(User $employee, UploadedFile $file): void
    {
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'jpg');
        $directory = $employee->employeeFolder().'/images';
        Storage::disk('public')->makeDirectory($directory);

        if ($employee->photo_path) {
            Storage::disk('public')->delete($employee->photo_path);
        }

        $path = $file->storeAs($directory, $employee->photoFileName($extension), 'public');
        $employee->update(['photo_path' => $path]);
    }
}
