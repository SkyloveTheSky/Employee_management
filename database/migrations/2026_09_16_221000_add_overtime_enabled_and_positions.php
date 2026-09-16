<?php

use App\Services\Payroll\OvertimeTypes;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('company_settings')) {
            return;
        }

        Schema::table('company_settings', function (Blueprint $table) {
            if (! Schema::hasColumn('company_settings', 'overtime_enabled')) {
                $table->boolean('overtime_enabled')->default(true)->after('overtime_hours_per_half');
            }
            if (! Schema::hasColumn('company_settings', 'overtime_by_position')) {
                $column = $table->json('overtime_by_position')->nullable();
                if (Schema::hasColumn('company_settings', 'overtime_types')) {
                    $column->after('overtime_types');
                }
            }
        });

        if (Schema::hasColumn('company_settings', 'overtime_types')) {
            $defaults = json_encode(OvertimeTypes::defaults(), JSON_UNESCAPED_UNICODE);
            DB::table('company_settings')
                ->whereNull('overtime_types')
                ->update(['overtime_types' => $defaults]);
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('company_settings')) {
            return;
        }

        Schema::table('company_settings', function (Blueprint $table) {
            if (Schema::hasColumn('company_settings', 'overtime_by_position')) {
                $table->dropColumn('overtime_by_position');
            }
            if (Schema::hasColumn('company_settings', 'overtime_enabled')) {
                $table->dropColumn('overtime_enabled');
            }
        });
    }
};
