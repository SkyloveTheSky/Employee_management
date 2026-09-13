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
            if (! Schema::hasColumn('company_settings', 'irsa_brackets')) {
                $table->json('irsa_brackets')->nullable()->after('irsa_percent');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('company_settings') || ! Schema::hasColumn('company_settings', 'irsa_brackets')) {
            return;
        }

        Schema::table('company_settings', function (Blueprint $table) {
            $table->dropColumn('irsa_brackets');
        });
    }
};
