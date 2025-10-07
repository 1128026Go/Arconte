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
            if (! Schema::hasColumn('case_models', 'tipo_proceso')) {
                $table->string('tipo_proceso')->nullable()->after('juzgado');
            }

            if (! Schema::hasColumn('case_models', 'despacho')) {
                $table->string('despacho')->nullable()->after('tipo_proceso');
            }

            if (! Schema::hasColumn('case_models', 'last_seen_at')) {
                $table->timestamp('last_seen_at')->nullable()->after('last_checked_at');
            }

            if (! Schema::hasColumn('case_models', 'has_unread')) {
                $table->boolean('has_unread')->default(false)->after('last_seen_at');
            }

            if (! Schema::hasColumn('case_models', 'estado_checked')) {
                $table->boolean('estado_checked')->default(false)->after('has_unread');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('case_models', function (Blueprint $table) {
            if (Schema::hasColumn('case_models', 'estado_checked')) {
                $table->dropColumn('estado_checked');
            }

            if (Schema::hasColumn('case_models', 'has_unread')) {
                $table->dropColumn('has_unread');
            }

            if (Schema::hasColumn('case_models', 'last_seen_at')) {
                $table->dropColumn('last_seen_at');
            }

            if (Schema::hasColumn('case_models', 'despacho')) {
                $table->dropColumn('despacho');
            }

            if (Schema::hasColumn('case_models', 'tipo_proceso')) {
                $table->dropColumn('tipo_proceso');
            }
        });
    }
};
