<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Analytics - LegalTech Colombia</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1f2937; margin: 0; padding: 32px; }
        h1, h2, h3 { margin: 0; }
        .header { text-align: center; padding-bottom: 16px; border-bottom: 3px solid #2563eb; margin-bottom: 24px; }
        .header h1 { font-size: 26px; color: #1d4ed8; }
        .header p { margin-top: 8px; color: #6b7280; font-size: 12px; }
        .section { margin-bottom: 28px; }
        .section-title { font-size: 16px; font-weight: 600; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 16px; }
        .grid { display: flex; gap: 16px; }
        .card { flex: 1 1 0; background: #f9fafb; border-radius: 8px; padding: 16px; border-left: 4px solid #2563eb; }
        .card-title { font-size: 11px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; margin-bottom: 8px; }
        .card-value { font-size: 22px; font-weight: 700; color: #111827; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: left; }
        th { background: #eff6ff; color: #1d4ed8; font-weight: 600; }
        .text-right { text-align: right; }
        .badge { display: inline-block; padding: 2px 8px; font-size: 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.08em; }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-info { background: #dbeafe; color: #1d4ed8; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 11px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Reporte de Analytics</h1>
        <p>LegalTech Colombia</p>
        <p>Generado: {{ $generated_at }} &mdash; Usuario: {{ $user->name }}</p>
    </div>

    <div class="section">
        <div class="section-title">Resumen General</div>
        <div class="grid">
            <div class="card">
                <div class="card-title">Casos Totales</div>
                <div class="card-value">{{ $cases['total'] }}</div>
            </div>
            <div class="card">
                <div class="card-title">Casos Activos</div>
                <div class="card-value">{{ $cases['active'] }}</div>
            </div>
            <div class="card">
                <div class="card-title">Notificaciones Pendientes</div>
                <div class="card-value">{{ $notifications['unread'] }}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Estado de Notificaciones</div>
        <table>
            <thead>
                <tr>
                    <th>Indicador</th>
                    <th class="text-right">Valor</th>
                    <th class="text-right">Etiqueta</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Total Registradas</td>
                    <td class="text-right">{{ $notifications['total'] }}</td>
                    <td class="text-right"><span class="badge badge-info">Seguimiento</span></td>
                </tr>
                <tr>
                    <td>No Leidas</td>
                    <td class="text-right">{{ $notifications['unread'] }}</td>
                    <td class="text-right">
                        <span class="badge {{ $notifications['unread'] > 5 ? 'badge-warning' : 'badge-success' }}">
                            {{ $notifications['unread'] > 5 ? 'Revisar' : 'En orden' }}
                        </span>
                    </td>
                </tr>
                <tr>
                    <td>Alta Prioridad</td>
                    <td class="text-right">{{ $notifications['high_priority'] }}</td>
                    <td class="text-right">
                        <span class="badge {{ $notifications['high_priority'] > 3 ? 'badge-warning' : 'badge-success' }}">
                            {{ $notifications['high_priority'] > 3 ? 'Atencion' : 'Controlado' }}
                        </span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Facturacion</div>
        <div class="grid">
            <div class="card">
                <div class="card-title">Ingresos Totales</div>
                <div class="card-value">${{ number_format($billing['total_revenue'], 0, ',', '.') }}</div>
            </div>
            <div class="card">
                <div class="card-title">Pendiente de Cobro</div>
                <div class="card-value">${{ number_format($billing['pending_revenue'], 0, ',', '.') }}</div>
            </div>
            <div class="card">
                <div class="card-title">Monto del Mes</div>
                <div class="card-value">${{ number_format($billing['this_month'], 0, ',', '.') }}</div>
            </div>
        </div>
        <p style="margin-top: 12px; color: #6b7280;">
            Total de facturas: <strong>{{ $billing['total_invoices'] }}</strong> &mdash; Pagadas: <strong>{{ $billing['paid_invoices'] }}</strong>
        </p>
    </div>

    <div class="section">
        <div class="section-title">Control de Tiempo</div>
        <div class="grid">
            <div class="card">
                <div class="card-title">Horas Registradas</div>
                <div class="card-value">{{ number_format($time['total_hours'], 1) }} hrs</div>
            </div>
            <div class="card">
                <div class="card-title">Horas Facturables</div>
                <div class="card-value">{{ number_format($time['billable_hours'], 1) }} hrs</div>
            </div>
            <div class="card">
                <div class="card-title">Horas sin Facturar</div>
                <div class="card-value">{{ number_format($time['uninvoiced_hours'], 1) }} hrs</div>
            </div>
        </div>
        <p style="margin-top: 12px; color: #6b7280;">
            Horas registradas este mes: <strong>{{ number_format($time['this_month_hours'], 1) }}</strong>
        </p>
    </div>

    <div class="section">
        <div class="section-title">Distribucion de Casos por Tipo</div>
        @if(count($cases['by_type']) > 0)
            @php $totalCases = max($cases['total'], 1); @endphp
            <table>
                <thead>
                    <tr>
                        <th>Tipo de Proceso</th>
                        <th class="text-right">Cantidad</th>
                        <th class="text-right">Porcentaje</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($cases['by_type'] as $type)
                        <tr>
                            <td>{{ $type->tipo_proceso ?? 'Sin clasificar' }}</td>
                            <td class="text-right">{{ $type->count }}</td>
                            <td class="text-right">{{ round(($type->count / $totalCases) * 100, 1) }}%</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @else
            <p style="color: #6b7280;">No hay datos suficientes para mostrar la distribucion.</p>
        @endif
    </div>

    <div class="section">
        <div class="section-title">Indicadores Clave</div>
        @php
            $billingRate = $time['total_hours'] > 0 ? round(($time['billable_hours'] / max($time['total_hours'], 1)) * 100, 1) : 0;
            $collectionRate = $billing['total_invoices'] > 0 ? round(($billing['paid_invoices'] / $billing['total_invoices']) * 100, 1) : 0;
        @endphp
        <table>
            <thead>
                <tr>
                    <th>Indicador</th>
                    <th class="text-right">Valor</th>
                    <th class="text-right">Estado</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Tasa de Facturacion</td>
                    <td class="text-right">{{ $billingRate }}%</td>
                    <td class="text-right"><span class="badge {{ $billingRate >= 70 ? 'badge-success' : 'badge-warning' }}">{{ $billingRate >= 70 ? 'Saludable' : 'Mejorar' }}</span></td>
                </tr>
                <tr>
                    <td>Tasa de Cobro</td>
                    <td class="text-right">{{ $collectionRate }}%</td>
                    <td class="text-right"><span class="badge {{ $collectionRate >= 70 ? 'badge-success' : 'badge-warning' }}">{{ $collectionRate >= 70 ? 'Saludable' : 'Mejorar' }}</span></td>
                </tr>
                <tr>
                    <td>Horas sin Facturar</td>
                    <td class="text-right">{{ number_format($time['uninvoiced_hours'], 1) }} hrs</td>
                    <td class="text-right"><span class="badge {{ $time['uninvoiced_hours'] > 20 ? 'badge-warning' : 'badge-success' }}">{{ $time['uninvoiced_hours'] > 20 ? 'Revisar' : 'En orden' }}</span></td>
                </tr>
                <tr>
                    <td>Alertas de Alta Prioridad</td>
                    <td class="text-right">{{ $notifications['high_priority'] }}</td>
                    <td class="text-right"><span class="badge {{ $notifications['high_priority'] > 3 ? 'badge-warning' : 'badge-success' }}">{{ $notifications['high_priority'] > 3 ? 'Atencion' : 'En orden' }}</span></td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>&copy; {{ date('Y') }} LegalTech Colombia &mdash; Reporte generado automaticamente por el sistema</p>
        <p>Documento de uso interno. El contenido puede contener informacion confidencial.</p>
    </div>
</body>
</html>
