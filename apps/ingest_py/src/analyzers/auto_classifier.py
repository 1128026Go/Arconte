"""
Clasificador de AUTOS judiciales.

Este módulo detecta y clasifica automáticamente los autos judiciales
en dos categorías:
- Perentorio: requiere actuación urgente del abogado
- Trámite: avance procesal sin acción inmediata requerida
"""

from __future__ import annotations

import re
import logging
from typing import Optional, Dict, Any
from enum import Enum

logger = logging.getLogger(__name__)


class AutoType(str, Enum):
    """Tipos de autos judiciales."""
    PERENTORIO = "perentorio"
    TRAMITE = "tramite"
    UNKNOWN = "unknown"


# Palabras clave para clasificación de autos perentorios
PERENTORIO_KEYWORDS = [
    # Requerimientos directos
    r"requiérase",
    r"requier[ae]se",
    r"requiera",
    r"deberá\s+presentar",
    r"debe\s+presentar",
    r"presentar\s+dentro\s+de",

    # Plazos y términos
    r"en\s+el\s+término\s+de\s+\d+\s+días",
    r"dentro\s+de\s+\d+\s+días",
    r"plazo\s+de\s+\d+\s+días",
    r"término\s+de\s+\d+\s+días",
    r"tendrá\s+\d+\s+días\s+para",
    r"dispondrá\s+de\s+\d+\s+días",

    # Traslados con plazo
    r"confiérase\s+traslado",
    r"confiera\s+traslado",
    r"traslado\s+por\s+\d+\s+días",
    r"córrase\s+traslado\s+por",

    # Emplazamientos y citaciones
    r"emplaza",
    r"emplácese",
    r"emplazamiento",
    r"cítese",
    r"citación",
    r"comparec",

    # Ordenes directas
    r"ordénese",
    r"prevéngase",
    r"prevenir",
    r"impóngase",
    r"dispóngase",

    # Recursos y apelaciones
    r"impugnación",
    r"interponer\s+recurso",
    r"recurso\s+de\s+apelación",
    r"recurso\s+de\s+reposición",
    r"no\s+interponer.*producirá",

    # Contestaciones
    r"conteste\s+dentro\s+de",
    r"contestar.*dentro\s+de",
    r"responda\s+en\s+el\s+término",

    # Obligaciones
    r"es\s+obligatorio",
    r"deberá\s+cumplir",
    r"so\s+pena\s+de",
    r"bajo\s+apercibimiento",
    r"apercibido",
]

# Palabras clave para clasificación de autos de trámite
TRAMITE_KEYWORDS = [
    r"admítase",
    r"admitase",
    r"téngase\s+por",
    r"tengase\s+por",
    r"tómese\s+nota",
    r"tomese\s+nota",
    r"inscríbase",
    r"inscribase",
    r"infórmese",
    r"informese",
    r"remítase",
    r"remitase",
    r"agrégue",
    r"agreguese",
    r"siga\s+el\s+trámite",
    r"continúe",
    r"archívese",
    r"archivese",
    r"avócase",
    r"avoca\s+conocimiento",
]

# Compilar patrones regex
PERENTORIO_PATTERNS = [re.compile(pattern, re.IGNORECASE) for pattern in PERENTORIO_KEYWORDS]
TRAMITE_PATTERNS = [re.compile(pattern, re.IGNORECASE) for pattern in TRAMITE_KEYWORDS]


def is_auto(titulo: Optional[str], descripcion: Optional[str] = None) -> bool:
    """
    Detecta si una actuación es un AUTO judicial.

    Args:
        titulo: Título o tipo de la actuación
        descripcion: Descripción detallada (opcional)

    Returns:
        True si es un auto, False en caso contrario
    """
    if not titulo:
        return False

    texto_completo = titulo.lower()
    if descripcion:
        texto_completo += " " + descripcion.lower()

    # Patrones comunes de autos
    auto_patterns = [
        r"\bauto\b",
        r"providencia",
        r"decisión\s+de\s+fondo",
    ]

    return any(re.search(pattern, texto_completo) for pattern in auto_patterns)


