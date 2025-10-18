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

from typing import Dict, Any, List
import re
import os
import time
from collections import defaultdict
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, Query, Header, Depends, Request

# Cargar variables de entorno desde .env
load_dotenv()

from .clients.rama_client import fetch_proceso_completo, fetch_proceso_completo_safe
from .analyzers.auto_classifier import batch_analyze, analyze_actuacion
from .notifications.notifier import get_notifier
from .clients.resilience import rama_circuit, rama_cache, metrics

app = FastAPI(title="Microservicio Ingesta de Procesos y Vigilancia de Autos")


# Rate limiter simple: 10 requests per minute por IP
class SimpleRateLimiter:
    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, List[float]] = defaultdict(list)

    def check_rate_limit(self, client_ip: str) -> bool:
        """Verifica si el cliente ha excedido el rate limit."""
        now = time.time()
        # Limpiar requests antiguos
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if now - req_time < self.window_seconds
        ]

        # Verificar límite
        if len(self.requests[client_ip]) >= self.max_requests:
            return False

        # Registrar nueva request
        self.requests[client_ip].append(now)
        return True


rate_limiter = SimpleRateLimiter(max_requests=10, window_seconds=60)


# Dependency para verificar rate limit
async def check_rate_limit(request: Request) -> str:
    """
    Verifica que el cliente no haya excedido el rate limit.

    Args:
        request: Request object de FastAPI

    Returns:
        La IP del cliente

    Raises:
        HTTPException: Si se excedió el rate limit
    """
    client_ip = request.client.host if request.client else "unknown"

    if not rate_limiter.check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit excedido. Máximo {rate_limiter.max_requests} requests por minuto.",
            headers={"Retry-After": "60"}
        )

    return client_ip


# Middleware de autenticación por API Key
async def verify_api_key(x_api_key: str = Header(..., alias="X-API-Key")) -> str:
    """
    Verifica que el header X-API-Key coincida con la clave esperada.

    Args:
        x_api_key: API key enviada en el header

    Returns:
        La API key si es válida

    Raises:
        HTTPException: Si la API key no es válida o no se proporciona
    """
    expected_key = os.getenv("INGEST_API_KEY", "default_insecure_key")

    if not x_api_key:
        raise HTTPException(
            status_code=401,
            detail="API Key requerida. Incluya el header X-API-Key."
        )

    if x_api_key != expected_key:
        raise HTTPException(
            status_code=403,
            detail="API Key inválida."
        )

    return x_api_key


@app.get("/healthz", tags=["Utils"])
async def healthz() -> Dict[str, Any]:
    """Endpoint de salud simple.

    Returns:
        Un diccionario indicando que el servicio está operativo.
    """
    return {"ok": True}


@app.get("/metrics", tags=["Utils"])
async def get_metrics() -> Dict[str, Any]:
    """Endpoint de métricas para observabilidad.

    Expone contadores y estadísticas del circuit breaker, cache y peticiones
    a la API de Rama Judicial.

    Returns:
        Diccionario con métricas:
        - breaker_open: Estado del circuit breaker
        - failures: Número de fallos consecutivos
        - reset_at: Timestamp ISO cuando se reabrirá el circuito (si está abierto)
        - cache_keys: Número de entradas en cache
        - rama_ok: Peticiones exitosas a Rama Judicial
        - rama_5xx: Peticiones fallidas (5xx)
        - cache_hit: Hits de cache
        - demo_hit: Fallbacks a datos demo
        - latency_ms_p50: Latencia p50
        - latency_ms_p95: Latencia p95
    """
    from datetime import datetime

    breaker_data = {
        "breaker_open": rama_circuit.is_open(),
        "failures": rama_circuit.failures,
        "reset_at": datetime.fromtimestamp(rama_circuit.opened_at).isoformat() if rama_circuit.opened_at else None,
        "cache_keys": len(rama_cache._cache),
    }

    return {
        **breaker_data,
        **metrics.to_dict(),
    }


