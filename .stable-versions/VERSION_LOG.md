# 📋 Registro de Versiones Estables

Este archivo registra todas las versiones estables guardadas de archivos críticos del proyecto.

**Última actualización:** 2025-10-16

---

## ¿Qué es este sistema?

Este sistema de versionado permite:
- Guardar versiones funcionales de archivos críticos
- Restaurar configuraciones cuando algo se rompe
- Comparar cambios contra versiones estables
- Mantener un historial de qué funcionaba y cuándo

## Uso Rápido

```bash
# Guardar versión estable
./scripts/save-stable.sh apps/api_php/config/sanctum.php

# Restaurar versión estable
./scripts/restore-stable.sh apps/api_php/config/sanctum.php

# Comparar con versión estable
./scripts/compare-versions.sh apps/api_php/config/sanctum.php
```

---

## Historial de Versiones

_(Los cambios se registran automáticamente cuando usas save-stable.sh)_

### ✅ .env
- **Fecha:** 2025-10-16 18:02:11
- **SHA256:** 11f8ee104d425abb1ea47743cdbddb915b303d04f327b37e7b3a237bd95f3679
- **Tipo:** backend

### ✅ config/sanctum.php
- **Fecha:** 2025-10-16 18:02:22
- **SHA256:** 797bd69c696b20299d61b0a4b373b4ebf6c23403346e270d5a03e0005e410fe1
- **Tipo:** backend

### ✅ config/cors.php
- **Fecha:** 2025-10-16 18:02:23
- **SHA256:** 4ebdf28db5b55d01e09424c8d5dd0ca5d86bc3de518fc6ae2355d2a2371a9ff2
- **Tipo:** backend

### ✅ bootstrap/app.php
- **Fecha:** 2025-10-16 18:02:23
- **SHA256:** 9ff536fb32a8d866599479a4ee4cb38ef10ab34f09a5e6225ffe73713ee2651d
- **Tipo:** backend

### ✅ src/lib/apiSecure.js
- **Fecha:** 2025-10-16 18:02:39
- **SHA256:** 08e2f3e5ff3f610aceef727b22d8113a215fc74c2e2e68b1fe6f939f7eba0dea
- **Tipo:** frontend

### ✅ .env.local
- **Fecha:** 2025-10-16 18:02:40
- **SHA256:** 355bfe8f2a4440b48c4d6a660487a2ceaaccdaa0d38b5ce6e86c968797940792
- **Tipo:** frontend

### ✅ app/Http/Controllers/CaseController.php
- **Fecha:** 2025-10-16 18:29:17
- **SHA256:** 7c4d06616012115bf9ad6316ada0831967de0fbdd6e712be56a621831a11d8fe
- **Tipo:** backend

### ✅ routes/api.php
- **Fecha:** 2025-10-16 18:45:13
- **SHA256:** 4a4e3be2f7a4012d043e7e20c24636f063b28b416de5a64a2c2faaca37189f71
- **Tipo:** backend

### ✅ app/Http/Controllers/CaseController.php
- **Fecha:** 2025-10-16 18:45:13
- **SHA256:** ba8ef76932948774ce7d6e5616a0292b6bcc11db5fbb736be67370a86e79c000
- **Tipo:** backend
