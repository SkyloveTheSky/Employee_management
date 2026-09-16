<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

#[Fillable(['first_name', 'last_name', 'email', 'phone', 'position', 'hire_date', 'salary_base', 'password', 'photo_path'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'hire_date' => 'date',
            'salary_base' => 'decimal:2',
            'password' => 'hashed',
        ];
    }

    public function payrolls(): HasMany
    {
        return $this->hasMany(Payroll::class);
    }

    public function workEntries(): HasMany
    {
        return $this->hasMany(WorkEntry::class);
    }

    public function employeeFolder(): string
    {
        $firstName = Str::slug($this->first_name ?? '');
        $lastName  = Str::slug($this->last_name ?? '');

        return "employees/{$firstName}-{$lastName}-{$this->id}";
    }

    public function photoFileName(string $extension): string
    {
        $firstName = Str::slug($this->first_name ?? '');
        $lastName  = Str::slug($this->last_name ?? '');

        return "{$firstName}-{$lastName}.".strtolower($extension);
    }

    public function payslipFileName(int $month, int $year): string
    {
        $nom  = trim(Str::slug($this->last_name ?? '').'-'.Str::slug($this->first_name ?? ''), '-');
        $date = sprintf('%04d-%02d', $year, $month);

        return "FP_{$nom}_{$date}.pdf";
    }
}
