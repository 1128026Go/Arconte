# ✅ TESTING COMPLETO - ARCONTE 2025

**Fecha:** 2025-01-09
**Estado:** Todos los servicios corriendo ✅
**Cache:** Limpiado ✅

---

## 🚀 SERVICIOS ACTIVOS

✅ **React (Frontend):** Puerto 3000 - CORRIENDO
✅ **Laravel (API):** Puerto 8000 - CORRIENDO
✅ **FastAPI (Ingest):** Puerto 8001 - CORRIENDO

---

## 🔗 LINKS PARA PROBAR

### 🏠 APLICACIÓN PRINCIPAL
**Frontend React:**
```
http://localhost:3000
```

**Login:**
- Email: `tu_email@example.com`
- Password: `tu_contraseña`

---

### 📊 DASHBOARD
```
http://localhost:3000/
```

**Funcionalidades a probar:**
- ✅ 4 KPI Cards (Total casos, Notificaciones, Alta prioridad, Hoy)
- ✅ Line Chart (Actividad últimos 7 días)
- ✅ Pie Chart (Distribución por estado)
- ✅ Lista de casos recientes

---

### 📁 CASOS
```
http://localhost:3000/cases
```

**Funcionalidades a probar:**
- ✅ Ver lista de casos
- ✅ Crear nuevo caso
- ✅ Eliminar caso (botón rojo con icono basura)
- ✅ Modal de confirmación de eliminación

---

### 📄 DETALLE DE CASO
```
http://localhost:3000/cases/{id}
```
(Reemplazar `{id}` con el ID de un caso existente)

**Funcionalidades a probar:**
- ✅ Ver información del caso
- ✅ Ver actuaciones (timeline)
- ✅ Ver partes del proceso
- ✅ **NUEVO: Sistema de Archivos Adjuntos**

---

### 📎 ARCHIVOS ADJUNTOS (NUEVO)

**Ubicación:** Scroll down en la página de detalle del caso

**Test 1: Subir Archivo**
1. Click en botón "Subir Archivo"
2. Seleccionar un archivo (máx 10MB)
3. ✅ Debe aparecer en la lista inmediatamente
4. ✅ Debe mostrar: nombre, tamaño, fecha

**Test 2: Editar Metadatos**
1. Click en icono de lápiz (editar)
2. Agregar categoría: "Documento Legal"
3. Agregar descripción: "Demanda principal"
4. Click "Guardar"
5. ✅ Debe actualizar sin recargar página

**Test 3: Descargar Archivo**
1. Click en icono de descarga
2. ✅ Debe descargarse con nombre original

**Test 4: Eliminar Archivo**
1. Click en icono de basura (rojo)
2. ✅ Debe pedir confirmación
3. Confirmar eliminación
4. ✅ Debe desaparecer de la lista

---

### ⚙️ SETTINGS
```
http://localhost:3000/settings
```

**Test Perfil:**
1. Modificar nombre
2. Guardar cambios
3. ✅ Debe mostrar mensaje de éxito
4. Recargar página
5. ✅ Cambios deben persistir

**Test Contraseña:**
1. Tab "Seguridad"
2. Ingresar contraseña actual
3. Nueva contraseña (mín 8 caracteres)
4. Confirmar nueva contraseña
5. ✅ Debe mostrar éxito

**Test Preferencias:**
1. Tab "Preferencias"
2. Cambiar tema/idioma/timezone
3. ✅ Debe guardar correctamente

**Test Notificaciones:**
1. Tab "Notificaciones"
2. Toggle switches
3. ✅ Debe guardar configuración

---

## 🔧 TESTS DE API

### FastAPI (Puerto 8001)

**Health Check:**
```bash
curl http://127.0.0.1:8001/healthz
```
✅ Respuesta esperada:
```json
{"ok":true,"service":"ingest_py","status":"healthy"}
```

**Jurisprudencia - Recientes:**
```bash
curl -H "X-API-Key: 5d95c7ed99d196f47c374cc04c7cf77c2235a29b67dc85baa573f3bb815024b1" http://127.0.0.1:8001/jurisprudencia/recientes?limit=5
```

**Jurisprudencia - Búsqueda:**
```bash
curl -H "X-API-Key: 5d95c7ed99d196f47c374cc04c7cf77c2235a29b67dc85baa573f3bb815024b1" "http://127.0.0.1:8001/jurisprudencia/buscar?q=salud&limit=5"
```

---

### Laravel (Puerto 8000)

**Verificar Rutas:**
```bash
cd "C:\Users\David\Herd\Aplicacion Juridica\Aplicacion Juridica\apps\api_php"
php artisan route:list --path=attachments
```

✅ Debe mostrar 5 rutas de attachments

---

## 🤖 SINCRONIZACIÓN AUTOMÁTICA

### Ver Comandos Programados
```bash
cd "C:\Users\David\Herd\Aplicacion Juridica\Aplicacion Juridica\apps\api_php"
php artisan schedule:list
```

✅ Debe mostrar:
- `sync:cases` - Programado a las 2:00 AM

### Ejecutar Sincronización Manual (OPCIONAL)

**Advertencia:** Este comando sincronizará TODOS los casos y puede tardar varios minutos.

```bash
cd "C:\Users\David\Herd\Aplicacion Juridica\Aplicacion Juridica\apps\api_php"
php artisan sync:cases
```

