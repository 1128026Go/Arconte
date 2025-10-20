import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader, AlertCircle, Sparkles } from 'lucide-react';
import useAIChat from '../hooks/useAIChat';
import ReactMarkdown from 'react-markdown';

export default function ChatBot({ caseId = null, position = 'bottom-right' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const {
    messages,
    isLoading,
    error,
    isStreaming,
    sendMessage,
    clearConversation,
    setError
  } = useAIChat({
    caseId,
    useStreaming: true
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage;
    setInputMessage('');
    await sendMessage(message);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 bg-white rounded-lg shadow-2xl border border-primary-200 w-96 h-[600px] flex flex-col animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">Asistente Legal AI</h3>
                <p className="text-xs text-primary-100">Powered by Gemini 2.0</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-primary-500 p-1 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-primary-50">
            {messages.length === 0 && (
              <div className="text-center text-primary-400 py-8">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-primary-300" />
                <p className="font-medium">¡Hola! Soy tu asistente legal.</p>
                <p className="text-sm mt-1">Pregúntame sobre procesos legales en Colombia</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white border border-primary-200 text-primary-900'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none prose-headings:text-primary-900 prose-p:text-primary-700 prose-strong:text-primary-900 prose-li:text-primary-700">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}

                  {msg.isStreaming && (
                    <div className="flex items-center gap-1 mt-2 text-primary-400">
                      <Loader className="w-3 h-3 animate-spin" />
                      <span className="text-xs">Escribiendo...</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Error</p>
                  <p className="text-xs mt-1">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="text-xs underline mt-2 hover:text-red-800"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-primary-200 bg-white rounded-b-lg">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu pregunta..."
                disabled={isLoading}
                rows="2"
                className="flex-1 px-3 py-2 border border-primary-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-primary-50 disabled:text-primary-400"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !inputMessage.trim()}
                className="px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-primary-300 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>

            {messages.length > 0 && (
              <button
                onClick={clearConversation}
                className="text-xs text-primary-500 hover:text-primary-700 mt-2 transition-colors"
              >
                Nueva conversación
              </button>
            )}
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110 active:scale-95"
        aria-label="Abrir asistente AI"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>
    </div>
  );
}
