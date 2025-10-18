<?php

namespace App\Http\Controllers;

use App\Models\Lawyer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LawyerController extends Controller
{
    /**
     * Display a listing of lawyers with filters
     */
    public function index(Request $request)
    {
        $query = Lawyer::query()->where('available', true);

        // Filters
        if ($request->has('specialty')) {
            $query->where('specialty', $request->specialty);
        }

        if ($request->has('city')) {
            $query->where('city', $request->city);
        }

        if ($request->has('verified')) {
            $query->where('verified', $request->boolean('verified'));
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('specialty', 'ilike', "%{$search}%")
                  ->orWhere('bio', 'ilike', "%{$search}%");
            });
        }

        // Min/Max hourly rate
        if ($request->has('min_rate')) {
            $query->where('hourly_rate', '>=', $request->min_rate);
        }

        if ($request->has('max_rate')) {
            $query->where('hourly_rate', '<=', $request->max_rate);
        }

        // Sort
        $sortBy = $request->get('sort_by', 'rating');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Calculate match scores if requirements provided
        $requirements = [];
        if ($request->has('match_specialty')) {
            $requirements['specialty'] = $request->match_specialty;
        }
        if ($request->has('match_city')) {
            $requirements['city'] = $request->match_city;
        }

        $lawyers = $query->paginate(20);

        // Add match score to each lawyer
        if (!empty($requirements)) {
            $lawyers->getCollection()->transform(function($lawyer) use ($requirements) {
                $lawyer->match_score = $lawyer->calculateMatchScore($requirements);
                return $lawyer;
            });

            // Re-sort by match score if requirements were provided
            $sorted = $lawyers->getCollection()->sortByDesc('match_score')->values();
            $lawyers->setCollection($sorted);
        }

        return response()->json($lawyers);
    }

    /**
     * Store a newly created lawyer profile
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:lawyers,email',
            'phone' => 'nullable|string|max:20',
            'specialty' => 'required|string',
            'city' => 'required|string',
            'bio' => 'nullable|string',
            'experience_years' => 'required|integer|min:0',
            'hourly_rate' => 'required|numeric|min:0',
            'specialties' => 'nullable|array',
            'languages' => 'nullable|array',
            'education' => 'nullable|string',
            'license_number' => 'nullable|string',
            'certifications' => 'nullable|string',
            'profile_picture' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $lawyer = Lawyer::create([
            'user_id' => auth()->id(),
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'specialty' => $request->specialty,
            'city' => $request->city,
            'bio' => $request->bio,
            'experience_years' => $request->experience_years,
            'hourly_rate' => $request->hourly_rate,
            'specialties' => $request->specialties,
            'languages' => $request->languages,
            'education' => $request->education,
            'license_number' => $request->license_number,
            'certifications' => $request->certifications,
            'profile_picture' => $request->profile_picture,
        ]);

        return response()->json([
            'message' => 'Perfil de abogado creado exitosamente',
            'lawyer' => $lawyer
        ], 201);
    }

    /**
     * Display the specified lawyer
     */
    public function show($id)
    {
        $lawyer = Lawyer::with('user')->findOrFail($id);

        return response()->json($lawyer);
    }

    /**
     * Update the specified lawyer profile
     */
    public function update(Request $request, $id)
    {
        $lawyer = Lawyer::findOrFail($id);

        // Check if user owns this profile
        if ($lawyer->user_id !== auth()->id()) {
            return response()->json([
                'error' => 'No autorizado'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:lawyers,email,' . $id,
            'phone' => 'nullable|string|max:20',
            'specialty' => 'sometimes|string',
            'city' => 'sometimes|string',
            'bio' => 'nullable|string',
            'experience_years' => 'sometimes|integer|min:0',
            'hourly_rate' => 'sometimes|numeric|min:0',
            'available' => 'sometimes|boolean',
            'specialties' => 'nullable|array',
            'languages' => 'nullable|array',
            'education' => 'nullable|string',
            'license_number' => 'nullable|string',
            'certifications' => 'nullable|string',
            'profile_picture' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $lawyer->update($request->all());

        return response()->json([
            'message' => 'Perfil actualizado exitosamente',
            'lawyer' => $lawyer
        ]);
    }

    /**
     * Remove the specified lawyer profile
     */
    public function destroy($id)
    {
        $lawyer = Lawyer::findOrFail($id);

        // Check if user owns this profile
        if ($lawyer->user_id !== auth()->id()) {
            return response()->json([
                'error' => 'No autorizado'
            ], 403);
        }

        $lawyer->delete();

        return response()->json([
            'message' => 'Perfil eliminado exitosamente'
        ]);
    }

    /**
     * Get lawyer statistics
     */
    public function statistics()
    {
        $stats = [
            'total_lawyers' => Lawyer::count(),
            'verified_lawyers' => Lawyer::where('verified', true)->count(),
            'available_lawyers' => Lawyer::where('available', true)->count(),
            'average_rating' => Lawyer::avg('rating'),
            'total_cases_won' => Lawyer::sum('cases_won'),
            'specialties' => Lawyer::select('specialty')
                ->selectRaw('count(*) as count')
                ->groupBy('specialty')
                ->get(),
            'cities' => Lawyer::select('city')
                ->selectRaw('count(*) as count')
                ->groupBy('city')
                ->get(),
        ];

        return response()->json($stats);
    }

    /**
     * Search lawyers with smart matching
     */
    public function search(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'specialty' => 'nullable|string',
            'city' => 'nullable|string',
            'budget' => 'nullable|numeric',
            'experience_min' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $query = Lawyer::query()->where('available', true);

        if ($request->has('specialty')) {
            $query->where('specialty', $request->specialty);
        }

        if ($request->has('city')) {
            $query->where('city', $request->city);
        }

        if ($request->has('budget')) {
            $query->where('hourly_rate', '<=', $request->budget);
        }

        if ($request->has('experience_min')) {
            $query->where('experience_years', '>=', $request->experience_min);
        }

        $lawyers = $query->get();

        // Calculate match scores
        $requirements = [
            'specialty' => $request->specialty,
            'city' => $request->city,
        ];

        $lawyers = $lawyers->map(function($lawyer) use ($requirements) {
            $lawyer->match_score = $lawyer->calculateMatchScore($requirements);
            return $lawyer;
        })->sortByDesc('match_score')->values();

        return response()->json($lawyers);
    }

    /**
     * Get specialties list
     */
    public function specialties()
    {
        $specialties = [
            'Derecho Laboral',
            'Derecho Civil',
            'Derecho Penal',
            'Derecho Comercial',
            'Derecho Administrativo',
            'Derecho de Familia',
            'Derecho Tributario',
            'Derecho Constitucional',
            'Derecho Internacional',
            'Derecho Ambiental',
        ];

        return response()->json($specialties);
    }

    /**
     * Get cities list
     */
    public function cities()
    {
        $cities = [
            'Bogotá',
            'Medellín',
            'Cali',
            'Barranquilla',
            'Cartagena',
            'Bucaramanga',
            'Pereira',
            'Manizales',
            'Ibagué',
            'Santa Marta',
        ];

        return response()->json($cities);
    }
}
