"""
Scraper HTML para obtener actuaciones de la Rama Judicial.
Extrae información de actuaciones mediante web scraping cuando la API no las provee.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List
from bs4 import BeautifulSoup
import httpx

logger = logging.getLogger(__name__)

SEARCH_URL = "https://consultaprocesos.ramajudicial.gov.co/Procesos/NumeroRadicacion"


async def scrape_actuaciones(radicado: str, max_retries: int = 3) -> List[Dict[str, Any]]:
    """
    Extrae las actuaciones de un proceso mediante web scraping.

    Args:
        radicado: Número de radicación del proceso
        max_retries: Número máximo de reintentos

    Returns:
        Lista de actuaciones con fecha, tipo y descripción
    """
    attempt = 0
    last_exc: Exception | None = None

    while attempt < max_retries:
        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                # Primero hacemos la búsqueda del proceso
                logger.info(f"Buscando proceso {radicado} en Rama Judicial web")

                # Realizar búsqueda por radicado
                search_data = {
                    'NumeroRadicacion': radicado,
                    'SoloActivos': 'false'
                }

                response = await client.post(
                    SEARCH_URL,
                    data=search_data,
                    headers={
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': 'es-ES,es;q=0.9',
                    }
                )
                response.raise_for_status()

                # Parsear HTML
                soup = BeautifulSoup(response.text, 'lxml')

                # Buscar la tabla de actuaciones
                actuaciones = []

                # La tabla de actuaciones usualmente tiene id "actuaciones" o class "actuaciones"
                tabla_actuaciones = soup.find('table', {'id': 'actuaciones'}) or \
                                   soup.find('table', class_=lambda x: x and 'actuacion' in x.lower())

                if tabla_actuaciones:
                    rows = tabla_actuaciones.find_all('tr')[1:]  # Skip header

                    for row in rows:
                        cols = row.find_all('td')
                        if len(cols) >= 3:
                            actuacion = {
                                'fecha': cols[0].get_text(strip=True) if len(cols) > 0 else None,
                                'tipo': cols[1].get_text(strip=True) if len(cols) > 1 else None,
                                'descripcion': cols[2].get_text(strip=True) if len(cols) > 2 else None,
                                'documento_url': None,
                            }

                            # Buscar enlace a documento si existe
                            link = cols[2].find('a') if len(cols) > 2 else None
                            if link and link.get('href'):
                                actuacion['documento_url'] = link['href']

                            if actuacion['fecha'] and actuacion['tipo']:
                                actuaciones.append(actuacion)

                    logger.info(f"Extraídas {len(actuaciones)} actuaciones del HTML")
                else:
                    logger.warning(f"No se encontró tabla de actuaciones en el HTML para {radicado}")

                return actuaciones

        except Exception as exc:
            last_exc = exc
            attempt += 1
            wait = 2 ** attempt
            logger.warning(
                f"Error scrapeando actuaciones de {radicado} (intento {attempt}/{max_retries}): {exc}"
            )
            if attempt < max_retries:
                await asyncio.sleep(wait)

    # Si falló todo, devolver lista vacía en lugar de error
    logger.error(f"No se pudieron extraer actuaciones de {radicado} después de {max_retries} intentos")
    return []
