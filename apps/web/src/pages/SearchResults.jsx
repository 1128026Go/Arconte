import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import SemanticSearch from '../components/SemanticSearch';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  Search,
  FileText,
  Mic,
  Download,
  Eye,
  TrendingUp,
  Database,
  Zap
} from 'lucide-react';
import semanticSearchApi from '../services/semanticSearchApi';

export default function SearchResults() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [stats, setStats] = useState(null);
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [embeddingProgress, setEmbeddingProgress] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await semanticSearchApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleEmbedAll = async () => {
    if (!confirm('¿Generar embeddings para todos los documentos sin procesar? Esto puede tardar varios minutos.')) {
      return;
    }

    setIsEmbedding(true);
    setEmbeddingProgress('Procesando documentos...');

    try {
      const result = await semanticSearchApi.embedAll();
      setEmbeddingProgress(null);
      alert(`✅ Embeddings creados:\n- Documentos: ${result.results.documents}\n- Transcripciones: ${result.results.transcriptions}\n- Errores: ${result.results.errors}`);
      await loadStats();
    } catch (error) {
      console.error('Error embedding documents:', error);
      alert('Error al generar embeddings: ' + error.message);
    } finally {
      setIsEmbedding(false);
    }
  };

  const handleResultClick = (result) => {
    // Navigate to document/transcription detail
    if (result.type?.includes('GeneratedDocument')) {
      navigate(`/document-generation?doc=${result.document_id}`);
    } else if (result.type?.includes('Transcription')) {
      navigate(`/transcriptions?id=${result.document_id}`);
    }
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-900 mb-2">
            Búsqueda Semántica Inteligente
          </h1>
          <p className="text-gray-600">
            Encuentra documentos y obtén respuestas inteligentes usando IA
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Embeddings</p>
                  <p className="text-2xl font-bold text-primary-900">{stats.total_embeddings}</p>
                </div>
                <Database className="w-8 h-8 text-primary-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Documentos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.documents_embedded}</p>
                  <p className="text-xs text-gray-500">{stats.documents_pending} pendientes</p>
                </div>
                <FileText className="w-8 h-8 text-green-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Transcripciones</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.transcriptions_embedded}</p>
                  <p className="text-xs text-gray-500">{stats.transcriptions_pending} pendientes</p>
                </div>
                <Mic className="w-8 h-8 text-blue-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tasa de Cobertura</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round((stats.total_embeddings / (stats.total_documents + stats.total_transcriptions)) * 100)}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </Card>
          </div>
        )}

        {/* Embed All Button */}
        {stats && (stats.documents_pending > 0 || stats.transcriptions_pending > 0) && (
          <Card className="p-4 mb-6 bg-amber-50 border-amber-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-900">
                    Hay {stats.documents_pending + stats.transcriptions_pending} documentos sin indexar
                  </p>
                  <p className="text-sm text-amber-700">
                    Genera embeddings para habilitar búsqueda semántica en todos tus documentos
                  </p>
                </div>
              </div>
              <Button
                onClick={handleEmbedAll}
                disabled={isEmbedding}
                variant="primary"
                className="whitespace-nowrap"
              >
                {isEmbedding ? 'Procesando...' : 'Indexar Ahora'}
              </Button>
            </div>
          </Card>
        )}

        {/* Embedding Progress */}
        {embeddingProgress && (
          <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3">
              <div className="animate-spin">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-blue-900 font-medium">{embeddingProgress}</p>
            </div>
          </Card>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary-100 p-3 rounded-lg">
                <Search className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-primary-900 mb-2">
                  Búsqueda de Documentos
                </h3>
                <p className="text-gray-600 text-sm">
                  Encuentra documentos similares usando búsqueda por similitud vectorial.
                  Los resultados se ordenan por relevancia semántica.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-purple-900 mb-2">
                  RAG - Respuestas Inteligentes
                </h3>
                <p className="text-gray-600 text-sm">
                  Haz preguntas y obtén respuestas precisas basadas en el contenido real de tus documentos
                  usando Retrieval Augmented Generation.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search Component */}
        <SemanticSearch onResultClick={handleResultClick} />

        {/* How it works */}
        <Card className="p-6 mt-8 bg-gray-50">
          <h3 className="font-semibold text-lg text-gray-900 mb-4">
            ¿Cómo funciona la búsqueda semántica?
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <span className="bg-primary-600 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                1
              </span>
              <p>
                <strong className="text-gray-900">Vectorización:</strong> Cada documento se convierte en un vector
                de 1536 dimensiones usando OpenAI text-embedding-3-small
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-primary-600 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                2
              </span>
              <p>
                <strong className="text-gray-900">Búsqueda por similitud:</strong> Tu consulta se vectoriza y
                se compara usando similitud de coseno con pgvector en PostgreSQL
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-primary-600 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                3
              </span>
              <p>
                <strong className="text-gray-900">RAG (opcional):</strong> Los documentos más relevantes se
                envían a Gemini 2.0 como contexto para generar respuestas precisas
              </p>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
