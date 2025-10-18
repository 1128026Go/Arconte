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


def normalize_rama_response(raw: Dict[str, Any], actuaciones_raw: Dict[str, Any] = None) -> Dict[str, Any]:
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
        actuaciones_raw: Diccionario opcional con las actuaciones del proceso.

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
    )

    # Campos adicionales de Rama Judicial
    id_proceso_rama = detalle.get("idProceso")
    fecha_radicacion = _text(detalle.get("fechaProceso"))
    fecha_ultima_actuacion = _text(detalle.get("fechaUltimaActuacion"))
    es_privado = detalle.get("esPrivado", False)
    ponente = _text(detalle.get("ponente"))
    clase_proceso = _text(detalle.get("clase"))
    subclase_proceso = _text(detalle.get("subClase"))
    tipo_proceso = _text(detalle.get("tipoProceso") or detalle.get("tipoProcesoRadicacion"))
    ubicacion_expediente = _text(detalle.get("ubicacion"))
    recurso = _text(detalle.get("recurso"))
    contenido_radicacion = _text(detalle.get("contenidoRadicacion"))

    case: Dict[str, Any] = {
        "radicado": radicado,
        "jurisdiccion": jurisdiccion,
        "juzgado": juzgado,
        "court": juzgado,  # Alias para compatibilidad con Laravel
        "despacho": juzgado,  # Alias adicional
        "status": estado_actual,  # Alias para compatibilidad
        "estado_actual": estado_actual,
        "fuente": "RAMA_API",
        # Campos adicionales de Rama Judicial
        "id_proceso": id_proceso_rama,  # Alias para Laravel
        "id_proceso_rama": id_proceso_rama,
        "fecha_radicacion": fecha_radicacion,
        "fecha_ultima_actuacion": fecha_ultima_actuacion,
        "es_privado": es_privado,
        "ponente": ponente,
        "clase_proceso": clase_proceso,
        "subclase_proceso": subclase_proceso,
        "tipo_proceso": tipo_proceso,
        "ubicacion_expediente": ubicacion_expediente,
        "recurso": recurso,
        "contenido_radicacion": contenido_radicacion,
    }

    # Normalizar partes
    parties: List[Dict[str, Optional[str]]] = []
    partes_raw = detalle.get("Partes") or detalle.get("partes")

    # Si viene en formato lista
    if isinstance(partes_raw, list) and len(partes_raw) > 0:
        for p in partes_raw:
            rol = _text(p.get("Rol") or p.get("rol"))
            nombre = _text(p.get("Nombre") or p.get("nombre"))
            documento = _text(p.get("Documento") or p.get("documento"))
            parties.append({
                "rol": rol,
                "role": rol,  # Alias para Laravel
                "nombre": nombre,
                "name": nombre,  # Alias para Laravel
                "documento": documento,
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
                    rol_text = _text(rol.strip())
                    nombre_text = _text(nombre.strip())
                    parties.append({
                        "rol": rol_text,
                        "role": rol_text,  # Alias para Laravel
                        "nombre": nombre_text,
                        "name": nombre_text,  # Alias para Laravel
                        "documento": None,
                    })

    # Normalizar actuaciones
    acts: List[Dict[str, Optional[str]]] = []

    # Si se pasaron actuaciones por separado (API v2)
    if actuaciones_raw and isinstance(actuaciones_raw.get("actuaciones"), list):
        acts_raw = actuaciones_raw["actuaciones"]
    else:
        # Buscar en el detalle del proceso (API v1 o legacy)
        acts_raw = detalle.get("Actuaciones") or detalle.get("actuaciones") or []

    if isinstance(acts_raw, list):
        for a in acts_raw:
            # API v2 usa fechaActuacion, actuacion, anotacion
            fecha = _text(
                a.get("fechaActuacion") or
                a.get("Fecha") or
                a.get("fecha")
            )
            tipo = _text(
                a.get("actuacion") or
                a.get("Tipo") or
                a.get("tipo")
            )
            # Separar anotación y descripción según estándar Rama Judicial
            anotacion = _text(
                a.get("anotacion") or
                a.get("Anotacion")
            )
            # Descripción adicional de observación
            descripcion = _text(
                a.get("Observacion") or
                a.get("observacion") or
                a.get("Descripcion") or
                a.get("descripcion")
            )

            # Verificar si tiene documentos
            con_documentos = a.get("conDocumentos", False)
            doc_url = _text(a.get("DocumentoURL") or a.get("documentoUrl") or a.get("documento_url"))

            # Campos adicionales de Rama Judicial (plazos e identificadores)
            id_reg_actuacion = a.get("idRegActuacion")
            cons_actuacion = a.get("consActuacion")
            fecha_inicial = _text(a.get("fechaInicial"))
            fecha_final = _text(a.get("fechaFinal"))  # CRÍTICO para alertas de plazos
            fecha_registro = _text(a.get("fechaRegistro"))
            cod_regla = _text(a.get("codRegla"))

            # Crear título combinado para visualización
            title = anotacion if anotacion else descripcion

            uniq_key = _hash(fecha, tipo, anotacion or descripcion)
            acts.append({
                "fecha": fecha,
                "date": fecha,  # Alias para Laravel
                "tipo": tipo,
                "type": tipo,  # Alias para Laravel
                "actuacion": tipo,  # Nombre oficial Rama Judicial
                "anotacion": anotacion,  # Campo oficial Rama Judicial
                "descripcion": descripcion,
                "title": title,  # Alias para Laravel
                "description": descripcion,  # Alias adicional
                "documento_url": doc_url,
                "con_documentos": con_documentos,
                "origen": "RAMA_API",
                "uniq_key": uniq_key,
                "hash": uniq_key,  # Alias para compatibilidad
                # Campos adicionales de Rama Judicial
                "id_reg_actuacion": id_reg_actuacion,
                "cons_actuacion": cons_actuacion,
                "fecha_inicial": fecha_inicial,
                "fecha_final": fecha_final,
                "fecha_registro": fecha_registro,
                "cod_regla": cod_regla,
            })

    return {
        "case": case,
        "parties": parties,
        "acts": acts,
    }