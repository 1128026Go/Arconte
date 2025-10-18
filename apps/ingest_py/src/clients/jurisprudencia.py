"""
Cliente para la API de Jurisprudencia de la Corte Constitucional de Colombia
Usa Socrata SODA API desde datos.gov.co
"""
from __future__ import annotations

import httpx
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

# API de Datos Abiertos Colombia - Jurisprudencia Corte Constitucional
SOCRATA_BASE_URL = "https://www.datos.gov.co/resource/v2k4-2t8s.json"
SOCRATA_APP_TOKEN = None  # Opcional: aumenta rate limits

class JurisprudenciaClient:
    """Cliente para consultar jurisprudencia de la Corte Constitucional"""

    def __init__(self, app_token: Optional[str] = None):
        self.base_url = SOCRATA_BASE_URL
        self.app_token = app_token or SOCRATA_APP_TOKEN

    def _get_headers(self) -> Dict[str, str]:
        """Construir headers para la petición"""
        headers = {
            'Accept': 'application/json',
            'User-Agent': 'Arconte-LegalAI/1.0 (arconte.legal@example.com)'
        }

        if self.app_token:
            headers['X-App-Token'] = self.app_token

        return headers

    async def buscar(
        self,
        query: Optional[str] = None,
        tipo: Optional[str] = None,  # T=Tutela, C=Constitucionalidad, SU=Sentencia Unificación
        ano: Optional[int] = None,
        magistrado: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Buscar sentencias de la Corte Constitucional

        Args:
            query: Texto a buscar (búsqueda full-text)
            tipo: Tipo de sentencia (T, C, SU, etc.)
            ano: Año de la sentencia
            magistrado: Nombre del magistrado ponente
            limit: Número máximo de resultados (max 50,000)
            offset: Offset para paginación

        Returns:
            Lista de sentencias encontradas
        """
        params = {
            '$limit': min(limit, 1000),  # Max 1000 por request
            '$offset': offset,
            '$order': 'fecha DESC'
        }

        # Construir filtros WHERE
        where_clauses = []

        if tipo:
            where_clauses.append(f"tipo = '{tipo}'")

        if ano:
            where_clauses.append(f"fecha >= '{ano}-01-01T00:00:00'")
            where_clauses.append(f"fecha <= '{ano}-12-31T23:59:59'")

        if magistrado:
            where_clauses.append(f"magistrado_ponente LIKE '%{magistrado}%'")

        if where_clauses:
            params['$where'] = ' AND '.join(where_clauses)

        # Búsqueda full-text
        if query:
            params['$q'] = query

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    self.base_url,
                    params=params,
                    headers=self._get_headers()
                )

                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"Encontradas {len(data)} sentencias")
                    return data
                else:
                    logger.error(f"Error en API Socrata: {response.status_code}")
                    return []

        except Exception as e:
            logger.error(f"Error consultando jurisprudencia: {e}")
            return []

    async def buscar_por_numero(self, numero_sentencia: str) -> Optional[Dict[str, Any]]:
        """
        Buscar una sentencia específica por su número

        Args:
            numero_sentencia: Número de sentencia (ej: "T-082-25", "C-055-24")

        Returns:
            Datos de la sentencia o None si no se encuentra
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    self.base_url,
                    params={
                        '$where': f"numero_sentencia = '{numero_sentencia}'",
                        '$limit': 1
                    },
                    headers=self._get_headers()
                )

                if response.status_code == 200:
                    data = response.json()
                    if data and len(data) > 0:
                        logger.info(f"Encontrada sentencia {numero_sentencia}")
                        return data[0]

                return None

        except Exception as e:
            logger.error(f"Error buscando sentencia {numero_sentencia}: {e}")
            return None

    async def buscar_temas_similares(
        self,
        tema: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Buscar sentencias relacionadas con un tema específico

        Args:
            tema: Tema o materia (ej: "derecho a la salud", "tutela", "habeas corpus")
            limit: Número máximo de resultados

        Returns:
            Lista de sentencias relacionadas
        """
        return await self.buscar(
            query=tema,
            limit=limit
        )

    async def obtener_recientes(
        self,
        limit: int = 20,
        tipo: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Obtener las sentencias más recientes

        Args:
            limit: Número de sentencias a obtener
            tipo: Filtrar por tipo (opcional)

        Returns:
            Lista de sentencias recientes
        """
        year = datetime.now().year

        return await self.buscar(
            tipo=tipo,
            ano=year,
            limit=limit
        )

    async def estadisticas_por_ano(self, ano: int) -> Dict[str, Any]:
        """
        Obtener estadísticas de sentencias por año

        Args:
            ano: Año a consultar

        Returns:
            Diccionario con estadísticas
        """
        sentencias = await self.buscar(ano=ano, limit=50000)

        # Contar por tipo
        tipos = {}
        magistrados = {}

        for s in sentencias:
            tipo = s.get('tipo', 'Desconocido')
            tipos[tipo] = tipos.get(tipo, 0) + 1

            mag = s.get('magistrado_ponente', 'Desconocido')
            magistrados[mag] = magistrados.get(mag, 0) + 1

        return {
            'ano': ano,
            'total': len(sentencias),
            'por_tipo': tipos,
            'por_magistrado': magistrados
        }


# Cliente singleton
_cliente_jurisprudencia = None

def get_cliente_jurisprudencia(app_token: Optional[str] = None) -> JurisprudenciaClient:
    """Obtener instancia singleton del cliente"""
    global _cliente_jurisprudencia

    if _cliente_jurisprudencia is None:
        _cliente_jurisprudencia = JurisprudenciaClient(app_token)

    return _cliente_jurisprudencia


# Funciones helper para facilitar uso
async def buscar_jurisprudencia(
    query: str,
    tipo: Optional[str] = None,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """
    Función helper para buscar jurisprudencia

    Ejemplos de uso:
        # Buscar tutelas sobre salud
        await buscar_jurisprudencia("derecho a la salud", tipo="T")

        # Buscar sentencias de constitucionalidad sobre educación
        await buscar_jurisprudencia("educación", tipo="C", limit=10)
    """
    cliente = get_cliente_jurisprudencia()
    return await cliente.buscar(query=query, tipo=tipo, limit=limit)


async def obtener_sentencias_recientes(
    limit: int = 20,
    tipo: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Obtener sentencias recientes de la Corte Constitucional
    """
    cliente = get_cliente_jurisprudencia()
    return await cliente.obtener_recientes(limit=limit, tipo=tipo)
