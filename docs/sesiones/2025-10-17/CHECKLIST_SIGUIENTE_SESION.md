# ✅ CHECKLIST PARA MAÑANA

## 🌅 Al iniciar el día

### 1️⃣ Iniciar Servicios (5 minutos)
```
[ ] Doble clic en START_ALL_SERVICES.bat
[ ] Esperar que se abran 3 ventanas de terminal
[ ] Verificar http://localhost:3000 (Frontend)
[ ] Verificar http://127.0.0.1:8001/ (Microservicio)
```

### 2️⃣ Verificar Funcionalidad (2 minutos)
```
[ ] Abrir http://localhost:3000/cases
[ ] Agregar caso: 73001400300120240017300
[ ] Ver que se procesa correctamente
[ ] Verificar que aparecen los AUTOS destacados
```

### 3️⃣ Si algo falla (troubleshooting)
```
[ ] Leer README_INICIO_RAPIDO.md sección "Si algo no funciona"
[ ] Verificar que Worker de Cola está corriendo: tasklist | findstr php
[ ] Limpiar cache: php artisan cache:clear
[ ] Reiniciar servicios si es necesario
```

---

## 🎯 Prioridades del Día

### 🔥 ALTA PRIORIDAD

#### 1. Sistema de Notificaciones
```
[ ] Crear NotificationController para frontend
[ ] Implementar badge de contador en navbar
[ ] Crear panel de notificaciones desplegable
[ ] Agregar notificación cuando llega nuevo auto
[ ] Probar flujo completo
```
**Tiempo estimado:** 3-4 horas
**Archivos a crear:**
- `apps/web/src/components/NotificationCenter.jsx`
- `apps/web/src/components/NotificationBell.jsx`
- `app/Notifications/NewAutoNotification.php`

#### 2. Mejorar Clasificación de Autos con IA
```
[ ] Revisar prompts actuales en auto_classifier.py
[ ] Agregar más ejemplos de entrenamiento
[ ] Implementar validación de confianza mínima
[ ] Agregar fallback para clasificación dudosa
[ ] Probar con casos reales
```
**Tiempo estimado:** 2-3 horas
**Archivos a modificar:**
- `apps/ingest_py/src/analyzers/auto_classifier.py`

#### 3. Dashboard de Analíticas Básico
```
[ ] Crear página Analytics.jsx
[ ] Agregar gráfica de tipos de autos (pie chart)
[ ] Agregar timeline de actuaciones
[ ] Mostrar estadísticas de plazos próximos
[ ] Agregar filtros por fecha
```
**Tiempo estimado:** 4-5 horas
**Archivos a crear:**
- `apps/web/src/pages/Analytics.jsx`
- `apps/web/src/components/charts/AutosPieChart.jsx`
- `apps/web/src/components/charts/TimelineChart.jsx`

---

### ⚠️ MEDIA PRIORIDAD

#### 4. Búsqueda Avanzada
```
[ ] Agregar filtros por fecha en Cases.jsx
[ ] Implementar búsqueda por clasificación de auto
[ ] Agregar ordenamiento por urgencia
[ ] Botón exportar a Excel
```
**Tiempo estimado:** 2-3 horas

#### 5. Optimizar Rendimiento
```
[ ] Implementar virtualización en lista de actuaciones
[ ] Agregar lazy loading de imágenes
[ ] Comprimir respuestas API (middleware gzip)
[ ] Optimizar queries N+1 en Laravel
```
**Tiempo estimado:** 3-4 horas

---

### 📋 BAJA PRIORIDAD

#### 6. Mejoras de UX
```
[ ] Agregar skeleton screens
[ ] Implementar modo oscuro
[ ] Agregar animaciones suaves
[ ] Crear tour guiado para nuevos usuarios
```
**Tiempo estimado:** 2-3 horas por feature

