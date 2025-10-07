<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class CaseAct extends Model {
  protected $table="case_acts"; public $timestamps=false;
  protected $fillable=["case_model_id","fecha","tipo","descripcion","documento_url","origen","uniq_key"];
  protected $casts=["fecha"=>"datetime"];
}

