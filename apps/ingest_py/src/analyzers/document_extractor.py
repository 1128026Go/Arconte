"""
Extractor de texto de documentos judiciales (PDF, DOCX).

Este módulo descarga y extrae texto de documentos adjuntos
a las actuaciones judiciales.
"""

from __future__ import annotations

import io
import logging
import tempfile
from pathlib import Path
from typing import Optional
import httpx

logger = logging.getLogger(__name__)


async def download_document(url: str, timeout: int = 30) -> Optional[bytes]:
    """
    Descarga un documento desde una URL.

    Args:
        url: URL del documento a descargar
        timeout: Tiempo máximo de espera en segundos

    Returns:
        Contenido del documento en bytes, o None si falla
    """
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(url, follow_redirects=True)
            if response.status_code == 200:
                logger.info(f"Documento descargado exitosamente: {url}")
                return response.content
            else:
                logger.warning(f"Error descargando documento: {url} - Status {response.status_code}")
                return None
    except Exception as e:
        logger.error(f"Excepción descargando documento {url}: {e}")
        return None


def extract_text_from_pdf(pdf_content: bytes) -> Optional[str]:
    """
    Extrae texto de un PDF usando PyPDF2.

    Args:
        pdf_content: Contenido del PDF en bytes

    Returns:
        Texto extraído o None si falla
    """
    try:
        import PyPDF2

        pdf_file = io.BytesIO(pdf_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)

        text_parts = []
        for page in pdf_reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)

        full_text = "\n".join(text_parts).strip()

        if full_text:
            logger.info(f"Texto extraído del PDF: {len(full_text)} caracteres")
            return full_text
        else:
            logger.warning("PDF no contiene texto extraíble, puede requerir OCR")
            return None

    except ImportError:
        logger.error("PyPDF2 no está instalado. Instala con: pip install PyPDF2")
        return None
    except Exception as e:
        logger.error(f"Error extrayendo texto del PDF: {e}")
        return None


def extract_text_with_ocr(pdf_content: bytes) -> Optional[str]:
    """
    Extrae texto de un PDF escaneado usando OCR (Tesseract).

    Args:
        pdf_content: Contenido del PDF en bytes

    Returns:
        Texto extraído o None si falla
    """
    try:
        import pytesseract
        from pdf2image import convert_from_bytes
        from PIL import Image

        # Convertir PDF a imágenes
        images = convert_from_bytes(pdf_content)

        text_parts = []
        for i, image in enumerate(images):
            logger.info(f"Aplicando OCR a página {i + 1}/{len(images)}")

            # Aplicar OCR con configuración para español
            text = pytesseract.image_to_string(image, lang='spa')
            if text:
                text_parts.append(text)

        full_text = "\n".join(text_parts).strip()

        if full_text:
            logger.info(f"Texto extraído con OCR: {len(full_text)} caracteres")
            return full_text
        else:
            logger.warning("OCR no pudo extraer texto del documento")
            return None

    except ImportError as e:
        logger.error(
            f"Dependencias de OCR no instaladas: {e}. "
            "Instala con: pip install pytesseract pdf2image pillow"
        )
        return None
    except Exception as e:
        logger.error(f"Error aplicando OCR: {e}")
        return None


async def extract_document_text(url: str, use_ocr: bool = True) -> Optional[str]:
    """
    Descarga y extrae texto de un documento judicial.

    Primero intenta extraer texto directamente del PDF.
    Si falla y use_ocr es True, aplica OCR para PDFs escaneados.

    Args:
        url: URL del documento a procesar
        use_ocr: Si debe usar OCR como fallback para PDFs escaneados

    Returns:
        Texto completo del documento o None si falla
    """
    # Descargar documento
    content = await download_document(url)
    if not content:
        return None

    # Detectar tipo de documento por extensión
    url_lower = url.lower()

    if url_lower.endswith('.pdf'):
        # Intentar extracción normal
        text = extract_text_from_pdf(content)

        # Si falla y OCR está habilitado, intentar con OCR
        if not text and use_ocr:
            logger.info("PDF sin texto extraíble, intentando OCR...")
            text = extract_text_with_ocr(content)

        return text

    elif url_lower.endswith(('.doc', '.docx')):
        # Para documentos Word (implementación futura)
        logger.warning("Extracción de documentos Word no implementada aún")
        return None

    else:
        logger.warning(f"Tipo de documento no soportado: {url}")
        return None


def save_document_locally(content: bytes, filename: str, directory: str = "downloads") -> Path:
    """
    Guarda un documento descargado en el sistema de archivos local.

    Args:
        content: Contenido del documento en bytes
        filename: Nombre del archivo
        directory: Directorio donde guardar (se crea si no existe)

    Returns:
        Path al archivo guardado
    """
    save_dir = Path(directory)
    save_dir.mkdir(parents=True, exist_ok=True)

    filepath = save_dir / filename
    filepath.write_bytes(content)

    logger.info(f"Documento guardado en: {filepath}")
    return filepath
