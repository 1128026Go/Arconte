import api from '../lib/api';

/**
 * Servicio para interactuar con el asistente AI
 */
const aiApi = {
  /**
   * Enviar mensaje al chatbot (sin streaming)
   */
  async sendMessage(message, conversationId = null, caseId = null) {
    const response = await api.post('/ai-assistant/chat', {
      message,
      conversation_id: conversationId,
      case_id: caseId,
      stream: false
    });
    return response.data;
  },

  /**
   * Enviar mensaje con streaming SSE
   */
  async sendMessageStream(message, conversationId = null, caseId = null, onChunk) {
    const token = localStorage.getItem('token');
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const response = await fetch(`${baseURL}/api/ai-assistant/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        case_id: caseId,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al enviar mensaje');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';
    let metadata = null;

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
              metadata = {
                conversation_id: data.conversation_id,
                message_id: data.message_id
              };
            }
          } catch (e) {
            console.warn('Error parsing SSE data:', e);
          }
        }
      }
    }

    return {
      content: fullResponse,
      ...metadata
    };
  },

  /**
   * Obtener historial de conversaciones
   */
  async getConversations(page = 1) {
    const response = await api.get(`/ai-assistant/conversations?page=${page}`);
    return response.data;
  },

  /**
   * Obtener mensajes de una conversación
   */
  async getMessages(conversationId) {
    const response = await api.get(`/ai-assistant/conversations/${conversationId}/messages`);
    return response.data;
  },

  /**
   * Eliminar conversación
   */
  async deleteConversation(conversationId) {
    const response = await api.delete(`/ai-assistant/conversations/${conversationId}`);
    return response.data;
  },

  /**
   * Actualizar título de conversación
   */
  async updateTitle(conversationId, title) {
    const response = await api.put(`/ai-assistant/conversations/${conversationId}/title`, {
      title
    });
    return response.data;
  }
};

export default aiApi;
