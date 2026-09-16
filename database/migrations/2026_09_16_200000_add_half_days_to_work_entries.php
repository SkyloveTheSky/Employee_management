<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('work_entries')) {
            return;
        }

        Schema::table('work_entries', function (Blueprint $table) {
            if (! Schema::hasColumn('work_entries', 'morning_hours')) {
                $table->decimal('morning_hours', 5, 2)->default(0)->after('hours');
            }
            if (! Schema::hasColumn('work_entries', 'afternoon_hours')) {
                $table->decimal('afternoon_hours', 5, 2)->default(0)->after('morning_hours');
            }
        });

        $hoursPerDay = 8.0;
        if (Schema::hasTable('company_settings')) {
            $hoursPerDay = (float) (DB::table('company_settings')->value('overtime_hours_per_day') ?: 8);
        }
        $half = round($hoursPerDay / 2, 2);

        foreach (DB::table('work_entries')->orderBy('id')->get() as $row) {
            $total = (float) $row->hours;
            $morning = round(min($total, $half), 2);
            $afternoon = round(max(0, $total - $morning), 2);

            DB::table('work_entries')->where('id', $row->id)->update([
                'morning_hours' => $morning,
                'afternoon_hours' => $afternoon,
            ]);
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('work_entries')) {
            return;
        }

        Schema::table('work_entries', function (Blueprint $table) {
            if (Schema::hasColumn('work_entries', 'afternoon_hours')) {
                $table->dropColumn('afternoon_hours');
            }
            if (Schema::hasColumn('work_entries', 'morning_hours')) {
                $table->dropColumn('morning_hours');
            }
        });
    }
};
