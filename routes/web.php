<?php

use App\Http\Controllers\LocaleController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\PayrollController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\User\FileManagerController as UserFileManagerController;
use App\Http\Controllers\User\InboxController as UserInboxController;
use App\Http\Controllers\User\NotificationController as UserNotificationController;
use App\Http\Controllers\User\PayrollController as UserPayrollController;
use App\Http\Controllers\User\AttendanceController as UserAttendanceController;
use App\Http\Controllers\User\LeaveController as UserLeaveController;
use App\Http\Controllers\Admin\LeaveController as AdminLeaveController;
use App\Http\Controllers\Admin\CompanySettingsController;
use App\Http\Controllers\Admin\AgendaController;
use App\Http\Controllers\Admin\ChargeController;
use App\Http\Controllers\Admin\OvertimeController;
use App\Http\Controllers\Admin\FileManagerController;
use App\Http\Controllers\Admin\InboxController as AdminInboxController;
use App\Http\Controllers\Admin\NotificationController as AdminNotificationController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\DashboardChartController;
use App\Http\Controllers\Admin\EntrepriseWidgetController;
use App\Http\Controllers\Admin\EmployeWidgetController;

use Inertia\Inertia;

Route::get('/locale/{locale}', [LocaleController::class, 'update'])->name('locale.update');

Route::get('/', function () {
    if (session('admin_logged_in')) {
        return redirect()->route('admin.dashboard');
    }

    if (Auth::check()) {
        return redirect()->route('dashboard');
    }

    return Inertia::render('Welcome');
});

Route::get('/dashboard', [DashboardController::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::get('/payrolls', [UserPayrollController::class, 'index'])->name('payrolls.index');
    Route::get('/payrolls/{id}/pdf', [UserPayrollController::class, 'pdf'])->name('payrolls.pdf');
    Route::get('/attendance', [UserAttendanceController::class, 'index'])->name('attendance.index');
    Route::post('/attendance/punch', [UserAttendanceController::class, 'punch'])->name('attendance.punch');
    Route::get('/leaves', [UserLeaveController::class, 'index'])->name('leaves.index');
    Route::post('/leaves', [UserLeaveController::class, 'store'])->name('leaves.store');
    Route::delete('/leaves/{leave}', [UserLeaveController::class, 'destroy'])->name('leaves.destroy');
    Route::get('/files', [UserFileManagerController::class, 'index'])->name('files.index');
    Route::post('/files/upload', [UserFileManagerController::class, 'upload'])->name('files.upload');
    Route::delete('/files', [UserFileManagerController::class, 'destroy'])->name('files.destroy');
    Route::get('/files/download', [UserFileManagerController::class, 'download'])->name('files.download');
    Route::get('/messages/live', [UserInboxController::class, 'live'])->name('messages.live');
    Route::get('/messages', [UserInboxController::class, 'index'])->name('messages.index');
    Route::post('/messages', [UserInboxController::class, 'store'])->name('messages.store');
    Route::delete('/messages', [UserInboxController::class, 'destroyThread'])->name('messages.destroy-thread');
    Route::get('/messages/{id}/attachments/{index}', [UserInboxController::class, 'attachment'])->name('messages.attachments');
    Route::delete('/messages/{id}', [UserInboxController::class, 'destroy'])->name('messages.destroy');
    Route::post('/notifications/read-all', [UserNotificationController::class, 'readAll'])->name('notifications.read-all');
    Route::post('/notifications/{id}/read', [UserNotificationController::class, 'read'])->name('notifications.read');
    Route::delete('/notifications', [UserNotificationController::class, 'destroyAll'])->name('notifications.destroy-all');
    Route::delete('/notifications/{id}', [UserNotificationController::class, 'destroy'])->name('notifications.destroy');
});

