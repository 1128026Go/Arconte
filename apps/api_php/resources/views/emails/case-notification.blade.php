<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $notification->title }}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #374151;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
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
        .content {
            background: white;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
        }
        .priority-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            color: white;
            background: {{ $priorityColor }};
            margin-bottom: 20px;
        }
        .case-info {
            background: #f9fafb;
            padding: 16px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .case-info h3 {
            margin: 0 0 12px 0;
            font-size: 16px;
            color: #111827;
        }
        .case-info p {
            margin: 6px 0;
            font-size: 14px;
        }
        .message {
            margin: 20px 0;
            font-size: 16px;
            line-height: 1.8;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background: #3b82f6;
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
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
        <p style="margin: 8px 0 0 0; opacity: 0.9;">Notificación de Caso Judicial</p>
    </div>

    <div class="content">
        <span class="priority-badge">Prioridad {{ $priority }}</span>

        <h2 style="margin: 0 0 16px 0; color: #111827;">{{ $notification->title }}</h2>

        <div class="message">
            {{ $notification->message }}
        </div>

        <div class="case-info">
            <h3>📁 Información del Caso</h3>
            <p><strong>Radicado:</strong> {{ $case->radicado }}</p>
            <p><strong>Tipo:</strong> {{ $case->tipo_proceso ?? 'No especificado' }}</p>
            <p><strong>Despacho:</strong> {{ $case->despacho ?? 'No especificado' }}</p>
            @if($case->demandante)
            <p><strong>Demandante:</strong> {{ $case->demandante }}</p>
            @endif
            @if($case->demandado)
            <p><strong>Demandado:</strong> {{ $case->demandado }}</p>
            @endif
        </div>

        <a href="{{ config('app.url') }}/cases/{{ $case->id }}" class="button">
            Ver Detalles del Caso →
        </a>

        <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
            Recibiste esta notificación porque estás monitoreando este caso en LegalTech Colombia.
        </p>
    </div>

    <div class="footer">
        <p style="margin: 0;">
            © {{ date('Y') }} LegalTech Colombia - Todos los derechos reservados
        </p>
        <p style="margin: 8px 0 0 0;">
            <a href="{{ config('app.url') }}/prefs" style="color: #3b82f6; text-decoration: none;">
                Gestionar Preferencias de Notificación
            </a>
        </p>
    </div>
</body>
</html>
