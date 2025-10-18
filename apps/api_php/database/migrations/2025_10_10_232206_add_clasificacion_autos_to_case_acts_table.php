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
        Schema::table('case_acts', function (Blueprint $table) {
            // Modificar columnas existentes para permitir NULL (actuaciones que no son autos)
            $table->string('clasificacion')->nullable()->change();
            $table->float('confianza_clasificacion')->nullable()->change();
            $table->text('razon_clasificacion')->nullable()->change();
            $table->json('plazo_info')->nullable()->change();
            $table->timestamp('clasificado_at')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('case_acts', function (Blueprint $table) {
            $table->dropColumn([
                'clasificacion',
                'confianza_clasificacion',
                'razon_clasificacion',
                'plazo_info',
                'clasificado_at',
                'notificado'
            ]);
        });
    }
};