// Routes admin
Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('login.post');


    Route::middleware(\App\Http\Middleware\AdminAuth::class)->group(function () {
        Route::get('/dashboard', [AuthController::class, 'dashboard'])->name('dashboard');
        Route::get('/dashboard/chart-data', [DashboardChartController::class, 'index'])->name('dashboard.chart-data');
        Route::get('/admin/company-setting', [EntrepriseWidgetController::class,
            'show'
        ])->name('admin.company.widget');
        Route::get('/admin/users', [EmployeWidgetController::class, 'index'])
        ->name('admin.employee.widget.index');

        Route::get('/admin/users/{id}', [EmployeWidgetController::class, 'show'])
        ->name('admin.employee.widget.show');


        // Employees — statiques avant dynamiques
        Route::get('/employees', [AuthController::class, 'employees'])->name('employees');
        Route::get('/employees/create', [AuthController::class, 'showCreateEmployee'])->name('employees.create');
        Route::post('/employees', [AuthController::class, 'createEmployee'])->name('employees.store');
        Route::get('/employees/{id}/edit', [AuthController::class, 'showEditEmployee'])->name('employees.edit');
        Route::patch('/employees/{id}', [AuthController::class, 'updateEmployee'])->name('employees.update');
        Route::delete('/employees/{id}', [AuthController::class, 'deleteEmployee'])->name('employees.delete');

        // Payrolls — statiques EN PREMIER, dynamiques après
        Route::get('/payrolls', [PayrollController::class, 'index'])->name('payrolls.index');
        Route::post('/payrolls', [PayrollController::class, 'store'])->name('payrolls.store');
        Route::post('/payrolls/assistant', [PayrollController::class, 'assistant'])->name('payrolls.assistant');
        Route::post('/payrolls/generate-missing', [PayrollController::class, 'generateMissing'])->name('payrolls.generate-missing');
        Route::get('/payrolls/{id}/edit', [PayrollController::class, 'edit'])->name('payrolls.edit');
        Route::patch('/payrolls/{id}', [PayrollController::class, 'update'])->name('payrolls.update');
        Route::patch('/payrolls/{id}/payment', [PayrollController::class, 'markPayment'])->name('payrolls.payment');
        Route::delete('/payrolls/{id}', [PayrollController::class, 'destroy'])->name('payrolls.delete');
        Route::get('/payrolls/{id}/pdf', [PayrollController::class, 'pdf'])->name('payrolls.pdf');

        Route::get('/charges', [ChargeController::class, 'index'])->name('charges.index');

        Route::get('/overtime', [OvertimeController::class, 'index'])->name('overtime.index');
        Route::put('/overtime/day', [OvertimeController::class, 'updateDay'])->name('overtime.day');
        Route::get('/leaves', [AdminLeaveController::class, 'index'])->name('leaves.index');
        Route::patch('/leaves/{leave}', [AdminLeaveController::class, 'update'])->name('leaves.update');

        // Settings
        Route::get('/settings', [AuthController::class, 'showSettings'])->name('settings.edit');
        Route::patch('/settings/password', [AuthController::class, 'updatePassword'])->name('settings.password');
        Route::patch('/settings/theme', [AuthController::class, 'updateTheme'])->name('settings.theme');
        Route::get('/settings/company', [CompanySettingsController::class, 'edit'])->name('settings.company.edit');
        Route::post('/settings/company', [CompanySettingsController::class, 'update'])->name('settings.company.update');
        Route::get('/messages/live', [AdminInboxController::class, 'live'])->name('messages.live');
        Route::get('/messages', [AdminInboxController::class, 'index'])->name('messages.index');
        Route::get('/messages/attachments/{id}/{index}', [AdminInboxController::class, 'attachment'])->name('messages.attachments');
        Route::delete('/messages/items/{id}', [AdminInboxController::class, 'destroy'])->name('messages.destroy');
        Route::delete('/messages/{id}/thread', [AdminInboxController::class, 'destroyThread'])->name('messages.destroy-thread');
        Route::get('/messages/{id}', [AdminInboxController::class, 'show'])->name('messages.show');
        Route::post('/messages/{id}', [AdminInboxController::class, 'store'])->name('messages.store');
        Route::post('/notifications/read-all', [AdminNotificationController::class, 'readAll'])->name('notifications.read-all');
        Route::post('/notifications/{id}/read', [AdminNotificationController::class, 'read'])->name('notifications.read');
        Route::delete('/notifications', [AdminNotificationController::class, 'destroyAll'])->name('notifications.destroy-all');
        Route::delete('/notifications/{id}', [AdminNotificationController::class, 'destroy'])->name('notifications.destroy');
        Route::get('/files', [FileManagerController::class, 'index'])->name('files.index');
        Route::post('/files/mkdir', [FileManagerController::class, 'mkdir'])->name('files.mkdir');
        Route::post('/files/upload', [FileManagerController::class, 'upload'])->name('files.upload');
        Route::delete('/files', [FileManagerController::class, 'destroy'])->name('files.destroy');
        Route::get('/files/download', [FileManagerController::class, 'download'])->name('files.download');
        Route::get('/agenda', [AgendaController::class, 'index'])->name('agenda');
        Route::post('/agenda/notes', [AgendaController::class, 'store'])->name('agenda.store');
        Route::patch('/agenda/notes/{agendaNote}', [AgendaController::class, 'update'])->name('agenda.update');
        Route::delete('/agenda/notes/{agendaNote}', [AgendaController::class, 'destroy'])->name('agenda.destroy');

        Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    });
});

require __DIR__.'/auth.php';
