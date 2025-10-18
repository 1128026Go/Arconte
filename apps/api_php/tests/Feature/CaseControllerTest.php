<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\CaseModel;
use App\Models\CaseAct;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CaseControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    // ==========================================
    // GET /api/cases - List Cases
    // ==========================================

    public function test_user_can_list_their_cases(): void
    {
        CaseModel::factory()->count(3)->create(['user_id' => $this->user->id]);
        CaseModel::factory()->count(2)->create(); // Casos de otros usuarios

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/cases');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_cases_list_is_paginated(): void
    {
        CaseModel::factory()->count(25)->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/cases');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'links',
                'meta' => [
                    'current_page',
                    'total',
                    'per_page'
                ]
            ]);
    }

    public function test_cases_can_be_filtered_by_status(): void
    {
        CaseModel::factory()->create([
            'user_id' => $this->user->id,
            'estado' => 'activo'
        ]);
        CaseModel::factory()->create([
            'user_id' => $this->user->id,
            'estado' => 'terminado'
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/cases?status=activo');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    // ==========================================
    // POST /api/cases - Create Case
    // ==========================================

    public function test_user_can_create_case_with_valid_radicado(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/cases', [
                'radicado' => '11001400300820240012345'
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'case_number',
                    'user_id'
                ]
            ]);

        $this->assertDatabaseHas('case_models', [
            'case_number' => '11001400300820240012345',
            'user_id' => $this->user->id
        ]);
    }

    public function test_case_creation_requires_radicado(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/cases', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['radicado']);
    }

    public function test_case_creation_rejects_invalid_radicado_format(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/cases', [
                'radicado' => 'invalid'
            ]);

        $response->assertStatus(422);
    }

    public function test_duplicate_radicado_is_rejected(): void
    {
        $radicado = '11001400300820240012345';

        CaseModel::factory()->create([
            'user_id' => $this->user->id,
            'case_number' => $radicado
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/cases', [
                'radicado' => $radicado
            ]);

        $response->assertStatus(422);
    }

    // ==========================================
    // GET /api/cases/{id} - Get Case Details
    // ==========================================

    public function test_user_can_get_case_details(): void
    {
        $case = CaseModel::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/cases/{$case->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'case_number',
                    'tipo_proceso',
                    'despacho',
                    'estado',
                    'created_at',
                    'updated_at'
                ]
            ]);
    }

    public function test_case_details_includes_acts(): void
    {
        $case = CaseModel::factory()->create(['user_id' => $this->user->id]);
        CaseAct::factory()->count(3)->create(['case_id' => $case->id]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/cases/{$case->id}");

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data.acts');
    }

    public function test_user_cannot_view_other_users_cases(): void
    {
        $otherUser = User::factory()->create();
        $case = CaseModel::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/cases/{$case->id}");

        $response->assertStatus(403);
    }

    public function test_nonexistent_case_returns_404(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/cases/99999');

        $response->assertStatus(404);
    }

    // ==========================================
    // POST /api/cases/{id}/mark-viewed - Mark as Viewed
    // ==========================================

    public function test_user_can_mark_case_as_viewed(): void
    {
        $case = CaseModel::factory()->create([
            'user_id' => $this->user->id,
            'last_viewed_at' => null
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/cases/{$case->id}/mark-viewed");

        $response->assertStatus(200);

        $case->refresh();
        $this->assertNotNull($case->last_viewed_at);
    }

    // ==========================================
    // POST /api/cases/{id}/refresh - Refresh Case
    // ==========================================

    public function test_user_can_refresh_case(): void
    {
        $case = CaseModel::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/cases/{$case->id}/refresh");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'case'
            ]);
    }

    // ==========================================
    // DELETE /api/cases/{id} - Delete Case
    // ==========================================

    public function test_user_can_delete_their_case(): void
    {
        $case = CaseModel::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/cases/{$case->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('case_models', [
            'id' => $case->id
        ]);
    }

    public function test_user_cannot_delete_other_users_case(): void
    {
        $otherUser = User::factory()->create();
        $case = CaseModel::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/cases/{$case->id}");

        $response->assertStatus(403);

        $this->assertDatabaseHas('case_models', [
            'id' => $case->id
        ]);
    }

    // ==========================================
    // Authentication & Authorization
    // ==========================================

    public function test_unauthenticated_user_cannot_access_cases(): void
    {
        $response = $this->getJson('/api/cases');

        $response->assertStatus(401);
    }

    public function test_unauthenticated_user_cannot_create_case(): void
    {
        $response = $this->postJson('/api/cases', [
            'radicado' => '11001400300820240012345'
        ]);

        $response->assertStatus(401);
    }

    // ==========================================
    // Edge Cases & Validation
    // ==========================================

    public function test_case_list_handles_empty_results(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/cases');

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    public function test_case_creation_trims_whitespace_from_radicado(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/cases', [
                'radicado' => '  11001400300820240012345  '
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('case_models', [
            'case_number' => '11001400300820240012345',
            'user_id' => $this->user->id
        ]);
    }
}
