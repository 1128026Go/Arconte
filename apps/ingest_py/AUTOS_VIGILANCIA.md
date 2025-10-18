# Sistema de Vigilancia Automática de AUTOS

## 📋 Descripción

Sistema automatizado para detectar, clasificar y notificar sobre AUTOS judiciales publicados en el portal de la Rama Judicial de Colombia.

## 🎯 Funcionalidades

### 1. Detección Automática de AUTOS

El sistema identifica automáticamente si una actuación judicial es un AUTO mediante análisis de patrones en el título y descripción.

### 2. Clasificación Inteligente

Clasifica los autos en dos categorías:

#### 🔴 AUTO PERENTORIO
Requiere actuación urgente del abogado. Se detecta por palabras clave como:
- "requiérase", "confiérase traslado"
- "en el término de X días"
- "plazo de X días"
- "deberá presentar"
- "ordénese", "prevéngase"
- "recurso de apelación"

#### 📄 AUTO DE TRÁMITE
Avance procesal sin acción inmediata. Se detecta por palabras clave como:
- "admítase", "téngase por"
- "inscríbase", "infórmese"
- "remítase", "agregue"
- "siga el trámite"
- "avoca conocimiento"

### 3. Notificaciones Automáticas

- **Autos perentorios**: Envío inmediato de alerta por email y push notification
- **Autos de trámite**: Registro en el historial del expediente

### 4. Extracción de Documentos

- Descarga automática de PDFs adjuntos
- Extracción de texto de PDFs nativos
- OCR para PDFs escaneados (cuando esté disponible el texto)

## 🚀 Endpoints API

### GET `/autos/analyze/{radicado}`

Analiza un radicado específico para detectar autos.

**Parámetros:**
- `radicado`: Número de radicación (path)
- `notify`: Si `true`, envía notificaciones (query, default: false)

**Respuesta:**
```json
{
  "ok": true,
  "radicado": "11001310300020230012300",
  "total_actuaciones": 15,
  "autos_detectados": 3,
  "autos_perentorios": [
    {
      "fecha": "2024-03-15",
      "tipo": "Auto",
      "descripcion": "AUTO REQUIERE contestar dentro de 10 días...",
      "is_auto": true,
      "auto_type": "perentorio",
      "requires_action": true,
      "classification_confidence": 0.8
    }
  ],
  "autos_tramite": [...],
  "notificaciones_enviadas": false
}
```

### GET `/autos/history/{radicado}`

Obtiene el historial completo de autos de un proceso.

**Respuesta:**
```json
{
  "ok": true,
  "radicado": "11001310300020230012300",
  "total_autos": 5,
  "autos": [
    {
      "fecha": "2024-03-15",
      "tipo": "Auto",
      "auto_type": "perentorio",
      "requires_action": true
    }
  ]
}
```

### POST `/autos/scan`

Dispara un escaneo manual de múltiples radicados.

**Parámetros:**
- `radicados`: Lista de radicados a escanear (query)

**Ejemplo:**
```bash
POST /autos/scan?radicados=11001310300020230012300&radicados=11001310300020230012301
```

**Respuesta:**
```json
{
  "ok": true,
  "total_escaneados": 2,
  "resultados": [
    {
      "radicado": "11001310300020230012300",
      "ok": true,
      "autos_perentorios": 1,
      "total_autos": 3
    }
  ]
}
```

## ⏰ Vigilancia Automática (Scheduler)

El sistema ejecuta automáticamente el escaneo de todos los radicados registrados:

- **Modo producción**: 1 vez al día a las 6:00 AM
- **Modo testing**: Configurable cada N horas

### Activar el Scheduler

```python
from apps.ingest_py.src.sched.cron import start_scheduler

# Modo producción (diario)
scheduler = start_scheduler()

# Modo testing (cada 2 horas)
scheduler = start_scheduler(interval_hours=2)
```

## 📦 Módulos Implementados

### `analyzers/auto_classifier.py`

Clasificador de autos con análisis basado en palabras clave.

**Funciones principales:**
- `is_auto()`: Detecta si una actuación es un auto
- `classify_auto()`: Clasifica como perentorio/trámite
- `analyze_actuacion()`: Análisis completo de actuación
- `batch_analyze()`: Análisis en lote

### `analyzers/document_extractor.py`

Extractor de texto de documentos judiciales.

**Funciones principales:**
- `download_document()`: Descarga documento desde URL
- `extract_text_from_pdf()`: Extrae texto de PDF
- `extract_text_with_ocr()`: OCR para PDFs escaneados
- `extract_document_text()`: Extracción completa con fallback

