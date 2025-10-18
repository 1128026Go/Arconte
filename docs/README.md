# 📚 Documentación Arconte

Bienvenido a la documentación organizada del proyecto Arconte.

---

## 🎯 Documento Principal

### ⭐ [ARCONTE_DOCUMENTACION_MAESTRA.md](../ARCONTE_DOCUMENTACION_MAESTRA.md)

**Fuente única de verdad del proyecto**

- 14 secciones completas
- 500+ líneas de documentación consolidada
- Versiones tecnológicas actualizadas
- Rutas y configuraciones críticas
- **Actualizado:** 2025-10-14

> 💡 **Recomendación:** Comienza aquí para obtener una visión completa del proyecto.

---

## 📁 Estructura de Documentación

### 🎨 features/

Documentación detallada de features implementadas

- **[suscripciones.md](features/suscripciones.md)**
  - Sistema de pagos con ePayco
  - Planes Free/Premium/Enterprise
  - Webhooks y validación de límites
  - Tests de integración

- **[vigilancia_autos.md](features/vigilancia_autos.md)**
  - Clasificación automática con IA (Gemini)
  - Detección de plazos y términos
  - Análisis de urgencia
  - Sistema de notificaciones

---

### 🔌 integraciones/

Documentación de integraciones con APIs externas

- **[rama_judicial.md](integraciones/rama_judicial.md)**
  - Scraping con Playwright
  - API real de Rama Judicial
  - Normalización de datos
  - Manejo de errores y reintentos

- **[investigacion_apis.md](integraciones/investigacion_apis.md)**
  - APIs investigadas para Colombia
  - Evaluación de fuentes oficiales
  - Decisiones de diseño
  - Limitaciones y alternativas

---

### 🔧 troubleshooting/

Guías de solución de problemas

- **[cors_auth.md](troubleshooting/cors_auth.md)**
  - Problemas de CORS
  - Autenticación con Laravel Sanctum
  - Cookies httpOnly
  - Configuración de dominios

- **[bugs_v1.md](troubleshooting/bugs_v1.md)**
  - Bugs históricos resueltos (Enero 2025)
  - Login redirect issues
  - Registro de autos duplicados

- **[bugs_v2.md](troubleshooting/bugs_v2.md)**
  - Bugs históricos resueltos (Octubre 2025)
  - Correcciones urgentes
  - Mejoras de UX

---

### ⚙️ setup/

Configuración y planificación

- **[plan_maestro.md](setup/plan_maestro.md)**
  - Roadmap del proyecto
  - Fases de implementación
  - Timeline y milestones
  - Prioridades técnicas

---

### 🧪 testing/

Guías de testing

- **[TESTING_COMPLETO.md](testing/TESTING_COMPLETO.md)**
  - Checklist completo de testing
  - Tests manuales y automatizados
  - Verificación de funcionalidades
  - Casos de prueba críticos

---

### 📜 historial/

Registro cronológico de implementaciones y cambios importantes

- **[frontend_sprint1.md](historial/frontend_sprint1.md)** - Sprint 1: Implementación completa React 18 + Vite (Octubre 2025)
- **[SPRINT1_FIXES_COMPLETADOS.md](historial/SPRINT1_FIXES_COMPLETADOS.md)** - Correcciones del sprint 1
- **[IMPLEMENTACION_COMPLETA_2025.md](historial/IMPLEMENTACION_COMPLETA_2025.md)** - Resumen de implementaciones 2025
- **[INSTRUCCIONES_FINALES.md](historial/INSTRUCCIONES_FINALES.md)** - Instrucciones de configuración final
- **[RESUMEN_SESION_COMPLETO.md](historial/RESUMEN_SESION_COMPLETO.md)** - Resumen de sesión de trabajo

> 📖 Consulta [historial/README.md](historial/README.md) para el índice completo
>
> 💡 Para reportes detallados de sesiones, consulta **[sesiones/](sesiones/)**

---

### 📅 sesiones/

Reportes detallados de sesiones de desarrollo organizados por fecha

