<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateTestUser extends Command
{
    protected $signature = 'user:create-test';
    protected $description = 'Create a test user for development';

    public function handle()
    {
        $email = 'admin@test.com';
        
        // Check if user already exists
        if (User::where('email', $email)->exists()) {
            $this->info('Test user already exists!');
            return;
        }

        $user = User::create([
            'name' => 'Admin Test',
            'email' => $email,
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);

        $this->info("Test user created successfully!");
        $this->info("Email: {$email}");
        $this->info("Password: password");
        
        return 0;
    }
}