<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BetaSignup extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'firm',
        'case_volume',
        'hear_about',
        'status',
        'notes',
        'contacted_at'
    ];

    protected $casts = [
        'contacted_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
