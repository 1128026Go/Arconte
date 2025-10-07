<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('teams', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->timestamps();
        });

        Schema::create('team_members', function (Blueprint $t) {
            $t->id();
            $t->foreignId('team_id')->constrained()->cascadeOnDelete();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('role')->default('member');
            $t->timestamps();
            $t->unique(['team_id','user_id']);
        });

        if (Schema::hasTable('case_models') && ! Schema::hasColumn('case_models', 'team_id')) {
            Schema::table('case_models', function (Blueprint $t) {
                $t->foreignId('team_id')->nullable()->constrained('teams')->nullOnDelete()->after('user_id');
                $t->index(['team_id','user_id']);
            });
        }
    }

    public function down(): void {
        if (Schema::hasTable('case_models') && Schema::hasColumn('case_models', 'team_id')) {
            Schema::table('case_models', function (Blueprint $t) {
                $t->dropConstrainedForeignId('team_id');
            });
        }
        Schema::dropIfExists('team_members');
        Schema::dropIfExists('teams');
    }
};