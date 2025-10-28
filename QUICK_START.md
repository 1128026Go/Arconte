# 🚀 GUÍA RÁPIDA - ARCONTE

## Paso 1: Abre 3 ventanas cmd

En cada una ejecuta los siguientes comandos:

### Ventana 1 - BACKEND
```cmd
cd "C:\Users\David\Herd\Aplicacion Juridica\Aplicacion Juridica\apps\api_php"
"%USERPROFILE%\.config\herd\bin\php" artisan serve --host=0.0.0.0 --port=8000
```

### Ventana 2 - FRONTEND
```cmd
cd "C:\Users\David\Herd\Aplicacion Juridica\Aplicacion Juridica\apps\web"
npm run dev
```

### Ventana 3 - QUEUE WORKER (Opcional pero recomendado)
```cmd
cd "C:\Users\David\Herd\Aplicacion Juridica\Aplicacion Juridica\apps\api_php"
"%USERPROFILE%\.config\herd\bin\php" artisan queue:work
```

---

## 📍 Acceso a los Servicios

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000/api/health
- **Swagger (API Docs)**: http://localhost:8000/api/documentation

---

## 👤 Credenciales

```
Email:    admin@arconte.app
Password: password
```

o

```
Email:    abogado@arconte.app
Password: password
```

---

## ✅ Verificación Rápida

Abre otra ventana cmd y ejecuta:

```cmd
curl http://localhost:8000/api/health
```

Si ves `{"status":"ok"}` → Backend está funcionando ✅

---

## 🛑 Para Detener Todo

Cierra las 3 ventanas cmd (Ctrl+C en cada una)

---

**Nota**: La Base de Datos (PostgreSQL + Redis) debe estar corriendo en Docker
