<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class UserPref extends Model {
  protected $table="user_prefs"; protected $primaryKey="user_id"; public $incrementing=false; public $timestamps=false;
  protected $fillable=["user_id","digest_daily","notify_hour"];
  protected $casts=["digest_daily"=>"boolean","notify_hour"=>"integer"];
}

