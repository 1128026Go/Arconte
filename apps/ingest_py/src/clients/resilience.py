"""
Sistema de resiliencia: circuit breaker y cache para APIs externas.

Implementa un circuit breaker simple y cache en memoria para tolerar
fallos de la API de Rama Judicial sin bloquear el sistema.
"""

import time
import logging
from typing import Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)


# Métricas globales
class Metrics:
    """Contenedor de métricas para observabilidad."""
    def __init__(self):
        self.rama_ok = 0
        self.rama_5xx = 0
        self.cache_hit = 0
        self.demo_hit = 0
        self.latencies = []  # Lista de latencias en ms

    def record_success(self, latency_ms: float):
        """Registra una petición exitosa."""
        self.rama_ok += 1
        self.latencies.append(latency_ms)
        # Mantener solo últimas 1000 latencias
        if len(self.latencies) > 1000:
            self.latencies = self.latencies[-1000:]

    def record_5xx(self):
        """Registra un error 5xx."""
        self.rama_5xx += 1

    def record_cache_hit(self):
        """Registra un hit de cache."""
        self.cache_hit += 1

    def record_demo_hit(self):
        """Registra uso de datos demo."""
        self.demo_hit += 1

    def get_percentile(self, p: int) -> float:
        """Calcula percentil de latencias."""
        if not self.latencies:
            return 0.0
        sorted_latencies = sorted(self.latencies)
        index = int(len(sorted_latencies) * p / 100)
        return sorted_latencies[min(index, len(sorted_latencies) - 1)]

    def to_dict(self) -> Dict[str, Any]:
        """Serializa métricas a diccionario."""
        return {
            "rama_ok": self.rama_ok,
            "rama_5xx": self.rama_5xx,
            "cache_hit": self.cache_hit,
            "demo_hit": self.demo_hit,
            "latency_ms_p50": round(self.get_percentile(50), 2),
            "latency_ms_p95": round(self.get_percentile(95), 2),
        }


# Instancia global de métricas
metrics = Metrics()


@dataclass
class CacheEntry:
    """Entrada de cache con timestamp."""
    data: Dict[str, Any]
    timestamp: float


class SimpleCircuitBreaker:
    """
    Circuit breaker simple para API externa.

    - CERRADO: peticiones pasan normalmente
    - ABIERTO: peticiones bloqueadas, se devuelve fallback
    - Se abre después de N fallos consecutivos
    - Se cierra automáticamente después de TTL
    """

    def __init__(self, failure_threshold: int = 3, open_duration: int = 600):
        """
        Args:
            failure_threshold: Número de fallos consecutivos para abrir
            open_duration: Segundos que permanece abierto (default 10 min)
        """
        self.failure_threshold = failure_threshold
        self.open_duration = open_duration
        self.failures = 0
        self.opened_at: Optional[float] = None

    def is_open(self) -> bool:
        """Verifica si el circuito está abierto."""
        if self.opened_at is None:
            return False

        # Verificar si ya pasó el TTL para cerrarlo
        elapsed = time.time() - self.opened_at
        if elapsed >= self.open_duration:
            logger.info("Circuit breaker: cerrando después de %d segundos", int(elapsed))
            self.close()
            return False

        return True

    def record_success(self):
        """Registra una operación exitosa."""
        self.failures = 0
        if self.opened_at:
            logger.info("Circuit breaker: cerrando después de éxito")
            self.opened_at = None

    def record_failure(self):
        """Registra un fallo y abre el circuito si alcanza el threshold."""
        self.failures += 1
        logger.warning(f"Circuit breaker: fallo {self.failures}/{self.failure_threshold}")

        if self.failures >= self.failure_threshold and not self.opened_at:
            self.open()

    def open(self):
        """Abre el circuito."""
        self.opened_at = time.time()
        logger.error(
            f"Circuit breaker: ABIERTO por {self.open_duration}s después de "
            f"{self.failures} fallos consecutivos"
        )

    def close(self):
        """Cierra el circuito manualmente."""
        self.opened_at = None
        self.failures = 0


class SimpleCache:
    """Cache simple en memoria con TTL."""

    def __init__(self, ttl: int = 86400):  # 24 horas
        """
        Args:
            ttl: Tiempo de vida de las entradas en segundos (default 24h)
        """
        self.ttl = ttl
        self._cache: Dict[str, CacheEntry] = {}

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Obtiene un valor del cache si existe y no ha expirado."""
        entry = self._cache.get(key)
        if not entry:
            return None

        elapsed = time.time() - entry.timestamp
        if elapsed > self.ttl:
            logger.debug(f"Cache: entrada {key} expiró ({int(elapsed)}s)")
            del self._cache[key]
            return None

        logger.info(f"Cache: hit para {key} (edad: {int(elapsed)}s)")
        return entry.data

    def set(self, key: str, data: Dict[str, Any]):
        """Guarda un valor en el cache."""
        self._cache[key] = CacheEntry(data=data, timestamp=time.time())
        logger.info(f"Cache: guardado {key}")

    def clear(self, key: Optional[str] = None):
        """Limpia el cache completo o una entrada específica."""
        if key:
            self._cache.pop(key, None)
        else:
            self._cache.clear()


# Instancias globales
rama_circuit = SimpleCircuitBreaker(failure_threshold=3, open_duration=600)
rama_cache = SimpleCache(ttl=86400)
