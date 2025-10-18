# ✅ SISTEMA DE VIGILANCIA AUTOMÁTICA DE AUTOS - IMPLEMENTADO

## 🎉 Resumen

Se ha implementado completamente el sistema de vigilancia automática de publicaciones judiciales para detectar AUTOS y notificar al abogado según su urgencia.

## 📦 Componentes Implementados

### 1. **Clasificador de Autos** (`src/analyzers/auto_classifier.py`)

✅ Detección automática de autos en actuaciones
✅ Clasificación inteligente: Perentorio vs Trámite
✅ Análisis basado en palabras clave en español
✅ Cálculo de confianza de clasificación
✅ Procesamiento en lote

**Palabras clave implementadas:**
- **Perentorios**: requiérase, confiérase traslado, plazo de X días, ordénese, recurso de apelación, etc.
- **Trámite**: admítase, téngase por, inscríbase, infórmese, avoca conocimiento, etc.

### 2. **Extractor de Documentos** (`src/analyzers/document_extractor.py`)

✅ Descarga de documentos desde URLs
✅ Extracción de texto de PDFs nativos (PyPDF2)
✅ OCR para PDFs escaneados (Tesseract)
✅ Fallback automático si falla extracción normal
✅ Almacenamiento local de documentos

### 3. **Sistema de Notificaciones** (`src/notifications/notifier.py`)

✅ Notificación multi-canal (email + backend API)
✅ Alertas urgentes para autos perentorios
✅ Registro de autos de trámite
✅ Integración con backend PHP/Laravel
✅ Formato de email personalizado

### 4. **Scheduler Automático** (`src/sched/cron.py`)

✅ Escaneo periódico de radicados
✅ Modo producción: 1 vez al día (6 AM)
✅ Modo testing: configurable cada N horas
✅ Detección automática de cambios
✅ Envío de notificaciones en tiempo real

### 5. **API REST Endpoints** (`src/main.py`)

Nuevos endpoints implementados:

#### `GET /autos/analyze/{radicado}`
Analiza un radicado específico para detectar autos
- Query param: `notify` (bool) - enviar notificaciones

#### `GET /autos/history/{radicado}`
Obtiene historial completo de autos del proceso

#### `POST /autos/scan`
Dispara escaneo manual de múltiples radicados
- Query param: `radicados` (list) - lista de radicados a escanear

## 🚀 Cómo Usar

### Instalación

```bash
cd apps/ingest_py

# Instalar dependencias
pip install -r requirements.txt

# Copiar configuración
cp .env.example .env

# Editar .env con tu configuración
```

### Ejecutar con vigilancia automática

```bash
# Modo producción (escaneo diario)
python -m apps.ingest_py.run_with_scheduler

# Servidor disponible en: http://localhost:8001
# Documentación API: http://localhost:8001/docs
```

### Ejecutar tests

```bash
# Test del clasificador
python -m apps.ingest_py.test_auto_detection
```

### Uso de la API

```bash
# Analizar un radicado
curl http://localhost:8001/autos/analyze/11001310300020230012300

# Analizar y enviar notificaciones
curl http://localhost:8001/autos/analyze/11001310300020230012300?notify=true

# Ver historial de autos
curl http://localhost:8001/autos/history/11001310300020230012300

# Escaneo manual múltiple
curl -X POST "http://localhost:8001/autos/scan?radicados=RAD1&radicados=RAD2"
```

## 📊 Flujo de Funcionamiento

```
┌─────────────────────────────────────────────────┐
│  1. Scheduler ejecuta cada 24h (6 AM)           │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│  2. Para cada radicado activo:                   │
│     - Consultar Rama Judicial                    │
│     - Normalizar actuaciones                     │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│  3. Analizar actuaciones:                        │
│     - ¿Es un AUTO? → Sí/No                       │
│     - Si SÍ: Clasificar tipo                     │
└───────────────┬─────────────────────────────────┘
                │
                ▼
        ┌───────┴───────┐
        │               │
        ▼               ▼
┌──────────────┐  ┌──────────────┐
│ PERENTORIO   │  │  TRÁMITE     │
└──────┬───────┘  └──────┬───────┘
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ 🔴 ALERTA    │  │ 📄 Registro  │
│ Notificación │  │ en historial │
│ URGENTE      │  │              │
└──────────────┘  └──────────────┘
```

## 🔧 Configuración

### Variables de entorno (`.env`)

```bash
# Backend API
API_BASE_URL=http://localhost:8000

# OCR (requiere Tesseract instalado)
ENABLE_OCR=true

# Scheduler
SCHEDULER_INTERVAL_HOURS=24  # 24 = diario

# Notificaciones
NOTIFICATION_EMAIL_ENABLED=true
NOTIFICATION_PUSH_ENABLED=true
```

### Personalizar palabras clave

Editar `src/analyzers/auto_classifier.py`:

```python
PERENTORIO_KEYWORDS = [
    r"tu_palabra_personalizada",
    # ... más keywords
]

TRAMITE_KEYWORDS = [
    r"tu_palabra_personalizada",
    # ... más keywords
]
```