#### 7. Tests Automatizados
```
[ ] Tests unitarios para normalizer Python
[ ] Tests de integración para API Laravel
[ ] Tests E2E con Playwright para frontend
```
**Tiempo estimado:** 1 día completo

---

## 🐛 Bugs a Corregir (si tienes tiempo)

### Menor Urgencia
```
[ ] Auto-refresh cada 3s es agresivo → cambiar a 5-10s
[ ] Errores no siempre se muestran al usuario → agregar toasts
[ ] Cache puede quedar stale → implementar invalidación proactiva
```

---

## 📝 Testing Manual Diario

### Casos de Prueba Básicos
```
[ ] Agregar nuevo caso
[ ] Ver detalles de caso
[ ] Actualizar caso existente
[ ] Descargar PDF de auto (si tiene)
[ ] Verificar auto-refresh funciona
[ ] Probar filtros de búsqueda
```

### Casos de Prueba Avanzados
```
[ ] Agregar caso con radicado inválido
[ ] Probar cuando Rama Judicial está caída
[ ] Verificar límites de plan free vs premium
[ ] Probar con múltiples usuarios simultáneos
```

---

## 🎓 Aprendizajes para Documentar

Cuando termines features nuevas, documenta:
```
[ ] ¿Qué problema resolvió?
[ ] ¿Cómo funciona internamente?
[ ] ¿Qué archivos se modificaron?
[ ] ¿Hay casos edge a considerar?
[ ] ¿Qué tests agregaste?
```

---

## 🚀 Antes de Cerrar el Día

### Checklist de Cierre
```
[ ] Hacer commit de cambios importantes
[ ] Actualizar RESUMEN_SESION con lo nuevo
[ ] Documentar bugs encontrados
[ ] Dejar servicios corriendo o apagarlos ordenadamente
[ ] Hacer backup de la BD si hubo cambios importantes
```

### Comandos de Cierre
```bash
# Si quieres detener servicios:
# 1. Presiona Ctrl+C en cada terminal
# 2. O mata procesos:
taskkill /IM python.exe /F
taskkill /IM php.exe /F

# Hacer commit
cd "Aplicacion Juridica"
git add .
git commit -m "feat: [descripción de lo que hiciste]"
git push
```

---

## 💾 Backup Recomendado

### Antes de cambios grandes:
```bash
# Backup de BD
pg_dump -h 127.0.0.1 -U arconte arconte > backup_$(date +%Y%m%d).sql

# Backup de .env (por si acaso)
cp apps/api_php/.env apps/api_php/.env.backup
cp apps/ingest_py/.env apps/ingest_py/.env.backup
```

---

## 🎯 Meta del Día

**Objetivo Principal:**
- [ ] Implementar 1-2 features de ALTA PRIORIDAD
- [ ] Corregir bugs menores si aparecen
- [ ] Actualizar documentación

**Métrica de Éxito:**
- ✅ Al menos 1 feature nueva funcionando
- ✅ Sin bugs críticos introducidos
- ✅ Código documentado

---

## 📞 Si Te Atascas

1. **Revisar logs:**
   ```bash
   tail -f apps/api_php/storage/logs/laravel.log
   ```

2. **Consultar documentación:**
   - RESUMEN_SESION_2025-10-17.md
   - README_INICIO_RAPIDO.md

3. **Verificar que servicios estén corriendo:**
   ```bash
   tasklist | findstr "python php node"
   ```

4. **Limpiar todo y reiniciar:**
   ```bash
   php artisan cache:clear
   php artisan config:clear
   # Ctrl+C en todas las terminales
   # Ejecutar START_ALL_SERVICES.bat
   ```

---

## 🎉 ¡Ánimo!

Ya tienes una base sólida funcionando.
Los autos judiciales se ven increíbles.
Ahora solo falta pulir y agregar features cool.

**¡Tú puedes!** 💪

---

Última actualización: 17 Oct 2025, 01:15 AM
Creado por: Claude Code
