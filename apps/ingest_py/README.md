# Ingest Service (WIP)

Servicio FastAPI experimental para normalizar radicados y enviar actualizaciones al backend PHP.

## Requisitos
- Python 3.11+
- Dependencias listadas en `requirements.txt`

## Instalación
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Ejecución
```bash
uvicorn run_persistent:app --reload --port 8001
```

El endpoint principal expone `/normalized/{radicado}` y responde con datos mock hasta que el scraper esté listo.
