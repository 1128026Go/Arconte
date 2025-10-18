<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UsageTracking extends Model
{
    protected $fillable = [
        'user_id',
        'date',
        'cases_created',
        'queries_made',
        'jurisprudencia_searches'
    ];

    protected $casts = [
        'date' => 'date',
        'cases_created' => 'integer',
        'queries_made' => 'integer',
        'jurisprudencia_searches' => 'integer'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function incrementCasesCreated()
    {
        $this->increment('cases_created');
    }

    public function incrementQueries()
    {
        $this->increment('queries_made');
    }

    public function incrementJurisprudenciaSearches()
    {
        $this->increment('jurisprudencia_searches');
    }
}
