<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class CaseParty extends Model {
  protected $table="case_parties"; public $timestamps=false;
  protected $fillable=["case_model_id","rol","nombre","documento"];
  protected $appends=["role_alias","name_alias"];
  public function getRoleAliasAttribute(){ return $this->attributes["rol"] ?? null; }
  public function getNameAliasAttribute(){ return $this->attributes["nombre"] ?? null; }
}

