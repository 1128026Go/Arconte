<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('jurisprudence_cases', function (Blueprint $t) {
            $t->id();
            $t->string('number')->unique();
            $t->string('type', 8);
            $t->integer('year');
            $t->string('topic')->nullable();
            $t->string('magistrate')->nullable();
            $t->date('date')->nullable();
            $t->text('summary')->nullable();
            $t->string('official_url')->nullable();
            $t->timestamps();
            $t->index(['type','year','topic']);
        });
    }
    public function down(): void { Schema::dropIfExists('jurisprudence_cases'); }
};