<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('case_changes_log', function (Blueprint $table) {
            $table->id();
            $table->foreignId('case_id')->constrained('case_models')->onDelete('cascade');
            $table->string('source', 50); // 'ramajud', 'tyba', 'samai'
            $table->string('change_type', 50); // 'new_act', 'party_change', 'status_change', 'new_document'
            $table->json('old_value')->nullable();
            $table->json('new_value');
            $table->timestamp('detected_at')->useCurrent();
            
            $table->index(['case_id', 'detected_at']);
            $table->index('change_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('case_changes_log');
    }
};
