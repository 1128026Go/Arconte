"""
Módulo que define tareas periódicas utilizando APScheduler.  Estas tareas
pueden ejecutarse en segundo plano junto con la aplicación FastAPI para
mantener actualizados los procesos judiciales.
"""

from __future__ import annotations

import asyncio
import logging
from typing import List, Dict, Any

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from ..clients.rama_client import fetch_proceso_completo_safe
from ..storage.dao import upsert_case_snapshot
from ..analyzers.auto_classifier import analyze_actuacion
from ..notifications.notifier import get_notifier

logger = logging.getLogger(__name__)


async def scan_all_active_cases() -> None:
    """
    Tarea que recorre todos los casos registrados, actualiza su información
    y detecta AUTOS para enviar notificaciones.

    Esta función:
    1. Consulta todos los radicados activos
    2. Descarga actuaciones nuevas
    3. Detecta y clasifica AUTOS (perentorio vs trámite)
    4. Envía notificaciones cuando encuentra autos perentorios
    """
    # TODO: obtener radicados de la base de datos
    radicados: List[str] = ["11001310300020230012300", "11001310300020230012301"]

    notifier = get_notifier()

    for radicado in radicados:
        try:
            logger.info(f"Vigilando radicado: {radicado}")

            # Consultar proceso completo con API REAL
            normalized = await fetch_proceso_completo_safe(radicado)
            actuaciones = normalized.get("acts", [])

            # Analizar cada actuación para detectar autos
            for actuacion in actuaciones:
                analyzed = analyze_actuacion(actuacion)

                # Si es un auto, procesar según tipo
                if analyzed.get("is_auto"):
                    auto_type = analyzed.get("auto_type")

                    if auto_type == "perentorio":
                        # ALERTA: Auto perentorio detectado
                        logger.warning(
                            f"🔴 AUTO PERENTORIO detectado en {radicado}: "
                            f"{analyzed.get('tipo')}"
                        )
                        await notifier.notify_perentorio_auto(radicado, analyzed)

                    elif auto_type == "tramite":
                        # Registrar avance normal
                        logger.info(
                            f"📄 Auto de trámite en {radicado}: "
                            f"{analyzed.get('tipo')}"
                        )
                        await notifier.notify_tramite_auto(radicado, analyzed)

            # Actualizar snapshot en BD
            case_id, changes = await upsert_case_snapshot(radicado, normalized, fuente="RAMA_API")
            logger.info(
                f"Actualizado caso {radicado}: id={case_id}, "
                f"cambios={changes}, autos detectados={len([a for a in actuaciones if a.get('is_auto')])}"
            )

        except Exception as exc:  # pylint: disable=broad-except
            logger.error(f"Fallo actualizando caso {radicado}: {exc}")


def start_scheduler(interval_hours: int = 24) -> AsyncIOScheduler:
    """
    Configura y devuelve un programador de tareas para vigilancia de autos.

    Por defecto ejecuta `scan_all_active_cases` cada 24 horas a las 6 a.m.
    Para pruebas, puede configurarse un intervalo más frecuente.

    Args:
        interval_hours: Intervalo en horas entre escaneos (default: 24)

    Returns:
        Scheduler configurado e iniciado
    """
    scheduler = AsyncIOScheduler()

    if interval_hours == 24:
        # Modo producción: 1 vez al día a las 6 AM
        scheduler.add_job(scan_all_active_cases, "cron", hour=6, minute=0)
        logger.info("✓ Scheduler iniciado: Vigilancia diaria de autos a las 6 AM")
    else:
        # Modo testing: cada N horas
        scheduler.add_job(scan_all_active_cases, "interval", hours=interval_hours)
        logger.info(f"✓ Scheduler iniciado: Vigilancia cada {interval_hours} hora(s)")

    scheduler.start()
    return scheduler


# Iniciar el scheduler si se ejecuta directamente
if __name__ == "__main__":  # pragma: no cover
    logging.basicConfig(level=logging.INFO)
    loop = asyncio.get_event_loop()
    start_scheduler()
    loop.run_forever()