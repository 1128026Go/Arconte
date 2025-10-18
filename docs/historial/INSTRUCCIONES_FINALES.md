# 🚀 Instrucciones Finales - Pasos Manuales Requeridos

**Fecha:** 9 de Octubre, 2025
**Estado:** ✅ Casi completado - Solo faltan pasos manuales

---

## ✅ Lo que YA está hecho

1. ✅ **Credenciales actualizadas** en `.env`
2. ✅ **Docker Compose** creado (`docker-compose.yml`)
3. ✅ **PostgreSQL y Redis** configurados en `.env`
4. ✅ **HttpOnly Cookies** implementadas en AuthController
5. ✅ **Middlewares** registrados en `bootstrap/app.php`
6. ✅ **Índices de BD** creados (migración lista)
7. ✅ **Headers de seguridad** implementados
8. ✅ **Axios actualizado** a 1.7.7
9. ✅ **Tests configurados** con Vitest
10. ✅ **Dependencias frontend** instaladas

---

## 📋 Pasos que DEBES hacer manualmente

### Paso 1: Levantar Docker (PostgreSQL + Redis)

Abre **PowerShell** o **CMD** como administrador y ejecuta:

```powershell
# Navegar al proyecto
cd "C:\Users\David\Herd\Aplicacion Juridica\Aplicacion Juridica"

# Levantar servicios
docker compose up -d

# Verificar que estén corriendo
docker compose ps

# Deberías ver:
# - arconte_postgres (running)
# - arconte_redis (running)
# - arconte_adminer (running)
```

**Espera 30 segundos** para que PostgreSQL termine de inicializarse.

**Verificar logs:**
```powershell
docker compose logs postgres
# Busca: "database system is ready to accept connections"
```

---

### Paso 2: Migrar Base de Datos

Una vez que PostgreSQL esté listo:

```powershell
# Navegar a la carpeta del backend
cd "apps\api_php"

# Ejecutar migraciones
php artisan migrate:fresh --seed

# Si todo está bien, deberías ver:
# Migration: 2025_10_09_000001_add_critical_indexes.php ......... DONE
# Seeding: DatabaseSeeder .......... DONE
```

**Verificar la migración:**
```powershell
php artisan db:show
php artisan db:table case_models
```

---

### Paso 3: Verificar Configuración

**Comprobar que Redis funciona:**
```powershell
php artisan tinker

# En tinker, ejecuta:
Cache::put('test', 'funcionando');
Cache::get('test');
# Debería retornar: "funcionando"

# Salir con: exit
```

**Comprobar PostgreSQL:**
```powershell
php artisan tinker

# En tinker:
DB::connection()->getPdo();
# No debería dar error

User::count();
# Debería retornar el número de usuarios
```

---

### Paso 4: Iniciar Servicios de Desarrollo

**Opción A: Usando los scripts existentes**
```powershell
# Volver a la raíz del proyecto
cd "C:\Users\David\Herd\Aplicacion Juridica\Aplicacion Juridica"

# Ejecutar script de desarrollo (si existe)
npm run dev
```

**Opción B: Manual (en terminales separadas)**

**Terminal 1 - Backend:**
```powershell
cd "C:\Users\David\Herd\Aplicacion Juridica\Aplicacion Juridica\apps\api_php"
php artisan serve
# Corriendo en: http://localhost:8000
```

**Terminal 2 - Frontend:**
```powershell
cd "C:\Users\David\Herd\Aplicacion Juridica\Aplicacion Juridica\apps\web"
npm run dev
# Corriendo en: http://localhost:3000
```

**Terminal 3 - Ingest Service (Python):**
```powershell
cd "C:\Users\David\Herd\Aplicacion Juridica\Aplicacion Juridica\apps\ingest_py"
python run_persistent.py
# Corriendo en: http://localhost:8001
```

---

### Paso 5: Probar la Aplicación

1. **Abrir navegador** en: `http://localhost:3000`

2. **Ir a DevTools** (F12)

3. **Ir a la pestaña Application > Cookies**

