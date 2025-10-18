"""
Script para ejecutar el servidor FastAPI con el scheduler de vigilancia activado.

Ejecutar con:
    python -m apps.ingest_py.run_with_scheduler
"""

import asyncio
import logging
import uvicorn
from contextlib import asynccontextmanager

from apps.ingest_py.src.main import app
from apps.ingest_py.src.sched.cron import start_scheduler

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app):
    """
    Lifecycle manager para iniciar/detener el scheduler.
    """
    # Startup
    logger.info("🚀 Iniciando servidor con vigilancia automática de autos...")

    # Iniciar scheduler (cada 24 horas por defecto)
    # Para testing, cambiar a: start_scheduler(interval_hours=1)
    scheduler = start_scheduler()

    logger.info("✓ Servidor iniciado y scheduler activo")
    logger.info("📡 API disponible en: http://localhost:8001")
    logger.info("📚 Documentación en: http://localhost:8001/docs")

    yield

    # Shutdown
    logger.info("🛑 Deteniendo scheduler...")
    scheduler.shutdown()
    logger.info("✓ Scheduler detenido")


# Asignar lifecycle al app
app.router.lifespan_context = lifespan


if __name__ == "__main__":
    """
    Ejecuta el servidor con vigilancia automática.

    El scheduler:
    - Modo producción (default): Escanea todos los radicados 1 vez al día a las 6 AM
    - Modo testing: Configurar interval_hours en start_scheduler()

    Para cambiar el intervalo, editar la llamada a start_scheduler() arriba.
    """
    uvicorn.run(
        "apps.ingest_py.run_with_scheduler:app",
        host="0.0.0.0",
        port=8001,
        reload=False,  # Desactivar reload para que el scheduler funcione correctamente
        log_level="info"
    )
