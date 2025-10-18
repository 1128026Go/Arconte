"""
Script de prueba para el sistema de detección de autos.

Ejecutar con:
    python -m apps.ingest_py.test_auto_detection
"""

import asyncio
import logging
from typing import Dict, Any

from apps.ingest_py.src.analyzers.auto_classifier import (
    is_auto,
    classify_auto,
    analyze_actuacion,
    AutoType,
)

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


# Casos de prueba
TEST_CASES = [
    {
        "nombre": "Auto perentorio - Traslado con plazo",
        "actuacion": {
            "tipo": "Auto",
            "descripcion": "AUTO CONFIERE TRASLADO por 10 días para contestar la demanda",
            "fecha": "2024-03-15"
        },
        "esperado": AutoType.PERENTORIO
    },
    {
        "nombre": "Auto perentorio - Requerimiento",
        "actuacion": {
            "tipo": "Auto",
            "descripcion": "AUTO REQUIERE al demandado presentar documentos dentro de 5 días",
            "fecha": "2024-03-14"
        },
        "esperado": AutoType.PERENTORIO
    },
    {
        "nombre": "Auto perentorio - Recurso",
        "actuacion": {
            "tipo": "Auto",
            "descripcion": "AUTO ORDENA notificar. Contra este auto procede recurso de apelación",
            "fecha": "2024-03-13"
        },
        "esperado": AutoType.PERENTORIO
    },
    {
        "nombre": "Auto de trámite - Admisión",
        "actuacion": {
            "tipo": "Auto",
            "descripcion": "AUTO ADMITE demanda y ordena seguir el trámite correspondiente",
            "fecha": "2024-03-12"
        },
        "esperado": AutoType.TRAMITE
    },
    {
        "nombre": "Auto de trámite - Avoca",
        "actuacion": {
            "tipo": "Auto",
            "descripcion": "AUTO AVOCA conocimiento del proceso",
            "fecha": "2024-03-11"
        },
        "esperado": AutoType.TRAMITE
    },
    {
        "nombre": "Auto de trámite - Téngase por",
        "actuacion": {
            "tipo": "Auto",
            "descripcion": "AUTO TÉNGASE POR notificada la providencia anterior",
            "fecha": "2024-03-10"
        },
        "esperado": AutoType.TRAMITE
    },
    {
        "nombre": "No es auto - Notificación",
        "actuacion": {
            "tipo": "Notificación",
            "descripcion": "Notificación por estado del auto anterior",
            "fecha": "2024-03-09"
        },
        "esperado": None  # No es auto
    },
    {
        "nombre": "No es auto - Actuación administrativa",
        "actuacion": {
            "tipo": "Actuación administrativa",
            "descripcion": "Se recibe escrito de la parte demandante",
            "fecha": "2024-03-08"
        },
        "esperado": None  # No es auto
    },
]


def print_separator():
    """Imprime un separador visual."""
    print("\n" + "="*80 + "\n")


def test_detection():
    """Prueba la detección de autos."""
    print_separator()
    print("🧪 TEST 1: DETECCIÓN DE AUTOS")
    print_separator()

    passed = 0
    failed = 0

    for test in TEST_CASES:
        actuacion = test["actuacion"]
        esperado_es_auto = test["esperado"] is not None

        tipo = actuacion.get("tipo", "")
        descripcion = actuacion.get("descripcion", "")

        es_auto_result = is_auto(tipo, descripcion)

        status = "✓ PASS" if es_auto_result == esperado_es_auto else "✗ FAIL"
        if es_auto_result == esperado_es_auto:
            passed += 1
        else:
            failed += 1

        print(f"{status} | {test['nombre']}")
        print(f"       Tipo: {tipo}")
        print(f"       Es auto: {es_auto_result} (esperado: {esperado_es_auto})")
        print()

    print(f"Resultados: {passed} passed, {failed} failed")
    return failed == 0


def test_classification():
    """Prueba la clasificación de autos."""
    print_separator()
    print("🧪 TEST 2: CLASIFICACIÓN DE AUTOS")
    print_separator()

    passed = 0
    failed = 0

    # Solo probar casos que son autos
    auto_tests = [t for t in TEST_CASES if t["esperado"] is not None]

    for test in auto_tests:
        actuacion = test["actuacion"]
        esperado = test["esperado"]

        texto = f"{actuacion.get('tipo', '')} {actuacion.get('descripcion', '')}"
        clasificacion = classify_auto(texto)

        status = "✓ PASS" if clasificacion == esperado else "✗ FAIL"
        if clasificacion == esperado:
            passed += 1
        else:
            failed += 1

        print(f"{status} | {test['nombre']}")
        print(f"       Clasificación: {clasificacion.value}")
        print(f"       Esperado: {esperado.value}")
        print()

    print(f"Resultados: {passed} passed, {failed} failed")
    return failed == 0


def test_full_analysis():
    """Prueba el análisis completo de actuaciones."""
    print_separator()
    print("🧪 TEST 3: ANÁLISIS COMPLETO")
    print_separator()

    passed = 0
    failed = 0

    for test in TEST_CASES:
        actuacion = test["actuacion"]
        esperado = test["esperado"]

        result = analyze_actuacion(actuacion)

        es_auto = result.get("is_auto")
        auto_type = result.get("auto_type")
        requires_action = result.get("requires_action")
        confidence = result.get("classification_confidence")

        # Validar resultados
        esperado_es_auto = esperado is not None
        esperado_requires_action = esperado == AutoType.PERENTORIO

        test_passed = (
            es_auto == esperado_es_auto and
            (not es_auto or requires_action == esperado_requires_action)
        )

        status = "✓ PASS" if test_passed else "✗ FAIL"
        if test_passed:
            passed += 1
        else:
            failed += 1

        print(f"{status} | {test['nombre']}")
        print(f"       Es auto: {es_auto}")
        if es_auto:
            print(f"       Tipo: {auto_type}")
            print(f"       Requiere acción: {requires_action}")
            print(f"       Confianza: {confidence}")
        print()

    print(f"Resultados: {passed} passed, {failed} failed")
    return failed == 0


def main():
    """Ejecuta todos los tests."""
    print("\n" + "="*80)
    print(" 🔍 SISTEMA DE DETECCIÓN Y CLASIFICACIÓN DE AUTOS - TESTS ")
    print("="*80)

    all_passed = True

    # Test 1: Detección
    if not test_detection():
        all_passed = False

    # Test 2: Clasificación
    if not test_classification():
        all_passed = False

    # Test 3: Análisis completo
    if not test_full_analysis():
        all_passed = False

    # Resumen final
    print_separator()
    if all_passed:
        print("✓ TODOS LOS TESTS PASARON")
        print_separator()
        return 0
    else:
        print("✗ ALGUNOS TESTS FALLARON")
        print_separator()
        return 1


if __name__ == "__main__":
    exit(main())