- **[2025-10-17](sesiones/2025-10-17/)** - Auditoría profunda y limpieza completa
  - Reorganización de scripts (22 scripts en 4 categorías)
  - Limpieza de apps (26 archivos eliminados)
  - Estructura profesional completa

- **[2025-10-09](sesiones/2025-10-09/)** - Sprint 1 Frontend
  - Implementación React 18 + Vite
  - Análisis frontend completo
  - Rebranding a Arconte

> 📖 Consulta [sesiones/README.md](sesiones/README.md) para el índice completo

---

### 🔍 auditoria/

Auditorías técnicas del proyecto

- **[AUDITORIA_TECNICA_2025-10-10.md](auditoria/AUDITORIA_TECNICA_2025-10-10.md)** - Auditoría técnica completa del sistema

---

### 🗄️ archive/

Documentación histórica del frontend

Archivos de sesiones anteriores sobre implementación del frontend, rebranding, configuraciones de email, y más.

> ℹ️ Estos archivos se mantienen para referencia histórica pero no son parte del flujo de trabajo actual.

---

## 🔗 Otros Documentos en Raíz

- **[README.md](../README.md)** - Quick start del proyecto
- **[ARCONTE_DOCUMENTACION_MAESTRA.md](../ARCONTE_DOCUMENTACION_MAESTRA.md)** - Documentación técnica completa

---

### 🚀 getting-started/

Guías de inicio rápido para desarrolladores

- **[INICIO_RAPIDO_1CLIC.md](getting-started/INICIO_RAPIDO_1CLIC.md)** - ⚡ La forma MÁS RÁPIDA (doble clic)
- **[guia_rapida.md](getting-started/guia_rapida.md)** - Inicio rápido completo en 5 minutos
- **[primer_deploy.md](getting-started/primer_deploy.md)** - Deployar a producción por primera vez

> 📖 Consulta [getting-started/README.md](getting-started/README.md) para el índice completo

---

## 📊 Documentación Operativa (Raíz de docs/)

Otros documentos importantes en `docs/`:

- **[ESTRUCTURA_PROYECTO.md](ESTRUCTURA_PROYECTO.md)** - Estructura del proyecto
- **[NOTES.md](NOTES.md)** - Notas de desarrollo

---

## 🚀 Enlaces Rápidos

### Desarrollo Local

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

### Repositorio

- **GitHub:** https://github.com/1128026Go/Arconte

### Stack Tecnológico

- **Frontend:** Next.js 14.1.0 + React 18 + TypeScript
- **Backend:** Laravel 11 + PHP 8.2
- **Base de datos:** PostgreSQL
- **IA:** Google Gemini Pro 1.5
- **Scraping:** Playwright
- **Pagos:** ePayco

---

## 📞 Contacto y Soporte

Para reportar problemas o solicitar nuevas funcionalidades:

1. Revisa la documentación relevante
2. Consulta la sección de troubleshooting
3. Crea un issue en GitHub con detalles completos

---

## 🎯 Navegación Rápida por Tarea

### Si necesitas...

- **Implementar un nuevo feature** → Revisa `features/` para ver ejemplos
- **Solucionar un bug** → Consulta `troubleshooting/`
- **Integrar una API** → Lee `integraciones/`
- **Configurar el proyecto** → Revisa `setup/plan_maestro.md`
- **Ejecutar tests** → Consulta `testing/TESTING_COMPLETO.md`
- **Entender el proyecto completo** → Lee `ARCONTE_DOCUMENTACION_MAESTRA.md` ⭐

---

## 📝 Convenciones de Documentación

### Formato de archivos:

- Todos los documentos usan Markdown (.md)
- Nombres descriptivos en snake_case
- Secciones bien estructuradas con headers
- Código con syntax highlighting
- Emojis para mejor navegación visual

### Actualización de docs:

Al actualizar documentación:

1. Mantén el formato existente
2. Actualiza la fecha en el documento
3. Añade notas de cambio si es relevante
4. Verifica que los enlaces funcionen
5. Actualiza este índice si añades nuevos archivos

---

*Última actualización: 2025-10-17*
*Mantenedor: Equipo Arconte*
*Versión de docs: 2.1 (Estructura actualizada con sesiones)*
