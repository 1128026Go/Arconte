<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('documents', function (Blueprint $table) {
            $table->text('ocr_text')->nullable()->after('is_private');
            $table->decimal('ocr_confidence', 5, 2)->nullable()->after('ocr_text');
            $table->string('thumbnail_path')->nullable()->after('ocr_confidence');
        });
    }

    public function down(): void {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn(['ocr_text', 'ocr_confidence', 'thumbnail_path']);
        });
    }
};