## 📝 Estructura de Archivos

```
apps/ingest_py/
├── src/
│   ├── analyzers/
│   │   ├── __init__.py
│   │   ├── auto_classifier.py      ✅ Clasificador de autos
│   │   └── document_extractor.py   ✅ Extractor de PDFs con OCR
│   │
│   ├── notifications/
│   │   ├── __init__.py
│   │   └── notifier.py             ✅ Sistema de notificaciones
│   │
│   ├── sched/
│   │   └── cron.py                 ✅ Scheduler actualizado
│   │
│   └── main.py                     ✅ API con nuevos endpoints
│
├── test_auto_detection.py          ✅ Tests del clasificador
├── run_with_scheduler.py           ✅ Ejecutar con scheduler
├── requirements.txt                ✅ Dependencias actualizadas
├── .env.example                    ✅ Configuración de ejemplo
├── AUTOS_VIGILANCIA.md             ✅ Documentación completa
└── README.md
```

## 🧪 Tests Incluidos

El script `test_auto_detection.py` incluye:

✅ 8 casos de prueba
✅ Validación de detección de autos
✅ Validación de clasificación (perentorio/trámite)
✅ Análisis completo de actuaciones
✅ Cálculo de confianza

**Casos probados:**
- Auto perentorio con traslado y plazo
- Auto perentorio con requerimiento
- Auto perentorio con recurso
- Auto de trámite con admisión
- Auto de trámite con avoca conocimiento
- Auto de trámite con téngase por
- Notificación (no es auto)
- Actuación administrativa (no es auto)

## 📚 Dependencias Agregadas

```
PyPDF2==3.0.1           # Extracción de texto de PDFs
pytesseract==0.3.10     # OCR para PDFs escaneados
pdf2image==1.17.0       # Conversión PDF a imagen
Pillow==10.3.0          # Procesamiento de imágenes
apscheduler==3.10.4     # Tareas programadas
```

## 🔮 Próximas Mejoras Sugeridas

- [ ] **ML/NLP**: Usar modelos de lenguaje para clasificación más precisa
- [ ] **Extracción de plazos**: Detectar automáticamente "10 días", "5 días hábiles"
- [ ] **Dashboard web**: Interface visual para monitoreo
- [ ] **WhatsApp**: Integración con WhatsApp Business API
- [ ] **Análisis de sentencias**: Además de autos, detectar sentencias
- [ ] **Recordatorios**: Sistema de alertas de vencimiento de plazos
- [ ] **Reportes**: Exportación a PDF/Excel de historial de autos
- [ ] **Base de datos local**: Cache de autos para comparación de cambios
- [ ] **Webhooks**: Notificaciones a sistemas externos

## 🚨 Requisitos del Sistema

### Software requerido

✅ Python 3.11+
✅ pip (gestor de paquetes Python)
⚠️ Tesseract OCR (opcional, solo para PDFs escaneados)

### Instalar Tesseract (opcional)

**Windows:**
1. Descargar de: https://github.com/UB-Mannheim/tesseract/wiki
2. Instalar y agregar al PATH
3. Descargar paquete de idioma español

**Linux:**
```bash
sudo apt-get install tesseract-ocr tesseract-ocr-spa
```

**Mac:**
```bash
brew install tesseract tesseract-lang
```

## 💡 Tips de Uso

### 1. Testing en modo rápido

Para probar sin esperar 24 horas, modificar `run_with_scheduler.py`:

```python
# Cambiar de:
scheduler = start_scheduler()

# A:
scheduler = start_scheduler(interval_hours=1)  # Cada hora
```

### 2. Ver logs en tiempo real

```bash
tail -f logs/ingest_py.log
```

### 3. Probar clasificador interactivamente

```python
from apps.ingest_py.src.analyzers.auto_classifier import classify_auto

texto = "AUTO REQUIERE contestar en 10 días"
resultado = classify_auto(texto)
print(resultado)  # AutoType.PERENTORIO
```

### 4. Integración con el frontend

El frontend puede consumir estos endpoints:

```javascript
// Analizar radicado
const response = await fetch(`/autos/analyze/${radicado}?notify=true`);
const data = await response.json();

if (data.autos_perentorios.length > 0) {
  // Mostrar alerta roja
  showUrgentAlert(data.autos_perentorios);
}
```

## 📞 Soporte

Para preguntas o reportar bugs, contactar al equipo de desarrollo.

---

## ✅ Checklist de Implementación

- [x] Clasificador de autos con palabras clave
- [x] Extractor de documentos (PDF + OCR)
- [x] Sistema de notificaciones multi-canal
- [x] Scheduler para vigilancia automática
- [x] Endpoints API REST
- [x] Tests automatizados
- [x] Documentación completa
- [x] Configuración de ejemplo
- [x] Script de ejecución con scheduler
- [x] Requirements.txt actualizado

## 🎯 Estado: COMPLETADO ✅

**Fecha de implementación**: 2025-10-10
**Desarrollado por**: Claude Code
**Versión**: 1.0.0

---

**El sistema está listo para producción** 🚀
