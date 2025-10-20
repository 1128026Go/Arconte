import api from '../lib/api';

/**
 * Servicio para interactuar con la API de generación de documentos
 */
const documentApi = {
  /**
   * Generar documento con IA
   */
  async generateDocument(templateType, title, parameters, caseId = null, format = 'docx') {
    const response = await api.post('/document-generation/generate', {
      template_type: templateType,
      title,
      parameters,
      case_id: caseId,
      format
    });
    return response.data;
  },

  /**
   * Listar documentos generados
   */
  async listDocuments(filters = {}) {
    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.template_type) params.append('template_type', filters.template_type);
    if (filters.case_id) params.append('case_id', filters.case_id);
    if (filters.page) params.append('page', filters.page);

    const response = await api.get(`/document-generation/documents?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtener un documento específico
   */
  async getDocument(documentId) {
    const response = await api.get(`/document-generation/documents/${documentId}`);
    return response.data;
  },

  /**
   * Actualizar documento
   */
  async updateDocument(documentId, data) {
    const response = await api.put(`/document-generation/documents/${documentId}`, data);
    return response.data;
  },

  /**
   * Eliminar documento
   */
  async deleteDocument(documentId) {
    const response = await api.delete(`/document-generation/documents/${documentId}`);
    return response.data;
  },

  /**
   * Exportar documento
   */
  async exportDocument(documentId, format = 'txt') {
    const response = await api.post(`/document-generation/documents/${documentId}/export`, {
      format
    }, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Listar plantillas disponibles
   */
  async listTemplates() {
    const response = await api.get('/document-generation/templates');
    return response.data;
  },

  /**
   * Crear plantilla personalizada
   */
  async createTemplate(templateData) {
    const response = await api.post('/document-generation/templates', templateData);
    return response.data;
  },

  /**
   * Descargar documento exportado
   */
  downloadBlob(blob, fileName) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};

export default documentApi;