**Salida Esperada:**
```
🚀 Iniciando sincronización de casos...

📊 Total de casos a sincronizar: X

█████████████████████████████████ X/X

+------------------+----------+
| Métrica          | Cantidad |
+------------------+----------+
| Total de casos   | X        |
| ✅ Actualizados  | X        |
| 🔄 Sin cambios   | X        |
| ❌ Fallidos      | 0        |
+------------------+----------+

✨ Se sincronizaron exitosamente X casos con actualizaciones.
```

**Sincronizar solo un usuario específico:**
```bash
php artisan sync:cases --user_id=1
```

---

## ✅ VERIFICACIONES COMPLETADAS

### Migraciones
- ✅ Tabla `attachments` creada
- ✅ Campos: id, case_id, user_id, name, file_path, file_type, file_size, category, description
- ✅ Soft deletes habilitado
- ✅ Índices en case_id, user_id, category
- ✅ Foreign keys con cascade delete

### Rutas API
- ✅ GET `/api/cases/{caseId}/attachments` - Listar archivos
- ✅ POST `/api/cases/{caseId}/attachments` - Subir archivo
- ✅ GET `/api/cases/{caseId}/attachments/{id}/download` - Descargar
- ✅ PUT `/api/cases/{caseId}/attachments/{id}` - Actualizar metadatos
- ✅ DELETE `/api/cases/{caseId}/attachments/{id}` - Eliminar

### Scheduler
- ✅ Comando `sync:cases` creado
- ✅ Programado a las 2:00 AM diariamente
- ✅ Sin overlapping configurado
- ✅ Ejecución en background

### Cache
- ✅ Application cache cleared
- ✅ Configuration cache cleared
- ✅ Route cache cleared
- ✅ Compiled views cleared

---

## 📋 CHECKLIST DE TESTING MANUAL

### Dashboard
- [ ] Ver KPIs correctos
- [ ] Line chart se muestra
- [ ] Pie chart se muestra
- [ ] Lista de casos recientes visible
- [ ] Click en "Ver todos" funciona

### Casos
- [ ] Lista de casos se carga
- [ ] Crear caso funciona
- [ ] Eliminar caso muestra modal
- [ ] Confirmación de eliminación funciona
- [ ] Caso desaparece después de eliminar

### Detalle de Caso
- [ ] Información del caso visible
- [ ] Actuaciones en timeline
- [ ] Partes del proceso visible

### Archivos Adjuntos (NUEVO)
- [ ] Sección "Archivos Adjuntos" visible
- [ ] Botón "Subir Archivo" funciona
- [ ] Archivo se sube correctamente
- [ ] Archivo aparece en lista
- [ ] Editar categoría funciona
- [ ] Editar descripción funciona
- [ ] Descargar archivo funciona
- [ ] Eliminar archivo muestra confirmación
- [ ] Archivo se elimina correctamente
- [ ] Validación de 10MB funciona

### Settings
- [ ] Perfil se actualiza
- [ ] Cambio de contraseña funciona
- [ ] Preferencias se guardan
- [ ] Notificaciones se configuran

### API
- [ ] FastAPI health check responde
- [ ] Jurisprudencia API funciona
- [ ] Rutas de attachments existen

### Scheduler
- [ ] Comando sync:cases listado
- [ ] Programado a las 2:00 AM
- [ ] Ejecución manual funciona (opcional)

---

## 🎯 PRÓXIMOS PASOS

1. ✅ **Completar testing manual** usando este checklist
2. ⏳ **Reportar bugs** si encuentras alguno
3. ⏳ **Configurar variables de entorno** para producción
4. ⏳ **Configurar cron job** para el scheduler en servidor
5. ⏳ **Configurar SMTP** para emails de notificaciones

---

## 🚨 NOTAS IMPORTANTES

### Archivos Adjuntos
- Límite de tamaño: **10MB por archivo**
- Almacenamiento: `storage/app/attachments/{case_id}/`
- Formatos soportados: Todos
- Soft deletes: Los archivos eliminados se pueden recuperar desde la BD

### Sincronización
- **Frecuencia:** Diariamente a las 2:00 AM
- **Delay:** 2 segundos entre requests (evitar sobrecarga)
- **Emails:** Se envían solo si hay actualizaciones
- **Logs:** Revisar `storage/logs/laravel.log` para errores

### Performance
- Los archivos se sirven mediante stream (no se cargan en memoria)
- Índices en FK para consultas rápidas
- Cache habilitado en caso controller

---

## 📞 COMANDOS ÚTILES

### Ver logs de Laravel
```bash
tail -f "C:\Users\David\Herd\Aplicacion Juridica\Aplicacion Juridica\apps\api_php\storage\logs\laravel.log"
```

### Ver archivos subidos
```bash
dir "C:\Users\David\Herd\Aplicacion Juridica\Aplicacion Juridica\apps\api_php\storage\app\attachments"
```

### Limpiar cache nuevamente
```bash
cd "C:\Users\David\Herd\Aplicacion Juridica\Aplicacion Juridica\apps\api_php"
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

---

## 🎉 ¡LISTO PARA PROBAR!

Todos los servicios están corriendo y las funcionalidades están implementadas.

**Empieza aquí:** http://localhost:3000

**Documentación completa:** Ver archivo `NUEVAS_IMPLEMENTACIONES_2025.md`

---

**¡Buena suerte con las pruebas! 🚀**