### `notifications/notifier.py`

Sistema de notificaciones multi-canal.

**Clase principal:**
- `NotificationService`: Servicio de notificaciones
  - `notify_perentorio_auto()`: Notifica auto perentorio
  - `notify_tramite_auto()`: Registra auto de trámite

### `sched/cron.py`

Programador de tareas periódicas.

**Funciones principales:**
- `scan_all_active_cases()`: Escanea todos los radicados
- `start_scheduler()`: Inicia el scheduler

## 🛠️ Instalación

### 1. Instalar dependencias Python

```bash
cd apps/ingest_py
pip install -r requirements.txt
```

### 2. Instalar Tesseract OCR (opcional)

**Windows:**
```bash
# Descargar desde: https://github.com/UB-Mannheim/tesseract/wiki
# Agregar al PATH
```

**Linux/Mac:**
```bash
sudo apt-get install tesseract-ocr tesseract-ocr-spa
# o
brew install tesseract tesseract-lang
```

### 3. Configurar variables de entorno

```bash
# .env
API_BASE_URL=http://localhost:8000
ENABLE_OCR=true
NOTIFICATION_EMAIL_FROM=noreply@arconte.com
```

## 🧪 Testing

### Probar clasificación de autos

```python
from apps.ingest_py.src.analyzers.auto_classifier import classify_auto

texto = "AUTO REQUIERE contestar demanda dentro de 10 días"
tipo = classify_auto(texto)
print(tipo)  # AutoType.PERENTORIO
```

### Probar endpoint de análisis

```bash
curl http://localhost:8001/autos/analyze/11001310300020230012300?notify=false
```

### Disparar escaneo manual

```bash
curl -X POST "http://localhost:8001/autos/scan?radicados=11001310300020230012300"
```

## 📊 Flujo Completo

```
1. Scheduler ejecuta scan_all_active_cases()
   ↓
2. Para cada radicado:
   - Consultar actuaciones desde Rama Judicial
   - Normalizar datos
   ↓
3. Analizar actuaciones:
   - Detectar si es AUTO
   - Clasificar tipo (perentorio/trámite)
   ↓
4. Si hay auto perentorio:
   - 🔴 Enviar notificación URGENTE
   - Registrar en BD
   ↓
5. Si hay auto de trámite:
   - 📄 Registrar avance
   - Log en historial
```

## 🔧 Configuración Avanzada

### Personalizar palabras clave

Editar `analyzers/auto_classifier.py`:

```python
PERENTORIO_KEYWORDS = [
    r"tu_palabra_clave_personalizada",
    # ... más keywords
]
```

### Cambiar frecuencia de escaneo

```python
# En main.py o run_persistent.py
scheduler = start_scheduler(interval_hours=6)  # Cada 6 horas
```

### Integrar con base de datos

Modificar `sched/cron.py`:

```python
async def scan_all_active_cases() -> None:
    # Obtener radicados desde BD
    radicados = await db.get_active_radicados()
    # ...
```

## 📝 Notas Importantes

1. **OCR requiere Tesseract**: Si no está instalado, los PDFs escaneados no se procesarán
2. **Rate limiting**: El scraper tiene delays para no saturar el servidor de la Rama Judicial
3. **Notificaciones**: Requiere configuración del backend PHP/Laravel para envío de emails
4. **Persistencia**: Actualmente las notificaciones se envían al backend pero no hay BD local

## 🚨 Troubleshooting

### Error: "pytesseract not installed"
```bash
pip install pytesseract
# Y instalar el binario de Tesseract para tu OS
```

### Error: "pdf2image needs poppler"
```bash
# Windows: descargar poppler-utils
# Linux: sudo apt-get install poppler-utils
# Mac: brew install poppler
```

### No se detectan autos
- Verificar que las actuaciones tengan la palabra "auto" en el tipo
- Revisar logs para ver el análisis de clasificación
- Ajustar palabras clave si es necesario

## 🔮 Próximas Mejoras

- [ ] ML/NLP para clasificación más precisa
- [ ] Extracción de plazos específicos del texto
- [ ] Dashboard web para monitoreo en tiempo real
- [ ] Integración con WhatsApp Business API
- [ ] Análisis de sentencias además de autos
- [ ] Sistema de recordatorios de plazos
- [ ] Exportación de reportes PDF/Excel

## 📞 Soporte

Para reportar issues o solicitar features, crear un issue en el repositorio del proyecto.

---

**Desarrollado por**: Equipo Arconte
**Última actualización**: 2025-10-10
