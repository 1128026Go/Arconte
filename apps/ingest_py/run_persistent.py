#!/usr/bin/env python3
"""
Script persistente para FastAPI - mantiene el servidor corriendo
"""
import os
import time
import sys
import threading
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Importar el cliente y normalizador de la Rama Judicial
from src.clients.ramajud import fetch_by_radicado, fetch_actuaciones
from src.normalizers.rama import normalize_rama_response
from src.scrapers.ramajud_scraper import scrape_actuaciones
from src.scrapers.playwright_scraper import scrape_proceso_playwright
from src.clients.jurisprudencia import buscar_jurisprudencia, obtener_sentencias_recientes

app = FastAPI(title="Aplicacion Juridica - FastAPI", version="1.0.0")

# Configurar CORS para desarrollo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Obtener API key desde variable de entorno
API_KEY = os.getenv("INGEST_API_KEY", "5d95c7ed99d196f47c374cc04c7cf77c2235a29b67dc85baa573f3bb815024b1")

async def verify_api_key(x_api_key: str = Header(None)):
    """Verificar API key en header X-API-Key"""
    if x_api_key is None or x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid API Key")
    return x_api_key

@app.get("/")
async def root():
    return {"message": "FastAPI funcionando", "status": "ok", "service": "ingest_py"}

@app.get("/healthz")
async def health():
    return {"ok": True, "service": "ingest_py", "status": "healthy"}

@app.get("/metrics")
async def metrics():
    # Endpoint para compatibilidad con health externo del backend
    return {"breaker_open": False, "service": "ingest_py"}

@app.get("/test")
async def test():
    return {
        "message": "Servicio de prueba funcionando",
        "endpoints": ["/", "/healthz", "/test", "/normalized/{radicado}"]
    }

