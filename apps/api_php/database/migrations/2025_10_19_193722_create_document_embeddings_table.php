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
        Schema::create('document_embeddings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Tipo de documento fuente (generated_document, transcription, case_act, attachment)
            $table->string('source_type', 50);
            $table->unsignedBigInteger('source_id');

            // Contenido y metadata
            $table->text('content'); // Contenido original indexado
            $table->text('content_summary')->nullable(); // Resumen del contenido
            $table->json('metadata')->nullable(); // Información adicional

            // Vector de embeddings (1536 dimensiones para text-embedding-ada-002)
            $table->vector('embedding', 1536);

            $table->timestamps();

            // Índices
            $table->index(['source_type', 'source_id']);
            $table->index('user_id');
        });

        // Crear índice vectorial para búsqueda de similitud con cosine distance
        \DB::statement('CREATE INDEX document_embeddings_embedding_idx ON document_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_embeddings');
    }
};
