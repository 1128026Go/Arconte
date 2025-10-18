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
            // Campos adicionales de Rama Judicial
            $table->bigInteger('id_proceso_rama')->nullable()->after('radicado');
            $table->date('fecha_radicacion')->nullable()->after('id_proceso_rama');
            $table->date('fecha_ultima_actuacion')->nullable()->after('fecha_radicacion');
            $table->boolean('es_privado')->default(false)->after('fecha_ultima_actuacion');
            $table->string('ponente')->nullable()->after('es_privado');
            $table->string('clase_proceso')->nullable()->after('ponente');
            $table->string('subclase_proceso')->nullable()->after('clase_proceso');
            $table->string('ubicacion_expediente')->nullable()->after('subclase_proceso');
            $table->string('recurso')->nullable()->after('ubicacion_expediente');
            $table->text('contenido_radicacion')->nullable()->after('recurso');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('case_models', function (Blueprint $table) {
            $table->dropColumn([
                'id_proceso_rama',
                'fecha_radicacion',
                'fecha_ultima_actuacion',
                'es_privado',
                'ponente',
                'clase_proceso',
                'subclase_proceso',
                'ubicacion_expediente',
                'recurso',
                'contenido_radicacion'
            ]);
        });
    }
};