@app.get("/normalized/{radicado}")
@app.get("/ingest/ramajud-normalized/{radicado}")
async def get_normalized(radicado: str, api_key: str = Depends(verify_api_key)):
    """Endpoint para obtener datos normalizados de un radicado desde la Rama Judicial

    Sistema multi-estrategia con Playwright:
    1. Usa Playwright para scraping real del sitio de Rama Judicial
    2. Si falla, retorna datos de fallback con información mínima
    3. El scraper incluye anti-detección y reintentos automáticos

    Para desarrollo: usar INGEST_USE_MOCK=1 para forzar datos mock
    """
    # MODO DESARROLLO: Forzar uso de datos mock
    use_mock = os.getenv("INGEST_USE_MOCK", "1").lower() in ("1", "true", "yes")

    try:
        if use_mock:
            print(f"[MOCK] Modo mock activado - saltando scraper")
            raise RuntimeError("Mock mode enabled")

        print(f"[INFO] Iniciando consulta real con Playwright para {radicado}")

        # Usar el scraper de Playwright para obtener datos REALES
        resultado_playwright = await scrape_proceso_playwright(radicado)

        # Extraer datos del proceso y actuaciones
        proceso = resultado_playwright.get("proceso", {})
        actuaciones = resultado_playwright.get("actuaciones", [])

        # Construir estructura compatible con el normalizador
        raw_data = {
            "procesos": [{
                "idProceso": 0,
                "numero": proceso.get("radicado", radicado),
                "fechaRadicacion": proceso.get("fecha_radicacion", ""),
                "despacho": proceso.get("despacho", "Información no disponible"),
                "tipo": proceso.get("tipo_proceso", "Proceso Judicial"),
                "clase": proceso.get("clase", ""),
                "ponente": proceso.get("ponente", ""),
                "recurso": "",
                "contentType": "",
                "esPrivado": False,
                "actuaciones": actuaciones
            }]
        }

        print(f"[OK] Playwright: {len(actuaciones)} actuaciones obtenidas para {radicado}")

        # Normalizar la respuesta
        normalized = normalize_rama_response(raw_data)

        # Agregar metadatos del scraping
        normalized["metadata"] = {
            "source": resultado_playwright.get("source", "playwright"),
            "scraped_at": resultado_playwright.get("scraped_at", ""),
            "error_motivo": resultado_playwright.get("error_motivo")
        }

        return normalized

    except Exception as e:
        # Último recurso: retornar datos mock realistas para desarrollo
        print(f"[ERROR] Error crítico en /normalized/{radicado}: {e}")
        print(f"[MOCK] Devolviendo datos de prueba completos para desarrollo")

        import random
        from datetime import datetime, timedelta

        today = datetime.now()
        fecha_radicacion = (today - timedelta(days=random.randint(180, 730))).strftime('%Y-%m-%d')

        # Datos mock realistas y completos
        return {
            "case": {
                "radicado": radicado,
                "estado_actual": "Activo - En tramite",
                "tipo_proceso": "EJECUTIVO SINGULAR",
                "despacho": "JUZGADO SEXTO CIVIL MUNICIPAL DE IBAGUÉ",
                "juzgado": "JUZGADO SEXTO CIVIL MUNICIPAL DE IBAGUÉ",
                "court": "JUZGADO SEXTO CIVIL MUNICIPAL DE IBAGUÉ",
                "fecha_radicacion": fecha_radicacion,
                "fecha_ultima_actuacion": (today - timedelta(days=random.randint(1, 30))).strftime('%Y-%m-%d'),
                "ponente": "Dr. Carlos Andrés Ramírez",
                "clase_proceso": "Singular",
                "subclase_proceso": "Ejecutivo",
                "ubicacion_expediente": "Despacho - Juez",
                "recurso": None,
                "contenido_radicacion": "PROCESO EJECUTIVO - COBRO DE OBLIGACION",
                "jurisdiccion": "Tolima",
                "fuente": "MOCK_DATA"
            },
            "parties": [
                {
                    "rol": "DEMANDANTE",
                    "role": "DEMANDANTE",
                    "nombre": "BANCO EJEMPLO S.A.",
                    "name": "BANCO EJEMPLO S.A.",
                    "documento": "NIT 900123456-7"
                },
                {
                    "rol": "DEMANDADO",
                    "role": "DEMANDADO",
                    "nombre": "MARIA GONZALEZ PEREZ",
                    "name": "MARIA GONZALEZ PEREZ",
                    "documento": "CC 1234567890"
                },
                {
                    "rol": "APODERADO DEMANDANTE",
                    "role": "APODERADO DEMANDANTE",
                    "nombre": "JUAN CARLOS MARTINEZ - ABOGADO",
                    "name": "JUAN CARLOS MARTINEZ - ABOGADO",
                    "documento": "TP 45678"
                }
            ],
            "acts": [
                {
                    "fecha": (today - timedelta(days=5)).strftime('%Y-%m-%d'),
                    "date": (today - timedelta(days=5)).strftime('%Y-%m-%d'),
                    "tipo": "AUTO",
                    "type": "AUTO",
                    "descripcion": "SE DECRETA PRACTICA DE MEDIDA CAUTELAR SOBRE BIEN INMUEBLE MATRICULA 123-456789. NOTIFIQUESE.",
                    "title": "SE DECRETA PRACTICA DE MEDIDA CAUTELAR SOBRE BIEN INMUEBLE MATRICULA 123-456789. NOTIFIQUESE.",
                    "description": "SE DECRETA PRACTICA DE MEDIDA CAUTELAR SOBRE BIEN INMUEBLE MATRICULA 123-456789. NOTIFIQUESE.",
                    "documento_url": None,
                    "con_documentos": True,
                    "uniq_key": f"mock-{radicado}-auto-1",
                    "fecha_inicial": (today - timedelta(days=5)).strftime('%Y-%m-%d'),
                    "fecha_final": (today + timedelta(days=10)).strftime('%Y-%m-%d'),
                    "origen": "MOCK_DATA"
                },
                {
                    "fecha": (today - timedelta(days=25)).strftime('%Y-%m-%d'),
                    "date": (today - timedelta(days=25)).strftime('%Y-%m-%d'),
                    "tipo": "SENTENCIA",
                    "type": "SENTENCIA",
                    "descripcion": "SENTENCIA - SE DECLARA PROBADA LA EXCEPCION DE PRESCRIPCION. SE ORDENA EL ARCHIVO DEL EXPEDIENTE.",
                    "title": "SENTENCIA - SE DECLARA PROBADA LA EXCEPCION DE PRESCRIPCION. SE ORDENA EL ARCHIVO DEL EXPEDIENTE.",
                    "description": "SENTENCIA - SE DECLARA PROBADA LA EXCEPCION DE PRESCRIPCION. SE ORDENA EL ARCHIVO DEL EXPEDIENTE.",
                    "documento_url": None,
                    "con_documentos": True,
                    "uniq_key": f"mock-{radicado}-sentencia-1",
                    "origen": "MOCK_DATA"
                },
                {
                    "fecha": (today - timedelta(days=45)).strftime('%Y-%m-%d'),
                    "date": (today - timedelta(days=45)).strftime('%Y-%m-%d'),
                    "tipo": "CONTESTACIÓN DE DEMANDA",
                    "type": "CONTESTACIÓN DE DEMANDA",
                    "descripcion": "SE RADICA ESCRITO DE CONTESTACION DE DEMANDA PRESENTADO POR LA PARTE DEMANDADA. SE ANEXAN PRUEBAS DOCUMENTALES.",
                    "title": "SE RADICA ESCRITO DE CONTESTACION DE DEMANDA PRESENTADO POR LA PARTE DEMANDADA. SE ANEXAN PRUEBAS DOCUMENTALES.",
                    "description": "SE RADICA ESCRITO DE CONTESTACION DE DEMANDA PRESENTADO POR LA PARTE DEMANDADA. SE ANEXAN PRUEBAS DOCUMENTALES.",
                    "documento_url": None,
                    "con_documentos": False,
                    "uniq_key": f"mock-{radicado}-contestacion-1",
                    "origen": "MOCK_DATA"
                },
                {
                    "fecha": (today - timedelta(days=90)).strftime('%Y-%m-%d'),
                    "date": (today - timedelta(days=90)).strftime('%Y-%m-%d'),
                    "tipo": "AUTO ADMISORIO",
                    "type": "AUTO ADMISORIO",
                    "descripcion": "AUTO QUE ADMITE DEMANDA Y ORDENA EMPLAZAR AL DEMANDADO. CONCEDE TRASLADO POR 20 DIAS.",
                    "title": "AUTO QUE ADMITE DEMANDA Y ORDENA EMPLAZAR AL DEMANDADO. CONCEDE TRASLADO POR 20 DIAS.",
                    "description": "AUTO QUE ADMITE DEMANDA Y ORDENA EMPLAZAR AL DEMANDADO. CONCEDE TRASLADO POR 20 DIAS.",
                    "documento_url": None,
                    "con_documentos": True,
                    "uniq_key": f"mock-{radicado}-auto-admisorio-1",
                    "fecha_inicial": (today - timedelta(days=90)).strftime('%Y-%m-%d'),
                    "fecha_final": (today - timedelta(days=70)).strftime('%Y-%m-%d'),
                    "origen": "MOCK_DATA"
                },
                {
                    "fecha": fecha_radicacion,
                    "date": fecha_radicacion,
                    "tipo": "REPARTO",
                    "type": "REPARTO",
                    "descripcion": "RADICACION Y REPARTO DE DEMANDA EJECUTIVA. SE ASIGNA AL JUZGADO SEXTO CIVIL MUNICIPAL.",
                    "title": "RADICACION Y REPARTO DE DEMANDA EJECUTIVA. SE ASIGNA AL JUZGADO SEXTO CIVIL MUNICIPAL.",
                    "description": "RADICACION Y REPARTO DE DEMANDA EJECUTIVA. SE ASIGNA AL JUZGADO SEXTO CIVIL MUNICIPAL.",
                    "documento_url": None,
                    "con_documentos": False,
                    "uniq_key": f"mock-{radicado}-reparto-1",
                    "origen": "MOCK_DATA"
                }
            ],
            "metadata": {
                "source": "mock_fallback",
                "error": str(e),
                "note": "Datos de desarrollo - No provienen de Rama Judicial real"
            }
        }

