# Sistema de Colas de Arconte

## Estado Actual

✅ **Sistema configurado y funcionando**
- Tabla `jobs` creada en PostgreSQL
- `QUEUE_CONNECTION=database` configurado en `.env`
- Queue worker puede ejecutarse en background

---

## DESARROLLO (Windows con Herd)

### Opción 1: Script Principal (RECOMENDADO) ✨

El queue worker **ya está integrado** en el script de inicio principal:

```cmd
cd scripts\dev
start-all.bat
```

Esto iniciará automáticamente:
- ✅ PostgreSQL y Redis (Docker)
- ✅ Backend Laravel (puerto 8000)
- ✅ **Queue Worker con auto-reinicio**
- ✅ Frontend React (puerto 3000)
- ✅ Ingest Service Python (puerto 8001)

**Todo en ventanas separadas para fácil monitoreo.**

### Opción 2: Solo Queue Worker

Si solo necesitas iniciar el queue worker manualmente:

```cmd
cd apps\api_php
start-queue-worker.bat
```

**Características:**
- ✅ Se reinicia automáticamente si falla
- ✅ Muestra logs en tiempo real
- ✅ Fácil de detener (Ctrl+C)

### Opción 3: Comando Manual

Terminal dedicada al worker:

```cmd
cd apps\api_php
"C:\Users\David\.config\herd\bin\php84\php.exe" artisan queue:work --verbose --tries=3 --timeout=120
```

### ⚠️ IMPORTANTE EN DESARROLLO

Si el worker NO está corriendo, los jobs quedan pendientes en la tabla `jobs` y nunca se procesan.

**Recomendación:** Usa siempre `scripts\dev\start-all.bat` para iniciar todo el sistema completo y asegurar que el queue worker esté corriendo.

---

## PRODUCCIÓN (Linux con Supervisor)

### 1. Instalar Supervisor

```bash
sudo apt-get install supervisor
```

### 2. Configurar Worker

```bash
# Copiar archivo de configuración
sudo cp supervisor-queue-worker.conf /etc/supervisor/conf.d/arconte-worker.conf

# Editar y actualizar rutas
sudo nano /etc/supervisor/conf.d/arconte-worker.conf
```

**Actualizar estas líneas:**
```ini
command=php /ruta/real/a/arconte/apps/api_php/artisan queue:work --sleep=3 --tries=3 --max-time=3600
user=www-data  # O el usuario de tu servidor web
```

### 3. Crear logs

```bash
sudo mkdir -p /var/log
sudo touch /var/log/arconte-worker.log
sudo chown www-data:www-data /var/log/arconte-worker.log
```

### 4. Iniciar Supervisor

```bash
# Recargar configuración
sudo supervisorctl reread
sudo supervisorctl update

# Iniciar workers
sudo supervisorctl start arconte-worker:*

# Verificar estado
sudo supervisorctl status arconte-worker:*
```

**Salida esperada:**
```
arconte-worker:arconte-worker_00  RUNNING   pid 12345, uptime 0:00:10
arconte-worker:arconte-worker_01  RUNNING   pid 12346, uptime 0:00:10
```

### 5. Comandos útiles en producción

```bash
# Ver logs en tiempo real
sudo supervisorctl tail -f arconte-worker:arconte-worker_00

# Reiniciar workers (después de cambios en código)
sudo supervisorctl restart arconte-worker:*

# Detener workers
sudo supervisorctl stop arconte-worker:*
```

---

## Verificación del Sistema

### 1. Verificar configuración

```bash
php artisan tinker --execute="echo 'Queue Connection: ' . config('queue.default') . PHP_EOL;"
```

**Salida esperada:** `Queue Connection: database`

### 2. Ver jobs pendientes

```bash
php artisan tinker --execute="echo json_encode(DB::select('SELECT COUNT(*) as count FROM jobs'));"
```

### 3. Ver jobs en cola

```sql
-- Conectar a PostgreSQL
psql -U arconte -d arconte

-- Ver jobs pendientes
SELECT id, queue, attempts, created_at
FROM jobs
ORDER BY id DESC
LIMIT 10;

-- Ver jobs fallidos
SELECT * FROM failed_jobs ORDER BY id DESC LIMIT 10;
```

---

## Flujo de Procesamiento

### Antes (Síncrono - BLOQUEANTE)
```
Usuario → API POST /cases → CaseController
                           ↓
                    FetchCaseDataJob se ejecuta AHORA
                           ↓ (60 segundos de espera)
                    Respuesta HTTP ← Usuario sigue esperando
```

### Ahora (Asíncrono - NO BLOQUEANTE)
```
Usuario → API POST /cases → CaseController
                           ↓
                    Job se guarda en tabla 'jobs'
                           ↓
                    Respuesta HTTP INMEDIATA ← Usuario (< 1 segundo)

MIENTRAS TANTO (en paralelo):
Queue Worker → Lee job de tabla → Ejecuta FetchCaseDataJob → Marca como completado
```

---

## Troubleshooting

### Worker no procesa jobs

```bash
# Verificar que el worker esté corriendo
ps aux | grep "queue:work"  # Linux
tasklist | findstr php      # Windows

# Verificar logs del worker
tail -f storage/logs/laravel.log
```

### Jobs fallan constantemente

```bash
# Ver detalles de jobs fallidos
php artisan queue:failed

# Reintentar job específico
php artisan queue:retry <job-id>

# Reintentar todos los jobs fallidos
php artisan queue:retry all
```

### Limpiar jobs viejos

```bash
# Limpiar jobs fallidos
php artisan queue:flush

# Limpiar jobs pendientes (CUIDADO: elimina todos los pendientes)
php artisan tinker --execute="DB::table('jobs')->truncate();"
```

---

## Monitoreo Recomendado

En producción considera usar:

1. **Laravel Horizon** (para Redis)
2. **Laravel Queue Monitor** (para database driver)
3. **Logs centralizados** (Sentry, LogRocket, etc.)

---

## Próximos Pasos

- [ ] Configurar Supervisor en producción
- [ ] Implementar notificaciones de jobs fallidos
- [ ] Agregar métricas de rendimiento de jobs
- [ ] Considerar migrar a Redis para mejor performance
