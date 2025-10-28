# 🚀 Guía de Inicio Rápido - ARCONTE

## Paso 1: Levantar el Proyecto

Simplemente ejecuta:

```bash
start-all.bat
```

## ¿Qué hace el script?

✅ **Verifica prerequisitos** (Docker, PHP, Node.js)
✅ **Limpia puertos ocupados** automáticamente
✅ **Inicia la base de datos** (PostgreSQL + Redis)
✅ **Ejecuta migraciones** de Laravel
✅ **Crea/actualiza usuarios** de prueba
✅ **Inicia Backend** en puerto 8000
✅ **Inicia Frontend** en puerto 3000
✅ **Abre el navegador** automáticamente

---

## 📋 Credenciales de Acceso (Guardadas en BD)

### Usuario Admin
```
Email:    admin@arconte.app
Password: password
```

### Usuario Abogado
```
Email:    abogado@arconte.app
Password: password
```

### Base de Datos (Adminer)
```
Usuario:  arconte
Password: arconte_secure_2025
```

---

## 🌐 Enlaces del Proyecto

| Servicio | URL |
|----------|-----|
| **Frontend** | http://localhost:3000 |
| **Backend** | http://localhost:8000 |
| **API Health** | http://localhost:8000/api/health |
| **Swagger (Docs)** | http://localhost:8000/api/documentation |
| **Adminer (BD)** | http://localhost:8080 |

---

## ⚠️ IMPORTANTE

### NO cierres estas ventanas:
- ✋ "Arconte - Backend API"
- ✋ "Arconte - Frontend"
- ✋ "Arconte - Queue Worker"

Sin estas ventanas, el proyecto no funcionará correctamente.

---

## 🛑 Detener el Proyecto

Cuando termines de trabajar, ejecuta:

```bash
stop-all.bat
```

---

## 💡 Comandos Útiles

### Ver logs de Docker
```bash
docker-compose logs -f
```

### Ver contenedores activos
```bash
docker-compose ps
```

### Reiniciar solo el backend
```bash
cd apps/api_php
php artisan serve --host=0.0.0.0 --port=8000
```

### Reiniciar solo el frontend
```bash
cd apps/web
npm run dev
```

---

## 🔄 Si algo falla

1. **Puerto ocupado**: El script lo limpia automáticamente
2. **Usuarios no se crean**: Se crea automáticamente al iniciar
3. **BD sin datos**: Se ejecutan migraciones automáticamente
4. **Frontend no carga**: Espera 8 segundos, puede estar compilando

---

## 📂 Estructura del Proyecto

```
├── apps/
│   ├── api_php/          # Backend Laravel
│   ├── web/              # Frontend React
│   └── ingest/           # Servicio Python (opcional)
├── docker-compose.yml    # Base de datos (PostgreSQL + Redis)
├── start-all.bat         # Script para iniciar TODO
└── stop-all.bat          # Script para detener TODO
```

---

## ✅ Cambios Realizados

### ✨ Script mejorado (start-all.bat)
- Limpia puertos automáticamente
- Manejo mejorado de errores
- Muestra credenciales al final
- Captura logs para debugging

### 🔐 Usuarios persistentes
- Comando `php artisan user:create-test` crea usuarios en BD
- Se ejecuta automáticamente cada vez que inicias
- Si existen, actualiza las contraseñas
- Los datos se guardan en PostgreSQL

### 🎯 Credenciales garantizadas
- Siempre disponibles: admin@arconte.app / password
- Siempre disponibles: abogado@arconte.app / password
- Se guardan en la base de datos
- No requieren configuración manual

---

## 🆘 Necesitas ayuda?

Si algo no funciona:

1. Verifica que Docker esté activo
2. Ejecuta `stop-all.bat` y luego `start-all.bat`
3. Revisa los logs en las ventanas del cmd
4. Comprueba que los puertos 3000, 8000, 5432, 6379 estén libres

---

**Última actualización**: 28 de Octubre de 2025
**Versión**: 1.0 - Script Estable
