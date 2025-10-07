<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocumentTest extends TestCase
{
    use RefreshDatabase;

    public function test_documents_placeholder(): void
    {
        $this->markTestSkipped('Document module basic scaffold.');
    }

    public function test_authenticated_user_can_list_documents(): void
    {
        $user = User::factory()->create();

        Document::create([
            'user_id' => $user->id,
            'case_id' => null,
            'folder_id' => null,
            'title' => 'Contrato',
            'mime' => 'application/pdf',
            'size' => 1024,
            'storage_path' => 'documents/sample.pdf',
            'sha256' => null,
            'is_private' => true,
        ]);

        Document::create([
            'user_id' => User::factory()->create()->id,
            'case_id' => null,
            'folder_id' => null,
            'title' => 'Otro',
            'mime' => 'application/pdf',
            'size' => 2048,
            'storage_path' => 'documents/other.pdf',
            'sha256' => null,
            'is_private' => true,
        ]);

        $response = $this->actingAs($user)->getJson('/api/documents');

        $response->assertStatus(200)
            ->assertJsonPath('data.0.title', 'Contrato')
            ->assertJsonCount(1, 'data');
    }
}