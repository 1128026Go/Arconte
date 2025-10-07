<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🌱 Alimentando datos de demo...\n\n";

$user = \App\Models\User::where('email', 'juan@test.com')->first();

if (!$user) {
    echo "❌ No hay usuarios. Creando uno...\n";
    $user = \App\Models\User::create([
        'name' => 'Juan Pérez',
        'email' => 'juan@test.com',
        'password' => bcrypt('password123')
    ]);
    echo "✅ Usuario creado: juan@test.com / password123\n";
}

echo "✅ Usuario: {$user->name}\n\n";

// Crear casos
echo "📁 Creando 5 casos...\n";
$radicados = [
    '11001310500120230012300',
    '11001310500120230012301',
    '11001310500120230012302',
    '11001310500120230012303',
    '11001310500120230012304'
];

$casos = [];
foreach ($radicados as $index => $radicado) {
    $caso = \App\Models\CaseModel::firstOrCreate(
        ['user_id' => $user->id, 'radicado' => $radicado],
        [
            'estado_actual' => ['Activo', 'En trámite', 'Suspendido'][rand(0, 2)],
            'tipo_proceso' => ['Ejecutivo', 'Ordinario', 'Verbal'][rand(0, 2)],
            'despacho' => 'Juzgado ' . ($index + 1) . ' Civil del Circuito',
            'has_unread' => (bool)rand(0, 1),
            'estado_checked' => (bool)rand(0, 1)
        ]
    );
    $casos[] = $caso;
}
echo "✅ " . count($casos) . " casos creados\n\n";

// Agregar partes al primer caso
echo "👥 Agregando partes y actuaciones...\n";
$caso = $casos[0];

\App\Models\CaseParty::firstOrCreate(
    ['case_model_id' => $caso->id, 'rol' => 'Demandante'],
    ['nombre' => 'María González', 'documento' => '12345678']
);
\App\Models\CaseParty::firstOrCreate(
    ['case_model_id' => $caso->id, 'rol' => 'Demandado'],
    ['nombre' => 'Pedro Ramírez', 'documento' => '87654321']
);

\App\Models\CaseAct::firstOrCreate(
    ['case_model_id' => $caso->id, 'uniq_key' => 'act_001'],
    [
        'fecha' => now()->subDays(10),
        'tipo' => 'Auto',
        'descripcion' => 'Auto admisorio de la demanda'
    ]
);
\App\Models\CaseAct::firstOrCreate(
    ['case_model_id' => $caso->id, 'uniq_key' => 'act_002'],
    [
        'fecha' => now()->subDays(5),
        'tipo' => 'Notificación',
        'descripcion' => 'Notificación al demandado'
    ]
);
\App\Models\CaseAct::firstOrCreate(
    ['case_model_id' => $caso->id, 'uniq_key' => 'act_003'],
    [
        'fecha' => now()->subDays(2),
        'tipo' => 'Auto',
        'descripcion' => 'Auto de pruebas'
    ]
);
echo "✅ 2 partes y 3 actuaciones agregadas\n\n";

// Crear notificaciones
echo "🔔 Creando notificaciones...\n";
$notificationData = [
    [
        'title' => 'Nueva actuación en caso',
        'message' => 'Se ha registrado un auto admisorio en el caso ' . $caso->radicado,
        'priority' => 8,
        'type' => 'case_update'
    ],
    [
        'title' => 'Cambio de estado',
        'message' => 'El caso ha cambiado a estado: ' . $caso->estado_actual,
        'priority' => 7,
        'type' => 'status_change'
    ],
    [
        'title' => 'Recordatorio de audiencia',
        'message' => 'Tiene una audiencia programada para el 10 de octubre',
        'priority' => 9,
        'type' => 'reminder'
    ],
    [
        'title' => 'Documento pendiente',
        'message' => 'Debe presentar alegatos antes del viernes',
        'priority' => 6,
        'type' => 'task'
    ]
];

foreach ($notificationData as $notif) {
    \App\Models\Notification::create([
        'user_id' => $user->id,
        'case_model_id' => $caso->id,
        'title' => $notif['title'],
        'message' => $notif['message'],
        'priority' => $notif['priority'],
        'type' => $notif['type']
    ]);
}
echo "✅ 4 notificaciones creadas\n\n";

// Crear time entries
echo "⏱️  Creando entradas de tiempo...\n";
$timeEntries = [
    ['hours' => 3.5, 'desc' => 'Revisión exhaustiva de documentos del caso', 'billable' => true, 'days_ago' => 5],
    ['hours' => 2.0, 'desc' => 'Reunión con cliente - asesoría inicial', 'billable' => true, 'days_ago' => 4],
    ['hours' => 1.5, 'desc' => 'Investigación jurídica sobre precedentes', 'billable' => false, 'days_ago' => 3],
    ['hours' => 4.0, 'desc' => 'Redacción de demanda', 'billable' => true, 'days_ago' => 2],
    ['hours' => 1.0, 'desc' => 'Llamada telefónica con contraparte', 'billable' => true, 'days_ago' => 1],
];

