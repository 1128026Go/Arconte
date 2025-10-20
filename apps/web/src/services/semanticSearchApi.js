import api from '../lib/api';

/**
 * Servicio para búsqueda semántica y RAG
 */
const semanticSearchApi = {
  /**
   * Búsqueda semántica de documentos
   */
  async search(query, options = {}) {
    const response = await api.post('/semantic-search/search', {
      query,
      limit: options.limit || 10,
      threshold: options.threshold || 0.7
    });
    return response.data;
  },

  /**
   * RAG Query - Pregunta con contexto y respuesta de IA
   */
  async ragQuery(question, contextLimit = 5) {
    const response = await api.post('/semantic-search/rag-query', {
      question,
      context_limit: contextLimit,
      stream: false
    });
    return response.data;
  },

  /**
   * RAG Query con streaming
   */
  async ragQueryStream(question, contextLimit = 5, onChunk) {
    const token = localStorage.getItem('token');
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const response = await fetch(`${baseURL}/api/semantic-search/rag-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        question,
        context_limit: contextLimit,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error en RAG query');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.chunk) {
              fullResponse += data.chunk;
              onChunk(data.chunk);
            }

            if (data.done) {
              return fullResponse;
            }
          } catch (e) {
            console.warn('Error parsing SSE data:', e);
          }
        }
      }
    }

    return fullResponse;
  },

  /**
   * Buscar documentos similares
   */
  async findSimilar(embeddingId, limit = 5) {
    const response = await api.get(`/semantic-search/similar/${embeddingId}`, {
      params: { limit }
    });
    return response.data;
  },

  /**
   * Crear embedding para un documento específico
   */
  async embedDocument(type, id) {
    const response = await api.post('/semantic-search/embed', {
      type, // 'document' o 'transcription'
      id
    });
    return response.data;
  },

  /**
   * Crear embeddings para todos los documentos sin procesar
   */
  async embedAll() {
    const response = await api.post('/semantic-search/embed-all');
    return response.data;
  },

  /**
   * Obtener estadísticas de embeddings
   */
  async getStats() {
    const response = await api.get('/semantic-search/stats');
    return response.data;
  }
};

export default semanticSearchApi;
