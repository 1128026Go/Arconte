<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LawyerHire extends Model
{
    protected $fillable = [
        'user_id',
        'lawyer_id',
        'case_description',
        'status',
        'lawyer_notes',
        'accepted_at',
        'rejected_at',
        'completed_at',
    ];

    protected $casts = [
        'accepted_at' => 'datetime',
        'rejected_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function lawyer()
    {
        return $this->belongsTo(Lawyer::class);
    }
}