foreach ($timeEntries as $entry) {
    $rate = 150000;
    \App\Models\TimeEntry::create([
        'user_id' => $user->id,
        'case_id' => $caso->id,
        'date' => now()->subDays($entry['days_ago']),
        'hours' => $entry['hours'],
        'description' => $entry['desc'],
        'billable' => $entry['billable'],
        'hourly_rate' => $entry['billable'] ? $rate : 0,
        'total' => $entry['billable'] ? ($entry['hours'] * $rate) : 0,
        'invoiced' => false
    ]);
}
echo "✅ 5 entradas de tiempo creadas\n\n";

// Crear facturas
echo "💰 Creando facturas...\n";

// Factura 1: Pagada
$invoice1 = \App\Models\Invoice::create([
    'user_id' => $user->id,
    'case_id' => $caso->id,
    'invoice_number' => 'INV-2025-001',
    'status' => 'paid',
    'issue_date' => now()->subDays(30),
    'due_date' => now()->subDays(15),
    'paid_at' => now()->subDays(10),
    'subtotal' => 500000,
    'tax' => 95000,
    'discount' => 0,
    'total' => 595000,
    'client_name' => 'María González',
    'client_email' => 'maria@example.com',
    'client_address' => 'Calle 123 #45-67, Bogotá',
    'payment_method' => 'Transferencia bancaria',
    'notes' => 'Pago recibido según transferencia #12345'
]);

\App\Models\InvoiceItem::create([
    'invoice_id' => $invoice1->id,
    'description' => 'Consultoría jurídica - Asesoría inicial del caso',
    'quantity' => 1,
    'unit_price' => 500000,
    'total' => 500000
]);

// Factura 2: Enviada (pendiente de pago)
$invoice2 = \App\Models\Invoice::create([
    'user_id' => $user->id,
    'case_id' => $caso->id,
    'invoice_number' => 'INV-2025-002',
    'status' => 'sent',
    'issue_date' => now()->subDays(10),
    'due_date' => now()->addDays(5),
    'subtotal' => 825000,
    'tax' => 156750,
    'discount' => 0,
    'total' => 981750,
    'client_name' => 'María González',
    'client_email' => 'maria@example.com',
    'client_address' => 'Calle 123 #45-67, Bogotá',
    'notes' => 'Horas facturables del mes de septiembre'
]);

\App\Models\InvoiceItem::create([
    'invoice_id' => $invoice2->id,
    'description' => 'Horas registradas - 5.5 hrs @ $150,000/hr',
    'quantity' => 1,
    'unit_price' => 825000,
    'total' => 825000
]);

// Factura 3: Borrador
$invoice3 = \App\Models\Invoice::create([
    'user_id' => $user->id,
    'case_id' => $casos[1]->id,
    'invoice_number' => 'INV-2025-003',
    'status' => 'draft',
    'issue_date' => now(),
    'due_date' => now()->addDays(15),
    'subtotal' => 300000,
    'tax' => 57000,
    'discount' => 30000,
    'total' => 327000,
    'client_name' => 'Pedro Ramírez',
    'client_email' => 'pedro@example.com',
    'notes' => 'Borrador - Revisar antes de enviar'
]);

\App\Models\InvoiceItem::create([
    'invoice_id' => $invoice3->id,
    'description' => 'Consultoría telefónica',
    'quantity' => 2,
    'unit_price' => 150000,
    'total' => 300000
]);

echo "✅ 3 facturas creadas (1 pagada, 1 enviada, 1 borrador)\n\n";

// Crear recordatorios
echo "📅 Creando recordatorios...\n";

\App\Models\Reminder::create([
    'user_id' => $user->id,
    'case_id' => $caso->id,
    'title' => 'Audiencia de conciliación',
    'description' => 'Audiencia programada en Juzgado 5 Civil - Llevar documentos originales',
    'reminder_date' => now()->addDays(3)->setTime(9, 0),
    'notify_before_minutes' => 1440, // 1 día antes
    'status' => 'pending'
]);

\App\Models\Reminder::create([
    'user_id' => $user->id,
    'case_id' => $caso->id,
    'title' => 'Presentar alegatos',
    'description' => 'Fecha límite para presentar alegatos de conclusión',
    'reminder_date' => now()->addDays(7)->setTime(17, 0),
    'notify_before_minutes' => 2880, // 2 días antes
    'status' => 'pending'
]);

\App\Models\Reminder::create([
    'user_id' => $user->id,
    'case_id' => $casos[1]->id,
    'title' => 'Renovación de poder',
    'description' => 'Verificar vigencia del poder especial',
    'reminder_date' => now()->addDays(15)->setTime(10, 0),
    'notify_before_minutes' => 4320, // 3 días antes
    'status' => 'pending'
]);

