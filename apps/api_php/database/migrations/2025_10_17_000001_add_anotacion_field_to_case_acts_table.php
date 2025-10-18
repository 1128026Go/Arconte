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
            // Agregar campo anotacion separado de descripcion
            // según estándar de Rama Judicial
            $table->text('anotacion')->nullable()->after('tipo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('case_acts', function (Blueprint $table) {
            $table->dropColumn('anotacion');
        });
    }
};
