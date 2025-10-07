<?php

namespace App\Services;

use App\Models\JurisprudenceCase;

class JurisprudenceService
{
    public function search(array $filters = [])
    {
        $query = JurisprudenceCase::query();

        if (! empty($filters['query'])) {
            $query->where('summary', 'like', '%' . $filters['query'] . '%');
        }

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['year'])) {
            $query->where('year', $filters['year']);
        }

        return $query->orderByDesc('year')->paginate(20);
    }
}