echo "✅ 3 recordatorios creados\n\n";

// Crear plantillas
echo "📝 Creando plantillas de documentos...\n";

\App\Models\DocumentTemplate::firstOrCreate(
    ['user_id' => $user->id, 'name' => 'Derecho de Petición'],
    [
        'category' => 'Tutelas',
        'content' => 'Señor(a) {{destinatario}}

Asunto: {{asunto}}

En ejercicio del derecho fundamental de petición consagrado en el artículo 23 de la Constitución Política de Colombia, comedidamente me permito solicitar:

{{peticion}}

Cordialmente,
{{solicitante}}
CC: {{cedula}}',
        'variables' => json_encode(['destinatario', 'asunto', 'peticion', 'solicitante', 'cedula'])
    ]
);

\App\Models\DocumentTemplate::firstOrCreate(
    ['user_id' => $user->id, 'name' => 'Poder General'],
    [
        'category' => 'Poderes',
        'content' => 'PODER GENERAL

Yo {{poderdante}}, identificado(a) con cédula de ciudadanía No. {{cedula_poderdante}}, domiciliado(a) en {{ciudad}}, por medio del presente documento confiero PODER GENERAL, amplio y suficiente al doctor(a) {{apoderado}}, identificado(a) con cédula de ciudadanía No. {{cedula_apoderado}} y tarjeta profesional No. {{tarjeta_profesional}}, para que en mi nombre y representación adelante las siguientes gestiones:

{{facultades}}

Lugar y fecha: {{lugar}}, {{fecha}}

_______________________
{{poderdante}}
CC: {{cedula_poderdante}}',
        'variables' => json_encode(['poderdante', 'cedula_poderdante', 'ciudad', 'apoderado', 'cedula_apoderado', 'tarjeta_profesional', 'facultades', 'lugar', 'fecha'])
    ]
);

\App\Models\DocumentTemplate::firstOrCreate(
    ['user_id' => $user->id, 'name' => 'Contestación de Demanda'],
    [
        'category' => 'Escritos Judiciales',
        'content' => 'Señor(a) Juez {{juzgado}}
{{ciudad}}

REF: Proceso No. {{radicado}}
     Demandante: {{demandante}}
     Demandado: {{demandado}}

Respetado(a) Señor(a) Juez:

{{nombre_apoderado}}, identificado(a) como aparece al pie de mi firma, actuando como apoderado(a) del demandado {{demandado}}, según poder que se adjunta, comedidamente procedo a dar contestación a la demanda en los siguientes términos:

HECHOS:
{{hechos}}

EXCEPCIONES:
{{excepciones}}

PETICIONES:
{{peticiones}}

Del señor(a) Juez,

_______________________
{{nombre_apoderado}}
TP: {{tarjeta_profesional}}',
        'variables' => json_encode(['juzgado', 'ciudad', 'radicado', 'demandante', 'demandado', 'nombre_apoderado', 'hechos', 'excepciones', 'peticiones', 'tarjeta_profesional'])
    ]
);

echo "✅ 3 plantillas creadas\n\n";

// Crear reglas de notificación
echo "⚙️  Creando reglas de notificación...\n";

\App\Models\NotificationRule::firstOrCreate(
    ['user_id' => $user->id, 'event_type' => 'case_status_change'],
    [
        'priority' => 8,
        'send_email' => false,
        'enabled' => true
    ]
);

\App\Models\NotificationRule::firstOrCreate(
    ['user_id' => $user->id, 'event_type' => 'new_case_act'],
    [
        'priority' => 7,
        'send_email' => false,
        'enabled' => true
    ]
);

echo "✅ 2 reglas de notificación creadas\n\n";

echo "🎉 ¡Datos de demo alimentados exitosamente!\n\n";
echo "📊 Resumen:\n";
echo "   👤 Usuario: juan@test.com / password123\n";
echo "   📁 Casos: " . count($casos) . "\n";
echo "   👥 Partes: 2\n";
echo "   📋 Actuaciones: 3\n";
echo "   🔔 Notificaciones: 4\n";
echo "   ⏱️  Time entries: 5 (" . (3.5 + 2.0 + 4.0 + 1.0) . " hrs facturables)\n";
echo "   💰 Facturas: 3 (1 pagada, 1 enviada, 1 borrador)\n";
echo "   📅 Recordatorios: 3\n";
echo "   📝 Plantillas: 3\n";
echo "   ⚙️  Reglas: 2\n\n";
echo "🌐 Frontend: http://localhost:5173\n";
echo "🔧 Backend: https://api-juridica.test\n\n";
echo "🔑 Credenciales:\n";
echo "   Email: juan@test.com\n";
echo "   Password: password123\n";
