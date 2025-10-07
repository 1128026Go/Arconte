<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('category', 100); // tutela, derecho_peticion, demanda, contrato, poder, memorial
            $table->text('description')->nullable();
            $table->text('content');
            $table->json('variables')->nullable(); // {accionante}, {accionado}, {fecha}, etc.
            $table->boolean('is_public')->default(false);
            $table->integer('usage_count')->default(0);
            $table->timestamps();
            
            $table->index(['category', 'is_public']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_templates');
    }
};
