"""
Módulo que define tareas periódicas utilizando APScheduler.  Estas tareas
pueden ejecutarse en segundo plano junto con la aplicación FastAPI para
mantener actualizados los procesos judiciales.
"""

from __future__ import annotations

import asyncio
import logging
from typing import List

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from ..clients.ramajud import fetch_by_radicado
from ..storage.dao import upsert_case_snapshot

logger = logging.getLogger(__name__)


async def scan_all_active_cases() -> None:
    """Ejemplo de tarea que recorre todos los casos registrados y
    actualiza su información.  En una implementación real se extraerían
    los radicados de la base de datos.  Aquí se utiliza una lista
    ficticia para mostrar la mecánica.
    """
    # TODO: obtener radicados de la base de datos
    radicados: List[str] = ["11001310300020230012300", "11001310300020230012301"]
    for radicado in radicados:
        try:
            data = await fetch_by_radicado(radicado)
            case_id, changes = await upsert_case_snapshot(radicado, data, fuente="RAMA_API")
            logger.info("Actualizado caso %s: id=%s, cambios=%s", radicado, case_id, changes)
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("Fallo actualizando caso %s: %s", radicado, exc)


def start_scheduler() -> AsyncIOScheduler:
    """Configura y devuelve un programador de tareas que ejecuta
    `scan_all_active_cases` cada día a las 6 a.m. hora del servidor.
    """
    scheduler = AsyncIOScheduler()
    scheduler.add_job(scan_all_active_cases, "cron", hour=6, minute=0)
    scheduler.start()
    logger.info("Scheduler iniciado y tarea de escaneo programada")
    return scheduler


# Iniciar el scheduler si se ejecuta directamente
if __name__ == "__main__":  # pragma: no cover
    logging.basicConfig(level=logging.INFO)
    loop = asyncio.get_event_loop()
    start_scheduler()
    loop.run_forever()