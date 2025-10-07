<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\CaseModel;
use App\Models\CaseParty;
use App\Models\CaseAct;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // Crear usuario de prueba
        $user = User::firstOrCreate(
            ['email' => 'demo@juridica.com'],
            [
                'name' => 'Usuario Demo',
                'password' => Hash::make('demo123'),
            ]
        );

        // Crear casos de ejemplo
        $cases = [
            [
                'radicado' => '11001310300120230001800',
                'estado_actual' => 'EN DESPACHO PARA SENTENCIA',
                'tipo_proceso' => 'EJECUTIVO',
                'despacho' => 'JUZGADO 30 CIVIL DEL CIRCUITO DE BOGOTA',
                'parties' => [
                    ['rol' => 'DEMANDANTE', 'nombre' => 'BANCO POPULAR S.A.', 'documento' => '860007738'],
                    ['rol' => 'DEMANDADO', 'nombre' => 'MARIA FERNANDA RODRIGUEZ', 'documento' => '52345678'],
                    ['rol' => 'APODERADO DEMANDANTE', 'nombre' => 'JOSE ANTONIO MARTINEZ', 'documento' => '79123456'],
                ],
                'acts' => [
                    ['fecha' => '2025-10-01', 'tipo' => 'AUTO', 'descripcion' => 'Se ordena traslado al demandado por el término de 10 días'],
                    ['fecha' => '2025-09-15', 'tipo' => 'ESCRITO', 'descripcion' => 'Demandante presenta escrito de demanda ejecutiva'],
                    ['fecha' => '2025-09-10', 'tipo' => 'AUTO', 'descripcion' => 'Se admite demanda ejecutiva y se libra mandamiento de pago'],
                    ['fecha' => '2025-09-05', 'tipo' => 'REPARTO', 'descripcion' => 'Radicación y asignación al despacho'],
                ],
            ],
            [
                'radicado' => '11001310302120240012345',
                'estado_actual' => 'NOTIFICACIÓN PENDIENTE',
                'tipo_proceso' => 'ORDINARIO LABORAL',
                'despacho' => 'JUZGADO 15 LABORAL DEL CIRCUITO DE BOGOTA',
                'parties' => [
                    ['rol' => 'DEMANDANTE', 'nombre' => 'CARLOS EDUARDO GOMEZ', 'documento' => '80123456'],
                    ['rol' => 'DEMANDADO', 'nombre' => 'EMPRESA XYZ S.A.S.', 'documento' => '900456789'],
                ],
                'acts' => [
                    ['fecha' => '2025-09-28', 'tipo' => 'AUTO', 'descripcion' => 'Se ordena notificar por edicto al demandado'],
                    ['fecha' => '2025-09-20', 'tipo' => 'ESCRITO', 'descripcion' => 'Demandante presenta demanda por despido sin justa causa'],
                    ['fecha' => '2025-09-18', 'tipo' => 'AUTO', 'descripcion' => 'Se admite demanda laboral'],
                ],
            ],
            [
                'radicado' => '11001310305620240056789',
                'estado_actual' => 'EN TERMINO PARA CONTESTAR',
                'tipo_proceso' => 'VERBAL CIVIL',
                'despacho' => 'JUZGADO 45 CIVIL MUNICIPAL DE BOGOTA',
                'parties' => [
                    ['rol' => 'DEMANDANTE', 'nombre' => 'ANA MARIA LOPEZ', 'documento' => '41234567'],
                    ['rol' => 'DEMANDADO', 'nombre' => 'PEDRO ANTONIO DIAZ', 'documento' => '79876543'],
                    ['rol' => 'APODERADO DEMANDANTE', 'nombre' => 'SOFIA RAMIREZ', 'documento' => '52987654'],
                ],
                'acts' => [
                    ['fecha' => '2025-10-03', 'tipo' => 'AUTO', 'descripcion' => 'Se corre traslado por 10 días al demandado'],
                    ['fecha' => '2025-09-25', 'tipo' => 'AUDIENCIA', 'descripcion' => 'Audiencia inicial - Se admite demanda'],
                    ['fecha' => '2025-09-22', 'tipo' => 'ESCRITO', 'descripcion' => 'Demandante presenta demanda verbal por incumplimiento de contrato'],
                ],
            ],
        ];

        foreach ($cases as $caseData) {
            $case = CaseModel::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'radicado' => $caseData['radicado'],
                ],
                [
                    'estado_actual' => $caseData['estado_actual'],
                    'tipo_proceso' => $caseData['tipo_proceso'],
                    'despacho' => $caseData['despacho'],
                    'estado_checked' => true,
                    'has_unread' => false,
                    'last_checked_at' => now(),
                    'last_seen_at' => now(),
                ]
            );

            // Agregar partes
            foreach ($caseData['parties'] as $partyData) {
                CaseParty::firstOrCreate(
                    [
                        'case_model_id' => $case->id,
                        'rol' => $partyData['rol'],
                        'nombre' => $partyData['nombre'],
                    ],
                    [
                        'documento' => $partyData['documento'] ?? null,
                    ]
                );
            }

            // Agregar actuaciones
            foreach ($caseData['acts'] as $actData) {
                CaseAct::firstOrCreate(
                    [
                        'case_model_id' => $case->id,
                        'fecha' => $actData['fecha'],
                        'descripcion' => $actData['descripcion'],
                    ],
                    [
                        'tipo' => $actData['tipo'],
                        'uniq_key' => md5($case->radicado . $actData['fecha'] . $actData['descripcion']),
                    ]
                );
            }
        }

        $this->command->info('✅ Datos de demostración creados exitosamente');
        $this->command->info('📧 Email: demo@juridica.com');
        $this->command->info('🔑 Password: demo123');
        $this->command->info('📊 Casos creados: ' . count($cases));
    }
}
