<?php

namespace App\Console\Commands;

use App\Jobs\MonitorCaseChanges;
use Illuminate\Console\Command;

class MonitorCases extends Command
{
    protected $signature = 'cases:monitor';
    protected $description = 'Monitor all active cases for changes';

    public function handle(): int
    {
        $this->info('Monitoring cases for changes...');

        MonitorCaseChanges::dispatch();

        $this->info('Case monitoring job queued successfully!');

        return self::SUCCESS;
    }
}
