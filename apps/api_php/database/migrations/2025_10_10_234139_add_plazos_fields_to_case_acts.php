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
            // IDs de Rama Judicial
            $table->bigInteger('id_reg_actuacion')->nullable()->after('id');
            $table->bigInteger('cons_actuacion')->nullable()->after('id_reg_actuacion');

            // Fechas de plazos (MUY IMPORTANTE para alertas)
            $table->date('fecha_inicial')->nullable()->after('fecha');
            $table->date('fecha_final')->nullable()->after('fecha_inicial');
            $table->date('fecha_registro')->nullable()->after('fecha_final');

            // Código de regla
            $table->string('cod_regla')->nullable()->after('origen');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('case_acts', function (Blueprint $table) {
            $table->dropColumn([
                'id_reg_actuacion',
                'cons_actuacion',
                'fecha_inicial',
                'fecha_final',
                'fecha_registro',
                'cod_regla'
            ]);
        });
    }
};