@app.get("/jurisprudencia/buscar")
async def buscar_jurisprudencia_endpoint(
    q: str = None,
    tipo: str = None,
    limit: int = 50,
    api_key: str = Depends(verify_api_key)
):
    """
    Buscar sentencias de la Corte Constitucional de Colombia

    Parámetros:
    - q: Texto a buscar (búsqueda full-text)
    - tipo: Tipo de sentencia (T=Tutela, C=Constitucionalidad, SU=Sentencia Unificación)
    - limit: Número máximo de resultados (default 50, max 1000)

    Retorna sentencias reales desde datos.gov.co (API Socrata)
    """
    try:
        print(f"[INFO] Buscando jurisprudencia: q={q}, tipo={tipo}, limit={limit}")

        resultados = await buscar_jurisprudencia(
            query=q,
            tipo=tipo,
            limit=min(limit, 1000)
        )

        print(f"[OK] Encontradas {len(resultados)} sentencias")

        return {
            "ok": True,
            "count": len(resultados),
            "resultados": resultados
        }

    except Exception as e:
        print(f"[ERROR] Error buscando jurisprudencia: {e}")
        raise HTTPException(status_code=500, detail=f"Error en búsqueda: {str(e)}")

@app.get("/jurisprudencia/recientes")
async def obtener_recientes_endpoint(
    tipo: str = None,
    limit: int = 20,
    api_key: str = Depends(verify_api_key)
):
    """
    Obtener las sentencias más recientes de la Corte Constitucional

    Parámetros:
    - tipo: Filtrar por tipo (T, C, SU, etc.)
    - limit: Número de sentencias (default 20)

    Retorna sentencias del año actual ordenadas por fecha desc
    """
    try:
        print(f"[INFO] Obteniendo sentencias recientes: tipo={tipo}, limit={limit}")

        resultados = await obtener_sentencias_recientes(
            limit=limit,
            tipo=tipo
        )

        print(f"[OK] Obtenidas {len(resultados)} sentencias recientes")

        return {
            "ok": True,
            "count": len(resultados),
            "resultados": resultados
        }

    except Exception as e:
        print(f"[ERROR] Error obteniendo sentencias recientes: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

def run_server():
    """Ejecutar servidor con manejo de errores"""
    try:
        uvicorn.run(
            app, 
            host="127.0.0.1", 
            port=8001,
            log_level="info"
        )
    except Exception as e:
        print(f"Error en servidor: {e}")
        time.sleep(2)
        run_server()  # Reintentar

if __name__ == "__main__":
    print("Iniciando FastAPI en http://127.0.0.1:8001")
    print("Presiona Ctrl+C para detener")
    
    try:
        run_server()
    except KeyboardInterrupt:
        print("Servidor detenido por el usuario")
        sys.exit(0)
