<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Admin;


class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Admin::create([
            'name_admin'        => 'Brandon',
            'first_name_admin'  => 'Villanova',
            'email_admin'       => 'brandonvillanova2@gmail.com',
            'password_admin'    => '@Raveculture2025',
            'post_admin'        => 'Développeur',
            'number_phone_admin'=> '+261344777658',
        ]);
    }
}
