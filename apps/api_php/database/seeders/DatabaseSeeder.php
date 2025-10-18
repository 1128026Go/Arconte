<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Admin Arconte',
            'email' => 'admin@juridica.test',
            'password' => bcrypt('admin123'),
        ]);

        // Crear los planes de suscripción
        $this->call([
            PlansSeeder::class,
        ]);
    }
}
