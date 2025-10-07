# ✅ Checklist de Pruebas - LegalTech Colombia

## 🚀 Preparación Inicial

### Opción A: Usando Scripts Automáticos (Recomendado)

1. **Doble click en:** `CREATE_TEST_USER.bat`
   - ✅ Crea usuario admin@test.com / password
   - Espera mensaje "Usuario creado"

2. **Doble click en:** `START_SERVERS.bat`
   - ✅ Abre 2 ventanas: Backend + Frontend
   - Espera que ambas estén listas (~30 segundos)

3. **Abrir navegador:**
   - URL: http://localhost:3000

### Opción B: Manual

```bash
# Terminal 1: Backend
cd apps/api_php
php artisan tinker
# Dentro: User::create(['name'=>'Admin','email'=>'admin@test.com','password'=>bcrypt('password')]);
# Salir: exit
php artisan serve

# Terminal 2: Frontend
cd apps/web
npm install
npm run dev
```

---

## 📋 Tests Básicos (5 minutos)

### 1. Login ✅
- [ ] Abrir http://localhost:3000
- [ ] Ingresar: admin@test.com / password
- [ ] Click "Iniciar Sesión"
- [ ] **Esperado:** Redirige al Dashboard
- [ ] **Verificar:** No hay errores en consola (F12)

### 2. Dashboard ✅
- [ ] Ver 4 cards de estadísticas
- [ ] Ver gráfico de actividad
- [ ] Ver gráfico de distribución
- [ ] **Esperado:** Todo se renderiza correctamente

### 3. Documentos - Upload ✅
- [ ] Click en "Documentos" (sidebar)
- [ ] Verificar que se ve la zona de drag & drop
- [ ] Arrastrar un PDF al área
- [ ] **Esperado:**
  - Aparece progress indicator
  - Al terminar, documento en la lista
  - Icono rojo (PDF)
  - Tamaño correcto (ej: 2.5 MB)
  - Fecha de hoy

### 4. Documentos - Búsqueda ✅
- [ ] Escribir "test" en el buscador
- [ ] **Esperado:** Filtra en tiempo real
- [ ] Borrar búsqueda
- [ ] **Esperado:** Vuelven todos los documentos

### 5. Documentos - Detalle ✅
- [ ] Click en un documento de la lista
- [ ] **Esperado:**
  - Se abre modal
  - Muestra metadatos (tipo, tamaño, fecha)
  - Botón "Descargar" funciona
  - Botón "Cerrar" cierra modal

### 6. Documentos - Eliminar ✅
- [ ] Hover sobre un documento
- [ ] Click en icono de basura 🗑️
- [ ] Confirmar eliminación
- [ ] **Esperado:** Desaparece de la lista

### 7. Recordatorios - Vista ✅
- [ ] Click en "Recordatorios" (sidebar)
- [ ] **Esperado:**
  - Se ve calendario grande (izquierda)
  - Se ve lista lateral (derecha)
  - 3 tabs: Próximos / Vencidos / Completados
  - 3 cards de estadísticas arriba

### 8. Recordatorios - Crear ✅
- [ ] Click en "Nuevo Recordatorio" (botón azul)
- [ ] Llenar formulario:
  - Título: "Audiencia Test"
  - Tipo: "Audiencia"
  - Prioridad: "Alta"
  - Fecha: Mañana a las 10:00 AM
- [ ] Click "Crear"
- [ ] **Esperado:**
  - Evento rojo aparece en calendario
  - Aparece en lista lateral (tab "Próximos")
  - Tiene punto rojo (prioridad alta)

### 9. Recordatorios - Marcar Completado ✅
- [ ] En lista lateral, buscar el recordatorio creado
- [ ] Click en botón ✓ (Completar)
- [ ] **Esperado:**
  - Desaparece de "Próximos"
  - Aparece en tab "Completados"
  - Desaparece del calendario

### 10. Recordatorios - Vencido ✅
- [ ] Crear nuevo recordatorio con fecha de ayer
- [ ] **Esperado:**
  - Aparece en tab "Vencidos"
  - Se muestra en la lista con fecha pasada

---

## 🔍 Verificaciones Técnicas

### Console (F12 → Console) ✅
- [ ] **No debe haber errores rojos**
- [ ] Warnings amarillos son OK (pero evitar)
- [ ] Si hay error CORS → verificar .env del backend

### Network (F12 → Network) ✅
- [ ] Al subir documento:
  - POST a `/api/documents`
  - Status: 200 o 201
  - Response contiene el documento

- [ ] Al crear recordatorio:
  - POST a `/api/reminders`
  - Status: 200 o 201
  - Response contiene el recordatorio

### Responsive (F12 → Toggle Device) ✅
- [ ] Cambiar a iPhone/Android
- [ ] **Documentos:**
  - Cards apilados en 1 columna
  - Upload sigue funcionando

- [ ] **Recordatorios:**
  - Calendario arriba, lista abajo
  - Todo es navegable con touch

---

