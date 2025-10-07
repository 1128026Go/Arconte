"""
Funciones para calcular las diferencias entre dos capturas de datos de procesos.
Estas funciones son útiles para determinar qué actuaciones nuevas han aparecido
entre una consulta y otra.  Se pueden extender para comparar más campos.
"""

from __future__ import annotations

from typing import Any, Dict, List, Tuple


def calculate_diff(old_snapshot: Dict[str, Any], new_snapshot: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Calcula los cambios entre dos snapshots de un proceso judicial.

    Args:
        old_snapshot: datos previos del proceso (por ejemplo, de la última consulta almacenada).
        new_snapshot: datos recientes obtenidos de la API.

    Returns:
        Una tupla (nuevas_actuaciones, modificaciones) donde:
        - nuevas_actuaciones es una lista de actuaciones que no estaban en el snapshot anterior.
        - modificaciones es una lista de diccionarios que describen cambios en campos clave.

    Notas:
        Este ejemplo se basa en que los snapshots sigan la estructura de la API
        oficial (con claves como "actuaciones").  Deberá ajustarse según el formato
        real almacenado.
    """
    nuevas_actuaciones: List[Dict[str, Any]] = []
    modificaciones: List[Dict[str, Any]] = []

    # Detectar nuevas actuaciones comparando por ID único o combinación de campos
    old_actuaciones = {act.get("id") or act.get("uniq_key"): act for act in old_snapshot.get("actuaciones", [])}
    for act in new_snapshot.get("actuaciones", []):
        act_id = act.get("id") or act.get("uniq_key")
        if act_id not in old_actuaciones:
            nuevas_actuaciones.append(act)

    # Detectar cambios en estado_actual u otros campos de primer nivel
    keys_to_compare = ["estado_actual", "juzgado", "jurisdiccion"]
    for key in keys_to_compare:
        if old_snapshot.get(key) != new_snapshot.get(key):
            modificaciones.append({"campo": key, "antes": old_snapshot.get(key), "despues": new_snapshot.get(key)})

    return nuevas_actuaciones, modificaciones