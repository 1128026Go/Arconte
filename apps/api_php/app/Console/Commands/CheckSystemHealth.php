<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class CheckSystemHealth extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'health:check';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check system health (Redis, PostgreSQL, Ingest API)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🔍 Checking system health...');
        $this->newLine();

        $allOk = true;

        // 1. Check Redis
        try {
            Cache::put('health_check', time(), 10);
            $value = Cache::get('health_check');

            if ($value) {
                $this->info('✅ Redis: OK');
            } else {
                $this->error('❌ Redis: FAIL (can write but not read)');
                $allOk = false;
            }
        } catch (\Exception $e) {
            $this->error('❌ Redis: FAIL - ' . $e->getMessage());
            $allOk = false;
        }

        // 2. Check PostgreSQL
        try {
            DB::connection()->getPdo();
            $count = DB::table('users')->count();
            $this->info("✅ PostgreSQL: OK ({$count} users in database)");
        } catch (\Exception $e) {
            $this->error('❌ PostgreSQL: FAIL - ' . $e->getMessage());
            $allOk = false;
        }

        // 3. Check Ingest API
        try {
            $baseUrl = env('INGEST_BASE_URL', 'http://127.0.0.1:8001');
            $response = Http::timeout(5)->get($baseUrl . '/healthz');

            if ($response->successful()) {
                $data = $response->json();
                $this->info('✅ Ingest API: OK - ' . ($data['service'] ?? 'unknown'));
            } else {
                $this->error('❌ Ingest API: FAIL (HTTP ' . $response->status() . ')');
                $allOk = false;
            }
        } catch (\Exception $e) {
            $this->error('❌ Ingest API: FAIL - ' . $e->getMessage());
            $allOk = false;
        }

        // 4. Check Queue Configuration
        $queueConnection = env('QUEUE_CONNECTION', 'sync');
        if ($queueConnection === 'redis') {
            $this->info('✅ Queue Connection: redis (configured correctly)');
        } else {
            $this->warn("⚠️  Queue Connection: {$queueConnection} (should be 'redis')");
            $allOk = false;
        }

        $this->newLine();

        if ($allOk) {
            $this->info('🎉 All systems operational!');
            return Command::SUCCESS;
        } else {
            $this->error('⚠️  Some services are down. Check the logs above.');
            return Command::FAILURE;
        }
    }
}
