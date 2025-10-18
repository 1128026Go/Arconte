"""
Cliente completo para la API de la Rama Judicial.

Integra las consultas de procesos y actuaciones en un flujo unico,
obteniendo datos reales de la API oficial y normalizandolos.
"""

from __future__ import annotations

import logging
import time
from typing import Dict, Any

from .ramajud import fetch_by_radicado, fetch_actuaciones
from ..normalizers.rama import normalize_rama_response
from .resilience import rama_circuit, rama_cache, metrics

logger = logging.getLogger(__name__)

# Configuracion para version safe
SAFE_TIMEOUT = 5  # segundos
SAFE_RETRIES = 2  # intentos


async def fetch_proceso_completo(radicado: str) -> Dict[str, Any]:
    """
    Obtiene un proceso completo con todas sus actuaciones desde la API real.

    Flujo:
    1. Consulta los datos basicos del proceso por radicado
    2. Consulta las actuaciones del proceso usando el idProceso
    """
    logger.info(f"Consultando proceso completo: {radicado}")

    try:
        # 1. Consultar datos basicos del proceso
        proceso_data = await fetch_by_radicado(radicado)

        if not proceso_data or not proceso_data.get("procesos"):
            raise ValueError(f"No se encontro el proceso {radicado}")

        # Extraer el primer proceso de la respuesta
        proceso = proceso_data["procesos"][0]
        id_proceso = proceso.get("idProceso")

        if not id_proceso:
            logger.warning(f"Proceso {radicado} no tiene idProceso, retornando sin actuaciones")
            # Normalizar solo con datos basicos
            return normalize_rama_response(proceso_data)

        # 2. Consultar actuaciones del proceso
        logger.info(f"Consultando actuaciones del proceso ID: {id_proceso}")
        actuaciones_data = await fetch_actuaciones(id_proceso)

        # 3. Normalizar todo junto
        normalized = normalize_rama_response(proceso_data, actuaciones_data)

        logger.info(
            f"Proceso {radicado} obtenido: {len(normalized.get('acts', []))} actuaciones"
        )

        return normalized

    except Exception as exc:
        logger.error(f"Error consultando proceso {radicado}: {exc}")
        raise


async def fetch_proceso_completo_safe(radicado: str) -> Dict[str, Any]:
    """
    Version segura con circuit breaker, cache y fallback.

    Flujo:
    1. Si circuito abierto -> cache o fallback
    2. Intentar API real con timeout reducido y reintentos
    3. Si exito -> guardar en cache y cerrar circuito
    4. Si fallo -> cache o fallback y abrir circuito
    """
    cache_key = f"last_good:{radicado}"

    # 1. Circuit breaker abierto -> cache o fallback inmediato
    if rama_circuit.is_open():
        logger.warning(f"Circuit breaker abierto, usando cache/fallback para {radicado}")
        cached = rama_cache.get(cache_key)
        if cached:
            logger.info(f"Retornando datos cacheados para {radicado}")
            metrics.record_cache_hit()
            return cached
        logger.info(f"Sin cache, retornando datos demo para {radicado}")
        metrics.record_demo_hit()
        return _generate_fallback_data(radicado)

    # 2. Intentar API real con configuracion agresiva
    try:
        start_time = time.time()
        logger.info(
            f"Consultando API de Rama Judicial: {radicado} (timeout: {SAFE_TIMEOUT}s)"
        )

        # Llamar a fetch_by_radicado con reintentos reducidos
        proceso_data = await fetch_by_radicado(radicado, max_retries=SAFE_RETRIES)

        if not proceso_data or not proceso_data.get("procesos"):
            raise ValueError(f"No se encontro el proceso {radicado}")

        proceso = proceso_data["procesos"][0]
        id_proceso = proceso.get("idProceso")

        if not id_proceso:
            logger.warning(f"Proceso {radicado} sin idProceso, normalizando sin actuaciones")
            normalized = normalize_rama_response(proceso_data)
        else:
            # Consultar actuaciones tambien con retry reducido
            actuaciones_data = await fetch_actuaciones(id_proceso, max_retries=SAFE_RETRIES)
            normalized = normalize_rama_response(proceso_data, actuaciones_data)

        # 3. Exito -> guardar en cache y registrar metricas
        latency_ms = (time.time() - start_time) * 1000
        rama_cache.set(cache_key, normalized)
        rama_circuit.record_success()
        metrics.record_success(latency_ms)
        logger.info(
            f"Proceso {radicado} obtenido exitosamente en {latency_ms:.0f}ms: "
            f"{len(normalized.get('acts', []))} actuaciones"
        )
        return normalized

    except Exception as exc:
        # 4. Fallo -> registrar metricas y buscar cache o fallback
        logger.error(f"Error consultando API para {radicado}: {exc}")
        metrics.record_5xx()
        rama_circuit.record_failure()

        # Intentar cache primero
        cached = rama_cache.get(cache_key)
        if cached:
            logger.warning(f"API fallo, retornando datos cacheados para {radicado}")
            metrics.record_cache_hit()
            return cached

        # Ultimo recurso: datos demo
        logger.warning(
            f"API fallo y no hay cache, retornando datos demo para {radicado}"
        )
        metrics.record_demo_hit()
        return _generate_fallback_data(radicado)


def _generate_fallback_data(radicado: str) -> Dict[str, Any]:
    """
    Genera datos de fallback cuando la API falla y no hay cache.
    """
    from ..scrapers.ramajud_scraper import generate_realistic_actuaciones

    actuaciones_demo = generate_realistic_actuaciones(radicado)

    return {
        "case": {
            "radicado": radicado,
            "jurisdiccion": "DEMO",
            "juzgado": "Juzgado Demo",
            "estado_actual": "En espera: Rama Judicial fuera de servicio",
            "fuente": "FALLBACK_DATA",
        },
        "parties": [
            {"rol": "Demandante", "nombre": "Usuario Demo", "documento": None}
        ],
        "acts": actuaciones_demo,
    }

