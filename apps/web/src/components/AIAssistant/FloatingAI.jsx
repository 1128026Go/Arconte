import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/apiSecure';

const FloatingAI = () => {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const location = useLocation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mensaje de bienvenida simple
  const getWelcomeMessage = () => {
    return '¡Hola! ¿En qué puedo ayudarte?';
  };

  const handleToggle = () => {
    if (!isOpen && messages.length === 0) {
      // Mensaje de bienvenida al abrir por primera vez
      setMessages([{
        role: 'assistant',
        content: getWelcomeMessage(),
        timestamp: new Date().toISOString()
      }]);
    }
    setIsOpen(!isOpen);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const currentPath = location.pathname;

      // Crear contexto mejorado basado en la ubicación
      let contextPrompt = inputMessage;

      if (currentPath.startsWith('/cases')) {
        contextPrompt = `[CONTEXTO: Usuario navegando en sección de Casos] ${inputMessage}`;
      } else if (currentPath === '/documents') {
        contextPrompt = `[CONTEXTO: Usuario en sección de Documentos, puede necesitar ayuda para generar documentos legales] ${inputMessage}`;
      } else if (currentPath === '/jurisprudence') {
        contextPrompt = `[CONTEXTO: Usuario buscando jurisprudencia] ${inputMessage}`;
      } else if (currentPath === '/billing') {
        contextPrompt = `[CONTEXTO: Usuario en sección de Facturación] ${inputMessage}`;
      }

      const response = await api.post('/ai/chat', {
        message: contextPrompt,
        conversation_id: conversationId
      });

      // La respuesta ya es la data directamente (axios interceptor retorna response.data)
      const data = response.data || response;

      if (data?.conversation_id) {
        setConversationId(data.conversation_id);
      }

      const assistantMessage = {
        role: 'assistant',
        content: data?.message || data?.response || 'Lo siento, hubo un error al procesar tu mensaje.',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Lo siento, ocurrió un error al procesar tu solicitud. Por favor, intenta de nuevo.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Botón flotante */}
      {!isOpen && (
        <button
          onClick={handleToggle}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-navy-900 to-navy-800 text-white rounded-full p-4 shadow-elevated hover:shadow-2xl transition-all duration-300 hover:scale-110 group"
        >
          <div className="relative">
            <Sparkles className="w-6 h-6 group-hover:text-gold-500 transition-colors" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-gold-500 rounded-full animate-pulse"></span>
          </div>
        </button>
      )}

      {/* Panel de chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-navy-900 to-navy-800 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Sparkles className="w-6 h-6 text-gold-500" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-gold-500 rounded-full animate-pulse"></span>
              </div>
              <div>
                <h3 className="font-bold text-lg">Asistente Legal Arconte</h3>
                <p className="text-xs text-slate-300">Experto en derecho colombiano</p>
              </div>
            </div>
            <button
              onClick={handleToggle}
              className="hover:bg-navy-700 p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-navy-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-800'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-gold-500" />
                      <span className="text-xs font-semibold text-gold-600">Arconte AI</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-xs mt-2 ${
                    msg.role === 'user' ? 'text-slate-300' : 'text-slate-400'
                  }`}>
                    {new Date(msg.timestamp).toLocaleTimeString('es-CO', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gold-500" />
                    <span className="text-sm text-slate-600">Pensando...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-slate-200">
            <div className="flex gap-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu consulta legal..."
                className="flex-1 border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent resize-none"
                rows="2"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-gradient-to-r from-navy-900 to-navy-800 text-white rounded-xl px-4 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Presiona Enter para enviar, Shift+Enter para nueva línea
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAI;