4. **Login** con usuario de prueba:
   - Email: (el que creaste con seeders)
   - Password: (la que definiste)

5. **Verificar que se crea la cookie:**
   - Busca: `arconte_token`
   - Debe tener `HttpOnly: ✓`
   - Debe tener `SameSite: Lax`

6. **Ir a Network** y hacer una petición (ej: ir a Cases)
   - Verificar en Headers que hay:
     - `Cookie: arconte_token=...`
     - Headers de seguridad (CSP, X-Frame-Options, etc.)

---

### Paso 6: Verificar Tests

```powershell
cd "apps\web"

# Ejecutar tests
npm test

# Debería pasar:
# ✓ Button Component (4 tests)
# ✓ API Client - Auth (2 tests)
```

---

## 🔍 Troubleshooting

### Problema: Docker no inicia

**Solución:**
```powershell
# Verificar que Docker Desktop esté corriendo
docker --version

# Si no está instalado, descarga de:
# https://www.docker.com/products/docker-desktop/
```

### Problema: Migraciones fallan

**Error:** `SQLSTATE[42P01]: Undefined table`

**Solución:**
```powershell
# Limpiar y volver a migrar
php artisan migrate:fresh --seed --force
```

### Problema: Frontend no conecta con backend

**Error en consola:** `CORS error` o `401 Unauthorized`

**Solución:**
1. Verificar que `.env` del backend tenga:
   ```env
   SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000
   ```

2. Limpiar cookies del navegador:
   - DevTools > Application > Cookies > Eliminar todo

3. Hacer logout y volver a login

### Problema: Redis no funciona

**Error:** `Connection refused [tcp://127.0.0.1:6379]`

**Solución:**
```powershell
# Verificar que Redis esté corriendo
docker compose ps

# Si no está, reiniciar:
docker compose restart redis
```

---

## 📊 Checklist Final de Verificación

Antes de dar por terminado, verifica:

- [ ] Docker compose corriendo (`docker compose ps`)
- [ ] PostgreSQL accesible (puerto 5432)
- [ ] Redis accesible (puerto 6379)
- [ ] Migraciones ejecutadas (38+ migraciones)
- [ ] Índices creados (verificar con `\d+ case_models` en psql)
- [ ] Backend corriendo (http://localhost:8000)
- [ ] Frontend corriendo (http://localhost:3000)
- [ ] Ingest service corriendo (http://localhost:8001)
- [ ] Login funciona
- [ ] Cookie `arconte_token` se crea (HttpOnly ✓)
- [ ] Headers de seguridad presentes
- [ ] Tests pasan (`npm test`)

---

## 🎯 Próximos Pasos (Opcional)

### Mejorar Performance

```powershell
# Optimizar autoload de Composer
cd apps\api_php
composer dump-autoload --optimize

# Cachear configuración
php artisan config:cache
php artisan route:cache

# Build optimizado del frontend
cd ..\web
npm run build
```

### Backup de Base de Datos

```powershell
# Crear backup
docker exec arconte_postgres pg_dump -U arconte arconte > backup.sql

# Restaurar backup
docker exec -i arconte_postgres psql -U arconte arconte < backup.sql
```

### Monitoreo

**Adminer (UI de Base de Datos):**
- Abrir: http://localhost:8080
- Sistema: PostgreSQL
- Servidor: postgres
- Usuario: arconte
- Contraseña: arconte_secure_2025
- Base de datos: arconte

---

## 🎉 Conclusión

Una vez completados estos pasos manuales, tendrás:

✅ Sistema completamente funcional
✅ Base de datos escalable (PostgreSQL)
✅ Caché de alta performance (Redis)
✅ Autenticación segura (httpOnly cookies)
✅ Headers de seguridad implementados
✅ Tests configurados
✅ Performance optimizado con índices

**Tiempo estimado:** 15-20 minutos

**¿Problemas?** Revisa la sección de Troubleshooting arriba.

---

**Creado por:** Claude Code (Sonnet 4.5)
**Fecha:** 9 de Octubre, 2025
