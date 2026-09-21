<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('platform_notifications')) {
            return;
        }

        if (! Schema::hasColumn('platform_notifications', 'dedupe_key')) {
            Schema::table('platform_notifications', function (Blueprint $table) {
                $table->string('dedupe_key', 120)->nullable()->unique()->after('link');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('platform_notifications') && Schema::hasColumn('platform_notifications', 'dedupe_key')) {
            Schema::table('platform_notifications', function (Blueprint $table) {
                $table->dropUnique(['dedupe_key']);
                $table->dropColumn('dedupe_key');
            });
        }
    }
};
