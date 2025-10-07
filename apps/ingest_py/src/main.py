"""
Módulo principal del microservicio de ingesta.

Esta aplicación FastAPI proporciona una interfaz interna para
consultar procesos judiciales directamente desde la API pública de la
Rama Judicial de Colombia.  Además de retornar la respuesta cruda de
la API, se expone un endpoint que normaliza dichos datos en un
esquema apto para bases de datos relacionales.

Para ejecutar el servidor en desarrollo, sitúate en la raíz del
repositorio y ejecuta:

    uvicorn apps.ingest_py.src.main:app --reload --port 8000

"""

from typing import Dict, Any
import re

from fastapi import FastAPI, HTTPException, Query

from .clients.ramajud import fetch_by_radicado
from .normalizers.rama import normalize_rama_response

app = FastAPI(title="Microservicio Ingesta de Procesos")


@app.get("/healthz", tags=["Utils"])
async def healthz() -> Dict[str, Any]:
    """Endpoint de salud simple.

    Returns:
        Un diccionario indicando que el servicio está operativo.
    """
    return {"ok": True}


@app.get("/ingest/ramajud/{radicado}", tags=["Ingest"])
async def ingest_radicado_raw(radicado: str) -> Dict[str, Any]:
    """Consulta un radicado y devuelve la respuesta cruda.

    Este endpoint realiza la consulta de un número de radicado
    específico a la API pública de la Rama Judicial y devuelve el JSON
    original sin modificaciones.  Puede resultar útil para depurar
    problemas o examinar la estructura de la respuesta oficial.

    Args:
        radicado: Número único de radicación (23 dígitos normalmente).

    Returns:
        Diccionario con el estado de la operación y los datos crudos.
    """
    try:
        data = await fetch_by_radicado(radicado)
        return {"ok": True, "data": data}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.get("/ingest/ramajud-normalized/{radicado}", tags=["Ingest"])
async def ingest_radicado_normalized(radicado: str) -> Dict[str, Any]:
    """Consulta un radicado y devuelve la respuesta normalizada.

    Este endpoint se comporta como ``/ingest/ramajud/{radicado}`` pero
    devuelve un diccionario con tres claves: ``case`` con los campos
    principales del proceso, ``parties`` con las partes del proceso y
    ``acts`` con las actuaciones registradas.  Cada actuación incluye
    una clave única ``uniq_key`` que puede usarse para evitar
    duplicados en la persistencia.

    Args:
        radicado: Número único de radicación (23 dígitos normalmente).

    Returns:
        Diccionario con el estado de la operación y el payload
        normalizado.  En caso de error, se genera un HTTP 502.
    """
    try:
        data = await fetch_by_radicado(radicado)
        normalized = normalize_rama_response(data)
        return {"ok": True, **normalized}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.get("/ingest/search", tags=["Search"])
async def search(q: str = Query(..., min_length=2)) -> Dict[str, Any]:
    """Búsqueda de procesos por radicado o nombre.
    
    Args:
        q: Término de búsqueda (radicado o nombre)
        
    Returns:
        Diccionario con lista de resultados encontrados
    """
    # Si parece radicado, delega al normalizado
    if re.search(r"\d{5}-\d{2}-\d{2}-\d{3}-\d{4}-\d{5}-\d{2}", q):
        # respuesta tipo lista
        return {"items": [{"type": "radicado", "radicado": q}]}
    
    # Stub por nombre (extender luego): devuelve vacío por ahora
    return {"items": []}


@app.get("/ingest/test-normalized/{radicado}", tags=["Test"])
async def test_normalized(radicado: str) -> Dict[str, Any]:
    """Endpoint de prueba que simula respuesta normalizada sin llamadas externas.
    
    Args:
        radicado: Número de radicación
        
    Returns:
        Respuesta simulada para testing
    """
    return {
        "ok": True,
        "case": {
            "radicado": radicado,
            "status": "Activo",
            "city": "Bogotá",
            "court": "Juzgado 1 Civil"
        },
        "parties": [
            {"role": "Demandante", "name": "Juan Pérez"},
            {"role": "Demandado", "name": "María García"}
        ],
        "acts": [
            {"date": "2023-01-15", "title": "Auto admisorio demanda"},
            {"date": "2023-02-01", "title": "Citación a audiencia"}
        ]
    }