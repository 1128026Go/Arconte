# APIs Reales para Arconte - Colombia

## 🔍 Investigación de APIs Disponibles

### 1. RAMA JUDICIAL - Consulta de Procesos

**Estado**: ❌ NO HAY API PÚBLICA DOCUMENTADA

**Portales Disponibles**:
- `https://consultaprocesos.ramajudicial.gov.co/` - Consulta de Procesos Nacional Unificada (CPNU v2.0)
- `https://procesojudicial.ramajudicial.gov.co/consultaprocesostyba/` - Sistema TYBA/Justicia XXI
- `https://samai.consejodeestado.gov.co/` - Consejo de Estado (separado)

**Conclusión**:
- La Rama Judicial **NO expone una API REST pública** para desarrolladores
- Solo existen interfaces web que requieren JavaScript y navegación manual
- Los sistemas usan tecnologías legacy (ASP.NET, formularios tradicionales)

**Soluciones Disponibles**:

#### Opción A: Web Scraping Robusto (RECOMENDADA para producción)
Implementar scraper profesional con:
- **Playwright** o **Selenium** (navegadores reales headless)
- Técnicas anti-detección (user agents rotativos, delays aleatorios)
- Manejo de CAPTCHAs (si aparecen)
- Rate limiting responsable
- Caché agresivo (Redis) para minimizar requests
x
**Ventajas**:
- Datos 100% reales y actualizados
- No requiere permisos especiales
- Control total sobre el proceso

**Desventajas**:
- Más lento que una API (3-5 segundos por consulta)
- Requiere mantenimiento si cambia el HTML
- Posible que implementen CAPTCHAs

#### Opción B: Solicitar Acceso Institucional
Contactar a la Rama Judicial para:
- Acceso institucional/comercial a datos
- Posible API privada para empresas
- Convenios de colaboración

**Contacto**:
- Mesa de ayuda: https://www.ramajudicial.gov.co/
- Dirección de Tecnología e Informática

#### Opción C: Híbrido (IMPLEMENTAR AHORA)
1. Usar scraping profesional con caché largo (24-48h)
2. En paralelo, solicitar acceso institucional
3. Migrar a API oficial cuando esté disponible

---

### 2. JURISPRUDENCIA - Corte Constitucional

**Estado**: ✅ API PÚBLICA DISPONIBLE

**API Oficial**: Datos Abiertos Colombia - Socrata SODA API

**Endpoint Base**:
```
https://www.datos.gov.co/resource/v2k4-2t8s.json
```

**Dataset ID**: `v2k4-2t8s`

**Contenido**:
- Todas las sentencias de la Corte Constitucional desde 1992 hasta 2025
- Actualizado regularmente
- Incluye: número de sentencia, fecha, magistrado ponente, tema, texto completo

**Documentación**:
- Portal: https://www.datos.gov.co/Justicia-y-Derecho/Sentencias-proferidas-por-la-Corte-Constitucional-/v2k4-2t8s
- API Docs: https://dev.socrata.com/

**Ejemplos de Uso**:

```bash
# Obtener todas las sentencias (con paginación)
GET https://www.datos.gov.co/resource/v2k4-2t8s.json?$limit=100&$offset=0

# Buscar por año
GET https://www.datos.gov.co/resource/v2k4-2t8s.json?$where=fecha >= '2025-01-01'

# Buscar por texto
GET https://www.datos.gov.co/resource/v2k4-2t8s.json?$q=tutela

# Filtrar por tipo de sentencia
GET https://www.datos.gov.co/resource/v2k4-2t8s.json?tipo=T

# Obtener CSV completo
GET https://www.datos.gov.co/api/views/v2k4-2t8s/rows.csv?accessType=DOWNLOAD
```

**Parámetros SODA API**:
- `$limit`: Número de resultados (max 50,000)
- `$offset`: Paginación
- `$where`: Filtros SQL-like
- `$q`: Búsqueda full-text
- `$order`: Ordenamiento
- `$select`: Campos a retornar

**Sin Autenticación Requerida** (para lecturas básicas)

