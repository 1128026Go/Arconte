"""
Configuración de logging para el microservicio de ingesta.  Este módulo
define una función para inicializar el logging con un formato coherente y
nivel configurable.
"""

import logging
from typing import Optional


def setup_logging(level: str | int = logging.INFO) -> None:
    """Configura el registro de logs a nivel global.

    Args:
        level: nivel de registro (por ejemplo, `logging.DEBUG`).
    """
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )