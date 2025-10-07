<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('generated_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('case_id')->nullable()->constrained('case_models')->onDelete('cascade');
            $table->foreignId('conversation_id')->nullable()->constrained('ai_conversations')->onDelete('set null');
            $table->string('template_type', 100); // tutela, derecho_peticion, demanda, contrato
            $table->string('title');
            $table->text('content');
            $table->json('parameters')->nullable();
            $table->string('status', 20)->default('draft'); // draft, reviewed, finalized
            $table->string('format', 20)->default('docx'); // docx, pdf, html
            $table->string('file_path')->nullable();
            $table->timestamps();
            
            $table->index(['user_id', 'template_type']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('generated_documents');
    }
};