def classify_auto(texto: str) -> AutoType:
    """
    Clasifica un auto como perentorio o de trámite.

    Analiza el texto del auto buscando palabras clave específicas que
    indiquen si requiere acción urgente (perentorio) o es solo informativo
    (trámite).

    Args:
        texto: Texto completo del auto (título + descripción)

    Returns:
        AutoType.PERENTORIO si requiere acción urgente
        AutoType.TRAMITE si es solo informativo
        AutoType.UNKNOWN si no se puede clasificar
    """
    if not texto:
        return AutoType.UNKNOWN

    # Normalizar texto
    texto_norm = texto.lower()

    # Contar coincidencias de patrones perentorios
    perentorio_matches = sum(
        1 for pattern in PERENTORIO_PATTERNS
        if pattern.search(texto_norm)
    )

    # Contar coincidencias de patrones de trámite
    tramite_matches = sum(
        1 for pattern in TRAMITE_PATTERNS
        if pattern.search(texto_norm)
    )

    logger.debug(
        f"Clasificación: {perentorio_matches} perentorios, {tramite_matches} trámite"
    )

    # Clasificar basado en coincidencias
    if perentorio_matches > tramite_matches:
        return AutoType.PERENTORIO
    elif tramite_matches > 0:
        return AutoType.TRAMITE
    else:
        # Si no hay coincidencias claras, buscar indicadores generales
        if any(keyword in texto_norm for keyword in ["plazo", "término", "días", "requerir"]):
            return AutoType.PERENTORIO
        return AutoType.UNKNOWN


def analyze_actuacion(actuacion: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analiza una actuación para detectar y clasificar autos.

    Args:
        actuacion: Diccionario con los datos de la actuación
                   (debe contener 'tipo' y opcionalmente 'descripcion')

    Returns:
        Diccionario con los campos originales más:
        - is_auto: bool
        - auto_type: str (perentorio|tramite|unknown|null)
        - requires_action: bool
        - classification_score: float (confianza de la clasificación)
    """
    tipo = actuacion.get("tipo", "")
    descripcion = actuacion.get("descripcion", "")

    # Detectar si es auto
    es_auto = is_auto(tipo, descripcion)

    result = {
        **actuacion,
        "is_auto": es_auto,
        "auto_type": None,
        "requires_action": False,
        "classification_confidence": 0.0,
    }

    if not es_auto:
        return result

    # Clasificar el auto
    texto_completo = f"{tipo} {descripcion}".strip()
    auto_type = classify_auto(texto_completo)

    result["auto_type"] = auto_type.value
    result["requires_action"] = auto_type == AutoType.PERENTORIO

    # Calcular confianza (basado en número de coincidencias)
    texto_norm = texto_completo.lower()

    if auto_type == AutoType.PERENTORIO:
        matches = sum(1 for p in PERENTORIO_PATTERNS if p.search(texto_norm))
        confidence = min(matches / 3.0, 1.0)  # Máximo 3 coincidencias = 100%
    elif auto_type == AutoType.TRAMITE:
        matches = sum(1 for p in TRAMITE_PATTERNS if p.search(texto_norm))
        confidence = min(matches / 2.0, 1.0)  # Máximo 2 coincidencias = 100%
    else:
        confidence = 0.0

    result["classification_confidence"] = round(confidence, 2)

    logger.info(
        f"Actuación analizada: tipo={tipo}, es_auto={es_auto}, "
        f"clasificación={auto_type.value}, confianza={confidence:.2f}"
    )

    return result


def batch_analyze(actuaciones: list[Dict[str, Any]]) -> list[Dict[str, Any]]:
    """
    Analiza un lote de actuaciones para detectar autos.

    Args:
        actuaciones: Lista de diccionarios con actuaciones

    Returns:
        Lista de actuaciones con análisis agregado
    """
    return [analyze_actuacion(act) for act in actuaciones]
