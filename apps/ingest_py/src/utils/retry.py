"""
Funciones para implementar reintentos con retroceso exponencial.
Estas utilidades pueden usarse al llamar APIs externas para manejar errores
transitorios de red o límites de tasa.
"""

import asyncio
from functools import wraps
from typing import Any, Callable, Coroutine, TypeVar

T = TypeVar("T")


def async_retry(max_attempts: int = 3, base_delay: float = 1.0) -> Callable[[Callable[..., Coroutine[Any, Any, T]]], Callable[..., Coroutine[Any, Any, T]]]:
    """Decorador para reintentar una corrutina asincrónica.

    Args:
        max_attempts: número máximo de intentos antes de propagar la excepción.
        base_delay: tiempo base en segundos para el retroceso exponencial.

    Returns:
        Una función decorada que implementa la lógica de reintentos.
    """

    def decorator(func: Callable[..., Coroutine[Any, Any, T]]) -> Callable[..., Coroutine[Any, Any, T]]:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> T:
            attempt = 0
            while True:
                try:
                    return await func(*args, **kwargs)
                except Exception:  # pylint: disable=broad-except
                    attempt += 1
                    if attempt >= max_attempts:
                        raise
                    delay = base_delay * (2 ** (attempt - 1))
                    await asyncio.sleep(delay)
        return wrapper

    return decorator