<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('document_folders', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('case_id')->nullable()->constrained('case_models')->nullOnDelete();
            $t->string('name');
            $t->timestamps();
        });

        Schema::create('documents', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('case_id')->nullable()->constrained('case_models')->nullOnDelete();
            $t->foreignId('folder_id')->nullable()->constrained('document_folders')->nullOnDelete();
            $t->string('title');
            $t->string('mime');
            $t->unsignedBigInteger('size')->default(0);
            $t->string('storage_path');
            $t->string('sha256', 64)->nullable();
            $t->boolean('is_private')->default(true);
            $t->timestamps();
            $t->softDeletes();
        });

        Schema::create('document_versions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('document_id')->constrained()->cascadeOnDelete();
            $t->unsignedInteger('version');
            $t->string('storage_path');
            $t->string('sha256', 64)->nullable();
            $t->unsignedBigInteger('size')->default(0);
            $t->timestamps();
            $t->unique(['document_id','version']);
        });

        Schema::create('document_shares', function (Blueprint $t) {
            $t->id();
            $t->foreignId('document_id')->constrained()->cascadeOnDelete();
            $t->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $t->foreignId('shared_with_user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('token', 64)->unique();
            $t->timestamp('expires_at')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('document_shares');
        Schema::dropIfExists('document_versions');
        Schema::dropIfExists('documents');
        Schema::dropIfExists('document_folders');
    }
};
