<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TimeEntry extends Model
{
    protected $fillable = ['user_id', 'case_id', 'started_at', 'stopped_at', 'hours', 'billable', 'invoice_id'];

    protected $casts = [
        'started_at' => 'datetime',
        'stopped_at' => 'datetime',
        'billable' => 'boolean',
    ];
}