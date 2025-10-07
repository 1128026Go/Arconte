<?php

namespace Database\Factories;

use App\Models\Invoice;
use App\Models\User;
use App\Models\CaseModel;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    public function definition(): array
    {
        $subtotal = $this->faker->numberBetween(100000, 5000000);
        $tax = $subtotal * 0.19;

        return [
            'user_id' => User::factory(),
            'case_id' => CaseModel::factory(),
            'invoice_number' => 'INV-' . date('Y') . '-' . str_pad($this->faker->unique()->numberBetween(1, 9999), 6, '0', STR_PAD_LEFT),
            'client_name' => $this->faker->company,
            'client_nit' => $this->faker->numerify('##########'),
            'client_email' => $this->faker->companyEmail,
            'issue_date' => $this->faker->dateTimeBetween('-30 days', 'now'),
            'due_date' => $this->faker->dateTimeBetween('now', '+60 days'),
            'subtotal' => $subtotal,
            'tax' => $tax,
            'total' => $subtotal + $tax,
            'status' => $this->faker->randomElement(['draft', 'sent', 'paid', 'overdue']),
            'notes' => $this->faker->optional()->sentence,
        ];
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'draft',
        ]);
    }

    public function sent(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'sent',
        ]);
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'paid',
            'paid_at' => $this->faker->dateTimeBetween('-30 days', 'now'),
            'payment_method' => $this->faker->randomElement(['Transferencia', 'Efectivo', 'Tarjeta']),
        ]);
    }
}
