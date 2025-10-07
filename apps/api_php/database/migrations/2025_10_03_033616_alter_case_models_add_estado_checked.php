<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('case_models', function (Blueprint $table) {
            if (!Schema::hasColumn('case_models','estado_actual')) {
                $table->string('estado_actual')->nullable();
            }
            if (!Schema::hasColumn('case_models','last_checked_at')) {
                $table->timestamp('last_checked_at')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('case_models', function (Blueprint $table) {
            if (Schema::hasColumn('case_models','estado_actual')) $table->dropColumn('estado_actual');
            if (Schema::hasColumn('case_models','last_checked_at')) $table->dropColumn('last_checked_at');
        });
    }
};
