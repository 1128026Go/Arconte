<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Actualizaciones de Casos</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #374151;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
        }
        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            padding: 30px;
            border-radius: 8px 8px 0 0;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .stats {
            background: white;
            padding: 20px;
            display: flex;
            justify-content: space-around;
            border-bottom: 1px solid #e5e7eb;
        }
        .stat {
            text-align: center;
        }
        .stat-number {
            font-size: 32px;
            font-weight: bold;
            color: #3b82f6;
            margin: 0;
        }
        .stat-label {
            font-size: 14px;
            color: #6b7280;
            margin: 4px 0 0 0;
        }
        .content {
            background: white;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
        }
        .notification-item {
            background: #f9fafb;
            padding: 20px;
            border-left: 4px solid #3b82f6;
            margin-bottom: 16px;
            border-radius: 4px;
        }
        .notification-item.high-priority {
            border-left-color: #ef4444;
            background: #fef2f2;
        }
        .notification-item.medium-priority {
            border-left-color: #f59e0b;
            background: #fffbeb;
        }
        .notification-title {
            margin: 0 0 8px 0;
            font-size: 16px;
            font-weight: 600;
            color: #111827;
        }
        .notification-message {
            margin: 0 0 12px 0;
            font-size: 14px;
            color: #4b5563;
        }
        .notification-meta {
            font-size: 13px;
            color: #6b7280;
        }
        .priority-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 600;
            color: white;
            margin-left: 8px;
        }
        .priority-high { background: #ef4444; }
        .priority-medium { background: #f59e0b; }
        .priority-low { background: #3b82f6; }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background: #3b82f6;
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
        }
        .footer {
            background: #f9fafb;
            padding: 20px;
            border-radius: 0 0 8px 8px;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
            border: 1px solid #e5e7eb;
            border-top: none;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚖️ LegalTech Colombia</h1>
        <p style="margin: 8px 0 0 0; opacity: 0.9;">Resumen Diario de Actualizaciones</p>
    </div>

    <div class="stats">
        <div class="stat">
            <p class="stat-number">{{ $totalCount }}</p>
            <p class="stat-label">Total</p>
        </div>
        @if($highPriority > 0)
        <div class="stat">
            <p class="stat-number" style="color: #ef4444;">{{ $highPriority }}</p>
            <p class="stat-label">Alta Prioridad</p>
        </div>
        @endif
    </div>

    <div class="content">
        <h2 style="margin: 0 0 20px 0; color: #111827;">📬 Actualizaciones de tus Casos</h2>

        @foreach($notifications as $notification)
            @php
                $priorityClass = match(true) {
                    $notification->priority >= 8 => 'high-priority',
                    $notification->priority >= 5 => 'medium-priority',
                    default => ''
                };
                $priorityLabel = match(true) {
                    $notification->priority >= 8 => 'Alta',
                    $notification->priority >= 5 => 'Media',
                    default => 'Baja'
                };
                $priorityBadgeClass = match(true) {
                    $notification->priority >= 8 => 'priority-high',
                    $notification->priority >= 5 => 'priority-medium',
                    default => 'priority-low'
                };
            @endphp

            <div class="notification-item {{ $priorityClass }}">
                <h3 class="notification-title">
                    {{ $notification->title }}
                    <span class="priority-badge {{ $priorityBadgeClass }}">{{ $priorityLabel }}</span>
                </h3>
                <p class="notification-message">{{ $notification->message }}</p>
                <div class="notification-meta">
                    @if($notification->case)
                        📁 {{ $notification->case->radicado }} •
                    @endif
                    🕐 {{ $notification->created_at->diffForHumans() }}
                </div>
            </div>
        @endforeach

        <div style="text-align: center; margin-top: 30px;">
            <a href="{{ config('app.url') }}/notifications" class="button">
                Ver Todas las Notificaciones →
            </a>
        </div>

        <p style="font-size: 14px; color: #6b7280; margin-top: 24px; text-align: center;">
            Recibiste este correo porque tienes {{ $totalCount }} {{ $totalCount === 1 ? 'notificación pendiente' : 'notificaciones pendientes' }}
        </p>
    </div>

    <div class="footer">
        <p style="margin: 0;">
            © {{ date('Y') }} LegalTech Colombia - Todos los derechos reservados
        </p>
        <p style="margin: 8px 0 0 0;">
            <a href="{{ config('app.url') }}/prefs" style="color: #3b82f6; text-decoration: none;">
                Gestionar Preferencias
            </a>
            |
            <a href="{{ config('app.url') }}/notifications" style="color: #3b82f6; text-decoration: none;">
                Ver Notificaciones
            </a>
        </p>
    </div>
</body>
</html>
