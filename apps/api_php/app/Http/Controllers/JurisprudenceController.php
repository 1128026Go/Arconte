<?php

namespace App\Http\Controllers;

use App\Services\JurisprudenceService;
use Illuminate\Http\Request;

class JurisprudenceController extends Controller
{
    public function __construct(private JurisprudenceService $service)
    {
    }

    public function search(Request $request)
    {
        return $this->service->search($request->only(['query', 'type', 'year']));
    }
}