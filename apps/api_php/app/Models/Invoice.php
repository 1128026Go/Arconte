<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use SoftDeletes;

    protected $fillable = ['user_id', 'case_id', 'number', 'status', 'subtotal', 'tax', 'total', 'sent_at', 'paid_at'];

    protected $casts = [
        'sent_at' => 'datetime',
        'paid_at' => 'datetime',
        'subtotal' => 'decimal:2',
        'tax' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function case()
    {
        return $this->belongsTo(\App\Models\CaseModel::class, 'case_id');
    }

    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function timeEntries()
    {
        return $this->hasMany(TimeEntry::class);
    }

    // Scopes
    public function scopePaid($query)
    {
        return $query->whereNotNull('paid_at');
    }

    public function scopePending($query)
    {
        return $query->whereNull('paid_at')->where('status', '!=', 'cancelled');
    }

    // Accessors
    public function getIsPaidAttribute(): bool
    {
        return $this->paid_at !== null;
    }

    public function getIsPendingAttribute(): bool
    {
        return $this->paid_at === null && $this->status !== 'cancelled';
    }
}