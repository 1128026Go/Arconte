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
API_KEY = os.getenv("INGEST_API_KEY", "f05217fc68cc1c7b9203f6ed7399afb3")

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

@app.get("/test")
async def test():
    return {
        "message": "Servicio de prueba funcionando",
        "endpoints": ["/", "/healthz", "/test", "/normalized/{radicado}"]
    }

@app.get("/normalized/{radicado}")
async def get_normalized(radicado: str, api_key: str = Depends(verify_api_key)):
    """Endpoint para obtener datos normalizados de un radicado desde la Rama Judicial"""
    try:
        # Consultar la API real de la Rama Judicial
        raw_data = await fetch_by_radicado(radicado)

        # Si se encontró el proceso, obtener sus actuaciones mediante scraping
        if raw_data.get("procesos") and len(raw_data["procesos"]) > 0:
            proceso = raw_data["procesos"][0]

            try:
                # Intentar obtener actuaciones mediante web scraping
                actuaciones_scraped = await scrape_actuaciones(radicado)

                # Convertir actuaciones scraped al formato esperado
                if actuaciones_scraped:
                    proceso["actuaciones"] = actuaciones_scraped
                    print(f"Obtenidas {len(actuaciones_scraped)} actuaciones mediante scraping")
                else:
                    proceso["actuaciones"] = []
                    print("No se pudieron extraer actuaciones")
            except Exception as act_err:
                # Si falla el scraping, continuar sin actuaciones
                proceso["actuaciones"] = []
                print(f"Error scrapeando actuaciones: {act_err}")

        # Normalizar la respuesta
        normalized = normalize_rama_response(raw_data)

        return normalized
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error consultando radicado: {str(e)}")

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