## 📊 Resultados Esperados

### ✅ Si TODO pasa:
```
✅ 10/10 Tests Básicos
✅ Sin errores en consola
✅ API responde correctamente
✅ UI responsive funciona
```

**Estado:** 🎉 PRODUCTION READY

### ⚠️ Si falla alguno:

#### Error de Login
**Síntoma:** "Invalid credentials"
**Solución:**
```bash
cd apps/api_php
php artisan tinker
User::where('email', 'admin@test.com')->first()
# Si es null, créalo de nuevo
```

#### Error al subir documento
**Síntoma:** "Network Error" o "500 Server Error"
**Solución:**
1. Verificar backend corriendo: http://localhost:8000
2. Verificar ruta existe:
   ```bash
   cd apps/api_php
   php artisan route:list | grep documents
   ```
3. Verificar CORS en apps/api_php/.env:
   ```
   FRONTEND_URL=http://localhost:3000
   ```

#### Calendario no carga
**Síntoma:** Pantalla en blanco o error en consola
**Solución:**
```bash
cd apps/web
npm install react-big-calendar date-fns
npm run dev
```

#### Drag & drop no funciona
**Síntoma:** No se puede arrastrar archivos
**Solución:**
```bash
cd apps/web
npm install react-dropzone
npm run dev
```

---

## 📸 Screenshots de Referencia

### Documentos - Vista Principal
```
┌─────────────────────────────────────────────────────┐
│ Gestión de Documentos                      [+ Subir]│
│ Sube, organiza y comparte tus documentos            │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │   📄  Arrastra archivos aquí                   │ │
│  │       o haz click para seleccionar             │ │
│  │   PDF, Imágenes, Word, Excel (máx. 10MB)      │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  [🔍 Buscar documentos...]        [⚙️ Filtros]     │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ 📄       │  │ 🖼️       │  │ 📄       │         │
│  │ Contrato │  │ Foto     │  │ Factura  │         │
│  │ 2.5 MB   │  │ 1.2 MB   │  │ 500 KB   │         │
│  │ Hoy      │  │ Ayer     │  │ 2d ago   │         │
│  │ [Ver][⬇][🗑] │  [Ver][⬇][🗑] │  [Ver][⬇][🗑] │         │
│  └──────────┘  └──────────┘  └──────────┘         │
└─────────────────────────────────────────────────────┘
```

### Recordatorios - Vista Principal
```
┌──────────────────────────────────────────────────────────────┐
│ Recordatorios                              [+ Nuevo]          │
│                                                               │
│ [📊 Próximos: 3] [⚠️ Vencidos: 1] [✓ Completados: 5]        │
├──────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────┐ ┌────────────────────────┐  │
│ │      OCTUBRE 2025           │ │   LISTA LATERAL        │  │
│ │                             │ │                        │  │
│ │  L  M  X  J  V  S  D       │ │  [Próximos]            │  │
│ │  1  2  3  4  5  6  7       │ │                        │  │
│ │        🔴 Audiencia         │ │  ● Audiencia Cliente X │  │
│ │  8  9 10 11 12 13 14       │ │    10:00 AM            │  │
│ │           🟡 Reunión        │ │    Alta 🔴             │  │
│ │ 15 16 17 18 19 20 21       │ │    [✓][✏️][🗑️]        │  │
│ │                             │ │                        │  │
│ │ 22 23 24 25 26 27 28       │ │  ● Reunión Equipo      │  │
│ │     🟢 Pago                 │ │    15:00               │  │
│ │ 29 30 31                   │ │    Media 🟡            │  │
│ │                             │ │    [✓][✏️][🗑️]        │  │
│ └─────────────────────────────┘ └────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎯 Próximos Pasos Después de Verificar

### Si TODO funciona ✅

**Opción A: Continuar Desarrollo**
1. Implementar Facturación
2. Implementar Time Tracking
3. Implementar Analytics
4. Implementar Jurisprudencia

**Opción B: Mejorar Existente**
1. Agregar tests E2E (Cypress/Playwright)
2. Mejorar UX/animaciones
3. Optimizar performance
4. Agregar más validaciones

**Opción C: Deploy**
1. Preparar para producción
2. Configurar CI/CD
3. Deploy a servidor
4. Configurar dominio

### Si hay errores ⚠️

1. Revisar consola del navegador (F12)
2. Revisar logs del backend (terminal)
3. Consultar QUICK_TEST.md
4. Consultar sección troubleshooting arriba
5. Si persiste, reportar con:
   - Screenshot del error
   - Pasos para reproducir
   - Logs de consola
   - Network tab

---

## 📞 Soporte

Para reportar problemas:
1. Captura de pantalla del error
2. Consola del navegador (F12)
3. Pasos exactos para reproducir
4. Network tab (request/response)

---

**Tiempo estimado:** 5-10 minutos
**Dificultad:** Fácil
**Prerequisitos:** Backend + Frontend corriendo

¡Buena suerte con las pruebas! 🚀
