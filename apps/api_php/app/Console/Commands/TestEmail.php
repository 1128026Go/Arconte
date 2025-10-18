<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class TestEmail extends Command
{
    protected $signature = 'test:email {email}';
    protected $description = 'Test email sending with noreply configuration';

    public function handle()
    {
        $email = $this->argument('email');

        try {
            Mail::raw('Este es un correo de prueba desde Arconte. El remitente debería aparecer como noreply@arconte.com', function ($message) use ($email) {
                $message->to($email)
                        ->subject('Test Noreply - Arconte');
            });

            $this->info("✅ Email enviado exitosamente a {$email}");
            $this->info("📧 Remitente configurado: " . config('mail.from.address'));
            $this->info("📝 Nombre: " . config('mail.from.name'));

        } catch (\Exception $e) {
            $this->error("❌ Error al enviar email: " . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
