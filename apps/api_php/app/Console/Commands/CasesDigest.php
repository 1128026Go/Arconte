<?php
namespace App\Console\Commands;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use App\Models\User;
use App\Models\UserPref;
use App\Mail\CaseUpdatesMail;

class CasesDigest extends Command {
  protected $signature = "cases:digest";
  protected $description = "Envía resumen diario por usuario según sus preferencias";
  public function handle() {
    $users = User::all();
    foreach ($users as $u) {
      $pref = UserPref::firstOrCreate(["user_id"=>$u->id]);
      if (!$pref->notify_email || !$pref->daily_digest) continue;
      // diffs últimas 24h de casos del usuario
      $ids = $u->cases()->pluck("id"); // requiere relación hasMany en User
      $rows = \DB::table("case_diffs")->whereIn("case_id",$ids)->where("created_at",">=",now()->subDay())->get();
      if ($rows->count()) {
        $updates = $rows->map(fn($r)=>["radicado"=>"#", "mensaje"=>$r->type, "fecha"=>$r->created_at])->toArray();
        Mail::to($u->email)->send(new CaseUpdatesMail($updates));
      }
    }
    $this->info("Digest enviado.");
    return self::SUCCESS;
  }
}
