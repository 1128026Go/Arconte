import { useState, useCallback, useRef, useEffect } from 'react';
import aiApi from '../services/aiApi';

/**
 * Hook para gestionar el chat con el asistente AI
 */
export default function useAIChat(options = {}) {
  const {
    conversationId: initialConversationId = null,
    caseId = null,
    useStreaming = true,
    autoLoad = false
  } = options;

  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef(null);

  /**
   * Cargar mensajes de una conversación existente
   */
  const loadConversation = useCallback(async (convId) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await aiApi.getMessages(convId);
      setMessages(data.messages || []);
      setConversationId(convId);
    } catch (err) {
      setError(err.message || 'Error al cargar la conversación');
      console.error('Error loading conversation:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Enviar mensaje al asistente
   */
  const sendMessage = useCallback(async (message) => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: message,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setError(null);
    setIsLoading(true);

    try {
      if (useStreaming) {
        // Streaming con SSE
        setIsStreaming(true);
        setStreamingMessage('');

        const assistantMessagePlaceholder = {
          id: Date.now() + 1,
          role: 'assistant',
          content: '',
          created_at: new Date().toISOString(),
          isStreaming: true
        };

        setMessages(prev => [...prev, assistantMessagePlaceholder]);

        const result = await aiApi.sendMessageStream(
          message,
          conversationId,
          caseId,
          (chunk) => {
            setStreamingMessage(prev => prev + chunk);
          }
        );

        // Actualizar mensaje con contenido completo
        setMessages(prev =>
          prev.map(msg =>
            msg.isStreaming
              ? {
                  ...msg,
                  content: result.content,
                  isStreaming: false,
                  id: result.message_id || msg.id
                }
              : msg
          )
        );

        if (result.conversation_id) {
          setConversationId(result.conversation_id);
        }

        setStreamingMessage('');
        setIsStreaming(false);

      } else {
        // Respuesta normal sin streaming
        const response = await aiApi.sendMessage(message, conversationId, caseId);

        const assistantMessage = {
          id: response.message_id,
          role: 'assistant',
          content: response.message,
          tokens: response.tokens,
          created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, assistantMessage]);

        if (response.conversation_id) {
          setConversationId(response.conversation_id);
        }
      }

    } catch (err) {
      setError(err.message || 'Error al enviar el mensaje');
      console.error('Error sending message:', err);

      // Remover mensaje placeholder en caso de error
      if (useStreaming) {
        setMessages(prev => prev.filter(msg => !msg.isStreaming));
        setStreamingMessage('');
        setIsStreaming(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, caseId, useStreaming]);

  /**
   * Limpiar conversación actual
   */
  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    setStreamingMessage('');
  }, []);

  /**
   * Cancelar streaming actual
   */
  const cancelStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setStreamingMessage('');
  }, []);

  /**
   * Auto-cargar conversación si se especifica
   */
  useEffect(() => {
    if (autoLoad && initialConversationId) {
      loadConversation(initialConversationId);
    }
  }, [autoLoad, initialConversationId, loadConversation]);

  /**
   * Actualizar mensaje streaming en el último mensaje
   */
  useEffect(() => {
    if (isStreaming && streamingMessage) {
      setMessages(prev =>
        prev.map((msg, idx) =>
          idx === prev.length - 1 && msg.isStreaming
            ? { ...msg, content: streamingMessage }
            : msg
        )
      );
    }
  }, [streamingMessage, isStreaming]);

  return {
    messages,
    conversationId,
    isLoading,
    error,
    isStreaming,
    streamingMessage,
    sendMessage,
    loadConversation,
    clearConversation,
    cancelStreaming,
    setError
  };
}
