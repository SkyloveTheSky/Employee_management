<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\Hash;

class Admin extends Authenticatable
{
    protected $fillable = [
        'name_admin',
        'first_name_admin',
        'password_admin',
        'post_admin',
        'number_phone_admin',
        'email_admin',
    ];

    protected $hidden = [
        'password_admin',
    ];

    protected function getPasswordAdminAttribute($value)
    {
        return $value;
    }

    public function setPasswordAdminAttribute($value)
    {
        $this->attributes['password_admin'] = Hash::make($value);
    }

    public function checkPassword(string $password): bool
    {
        return Hash::check($password, $this->attributes['password_admin']);
    }
}
