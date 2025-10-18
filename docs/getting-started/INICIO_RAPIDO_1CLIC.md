# 🚀 INICIO RÁPIDO - ARCONTE

## ⚡ Forma más rápida de iniciar (1 CLIC)

**Doble clic en:**
```
START_ALL_SERVICES.bat
```

Esto iniciará automáticamente:
- ✅ Microservicio Python (puerto 8001)
- ✅ Worker de Cola Laravel
- ✅ Frontend React (puerto 3000)

---

## 📋 Verificar que todo funciona

Abre tu navegador y ve a:

**1. Frontend:** http://localhost:3000
   - Deberías ver la página de login

**2. API Backend:** http://localhost:8000/api
   - Deberías ver: `{"message":"Arconte API"}`

**3. Microservicio Python:** http://127.0.0.1:8001/
   - Deberías ver: `{"message":"FastAPI funcionando",...}`

---

## 🧪 Probar funcionalidad de autos

1. Ve a http://localhost:3000/cases
2. Agrega este radicado de prueba: `73001400300120240017300`
3. Espera 5-10 segundos
4. Haz clic en "Ver detalles"
5. ✅ Deberías ver los AUTOS JUDICIALES destacados en la parte superior

---

## ❌ Si algo no funciona

### Problema: No se ven los casos
**Solución:** Verifica que el Worker de Cola esté corriendo
```bash
tasklist | findstr php
```
Si no ves procesos PHP, ejecuta:
```bash
cd "Aplicacion Juridica/apps/api_php"
"C:/Users/David/.config/herd/bin/php84/php.exe" artisan queue:work --tries=3 --timeout=90
```

### Problema: Microservicio responde 403
**Solución:** Reinicia el microservicio con variables de entorno
```bash
cd "Aplicacion Juridica/apps/ingest_py"
set -a && source .env && set +a
python -m uvicorn src.main:app --host 127.0.0.1 --port 8001 --reload
```

### Problema: Cambios no se reflejan
**Solución:** Limpia la cache
```bash
cd "Aplicacion Juridica/apps/api_php"
php artisan cache:clear
php artisan config:clear
```

---

## 📖 Documentación Completa

Lee el archivo completo para más detalles:
```
RESUMEN_SESION_2025-10-17.md
```

---

## 🎯 Accesos Rápidos

| Servicio | URL | Estado Esperado |
|----------|-----|----------------|
| **Frontend** | http://localhost:3000 | Página de login |
| **API** | http://localhost:8000/api | JSON con mensaje |
| **Microservicio** | http://127.0.0.1:8001 | JSON con status |
| **Docs API Python** | http://127.0.0.1:8001/docs | Interfaz Swagger |
| **Adminer (BD)** | http://localhost:8080 | Login PostgreSQL |

---

## 💡 Tips Útiles

- **Ver logs Laravel:** `tail -f apps/api_php/storage/logs/laravel.log`
- **Ver jobs en cola:** Ver terminal del Worker
- **Reiniciar servicio:** Ctrl+C en la terminal y volver a ejecutar
- **Cache pegajoso:** Siempre hacer `cache:clear` después de cambios en backend

---

## ✨ Lo que funciona HOY (17 Oct 2025)

✅ Agregar casos con radicado
✅ Ver detalles completos de casos
✅ AUTOS JUDICIALES destacados con diseño especial
✅ Descarga de PDFs de autos
✅ Campos oficiales de Rama Judicial
✅ Auto-refresh de casos en procesamiento
✅ Separación visual autos vs actuaciones

---

**¡Todo listo para trabajar!** 🎉
