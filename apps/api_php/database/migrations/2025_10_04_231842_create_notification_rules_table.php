<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('rule_type', 50); // 'keyword', 'party', 'court', 'deadline', 'act_type'
            $table->json('rule_value'); // condiciones flexibles {keywords: [...], threshold: X}
            $table->integer('priority_boost')->default(0); // incremento de prioridad
            $table->boolean('enabled')->default(true);
            $table->timestamps();
            
            $table->index(['user_id', 'enabled']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_rules');
    }
};
