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
        Schema::create('dian_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->onDelete('cascade');

            // Información DIAN
            $table->string('cufe')->unique(); // Código Único de Factura Electrónica
            $table->string('numero_factura')->unique();
            $table->text('xml_content'); // XML UBL 2.1
            $table->string('pdf_path')->nullable();

            // Estado DIAN
            $table->enum('estado', ['pendiente', 'aprobada', 'rechazada', 'anulada'])->default('pendiente');
            $table->json('dian_response')->nullable();
            $table->timestamp('fecha_emision');
            $table->timestamp('fecha_aprobacion')->nullable();

            // Información fiscal
            $table->string('nit_emisor');
            $table->string('nit_receptor')->nullable();
            $table->decimal('subtotal', 12, 2);
            $table->decimal('impuestos', 12, 2)->default(0);
            $table->decimal('total', 12, 2);

            $table->timestamps();
            $table->softDeletes();

            // Índices
            $table->index(['cufe', 'estado']);
            $table->index('numero_factura');
            $table->index('fecha_emision');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dian_invoices');
    }
};
