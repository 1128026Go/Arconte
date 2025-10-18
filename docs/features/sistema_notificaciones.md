# 🔔 Sistema de Notificaciones - Arconte

Sistema completo de notificaciones en tiempo real para alertas de nuevos autos, plazos y actualizaciones.

---

## 📋 Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Backend (Laravel)](#backend-laravel)
- [Frontend (React)](#frontend-react)
- [Flujo de Notificaciones](#flujo-de-notificaciones)
- [Eventos y Listeners](#eventos-y-listeners)
- [Uso y Ejemplos](#uso-y-ejemplos)
- [Configuración](#configuración)

---

## 🏗️ Arquitectura

### Componentes Principales

```
┌──────────────────────────────────────────────────────────────┐
│                      Sistema de Notificaciones                │
└──────────────────────────────────────────────────────────────┘

Backend (Laravel)                    Frontend (React)
├── Notification Model               ├── NotificationBell
├── NotificationService              ├── NotificationCenter
├── NotificationController           └── Polling (30s)
├── Events
│   └── NewCaseActDetected
└── Listeners
    └── CreateNotificationForNewAct
```

### Flujo de Datos

```
Nuevo Auto → Evento → Listener → Notificación → API → Polling → UI
```

---

## 🔧 Backend (Laravel)

### Modelo: `Notification`

**Ubicación:** `apps/api_php/app/Models/Notification.php`

```php
protected $fillable = [
    'user_id',
    'case_id',
    'type',         // 'new_act', 'deadline', 'urgent', 'update'
    'priority',     // 0-10 (calculado por IA)
    'title',
    'message',
    'metadata',     // JSON con datos adicionales
    'read_at',
    'sent_at',
];
```

### Servicio: `NotificationService`

**Ubicación:** `apps/api_php/app/Services/NotificationService.php`

**Métodos principales:**

| Método | Descripción |
|--------|-------------|
| `createNotification()` | Crear nueva notificación |
| `calculatePriority()` | Calcular prioridad usando IA |
| `getUnreadCount()` | Obtener contador de no leídas |
| `markAllAsRead()` | Marcar todas como leídas |
| `sendEmailNotification()` | Enviar por email (opcional) |

### Controlador: `NotificationController`

**Ubicación:** `apps/api_php/app/Http/Controllers/NotificationController.php`

#### Endpoints Disponibles

```http
GET    /api/notifications           # Lista paginada
GET    /api/notifications/unread    # Solo no leídas
GET    /api/notifications/stats     # Estadísticas (unread, high_priority, today)
POST   /api/notifications/{id}/read # Marcar como leída
POST   /api/notifications/mark-all-read  # Marcar todas
```

**Ejemplo de respuesta `/stats`:**

```json
{
  "total": 25,
  "unread": 5,
  "high_priority": 2,
  "today": 3
}
```

### Migración: `notifications`

**Ubicación:** `apps/api_php/database/migrations/2025_10_04_231833_create_notifications_table.php`

**Estructura de tabla:**

```sql
notifications
├── id
├── user_id (FK users)
├── case_id (FK case_models, nullable)
├── type (varchar 50)
├── priority (int 0-10)
├── title (varchar 255)
├── message (text)
├── metadata (json)
├── read_at (timestamp, nullable)
├── sent_at (timestamp, nullable)
├── created_at
└── updated_at

Índices:
- (user_id, read_at)
- (user_id, priority)
- created_at
```

---

## 🎯 Eventos y Listeners

### Evento: `NewCaseActDetected`

**Ubicación:** `apps/api_php/app/Events/NewCaseActDetected.php`

**Cuándo se dispara:**
- Cuando el servicio de ingestión detecta un nuevo auto en Rama Judicial
- Cuando se actualiza manualmente un caso con nuevos autos

**Datos del evento:**

```php
public CaseAct $act;
public CaseModel $case;
public int $userId;
```

**Broadcasting:**
- Canal: `user.{userId}` (privado)
- Evento: `new.case.act`

### Listener: `CreateNotificationForNewAct`

**Ubicación:** `apps/api_php/app/Listeners/CreateNotificationForNewAct.php`

**Funcionalidad:**

1. ✅ Calcula prioridad basada en urgencia del auto
2. ✅ Construye título descriptivo
3. ✅ Genera mensaje con contexto
4. ✅ Crea notificación en DB
5. ✅ Implementa queue para procesamiento async
6. ✅ Maneja errores gracefully

**Mapeo de Urgencia → Prioridad:**

| Urgencia | Prioridad |
|----------|-----------|
| `critical` | 10 |
| `high` | 8 |
| `medium` | 5 |
| `low` | 3 |
| `default` | 4 |

---

## ⚛️ Frontend (React)

### Componente: `NotificationBell`

**Ubicación:** `apps/web/src/components/notifications/NotificationBell.jsx`

**Características:**

- ✅ **Badge animado** con contador de no leídas
- ✅ **Indicador visual** de prioridad alta (pulso rojo)
- ✅ **Polling automático** cada 30 segundos
- ✅ **Click outside** para cerrar dropdown
- ✅ **Estados visuales** (sin leer, leído, urgente)

**Props:**
- Ninguna (componente standalone)

**Estados internos:**

```javascript
const [isOpen, setIsOpen] = useState(false);
const [unreadCount, setUnreadCount] = useState(0);
const [hasHighPriority, setHasHighPriority] = useState(false);
```

### Componente: `NotificationCenter`

**Ubicación:** `apps/web/src/components/notifications/NotificationCenter.jsx`

**Características:**

- ✅ **Lista de notificaciones** con scroll
- ✅ **Iconos por tipo** (auto, plazo, urgente, etc.)
- ✅ **Badges de prioridad** (Urgente, Alta)
- ✅ **Fecha relativa** (ej: "hace 5 minutos")
- ✅ **Click to action** (marcar leída + navegar a caso)
- ✅ **Marcar todas** como leídas
- ✅ **Empty state** cuando no hay notificaciones

**Props:**

```javascript
<NotificationCenter
  onClose={() => {}}           // Callback al cerrar
  onNotificationRead={() => {}} // Callback al marcar como leída
/>
```

### Integración en Layout

**Ubicación:** `apps/web/src/components/Layout/Header.jsx`

```jsx
import NotificationBell from '../notifications/NotificationBell';

// En el header:
<div className="flex items-center space-x-4">
  <NotificationBell />
  {/* User menu... */}
</div>
```

---

## 🔄 Flujo de Notificaciones

### 1. Detección de Nuevo Auto

```
Python Service → Laravel API → Crear CaseAct
```

### 2. Disparo de Evento

```php
event(new NewCaseActDetected($act, $case, $userId));
```

### 3. Listener Procesa (Queue)

```
Queue Worker → CreateNotificationForNewAct
→ Calcula prioridad
→ Crea Notification en DB
```

### 4. Frontend Poll

```javascript
// Cada 30 segundos
const stats = await notifications.getStats();
setUnreadCount(stats.unread);
setHasHighPriority(stats.high_priority > 0);
```

### 5. Usuario Interactúa

```
Click en Bell → Dropdown → Lista de notificaciones
Click en notificación → Marcar leída + Navegar a caso
```

---

## 💡 Uso y Ejemplos

### Crear Notificación Manualmente (Backend)

```php
use App\Services\NotificationService;
use App\Models\User;
use App\Models\CaseModel;

$notificationService = app(NotificationService::class);

$notificationService->createNotification(
    user: $user,
    case: $case,
    type: 'new_act',
    title: 'Nuevo auto detectado',
    message: 'Se ha detectado un nuevo auto en el caso ABC-123',
    priority: 8,
    metadata: [
        'act_type' => 'auto',
        'deadline_days' => 10,
    ]
);
```

### Disparar Evento de Nuevo Auto

```php
use App\Events\NewCaseActDetected;

// Automático al crear CaseAct
event(new NewCaseActDetected($act, $case, $userId));
```

### Consumir API desde Frontend

```javascript
import { notifications } from '../../lib/api';

// Obtener stats
const stats = await notifications.getStats();
// { unread: 5, high_priority: 2, today: 3, total: 25 }

// Obtener no leídas
const { notifications: list, count } = await notifications.getUnread();

// Marcar como leída
await notifications.markAsRead(notificationId);

// Marcar todas
await notifications.markAllAsRead();
```

---

## ⚙️ Configuración

### Variables de Entorno (Backend)

```env
# Email notifications (opcional)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587

# Slack notifications (opcional)
SLACK_WEBHOOK_URL=

# Alert email
ALERT_EMAIL=admin@arconte.com
```

### Polling Interval (Frontend)

Editar en `NotificationBell.jsx`:

```javascript
// Cambiar de 30s a otro intervalo
const interval = setInterval(fetchStats, 30000); // milisegundos
```

### Broadcasting (Opcional - WebSockets)

Para habilitar notificaciones en tiempo real sin polling:

1. Configurar Laravel Broadcasting (Pusher/Redis)
2. Instalar `laravel-echo` en frontend
3. Subscribirse a canal privado `user.{userId}`

```javascript
// Ejemplo con Echo (no implementado aún)
Echo.private(`user.${userId}`)
  .listen('.new.case.act', (data) => {
    fetchStats(); // Actualizar inmediatamente
  });
```

---

## 📊 Tipos de Notificaciones

| Tipo | Descripción | Icono | Color |
|------|-------------|-------|-------|
| `new_act` | Nuevo auto detectado | 🔔 | Azul |
| `deadline` | Plazo próximo a vencer | ⏰ | Naranja |
| `urgent` | Requiere atención inmediata | ⚠️ | Rojo |
| `update` | Actualización de caso | 📄 | Verde |
| `hearing` | Recordatorio de audiencia | 📅 | Morado |

---

## 🧪 Testing

### Test Backend

```bash
cd apps/api_php

# Test de creación de notificación
php artisan test --filter NotificationTest

# Test de evento
php artisan test --filter NewCaseActDetectedTest
```

### Test Frontend

```bash
cd apps/web

# Test de componente NotificationBell
npm run test -- NotificationBell.test.jsx

# Test de componente NotificationCenter
npm run test -- NotificationCenter.test.jsx
```

---

## 🐛 Troubleshooting

### No se muestran notificaciones

1. ✅ Verificar que la tabla `notifications` existe
2. ✅ Verificar que el usuario está autenticado
3. ✅ Revisar logs: `apps/api_php/storage/logs/laravel.log`
4. ✅ Verificar endpoint: `GET /api/notifications/stats`

### Polling no funciona

1. ✅ Abrir DevTools → Network
2. ✅ Verificar requests cada 30s a `/api/notifications/stats`
3. ✅ Revisar errores de CORS
4. ✅ Verificar autenticación (cookies)

### Eventos no se disparan

1. ✅ Verificar que `queue:work` está corriendo
2. ✅ Revisar tabla `jobs` para procesos pendientes
3. ✅ Verificar configuración `QUEUE_CONNECTION=database`

```bash
# Ejecutar queue worker
php artisan queue:work --tries=3
```

---

## 📚 Referencias

- **Backend:**
  - `apps/api_php/app/Models/Notification.php`
  - `apps/api_php/app/Services/NotificationService.php`
  - `apps/api_php/app/Http/Controllers/NotificationController.php`
  - `apps/api_php/app/Events/NewCaseActDetected.php`
  - `apps/api_php/app/Listeners/CreateNotificationForNewAct.php`

- **Frontend:**
  - `apps/web/src/components/notifications/NotificationBell.jsx`
  - `apps/web/src/components/notifications/NotificationCenter.jsx`
  - `apps/web/src/components/Layout/Header.jsx`
  - `apps/web/src/lib/apiSecure.js` (líneas 623-667)

- **Database:**
  - `apps/api_php/database/migrations/2025_10_04_231833_create_notifications_table.php`

---

## 🎯 Próximas Mejoras

- [ ] Implementar WebSockets para updates en tiempo real (eliminar polling)
- [ ] Agregar notificaciones push (PWA)
- [ ] Filtros por tipo de notificación
- [ ] Preferencias de notificación por usuario
- [ ] Sonido al recibir notificación urgente
- [ ] Página `/notifications` con historial completo
- [ ] Búsqueda en notificaciones
- [ ] Export de notificaciones (CSV/PDF)

---

*Última actualización: 2025-10-17*
*Autor: Claude Code (Anthropic)*
*Versión: 1.0*
