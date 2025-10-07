"""
Cliente HTTP para la API pública de la Rama Judicial.  Proporciona
funciones asíncronas que consultan el endpoint de procesos por
radicado.  El endpoint oficial documentado está en
`https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Procesos/Consulta/NumeroRadicacion`.
La función `fetch_by_radicado` construye la URL con los parámetros
requeridos y devuelve el JSON de la respuesta.  Se implementan
reintentos básicos y control de errores.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict

import httpx

logger = logging.getLogger(__name__)


BASE_URL = (
    "https://consultaprocesos.ramajudicial.gov.co:448/api/v2/"
    "Procesos/Consulta/NumeroRadicacion"
)

ACTUACIONES_URL = (
    "https://consultaprocesos.ramajudicial.gov.co:448/api/v2/"
    "Procesos/Actuaciones/{id_proceso}"
)


async def fetch_by_radicado(
    radicado: str, *, solo_activos: bool = False, page: int = 1, max_retries: int = 3
) -> Dict[str, Any]:
    """Consulta el número de radicado en la API oficial de la Rama Judicial.

    Args:
        radicado: cadena con el número de proceso completo.
        solo_activos: indica si la API debe filtrar solo procesos activos.
        page: número de página, la API soporta paginación cuando hay varios resultados.
        max_retries: número máximo de reintentos ante fallos de red.

    Returns:
        El cuerpo de la respuesta JSON como diccionario.

    Raises:
        httpx.HTTPError: si la solicitud falla después de los reintentos.
    """
    params = {
        "numero": radicado,
        "SoloActivos": str(solo_activos).lower(),
        "pagina": page,
    }
    attempt = 0
    last_exc: Exception | None = None
    while attempt < max_retries:
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.get(BASE_URL, params=params)
                response.raise_for_status()
                return response.json()
        except Exception as exc:  # pylint: disable=broad-except
            last_exc = exc
            attempt += 1
            wait = 2**attempt
            logger.warning(
                "Error consultando radicado %s (intento %s/%s): %s", radicado, attempt, max_retries, exc
            )
            await asyncio.sleep(wait)
    assert last_exc is not None  # para mypy
    raise last_exc


async def fetch_actuaciones(
    id_proceso: int, *, max_retries: int = 3
) -> Dict[str, Any]:
    """Consulta las actuaciones de un proceso por su ID.

    Args:
        id_proceso: ID numérico del proceso en la API.
        max_retries: número máximo de reintentos ante fallos de red.

    Returns:
        El cuerpo de la respuesta JSON como diccionario.

    Raises:
        httpx.HTTPError: si la solicitud falla después de los reintentos.
    """
    url = ACTUACIONES_URL.format(id_proceso=id_proceso)
    attempt = 0
    last_exc: Exception | None = None
    while attempt < max_retries:
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                return response.json()
        except Exception as exc:  # pylint: disable=broad-except
            last_exc = exc
            attempt += 1
            wait = 2**attempt
            logger.warning(
                "Error consultando actuaciones del proceso %s (intento %s/%s): %s",
                id_proceso, attempt, max_retries, exc
            )
            await asyncio.sleep(wait)
    assert last_exc is not None  # para mypy
    raise last_exc