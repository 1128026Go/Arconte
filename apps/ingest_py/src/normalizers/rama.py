"""
Normalizador de respuestas de la API de la Rama Judicial.

Este módulo define funciones para transformar la estructura de datos
devuelta por la API pública de la Rama Judicial de Colombia a un
esquema interno consistente que puede almacenarse en bases de datos
relacionales.  A partir de una respuesta cruda de la API, se extraen
los campos principales del proceso judicial y se genera una lista
normalizada de partes y actuaciones.  Cada actuación incluye una
clave única derivada de sus atributos para facilitar operaciones de
``upsert`` y evitar duplicados.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
import hashlib


def _text(val: Any) -> Optional[str]:
    """Convierte el valor a texto, devolviendo ``None`` si está vacío.

    Args:
        val: Valor a convertir.

    Returns:
        Cadena de texto limpia o ``None``.
    """
    if val is None:
        return None
    s = str(val).strip()
    return s if s else None


def _hash(*parts: Optional[str]) -> str:
    """Genera un hash SHA‑256 de los argumentos concatenados.

    Cualquier argumento ``None`` o cadena vacía se sustituye por
    cadena vacía en la concatenación.  Esto asegura que una misma
    combinación de fecha, tipo y descripción produzca la misma clave
    única incluso si alguno de esos campos es ``None``.

    Args:
        *parts: Secuencia de textos a concatenar.

    Returns:
        Hexadecimal de 64 caracteres representando el hash.
    """
    buf = "|".join([p or "" for p in parts])
    return hashlib.sha256(buf.encode("utf-8")).hexdigest()


def normalize_rama_response(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Normaliza el JSON de la Rama Judicial a un esquema interno.

    Este helper transforma la estructura de datos devuelta por la API
    unificada de la Rama Judicial en tres bloques: un diccionario
    ``case`` con los datos del proceso principal, una lista ``parties``
    con las partes implicadas en el proceso y una lista ``acts`` con
    las actuaciones.  Cada actuación incluye un campo ``uniq_key`` que
    permite realizar operaciones de actualización/inserción (``upsert``)
    evitando duplicados.

    La función es tolerante a variaciones en los nombres de campo que
    puedan venir en mayúsculas o minúsculas, así como a estructuras
    de respuesta que envuelvan la lista de procesos bajo la clave
    ``"Procesos"``.

    Args:
        raw: Diccionario tal y como se recibió de la API oficial.

    Returns:
        Diccionario con las claves ``case``, ``parties`` y ``acts``.
    """
    # Si la respuesta contiene una lista de procesos, tomar el primero
    if isinstance(raw, dict) and isinstance(raw.get("Procesos"), list):
        detalle = (raw["Procesos"][0] if raw["Procesos"] else {}) or {}
    elif isinstance(raw, dict) and isinstance(raw.get("procesos"), list):
        detalle = (raw["procesos"][0] if raw["procesos"] else {}) or {}
    else:
        detalle = raw or {}

    # Extraer campos principales del proceso (radicado, jurisdicción, etc.)
    radicado = _text(
        detalle.get("Radicado")
        or detalle.get("numeroRadicacion")
        or detalle.get("llaveProceso")
    )
    jurisdiccion = _text(
        detalle.get("Jurisdiccion")
        or detalle.get("jurisdiccion")
        or detalle.get("departamento")
    )
    juzgado = _text(
        detalle.get("Despacho")
        or detalle.get("juzgado")
        or detalle.get("despacho")
    )
    estado_actual = _text(
        detalle.get("Estado")
        or detalle.get("estadoActual")
        or detalle.get("esPrivado")
    )

    case: Dict[str, Optional[str]] = {
        "radicado": radicado,
        "jurisdiccion": jurisdiccion,
        "juzgado": juzgado,
        "estado_actual": estado_actual,
        "fuente": "RAMA_API",
    }

    # Normalizar partes
    parties: List[Dict[str, Optional[str]]] = []
    partes_raw = detalle.get("Partes") or detalle.get("partes")

    # Si viene en formato lista
    if isinstance(partes_raw, list) and len(partes_raw) > 0:
        for p in partes_raw:
            parties.append({
                "rol": _text(p.get("Rol") or p.get("rol")),
                "nombre": _text(p.get("Nombre") or p.get("nombre")),
                "documento": _text(p.get("Documento") or p.get("documento")),
            })
    # Si viene en formato string "Demandado: NOMBRE | Fiscalia: NOMBRE2"
    elif isinstance(detalle.get("sujetosProcesales"), str):
        sujetos_str = detalle.get("sujetosProcesales", "")
        for parte_str in sujetos_str.split("|"):
            parte_str = parte_str.strip()
            if ":" in parte_str:
                rol, nombre = parte_str.split(":", 1)
                # Filtrar entradas que no son partes reales (como "Numero Interno")
                if rol.strip().lower() not in ["numero interno", "número interno"]:
                    parties.append({
                        "rol": _text(rol.strip()),
                        "nombre": _text(nombre.strip()),
                        "documento": None,
                    })

    # Normalizar actuaciones
    acts: List[Dict[str, Optional[str]]] = []
    acts_raw = detalle.get("Actuaciones") or detalle.get("actuaciones") or []
    if isinstance(acts_raw, list):
        for a in acts_raw:
            fecha = _text(a.get("Fecha") or a.get("fecha"))
            tipo = _text(a.get("Tipo") or a.get("tipo"))
            # Unificar descripción a partir de varios campos opcionales
            desc = " ".join(filter(None, [
                _text(a.get("Observacion") or a.get("observacion")),
                _text(a.get("Anotacion") or a.get("anotacion")),
                _text(a.get("Descripcion") or a.get("descripcion")),
            ])) or None
            doc_url = _text(a.get("DocumentoURL") or a.get("documentoUrl") or a.get("documento_url"))

            uniq_key = _hash(fecha, tipo, desc)
            acts.append({
                "fecha": fecha,
                "tipo": tipo,
                "descripcion": desc,
                "documento_url": doc_url,
                "origen": "RAMA_API",
                "uniq_key": uniq_key,
            })

    return {
        "case": case,
        "parties": parties,
        "acts": acts,
    }