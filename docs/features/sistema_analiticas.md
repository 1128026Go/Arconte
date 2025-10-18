# 📊 Sistema de Analíticas - Arconte

Sistema completo de dashboard con métricas, gráficas y análisis de datos.

---

## 📋 Tabla de Contenidos

- [Resumen](#resumen)
- [Backend API](#backend-api)
- [Componentes Frontend](#componentes-frontend)
- [Métricas Disponibles](#métricas-disponibles)
- [Gráficas](#gráficas)
- [Uso](#uso)
- [Personalización](#personalización)

---

## 📊 Resumen

El sistema de analíticas proporciona un dashboard completo con:

- ✅ **Estadísticas resumidas** - Total de casos, casos activos, autos, autos críticos
- ✅ **Gráficas interactivas** - Casos por estado, autos por clasificación
- ✅ **Timeline de actividades** - Últimas 20 actuaciones
- ✅ **Plazos próximos a vencer** - Alertas de deadlines críticos
- ✅ **Actualización en tiempo real** - Botón de refresh manual
- ✅ **Responsive design** - Funciona en desktop, tablet y mobile

**Tecnologías:**
- Backend: Laravel 11, PostgreSQL
- Frontend: React 18, Recharts
- Estilos: Tailwind CSS

---

## 🔧 Backend API

### Endpoint Principal

```php
GET /api/analytics/dashboard-stats
```

**Response:**

```json
{
  "cases_by_status": [
    {
      "status": "active",
      "label": "Activo",
      "count": 12,
      "color": "#10b981"
    },
    {
      "status": "closed",
      "label": "Cerrado",
      "count": 5,
      "color": "#ef4444"
    }
  ],
  "acts_by_classification": [
    {
      "classification": "critical",
      "label": "Perentorio",
      "count": 8,
      "color": "#ef4444"
    },
    {
      "classification": "medium",
      "label": "Trámite",
      "count": 15,
      "color": "#3b82f6"
    }
  ],
  "recent_activities": [
    {
      "id": 123,
      "case_id": 45,
      "case_number": "11001400300820240012345",
      "case_type": "Ejecutivo Singular",
      "act_type": "Admite Demanda",
      "annotation": "Se ordena correr traslado...",
      "urgency_level": "critical",
      "date": "2025-10-15",
      "formatted_date": "15/10/2025",
      "relative_date": "hace 2 días"
    }
  ],
  "upcoming_deadlines": [
    {
      "id": 456,
      "case_id": 45,
      "case_number": "11001400300820240012345",
      "case_type": "Ejecutivo Singular",
      "act_type": "Término para contestar",
      "annotation": "Plazo de 10 días",
      "date": "2025-10-20",
      "formatted_date": "20/10/2025",
      "days_until": 3,
      "is_urgent": true,
      "is_overdue": false
    }
  ],
  "summary": {
    "total_cases": 17,
    "active_cases": 12,
    "total_acts": 234,
    "critical_acts": 8
  }
}
```

### Endpoints Adicionales

#### Timeline de Actuaciones

```php
GET /api/analytics/timeline?period=30
```

Parámetros:
- `period` (opcional): Número de días (default: 30)

Response:

```json
[
  {
    "date": "2025-10-15",
    "count": 5
  },
  {
    "date": "2025-10-16",
    "count": 3
  }
]
```

#### Casos por Tipo

```php
GET /api/analytics/cases-by-type
```

Response:

```json
[
  {
    "type": "Ejecutivo Singular",
    "count": 8
  },
  {
    "type": "Ordinario Laboral",
    "count": 5
  }
]
```

---

## ⚛️ Componentes Frontend

### 1. StatsCards

Tarjetas con estadísticas resumidas.

**Ubicación:** `apps/web/src/components/analytics/StatsCards.jsx`

**Uso:**

```jsx
import StatsCards from '../components/analytics/StatsCards';

<StatsCards summary={stats.summary} />
```

**Props:**

```typescript
{
  summary: {
    total_cases: number,
    active_cases: number,
    total_acts: number,
    critical_acts: number
  }
}
```

---

### 2. CasesByStatusChart

Gráfica de pie con distribución de casos por estado.

**Ubicación:** `apps/web/src/components/analytics/CasesByStatusChart.jsx`

**Uso:**

```jsx
import CasesByStatusChart from '../components/analytics/CasesByStatusChart';

<CasesByStatusChart data={stats.cases_by_status} />
```

**Props:**

```typescript
{
  data: Array<{
    status: string,
    label: string,
    count: number,
    color: string
  }>
}
```

**Características:**
- Gráfica de pie interactiva con Recharts
- Labels con porcentajes
- Leyenda con conteos
- Tooltips al hover
- Resumen de stats debajo

---

### 3. ActsByClassificationChart

Gráfica de barras con autos por urgencia.

**Ubicación:** `apps/web/src/components/analytics/ActsByClassificationChart.jsx`

**Uso:**

```jsx
import ActsByClassificationChart from '../components/analytics/ActsByClassificationChart';

<ActsByClassificationChart data={stats.acts_by_classification} />
```

**Props:**

```typescript
{
  data: Array<{
    classification: string,
    label: string,
    count: number,
    color: string
  }>
}
```

**Características:**
- Gráfica de barras con colores personalizados
- Barras con bordes redondeados
- Grid y ejes configurados
- Leyenda debajo con stats

---

### 4. RecentActivitiesTimeline

Timeline vertical con últimas actuaciones.

**Ubicación:** `apps/web/src/components/analytics/RecentActivitiesTimeline.jsx`

**Uso:**

```jsx
import RecentActivitiesTimeline from '../components/analytics/RecentActivitiesTimeline';

<RecentActivitiesTimeline activities={stats.recent_activities} />
```

**Props:**

```typescript
{
  activities: Array<{
    id: number,
    case_id: number,
    case_number: string,
    case_type: string,
    act_type: string,
    annotation: string,
    urgency_level: 'critical' | 'high' | 'medium' | 'low',
    formatted_date: string,
    relative_date: string
  }>
}
```

**Características:**
- Timeline vertical con línea conectora
- Iconos de urgencia diferenciados
- Links clickeables a casos
- Fechas relativas ("hace 2 días")
- Scroll vertical si > 5 items

---

### 5. UpcomingDeadlinesWidget

Widget de plazos próximos a vencer.

**Ubicación:** `apps/web/src/components/analytics/UpcomingDeadlinesWidget.jsx`

**Uso:**

```jsx
import UpcomingDeadlinesWidget from '../components/analytics/UpcomingDeadlinesWidget';

<UpcomingDeadlinesWidget deadlines={stats.upcoming_deadlines} />
```

**Props:**

```typescript
{
  deadlines: Array<{
    id: number,
    case_id: number,
    case_number: string,
    case_type: string,
    act_type: string,
    annotation: string,
    formatted_date: string,
    days_until: number,
    is_urgent: boolean,
    is_overdue: boolean
  }>
}
```

**Características:**
- Estados visuales:
  - ❌ **Vencido** (rojo) - `days_until < 0`
  - ⚠️ **Urgente** (naranja) - `days_until <= 7`
  - 📅 **Próximo** (amarillo) - `days_until > 7`
- Badges con días faltantes
- Links a casos
- Empty state cuando no hay plazos

---

## 📈 Métricas Disponibles

### Summary Stats

```typescript
{
  total_cases: number,      // Total de casos del usuario
  active_cases: number,     // Casos con status = 'active'
  total_acts: number,       // Total de autos
  critical_acts: number     // Autos con urgency_level = 'critical'
}
```

### Casos por Estado

Estados disponibles:
- `active` - Activo (verde)
- `archived` - Archivado (gris)
- `closed` - Cerrado (rojo)
- `pending` - Pendiente (ámbar)

### Autos por Clasificación

Clasificaciones:
- `critical` - Perentorio (rojo) - Urgencia máxima
- `high` - Urgente (ámbar) - Alta prioridad
- `medium` - Trámite (azul) - Prioridad media
- `low` - Pendiente (gris) - Baja prioridad

---

## 🎨 Gráficas

### Colores del Sistema

```javascript
// Status Colors
{
  active: '#10b981',    // green-500
  archived: '#6b7280',  // gray-500
  closed: '#ef4444',    // red-500
  pending: '#f59e0b'    // amber-500
}

// Urgency Colors
{
  critical: '#ef4444',  // red-500
  high: '#f59e0b',      // amber-500
  medium: '#3b82f6',    // blue-500
  low: '#6b7280'        // gray-500
}
```

### Recharts Configuration

```javascript
// Pie Chart
<PieChart>
  <Pie
    data={data}
    cx="50%"
    cy="50%"
    labelLine={false}
    label={renderCustomizedLabel}
    outerRadius={100}
    dataKey="value"
  />
  <Tooltip />
  <Legend />
</PieChart>

// Bar Chart
<BarChart data={data}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
    {data.map((entry, index) => (
      <Cell key={index} fill={entry.color} />
    ))}
  </Bar>
</BarChart>
```

---

## 🚀 Uso

### Integración en Dashboard Existente

```jsx
// apps/web/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { analytics } from '../lib/api';
import StatsCards from '../components/analytics/StatsCards';
import CasesByStatusChart from '../components/analytics/CasesByStatusChart';
import ActsByClassificationChart from '../components/analytics/ActsByClassificationChart';
import RecentActivitiesTimeline from '../components/analytics/RecentActivitiesTimeline';
import UpcomingDeadlinesWidget from '../components/analytics/UpcomingDeadlinesWidget';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  async function fetchDashboardStats() {
    try {
      setLoading(true);
      const data = await analytics.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Cargando...</div>;
  if (!stats) return null;

  return (
    <div>
      {/* Summary Cards */}
      <StatsCards summary={stats.summary} />

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mt-8">
        <CasesByStatusChart data={stats.cases_by_status} />
        <ActsByClassificationChart data={stats.acts_by_classification} />
      </div>

      {/* Deadlines */}
      {stats.upcoming_deadlines?.length > 0 && (
        <UpcomingDeadlinesWidget deadlines={stats.upcoming_deadlines} />
      )}

      {/* Timeline */}
      <RecentActivitiesTimeline activities={stats.recent_activities} />
    </div>
  );
}
```

### Refresh Manual

```jsx
function handleRefresh() {
  fetchDashboardStats();
}

<button onClick={handleRefresh}>
  <RefreshCw className="w-4 h-4" />
  Actualizar
</button>
```

---

## 🎨 Personalización

### Modificar Colores

**Backend** (`AnalyticsController.php`):

```php
private function getStatusColor($status)
{
    return match ($status) {
        'active' => '#your-color-hex',
        // ...
    };
}
```

**Frontend** (componentes):

```jsx
const chartData = data.map(item => ({
  ...item,
  color: customColorMap[item.status] || item.color
}));
```

### Cambiar Límite de Actividades

**Backend:**

```php
private function getRecentActivities($userId, $limit = 50) // Cambiar a 50
{
    // ...
}
```

**Frontend:**

```jsx
// StatsCard.jsx - personalizar iconos
const cards = [
  {
    title: 'Custom Metric',
    value: summary.custom_value,
    icon: CustomIcon,
    color: 'custom-color'
  }
];
```

### Agregar Nueva Métrica

1. **Backend - Agregar método:**

```php
// AnalyticsController.php
public function getCustomMetric(Request $request)
{
    $user = $request->user();

    $data = YourModel::where('user_id', $user->id)
        ->customQuery()
        ->get();

    return response()->json($data);
}
```

2. **Ruta:**

```php
// routes/api.php
Route::get('/analytics/custom-metric', [AnalyticsController::class, 'getCustomMetric']);
```

3. **Frontend API:**

```javascript
// lib/apiSecure.js
export const analytics = {
  // ...
  getCustomMetric: async () => {
    return apiRequest('/analytics/custom-metric');
  }
};
```

4. **Componente:**

```jsx
// components/analytics/CustomMetricChart.jsx
export default function CustomMetricChart({ data }) {
  return <YourChartImplementation data={data} />;
}
```

---

## 📚 Ejemplos

### Empty States

Todos los componentes incluyen estados vacíos:

```jsx
// CasesByStatusChart
if (!data || data.length === 0) {
  return (
    <div className="flex items-center justify-center h-64 text-gray-500">
      No hay datos disponibles
    </div>
  );
}
```

### Loading States

```jsx
if (loading) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}
```

### Error Handling

```jsx
try {
  const data = await analytics.getDashboardStats();
  setStats(data);
} catch (err) {
  console.error('Error:', err);
  setError(err.message);
}
```

---

## 🐛 Troubleshooting

### No aparecen datos

```bash
# Verificar que hay casos en la DB
php artisan tinker
>>> App\Models\CaseModel::count();

# Verificar endpoint
curl http://localhost:8000/api/analytics/dashboard-stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Gráficas no renderizan

```bash
# Verificar que recharts está instalado
cd apps/web
npm list recharts

# Reinstalar si es necesario
npm install recharts
```

### Colores no se muestran

Asegurarse de usar colores hex válidos:

```javascript
// ✅ Correcto
color: '#10b981'

// ❌ Incorrecto
color: 'green-500'  // Tailwind class no funciona en Recharts
```

---

## 📝 Referencias

- **Recharts Documentation:** https://recharts.org/
- **Tailwind CSS Colors:** https://tailwindcss.com/docs/customizing-colors
- **Laravel Collections:** https://laravel.com/docs/11.x/collections
- **React Hooks:** https://react.dev/reference/react

---

*Última actualización: 2025-10-17*
*Autor: Claude Code (Anthropic)*
*Versión: 1.0*
