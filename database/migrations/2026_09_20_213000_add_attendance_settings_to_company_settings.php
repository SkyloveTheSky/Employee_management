<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('company_settings')) {
            return;
        }

        Schema::table('company_settings', function (Blueprint $table) {
            if (! Schema::hasColumn('company_settings', 'attendance_timezone')) {
                $table->string('attendance_timezone', 64)->nullable();
            }
            if (! Schema::hasColumn('company_settings', 'attendance_morning_start')) {
                $table->string('attendance_morning_start', 5)->nullable();
            }
            if (! Schema::hasColumn('company_settings', 'attendance_morning_end')) {
                $table->string('attendance_morning_end', 5)->nullable();
            }
            if (! Schema::hasColumn('company_settings', 'attendance_afternoon_start')) {
                $table->string('attendance_afternoon_start', 5)->nullable();
            }
            if (! Schema::hasColumn('company_settings', 'attendance_afternoon_end')) {
                $table->string('attendance_afternoon_end', 5)->nullable();
            }
            if (! Schema::hasColumn('company_settings', 'attendance_latitude')) {
                $table->decimal('attendance_latitude', 10, 7)->nullable();
            }
            if (! Schema::hasColumn('company_settings', 'attendance_longitude')) {
                $table->decimal('attendance_longitude', 10, 7)->nullable();
            }
            if (! Schema::hasColumn('company_settings', 'attendance_radius_m')) {
                $table->unsignedInteger('attendance_radius_m')->nullable();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('company_settings')) {
            return;
        }

        $columns = [
            'attendance_timezone',
            'attendance_morning_start',
            'attendance_morning_end',
            'attendance_afternoon_start',
            'attendance_afternoon_end',
            'attendance_latitude',
            'attendance_longitude',
            'attendance_radius_m',
        ];

        Schema::table('company_settings', function (Blueprint $table) use ($columns) {
            foreach ($columns as $column) {
                if (Schema::hasColumn('company_settings', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
