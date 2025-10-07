<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\CaseModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CaseTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_user_can_list_their_cases(): void
    {
        CaseModel::factory()->count(3)->create(['user_id' => $this->user->id]);
        CaseModel::factory()->count(2)->create(); // Casos de otros usuarios

        $response = $this->actingAs($this->user)
            ->getJson('/api/cases');

        $response->assertStatus(200)
            ->assertJsonCount(3);
    }

    public function test_user_can_create_case(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/cases', [
                'radicado' => '11001400300820240012345'
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'id',
                'radicado',
                'user_id'
            ]);

        $this->assertDatabaseHas('case_models', [
            'radicado' => '11001400300820240012345',
            'user_id' => $this->user->id
        ]);
    }

    public function test_user_can_get_case_details(): void
    {
        $case = CaseModel::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/cases/{$case->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'id',
                'radicado',
                'tipo_proceso',
                'despacho'
            ]);
    }

    public function test_user_cannot_view_other_users_cases(): void
    {
        $otherUser = User::factory()->create();
        $case = CaseModel::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/cases/{$case->id}");

        $response->assertStatus(404);
    }

    public function test_user_can_mark_case_as_read(): void
    {
        $case = CaseModel::factory()->create([
            'user_id' => $this->user->id,
            'estado_checked' => false
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("/api/cases/{$case->id}/read");

        $response->assertStatus(200);

        $this->assertDatabaseHas('case_models', [
            'id' => $case->id,
            'estado_checked' => true
        ]);
    }

    public function test_unauthenticated_user_cannot_access_cases(): void
    {
        $response = $this->getJson('/api/cases');

        $response->assertStatus(401);
    }

    public function test_case_requires_valid_radicado(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/cases', [
                'radicado' => ''
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['radicado']);
    }
}
