<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JurisprudenceCase extends Model
{
    protected $fillable = ['number', 'type', 'year', 'topic', 'magistrate', 'date', 'summary', 'official_url'];

    protected $casts = [
        'date' => 'date',
    ];
}