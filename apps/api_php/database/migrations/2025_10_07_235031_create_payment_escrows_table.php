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
        Schema::create('payment_escrows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('marketplace_case_id')->constrained()->onDelete('cascade');
            $table->foreignId('payer_id')->constrained('users')->onDelete('cascade'); // Cliente
            $table->foreignId('receiver_id')->constrained('users')->onDelete('cascade'); // Abogado

            // Información del pago
            $table->decimal('monto', 10, 2);
            $table->string('moneda', 3)->default('COP');
            $table->decimal('fee_plataforma', 10, 2); // 8% fee
            $table->decimal('monto_neto', 10, 2); // monto - fee

            // Estado del escrow
            $table->enum('estado', [
                'pending',       // Esperando pago inicial
                'funded',        // Dinero depositado en escrow
                'in_progress',   // Trabajo en progreso
                'completed',     // Trabajo completado, esperando liberación
                'released',      // Dinero liberado al abogado
                'refunded',      // Reembolsado al cliente
                'disputed'       // En disputa
            ])->default('pending');

            // Milestones (hitos de pago)
            $table->json('milestones')->nullable(); // [{descripcion, monto, completado}]
            $table->integer('milestone_actual')->default(0);

            // Fechas importantes
            $table->timestamp('funded_at')->nullable();
            $table->timestamp('released_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->timestamp('disputed_at')->nullable();

            // Información de transacción PSE/Pasarela
            $table->string('payment_method')->nullable(); // 'pse', 'nequi', 'card'
            $table->string('transaction_id')->nullable(); // ID de la pasarela
            $table->string('payment_reference')->nullable();

            // Disputa
            $table->text('razon_disputa')->nullable();
            $table->text('resolucion_disputa')->nullable();
            $table->timestamp('resolucion_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Índices
            $table->index(['estado', 'marketplace_case_id']);
            $table->index('payer_id');
            $table->index('receiver_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_escrows');
    }
};
