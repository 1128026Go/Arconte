# 🚀 Prueba Rápida - 5 Minutos

## Paso 1: Preparar Backend (Terminal 1)

```bash
cd apps/api_php

# Refrescar base de datos
php artisan migrate:fresh

# Crear usuario de prueba
php artisan tinker
```

En tinker, pega esto:
```php
$user = App\Models\User::create([
    'name' => 'Admin Test',
    'email' => 'admin@test.com',
    'password' => bcrypt('password')
]);

// Crear 3 casos de prueba
$case1 = App\Models\CaseModel::create([
    'user_id' => $user->id,
    'radicado' => '11001-31-03-001-2025-00001-00',
    'tipo_proceso' => 'Civil',
    'despacho' => 'Juzgado 1 Civil Circuito'
]);

$case2 = App\Models\CaseModel::create([
    'user_id' => $user->id,
    'radicado' => '11001-31-03-002-2025-00002-00',
    'tipo_proceso' => 'Laboral',
    'despacho' => 'Juzgado 2 Laboral'
]);

// Salir de tinker
exit
```

Luego:
```bash
# Iniciar servidor
php artisan serve
```

✅ Deberías ver: `Starting Laravel development server: http://127.0.0.1:8000`

---

## Paso 2: Iniciar Frontend (Terminal 2)

```bash
cd apps/web

# Instalar dependencias (si no lo hiciste)
npm install

# Iniciar dev server
npm run dev
```

✅ Deberías ver: `Local: http://localhost:3000/`

---

## Paso 3: Hacer Login

1. Abre http://localhost:3000
2. Login con:
   - Email: `admin@test.com`
   - Password: `password`
3. ✅ Deberías entrar al Dashboard

---

## Paso 4: Probar Documentos (2 min)

### 4.1 Ir a Documentos
- Click en "Documentos" en sidebar
- URL: http://localhost:3000/documents

### 4.2 Subir un Documento
1. Arrastra cualquier PDF a la zona de drag & drop
   - O click para seleccionar archivo
2. ✅ Debería aparecer en la lista con:
   - Icono rojo (PDF)
   - Nombre del archivo
   - Tamaño (ej: 2.5 MB)
   - Fecha de hoy

### 4.3 Ver Detalle
1. Click en el documento
2. ✅ Se abre modal con metadatos
3. Click en "Descargar"
4. ✅ Se descarga el archivo

### 4.4 Eliminar
1. Click en ícono de basura 🗑️
2. Confirmar
3. ✅ Desaparece de la lista

---

## Paso 5: Probar Recordatorios (2 min)

### 5.1 Ir a Recordatorios
- Click en "Recordatorios" en sidebar
- URL: http://localhost:3000/reminders

### 5.2 Crear Recordatorio
1. Click en "Nuevo Recordatorio" (botón azul arriba)
2. Llenar:
   - Título: `Audiencia Cliente X`
   - Tipo: `Audiencia`
   - Prioridad: `Alta`
   - Fecha: Mañana a las 10:00 AM
3. Click "Crear"
4. ✅ Aparece en el calendario como evento rojo

### 5.3 Ver en Lista
1. Mira la lista lateral derecha
2. ✅ Debería estar en tab "Próximos"
3. ✅ Con un punto rojo (prioridad alta)

### 5.4 Marcar Completado
1. Click en botón "Completar" (✓)
2. ✅ Pasa al tab "Completados"
3. ✅ Desaparece del calendario

### 5.5 Crear uno Vencido
1. Click "Nuevo Recordatorio"
2. Llenar con fecha de ayer
3. Guardar
4. ✅ Aparece en tab "Vencidos"

---

## Paso 6: Verificar que TODO funciona

### Checklist Rápido:
- [ ] Login funciona
- [ ] Dashboard muestra stats
- [ ] Puedo subir documento
- [ ] Puedo ver documento
- [ ] Puedo eliminar documento
- [ ] Puedo crear recordatorio
- [ ] Recordatorio aparece en calendario
- [ ] Puedo marcar como completado
- [ ] Tabs (Próximos/Vencidos/Completados) funcionan
- [ ] No hay errores en consola (F12)

---

## 🐛 Si algo falla:

### Backend no inicia:
```bash
# Verifica puerto 8000 libre
netstat -ano | findstr :8000

# Si está ocupado, mata el proceso o usa otro puerto:
php artisan serve --port=8001
```

### Frontend no compila:
```bash
cd apps/web
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Login no funciona:
```bash
# En apps/api_php
php artisan tinker

# Verifica que existe el usuario
App\Models\User::where('email', 'admin@test.com')->first();

# Si es null, créalo de nuevo (ver Paso 1)
```

### "Network Error" al subir documento:
1. Verifica que backend esté corriendo (http://localhost:8000)
2. Abre DevTools → Console
3. Busca error CORS
4. Verifica apps/api_php/.env tenga:
   ```
   FRONTEND_URL=http://localhost:3000
   ```

---

## ✅ Si TODO funciona:

**¡Felicidades!** El frontend está completamente operativo.

Siguiente paso: Implementar las páginas restantes:
1. Facturación
2. Time Tracking
3. Jurisprudencia
4. Analytics

O bien, mejorar las existentes con:
- Paginación
- Ordenamiento
- Más filtros
- Exportar a Excel/PDF
- Compartir documentos
- Recordatorios recurrentes

---

## 📸 Screenshots Esperados

### Documentos:
```
┌─────────────────────────────────────────────┐
│ Gestión de Documentos                       │
│ Sube, organiza y comparte tus documentos    │
│                                             │
│ ┌────────────────────────────────────────┐ │
│ │  📄 Arrastra archivos aquí            │ │
│ │     o haz click para seleccionar       │ │
│ │  PDF, Imágenes, Word, Excel (10MB)    │ │
│ └────────────────────────────────────────┘ │
│                                             │
│ [🔍 Buscar...]            [⚙️ Filtros]     │
│                                             │
│ ┌────────┐ ┌────────┐ ┌────────┐          │
│ │ 📄 Doc1│ │ 🖼️ Img│ │ 📋 XLS│          │
│ │ 2.5 MB │ │ 1.2 MB│ │ 500 KB│          │
│ │ Hoy    │ │ Ayer  │ │ 3d ago│          │
│ └────────┘ └────────┘ └────────┘          │
└─────────────────────────────────────────────┘
```

### Recordatorios:
```
┌──────────────────────────────────────────────────┐
│ Recordatorios                    [+ Nuevo]       │
│                                                  │
│ [📊 Próximos: 3] [⚠️ Vencidos: 1] [✓ Completados: 5] │
│                                                  │
│ ┌─────────────────┐  ┌──────────────────┐     │
│ │    CALENDARIO   │  │  LISTA LATERAL   │     │
│ │                 │  │                  │     │
│ │  L M X J V S D │  │ [Próximos]       │     │
│ │  1 2 3 4 5 6 7 │  │ • Audiencia X    │     │
│ │  🔴            │  │   10:00 AM       │     │
│ │  8 9 10 11...  │  │   [✓][✏️][🗑️]    │     │
│ └─────────────────┘  └──────────────────┘     │
└──────────────────────────────────────────────────┘
```

---

**Tiempo total estimado: 5-7 minutos** ⏱️

Si terminas en menos, todo está perfecto! 🎉
