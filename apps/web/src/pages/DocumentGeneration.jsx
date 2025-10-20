import { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import DocumentGenerator from '../components/DocumentGenerator';
import documentApi from '../services/documentApi';
import { FileText, Trash2, Download, Clock, CheckCircle, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DocumentGeneration() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerator, setShowGenerator] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentApi.listDocuments();
      setDocuments(data.data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return;

    try {
      await documentApi.deleteDocument(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error al eliminar el documento');
    }
  };

  const handleExport = async (doc) => {
    try {
      const blob = await documentApi.exportDocument(doc.id, 'txt');
      documentApi.downloadBlob(blob, `${doc.title}.txt`);
    } catch (error) {
      console.error('Error exporting document:', error);
      alert('Error al exportar el documento');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'generating':
        return 'text-blue-600 bg-blue-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'generating':
        return <Loader className="w-4 h-4 animate-spin" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary-900">Generador de Documentos</h1>
            <p className="text-primary-600 mt-2">Crea documentos legales con IA en segundos</p>
          </div>
          <button
            onClick={() => setShowGenerator(!showGenerator)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <FileText className="w-5 h-5" />
            {showGenerator ? 'Ver Historial' : 'Nuevo Documento'}
          </button>
        </div>

        {/* Generador */}
        {showGenerator ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DocumentGenerator
              onClose={() => {
                setShowGenerator(false);
                loadDocuments();
              }}
            />
          </motion.div>
        ) : (
          /* Historial */
          <div className="bg-white rounded-lg shadow border border-primary-200">
            <div className="p-6 border-b border-primary-200">
              <h2 className="text-xl font-semibold text-primary-900">Documentos Generados</h2>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <Loader className="w-8 h-8 animate-spin mx-auto text-primary-600" />
                <p className="text-primary-600 mt-4">Cargando documentos...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-16 h-16 mx-auto text-primary-300 mb-4" />
                <p className="text-primary-600 font-medium">No hay documentos generados</p>
                <p className="text-primary-500 text-sm mt-2">Crea tu primer documento con IA</p>
              </div>
            ) : (
              <div className="divide-y divide-primary-100">
                {documents.map(doc => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-6 hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-primary-900">{doc.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(doc.status)}`}>
                            {getStatusIcon(doc.status)}
                            {doc.status === 'completed' ? 'Completado' : doc.status === 'generating' ? 'Generando...' : doc.status}
                          </span>
                        </div>
                        <p className="text-sm text-primary-600 mb-2">
                          Tipo: <span className="font-medium">{doc.template_type}</span>
                        </p>
                        <p className="text-xs text-primary-500">
                          Creado el {new Date(doc.created_at).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>

                      {doc.status === 'completed' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleExport(doc)}
                            className="p-2 hover:bg-primary-200 text-primary-700 rounded transition-colors"
                            title="Descargar"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
