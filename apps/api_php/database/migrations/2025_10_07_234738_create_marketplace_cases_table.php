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
        Schema::create('marketplace_cases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Cliente que publica
            $table->foreignId('lawyer_id')->nullable()->constrained()->onDelete('set null'); // Abogado asignado

            // Información del caso
            $table->string('titulo');
            $table->text('descripcion');
            $table->enum('tipo_caso', [
                'civil',
                'penal',
                'laboral',
                'familia',
                'comercial',
                'administrativo',
                'constitucional',
                'otro'
            ]);
            $table->enum('urgencia', ['baja', 'media', 'alta', 'critica'])->default('media');

            // Presupuesto
            $table->decimal('presupuesto_min', 10, 2)->nullable();
            $table->decimal('presupuesto_max', 10, 2)->nullable();
            $table->enum('tipo_pago', ['hora', 'caso_completo', 'contingencia'])->default('caso_completo');

            // Ubicación
            $table->string('ciudad');
            $table->string('departamento');

            // Estado del caso en marketplace
            $table->enum('estado', [
                'publicado',      // Publicado buscando abogado
                'en_revision',    // Propuestas recibidas, cliente revisando
                'asignado',       // Abogado asignado, trabajo en progreso
                'completado',     // Caso completado
                'cancelado',      // Cancelado por cliente
                'dispute'         // En disputa
            ])->default('publicado');

            // Matching y propuestas
            $table->integer('propuestas_recibidas')->default(0);
            $table->timestamp('fecha_limite_propuestas')->nullable();

            // Escrow y pagos
            $table->decimal('monto_escrow', 10, 2)->nullable(); // Dinero en custodia
            $table->enum('estado_pago', ['pendiente', 'en_escrow', 'liberado', 'reembolsado'])->default('pendiente');
            $table->timestamp('pago_liberado_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Índices
            $table->index(['estado', 'tipo_caso']);
            $table->index(['ciudad', 'departamento']);
            $table->index('urgencia');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('marketplace_cases');
    }
};
