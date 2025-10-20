import { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, FileText, Mic, Loader, AlertCircle, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import semanticSearchApi from '../services/semanticSearchApi';

export default function SemanticSearch({ onResultClick }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isRagMode, setIsRagMode] = useState(true); // true = RAG, false = search
  const [searchResults, setSearchResults] = useState([]);
  const [ragAnswer, setRagAnswer] = useState('');
  const [ragSources, setRagSources] = useState([]);
  const [error, setError] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const answerRef = useRef(null);

  useEffect(() => {
    if (ragAnswer && answerRef.current) {
      answerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [ragAnswer]);

  const handleSearch = async () => {
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    setError('');
    setSearchResults([]);
    setRagAnswer('');
    setRagSources([]);

    try {
      if (isRagMode) {
        // RAG Mode - Get AI answer with context
        setIsStreaming(true);
        let fullAnswer = '';

        await semanticSearchApi.ragQueryStream(
          query,
          5,
          (chunk) => {
            fullAnswer += chunk;
            setRagAnswer(fullAnswer);
          }
        );

        // Get non-streaming to get sources
        const result = await semanticSearchApi.ragQuery(query, 5);
        setRagSources(result.sources || []);
        setIsStreaming(false);
      } else {
        // Search Mode - Get similar documents
        const result = await semanticSearchApi.search(query, { limit: 10, threshold: 0.6 });
        setSearchResults(result.results || []);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Error al realizar la búsqueda');
      setIsStreaming(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const clearResults = () => {
    setQuery('');
    setSearchResults([]);
    setRagAnswer('');
    setRagSources([]);
    setError('');
  };

  const getDocumentTypeIcon = (type) => {
    if (type?.includes('Transcription')) {
      return <Mic className="w-4 h-4 text-blue-500" />;
    }
    return <FileText className="w-4 h-4 text-green-500" />;
  };

  const getDocumentTypeName = (type) => {
    if (type?.includes('Transcription')) return 'Transcripción';
    if (type?.includes('GeneratedDocument')) return 'Documento Generado';
    return 'Documento';
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Search Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Search className="w-6 h-6 text-primary-600" />
          <h2 className="text-2xl font-bold text-primary-900">Búsqueda Semántica</h2>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setIsRagMode(true)}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              isRagMode
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Respuesta IA (RAG)</span>
            </div>
          </button>
          <button
            onClick={() => setIsRagMode(false)}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              !isRagMode
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Search className="w-4 h-4" />
              <span>Búsqueda de Documentos</span>
            </div>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              isRagMode
                ? '¿Qué necesitas saber sobre tus documentos?'
                : 'Buscar en documentos y transcripciones...'
            }
            className="w-full px-4 py-3 pr-24 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isSearching}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
            {query && (
              <button
                onClick={clearResults}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Limpiar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleSearch}
              disabled={!query.trim() || isSearching}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSearching ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Buscar</span>
            </button>
          </div>
        </div>

        {/* Mode Description */}
        <p className="text-sm text-gray-500 mt-2">
          {isRagMode
            ? 'Haz una pregunta y obtén una respuesta inteligente basada en tus documentos'
            : 'Busca documentos similares usando inteligencia artificial'}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* RAG Answer */}
      {isRagMode && ragAnswer && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6" ref={answerRef}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-primary-900">Respuesta</h3>
            {isStreaming && <Loader className="w-4 h-4 animate-spin text-primary-600" />}
          </div>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{ragAnswer}</ReactMarkdown>
          </div>

          {/* Sources */}
          {ragSources.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Fuentes consultadas ({ragSources.length})
              </h4>
              <div className="space-y-2">
                {ragSources.map((source, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => onResultClick && onResultClick(source)}
                  >
                    <div className="flex items-start gap-3">
                      {getDocumentTypeIcon(source.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-600">
                            {getDocumentTypeName(source.type)}
                          </span>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            {Math.round(source.similarity * 100)}% relevante
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">{source.preview}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Results */}
      {!isRagMode && searchResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-primary-900 mb-4">
            Resultados ({searchResults.length})
          </h3>
          <div className="space-y-3">
            {searchResults.map((result, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => onResultClick && onResultClick(result)}
              >
                <div className="flex items-start gap-3">
                  {getDocumentTypeIcon(result.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {getDocumentTypeName(result.type)} #{result.document_id}
                      </span>
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded font-medium">
                        {Math.round(result.similarity * 100)}% similar
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-3">{result.content}</p>

                    {/* Metadata */}
                    {result.metadata && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {result.metadata.template_type && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {result.metadata.template_type}
                          </span>
                        )}
                        {result.metadata.template_name && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {result.metadata.template_name}
                          </span>
                        )}
                        {result.metadata.duration && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                            {Math.round(result.metadata.duration)}s
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!isSearching && !error && (
        <>
          {isRagMode && !ragAnswer && query && (
            <div className="text-center py-12 text-gray-400">
              <Search className="w-16 h-16 mx-auto mb-3" />
              <p>Presiona buscar para obtener una respuesta</p>
            </div>
          )}
          {!isRagMode && searchResults.length === 0 && query && (
            <div className="text-center py-12 text-gray-400">
              <Search className="w-16 h-16 mx-auto mb-3" />
              <p>No se encontraron documentos similares</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
