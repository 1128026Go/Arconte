"""
Sistema de notificaciones para autos perentorios.

Este módulo envía alertas cuando se detectan autos que requieren
actuación urgente del abogado.
"""

from __future__ import annotations

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
import httpx

logger = logging.getLogger(__name__)


class NotificationService:
    """Servicio de notificaciones multi-canal."""

    def __init__(self, api_base_url: Optional[str] = None):
        """
        Inicializa el servicio de notificaciones.

        Args:
            api_base_url: URL base del API PHP/Laravel para enviar notificaciones
        """
        self.api_base_url = api_base_url or "http://localhost:8000"

    async def notify_perentorio_auto(
        self,
        radicado: str,
        actuacion: Dict[str, Any],
        abogado_email: Optional[str] = None,
    ) -> bool:
        """
        Envía notificación de auto perentorio al abogado responsable.

        Args:
            radicado: Número de radicación del proceso
            actuacion: Diccionario con los datos de la actuación
            abogado_email: Email del abogado (opcional)

        Returns:
            True si la notificación se envió exitosamente
        """
        try:
            notification_data = {
                "tipo": "auto_perentorio",
                "radicado": radicado,
                "fecha": actuacion.get("fecha"),
                "titulo": actuacion.get("tipo"),
                "descripcion": actuacion.get("descripcion"),
                "auto_type": actuacion.get("auto_type"),
                "confianza": actuacion.get("classification_confidence"),
                "timestamp": datetime.now().isoformat(),
                "requires_immediate_action": True,
            }

            # Enviar notificación al backend PHP
            success = await self._send_to_backend(notification_data)

            if success:
                logger.info(
                    f"✓ Notificación enviada: Auto perentorio detectado en {radicado}"
                )

                # Si hay email del abogado, enviar email directo
                if abogado_email:
                    await self._send_email_notification(abogado_email, notification_data)

            return success

        except Exception as e:
            logger.error(f"Error enviando notificación: {e}")
            return False

    async def notify_tramite_auto(
        self,
        radicado: str,
        actuacion: Dict[str, Any],
    ) -> bool:
        """
        Registra auto de trámite (sin urgencia) en el sistema.

        Args:
            radicado: Número de radicación del proceso
            actuacion: Diccionario con los datos de la actuación

        Returns:
            True si se registró exitosamente
        """
        try:
            notification_data = {
                "tipo": "auto_tramite",
                "radicado": radicado,
                "fecha": actuacion.get("fecha"),
                "titulo": actuacion.get("tipo"),
                "descripcion": actuacion.get("descripcion"),
                "auto_type": actuacion.get("auto_type"),
                "timestamp": datetime.now().isoformat(),
                "requires_immediate_action": False,
            }

            success = await self._send_to_backend(notification_data)

            if success:
                logger.info(f"Avance registrado: Auto de trámite en {radicado}")

            return success

        except Exception as e:
            logger.error(f"Error registrando avance: {e}")
            return False

    async def _send_to_backend(self, data: Dict[str, Any]) -> bool:
        """
        Envía notificación al backend PHP/Laravel.

        Args:
            data: Datos de la notificación

        Returns:
            True si se envió exitosamente
        """
        try:
            url = f"{self.api_base_url}/api/notificaciones/autos"

            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(url, json=data)

                if response.status_code in [200, 201]:
                    logger.debug(f"Notificación enviada al backend: {url}")
                    return True
                else:
                    logger.warning(
                        f"Backend respondió con status {response.status_code}: {response.text}"
                    )
                    return False

        except httpx.RequestError as e:
            logger.error(f"Error conectando al backend: {e}")
            return False
        except Exception as e:
            logger.error(f"Error inesperado enviando al backend: {e}")
            return False

    async def _send_email_notification(
        self, email: str, data: Dict[str, Any]
    ) -> bool:
        """
        Envía notificación por email (delegado al backend).

        Args:
            email: Dirección de email del destinatario
            data: Datos de la notificación

        Returns:
            True si se envió exitosamente
        """
        try:
            url = f"{self.api_base_url}/api/notificaciones/email"

            email_data = {
                "to": email,
                "subject": f"🔴 AUTO PERENTORIO - Radicado {data['radicado']}",
                "body": self._format_email_body(data),
                "metadata": data,
            }

            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(url, json=email_data)

                if response.status_code in [200, 201]:
                    logger.info(f"Email enviado a {email}")
                    return True
                else:
                    logger.warning(f"Error enviando email: {response.status_code}")
                    return False

        except Exception as e:
            logger.error(f"Error enviando email: {e}")
            return False

    def _format_email_body(self, data: Dict[str, Any]) -> str:
        """
        Formatea el cuerpo del email de notificación.

        Args:
            data: Datos de la notificación

        Returns:
            Texto del email formateado
        """
        return f"""
Se ha publicado un AUTO PERENTORIO que requiere su actuación urgente.

📋 Radicado: {data['radicado']}
📅 Fecha: {data['fecha']}
📄 Tipo: {data['titulo']}

Descripción:
{data['descripcion']}

⚠️ Este auto requiere actuación inmediata. Por favor, revise el expediente
y tome las medidas necesarias dentro del plazo establecido.

---
Sistema de Vigilancia Judicial - Arconte
        """.strip()


# Instancia global del servicio de notificaciones
_notifier_instance: Optional[NotificationService] = None


def get_notifier(api_base_url: Optional[str] = None) -> NotificationService:
    """
    Obtiene la instancia global del servicio de notificaciones.

    Args:
        api_base_url: URL base del API (opcional, usa default si no se provee)

    Returns:
        Instancia del servicio de notificaciones
    """
    global _notifier_instance
    if _notifier_instance is None:
        _notifier_instance = NotificationService(api_base_url)
    return _notifier_instance
