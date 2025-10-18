import { useState, useRef, useEffect } from 'react';
import { api } from '../lib/apiSecure';
import MainLayout from '../components/Layout/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Bot, Send, User, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function AIAssistant() {
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '¡Hola! Soy tu asistente legal con IA. ¿En qué puedo ayudarte hoy?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Usar apiSecure en lugar de fetch directo para mantener seguridad
      const response = await api.post('/ai/chat', {
        message: userMessage
      });

      console.log('AI Response:', response);

      // La respuesta ya es la data directamente (axios interceptor retorna response.data)
      const data = response.data || response;
      const assistantContent = data.message || data.response || 'Lo siento, no pude procesar tu solicitud.';
      console.log('Assistant Content:', assistantContent);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: assistantContent
      }]);
    } catch (error) {
      console.error('Error:', error);

      let errorMessage = 'Lo siento, hubo un error al procesar tu mensaje.';

      if (error.name === 'AbortError') {
        errorMessage = 'La solicitud tardó demasiado. Por favor, intenta con una pregunta más corta.';
      } else if (error.message.includes('401')) {
        errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
      } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const quickPrompts = [
    '¿Cómo redactar una demanda de tutela?',
    'Explícame el proceso de sucesión',
    '¿Cuáles son los requisitos para un divorcio?',
    'Ayúdame con un contrato laboral'
  ];

  return (
    <MainLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 p-3">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-navy-900">Asistente Legal con IA</h1>
              <p className="text-slate-600">Powered by Gemini AI</p>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <Card className="flex-1 flex flex-col overflow-hidden mb-4">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-navy-900 text-white'
                      : 'bg-slate-100 text-navy-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-navy-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-navy-700" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="bg-slate-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-navy-700" />
                    <span className="text-sm text-navy-700">Pensando...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length === 1 && (
            <div className="px-6 pb-4">
              <p className="text-sm text-slate-600 mb-3">Preguntas sugeridas:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {quickPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(prompt)}
                    className="text-left px-4 py-2 rounded-lg border border-slate-200 hover:border-gold-500 hover:bg-gold-50 transition-colors text-sm text-navy-700"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Input Area */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu pregunta legal..."
              rows={3}
              disabled={loading}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 resize-none disabled:opacity-50"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || loading}
            className="h-full bg-gold-500 hover:bg-gold-600 text-white px-6 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
