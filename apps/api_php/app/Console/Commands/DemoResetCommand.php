<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class DemoResetCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'demo:reset {--fresh : Drop all tables and recreate from scratch}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset demo environment with fresh data';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔄 Resetting demo environment...');
        $this->newLine();

        // Confirmación en producción
        if (app()->environment('production')) {
            if (!$this->confirm('⚠️  This will delete ALL data. Continue?')) {
                $this->error('Aborted');
                return 1;
            }
        }

        // Limpiar cachés
        $this->info('🧹 Clearing caches...');
        Artisan::call('cache:clear');
        Artisan::call('config:clear');
        Artisan::call('route:clear');
        Artisan::call('view:clear');

        // Migrar base de datos
        if ($this->option('fresh')) {
            $this->info('🗄️  Running fresh migrations...');
            Artisan::call('migrate:fresh', ['--force' => true]);
        } else {
            $this->info('🗄️  Running migrations...');
            Artisan::call('migrate', ['--force' => true]);
        }

        // Ejecutar seeders básicos
        $this->info('🌱 Seeding basic data...');
        Artisan::call('db:seed', [
            '--class' => 'DatabaseSeeder',
            '--force' => true
        ]);

        // Ejecutar seeder de demo
        $this->info('🎭 Seeding demo data...');
        Artisan::call('db:seed', [
            '--class' => 'DemoDataSeeder',
            '--force' => true
        ]);

        $this->newLine();
        $this->info('✅ Demo environment ready!');
        $this->newLine();

        $this->table(
            ['Service', 'Credentials'],
            [
                ['Admin User', 'admin@juridica.test / admin123'],
                ['Demo User', 'demo@juridica.com / demo123'],
                ['URL', 'http://localhost:3000'],
            ]
        );

        return 0;
    }
}
