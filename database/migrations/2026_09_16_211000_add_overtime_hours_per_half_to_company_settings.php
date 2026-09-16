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
            if (! Schema::hasColumn('company_settings', 'overtime_hours_per_half')) {
                $table->decimal('overtime_hours_per_half', 6, 2)->nullable()->after('overtime_hours_per_day');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('company_settings') || ! Schema::hasColumn('company_settings', 'overtime_hours_per_half')) {
            return;
        }

        Schema::table('company_settings', function (Blueprint $table) {
            $table->dropColumn('overtime_hours_per_half');
        });
    }
};
