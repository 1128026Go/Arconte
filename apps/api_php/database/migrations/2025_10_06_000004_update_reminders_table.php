<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('reminders', function (Blueprint $table) {
            $table->string('type')->default('audiencia')->after('title');
            $table->string('priority')->default('media')->after('notes');
            $table->text('description')->nullable()->after('title');
            $table->timestamp('notified_at')->nullable()->after('completed_at');
        });
    }

    public function down(): void {
        Schema::table('reminders', function (Blueprint $table) {
            $table->dropColumn(['type', 'priority', 'description', 'notified_at']);
        });
    }
};