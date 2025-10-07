"""
Implementación simple de un limitador de tasa (rate limiter) basado en un
algoritmo de token bucket.  Puede usarse para controlar la frecuencia de
llamadas a servicios externos, evitando exceder límites de uso.
"""

import asyncio
import time
from typing import Callable, Coroutine, TypeVar

T = TypeVar("T")


class RateLimiter:
    """Un limitador de tasa que permite ejecutar acciones a un máximo de
    `rate` veces por segundo.  Se implementa como un bucket de tokens
    regenerado en intervalos fijos.
    """

    def __init__(self, rate: float, capacity: int | None = None) -> None:
        self.rate = rate
        self.capacity = capacity or int(rate)
        self.tokens = self.capacity
        self.last_refill = time.monotonic()
        self._lock = asyncio.Lock()

    async def acquire(self) -> None:
        async with self._lock:
            # Reponer tokens en función del tiempo transcurrido
            now = time.monotonic()
            elapsed = now - self.last_refill
            refill_amount = elapsed * self.rate
            if refill_amount > 1:
                self.tokens = min(self.capacity, self.tokens + int(refill_amount))
                self.last_refill = now
            # Esperar si no hay tokens disponibles
            while self.tokens <= 0:
                await asyncio.sleep(max(1.0 / self.rate, 0.01))
                now = time.monotonic()
                elapsed = now - self.last_refill
                refill_amount = elapsed * self.rate
                if refill_amount > 1:
                    self.tokens = min(self.capacity, self.tokens + int(refill_amount))
                    self.last_refill = now
            self.tokens -= 1

    async def wrap(self, coro_func: Callable[..., Coroutine[Any, Any, T]], *args: Any, **kwargs: Any) -> T:
        """Envuelve y limita la ejecución de una corrutina.

        Args:
            coro_func: función corrutina a ejecutar.
            *args: argumentos posicionales para la corrutina.
            **kwargs: argumentos nombrados para la corrutina.

        Returns:
            El resultado de la corrutina.
        """
        await self.acquire()
        return await coro_func(*args, **kwargs)