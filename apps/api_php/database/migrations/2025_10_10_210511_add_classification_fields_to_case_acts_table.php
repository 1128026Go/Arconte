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
            $table->enum('clasificacion', ['perentorio', 'tramite', 'pendiente'])->default('pendiente')->after('documento_url');
            $table->decimal('confianza_clasificacion', 3, 2)->nullable()->after('clasificacion');
            $table->text('razon_clasificacion')->nullable()->after('confianza_clasificacion');
            $table->json('plazo_info')->nullable()->after('razon_clasificacion')->comment('Información de plazos extraída del auto');
            $table->timestamp('clasificado_at')->nullable()->after('plazo_info');
            $table->boolean('notificado')->default(false)->after('clasificado_at');
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