@app.get("/ingest/ramajud/{radicado}", tags=["Ingest"])
async def ingest_radicado_raw(
    radicado: str,
    request: Request,
    api_key: str = Depends(verify_api_key),
    client_ip: str = Depends(check_rate_limit)
) -> Dict[str, Any]:
    """Consulta un radicado y devuelve la respuesta cruda de la API REAL.

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
        from .clients.ramajud import fetch_by_radicado
        data = await fetch_by_radicado(radicado)
        return {"ok": True, "data": data}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.get("/ingest/ramajud-normalized/{radicado}", tags=["Ingest"])
async def ingest_radicado_normalized(
    radicado: str,
    request: Request,
    use_safe: bool = True,
    analyze_autos: bool = True,
    api_key: str = Depends(verify_api_key),
    client_ip: str = Depends(check_rate_limit)
) -> Dict[str, Any]:
    """Consulta un radicado y devuelve la respuesta normalizada.

    Por defecto usa modo SAFE con circuit breaker, timeout reducido,
    cache y fallback automático. Esto garantiza que el sistema nunca
    se bloquee esperando la API externa.

    Flujo del modo SAFE (predeterminado):
    - Timeout de 5 segundos por petición
    - Máximo 2 reintentos
    - Circuit breaker: se abre después de 3 fallos consecutivos por 10 min
    - Cache: datos exitosos se guardan por 24 horas
    - Fallback: si todo falla, retorna último dato cacheado o datos demo

    Args:
        radicado: Número único de radicación (23 dígitos normalmente).
        use_safe: Si True (default) usa modo resiliente, si False usa API directa sin protección
        analyze_autos: Si True, analiza y clasifica AUTOS automáticamente

    Returns:
        Diccionario con el estado de la operación y el payload normalizado.
        - ok: True si la petición fue procesada
        - case: Datos del proceso
        - parties: Partes procesales
        - acts: Actuaciones (con análisis si analyze_autos=True)
    """
    try:
        # Por defecto usar modo SAFE (resiliente)
        if use_safe:
            normalized = await fetch_proceso_completo_safe(radicado)
        else:
            # Modo directo sin protección (solo para debugging)
            normalized = await fetch_proceso_completo(radicado)

        # Analizar AUTOS si se solicitó
        if analyze_autos and normalized.get("acts"):
            normalized["acts"] = batch_analyze(normalized["acts"])

        return {"ok": True, **normalized}
    except Exception as exc:
        # Solo en modo no-safe se propaga el error como 502
        # En modo safe nunca debería llegar aquí (tiene fallback)
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


@app.get("/autos/analyze/{radicado}", tags=["Autos"])
async def analyze_autos(
    radicado: str,
    request: Request,
    notify: bool = False,
    api_key: str = Depends(verify_api_key),
    client_ip: str = Depends(check_rate_limit)
) -> Dict[str, Any]:
    """
    Analiza un radicado para detectar y clasificar AUTOS.

    Este endpoint consulta todas las actuaciones de un proceso judicial,
    detecta cuáles son AUTOS y los clasifica como perentorios o de trámite.

    Args:
        radicado: Número único de radicación
        notify: Si True, envía notificaciones para autos perentorios

    Returns:
        Diccionario con:
        - autos_detectados: número de autos encontrados
        - autos_perentorios: lista de autos que requieren acción urgente
        - autos_tramite: lista de autos informativos
    """
    try:
        # Consultar proceso completo con API REAL
        normalized = await fetch_proceso_completo_safe(radicado)
        actuaciones = normalized.get("acts", [])

        # Analizar todas las actuaciones
        analyzed = batch_analyze(actuaciones)

        # Filtrar autos
        autos_perentorios = [a for a in analyzed if a.get("auto_type") == "perentorio"]
        autos_tramite = [a for a in analyzed if a.get("auto_type") == "tramite"]

        # Enviar notificaciones si se solicitó
        if notify:
            notifier = get_notifier()
            for auto in autos_perentorios:
                await notifier.notify_perentorio_auto(radicado, auto)

        return {
            "ok": True,
            "radicado": radicado,
            "total_actuaciones": len(actuaciones),
            "autos_detectados": len([a for a in analyzed if a.get("is_auto")]),
            "autos_perentorios": autos_perentorios,
            "autos_tramite": autos_tramite,
            "notificaciones_enviadas": notify,
        }

    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.get("/autos/history/{radicado}", tags=["Autos"])
async def get_auto_history(
    radicado: str,
    request: Request,
    api_key: str = Depends(verify_api_key),
    client_ip: str = Depends(check_rate_limit)
) -> Dict[str, Any]:
    """
    Obtiene el historial completo de autos de un radicado.

    Args:
        radicado: Número único de radicación

    Returns:
        Historial de autos con análisis completo
    """
    try:
        # Consultar proceso completo con API REAL
        normalized = await fetch_proceso_completo_safe(radicado)
        actuaciones = normalized.get("acts", [])

        # Analizar y filtrar solo autos
        analyzed = batch_analyze(actuaciones)
        autos = [a for a in analyzed if a.get("is_auto")]

        # Ordenar por fecha (más recientes primero)
        autos_sorted = sorted(
            autos,
            key=lambda x: x.get("fecha", ""),
            reverse=True
        )

        return {
            "ok": True,
            "radicado": radicado,
            "total_autos": len(autos),
            "autos": autos_sorted,
        }

    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.post("/autos/scan", tags=["Autos"])
async def trigger_scan(
    radicados: List[str] = Query(...),
    request: Request = None,
    api_key: str = Depends(verify_api_key),
    client_ip: str = Depends(check_rate_limit)
) -> Dict[str, Any]:
    """
    Dispara un escaneo manual de múltiples radicados.

    Este endpoint permite vigilar manualmente un conjunto de procesos
    para detectar autos nuevos y enviar notificaciones.

    Args:
        radicados: Lista de números de radicación a escanear

    Returns:
        Resumen del escaneo con autos detectados
    """
    results = []
    notifier = get_notifier()

    for radicado in radicados:
        try:
            # Consultar proceso completo con API REAL
            normalized = await fetch_proceso_completo_safe(radicado)
            actuaciones = normalized.get("acts", [])

            analyzed = batch_analyze(actuaciones)
            autos_perentorios = [a for a in analyzed if a.get("auto_type") == "perentorio"]

            # Notificar autos perentorios
            for auto in autos_perentorios:
                await notifier.notify_perentorio_auto(radicado, auto)

            results.append({
                "radicado": radicado,
                "ok": True,
                "autos_perentorios": len(autos_perentorios),
                "total_autos": len([a for a in analyzed if a.get("is_auto")]),
            })

        except Exception as exc:
            results.append({
                "radicado": radicado,
                "ok": False,
                "error": str(exc),
            })

    return {
        "ok": True,
        "total_escaneados": len(radicados),
        "resultados": results,
    }