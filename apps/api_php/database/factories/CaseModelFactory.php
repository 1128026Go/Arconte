<?php

namespace Database\Factories;

use App\Models\CaseModel;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CaseModelFactory extends Factory
{
    protected $model = CaseModel::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'radicado' => $this->faker->numerify('###########'),
            'jurisdiccion' => $this->faker->randomElement(['Civil', 'Laboral', 'Penal']),
            'juzgado' => $this->faker->company . ' Juzgado',
            'tipo_proceso' => $this->faker->randomElement(['Tutela', 'Demanda', 'Apelacion']),
            'despacho' => $this->faker->city . ' - Despacho',
            'estado_actual' => $this->faker->randomElement(['En tramite', 'Fallado', 'Archivado']),
            'fuente' => 'RAMA_API',
            'ultimo_hash' => $this->faker->sha1,
            'last_checked_at' => now(),
            'last_seen_at' => null,
            'has_unread' => false,
            'estado_checked' => false,
        ];
    }
}