**App Tokens** (opcional, aumenta rate limits):
- Registrarse en https://dev.socrata.com/
- Agregar header: `X-App-Token: YOUR_TOKEN`

---

## 📋 PLAN DE IMPLEMENTACIÓN

### FASE 1: APIs Reales de Jurisprudencia (AHORA) ✅
- [x] Investigar API disponible
- [ ] Implementar cliente para Socrata SODA API
- [ ] Crear servicio de búsqueda de jurisprudencia
- [ ] Migrar JurisprudenceController a usar API real
- [ ] Agregar caché Redis para jurisprudencia
- [ ] Implementar búsqueda semántica con IA

### FASE 2: Web Scraping Profesional Rama Judicial (URGENTE) 🚨
- [ ] Implementar Playwright/Selenium en Python
- [ ] Crear scrapers robustos con anti-detección
- [ ] Implementar sistema de colas (Redis Queue)
- [ ] Agregar caché agresivo (24-48h por caso)
- [ ] Monitoreo y alertas de fallos
- [ ] Tests de regresión para detectar cambios en HTML

### FASE 3: Optimización y Producción (SIGUIENTE) 🔧
- [ ] Implementar sincronización nocturna automática
- [ ] Sistema de notificaciones cuando hay cambios
- [ ] Dashboard de salud del scraping
- [ ] Logs estructurados y métricas
- [ ] Backup de datos históricos

---

## 🎯 PRIORIDADES INMEDIATAS

### 1. Jurisprudencia con API Real (1-2 horas)
Implementar búsqueda real usando datos.gov.co

### 2. Scraper Profesional Rama Judicial (4-6 horas)
Reemplazar datos demo con scraping real usando Playwright

### 3. Sistema de Sincronización Automática (2-3 horas)
Cron job nocturno para actualizar todos los casos

### 4. Endpoints Backend Faltantes (2 horas)
Perfil de usuario, contraseña, preferencias

---

## 📊 OTRAS APIs POTENCIALMENTE ÚTILES

### Datos Abiertos Colombia
- **Notariado y Registro**: Certificados de tradición
- **Procuraduría**: Antecedentes disciplinarios
- **Contraloría**: Antecedentes fiscales
- **SECOP**: Contratación pública

### APIs Comerciales (Pago)
- **Serpro Brasil**: Consulta RUES, antecedentes
- **LexisNexis**: Base de datos legal internacional
- **Vlex Colombia**: Jurisprudencia y legislación

---

## ⚠️ CONSIDERACIONES LEGALES

### Web Scraping
- ✅ Legal en Colombia para datos públicos
- ✅ Rama Judicial es información pública
- ⚠️ Respetar términos de uso
- ⚠️ No sobrecargar servidores (rate limiting)
- ⚠️ Identificarse correctamente (User-Agent honesto)

### Datos Personales
- ⚠️ Las actuaciones judiciales pueden contener datos personales
- ⚠️ Cumplir con Ley 1581 de 2012 (Protección de Datos)
- ✅ Uso legítimo: asesoría legal profesional

---

## 🔑 CREDENCIALES Y TOKENS NECESARIOS

```bash
# Socrata SODA API (Jurisprudencia)
SOCRATA_APP_TOKEN=obtener_en_dev.socrata.com
SOCRATA_API_ENDPOINT=https://www.datos.gov.co/resource/v2k4-2t8s.json

# Para futura integración institucional
RAMA_JUDICIAL_API_KEY=pendiente_solicitud
RAMA_JUDICIAL_API_SECRET=pendiente_solicitud
```

---

## 📈 MÉTRICAS DE ÉXITO

1. **Precisión**: 100% de actuaciones reales (vs datos demo actuales)
2. **Velocidad**: < 5 segundos para consulta nueva, < 500ms para caché
3. **Disponibilidad**: 99.5% uptime del scraper
4. **Actualidad**: Datos < 24h de antigüedad
5. **Cobertura**: Todas las jurisdicciones de Colombia

---

Actualizado: 2025-01-09
