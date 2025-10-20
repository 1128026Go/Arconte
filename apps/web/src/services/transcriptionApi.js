import api from '../lib/api';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const transcriptionApi = {
  /**
   * Subir archivo de audio/video para transcripción
   */
  async uploadFile(file, title, caseId = null) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    if (caseId) {
      formData.append('case_id', caseId);
    }

    const response = await api.post('/transcriptions/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Listar transcripciones del usuario
   */
  async listTranscriptions(params = {}) {
    const response = await api.get('/transcriptions', { params });
    return response.data;
  },

  /**
   * Obtener una transcripción específica
   */
  async getTranscription(id) {
    const response = await api.get(`/transcriptions/${id}`);
    return response.data;
  },

  /**
   * Actualizar una transcripción
   */
  async updateTranscription(id, data) {
    const response = await api.put(`/transcriptions/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar una transcripción
   */
  async deleteTranscription(id) {
    const response = await api.delete(`/transcriptions/${id}`);
    return response.data;
  },

  /**
   * Reintentar una transcripción fallida
   */
  async retryTranscription(id) {
    const response = await api.post(`/transcriptions/${id}/retry`);
    return response.data;
  },

  /**
   * Exportar transcripción como archivo de texto
   */
  async exportTranscription(id) {
    const response = await api.get(`/transcriptions/${id}/export`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Obtener estadísticas de transcripciones
   */
  async getStats() {
    const response = await api.get('/transcriptions/stats');
    return response.data;
  },

  /**
   * Descargar blob como archivo
   */
  downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Validar archivo antes de subir
   */
  validateFile(file) {
    const allowedTypes = [
      'audio/mpeg',      // mp3
      'audio/mp4',       // m4a
      'audio/wav',       // wav
      'audio/webm',      // webm
      'video/mp4',       // mp4
      'video/mpeg',      // mpeg
      'video/webm',      // webm
    ];

    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Tipo de archivo no permitido. Solo se aceptan archivos de audio/video (MP3, MP4, M4A, WAV, WEBM, MPEG).',
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'El archivo es demasiado grande. Tamaño máximo: 50MB.',
      };
    }

    return { valid: true };
  },

  /**
   * Formatear duración en segundos a formato legible
   */
  formatDuration(seconds) {
    if (!seconds) return 'N/A';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  },

  /**
   * Formatear tamaño de archivo en bytes a formato legible
   */
  formatFileSize(bytes) {
    if (!bytes) return 'N/A';

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  },
};

export default transcriptionApi;
