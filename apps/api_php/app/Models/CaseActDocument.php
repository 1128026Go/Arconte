<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CaseActDocument extends Model
{
    protected $fillable = [
        'case_act_id',
        'filename',
        'mimetype',
        'disk',
        'path',
        'source_url',
        'sha256',
        'is_primary',
        'text_content',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    public function act(): BelongsTo
    {
        return $this->belongsTo(CaseAct::class, 'case_act_id');
    }
}
