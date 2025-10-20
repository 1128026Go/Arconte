import { useState, useEffect } from 'react';
import { Upload, File, Trash2, Download, RefreshCw, Clock, CheckCircle, AlertCircle, FileAudio, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import transcriptionApi from '../services/transcriptionApi';

export default function AudioTranscriber({ caseId = null, onTranscriptionComplete = null }) {
  const [transcriptions, setTranscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [selectedTranscription, setSelectedTranscription] = useState(null);

  useEffect(() => {
    loadTranscriptions();
  }, [caseId]);

  const loadTranscriptions = async () => {
    try {
      setLoading(true);
      const params = caseId ? { case_id: caseId } : {};
      const data = await transcriptionApi.listTranscriptions(params);
      setTranscriptions(data.data || []);
    } catch (err) {
      console.error('Error loading transcriptions:', err);
      setError('Error al cargar las transcripciones');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = transcriptionApi.validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setError('');

    // Auto-generar título basado en el nombre del archivo
    if (!title) {
      const filename = file.name.replace(/\.[^/.]+$/, '');
      setTitle(filename);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      setError('Por favor selecciona un archivo y proporciona un título');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const result = await transcriptionApi.uploadFile(selectedFile, title, caseId);

      // Agregar la nueva transcripción a la lista
      setTranscriptions(prev => [result.data, ...prev]);

      // Limpiar formulario
      setSelectedFile(null);
      setTitle('');
      document.getElementById('file-upload').value = '';

      if (onTranscriptionComplete) {
        onTranscriptionComplete(result.data);
      }

      // Recargar después de 2 segundos para actualizar el estado
      setTimeout(loadTranscriptions, 2000);

    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err.response?.data?.message || 'Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta transcripción?')) return;

    try {
      await transcriptionApi.deleteTranscription(id);
      setTranscriptions(prev => prev.filter(t => t.id !== id));
      if (selectedTranscription?.id === id) {
        setSelectedTranscription(null);
      }
    } catch (err) {
      console.error('Error deleting transcription:', err);
      alert('Error al eliminar la transcripción');
    }
  };

  const handleRetry = async (id) => {
    try {
      await transcriptionApi.retryTranscription(id);
      loadTranscriptions();
    } catch (err) {
      console.error('Error retrying transcription:', err);
      alert('Error al reintentar la transcripción');
    }
  };

  const handleExport = async (transcription) => {
    try {
      const blob = await transcriptionApi.exportTranscription(transcription.id);
      transcriptionApi.downloadBlob(blob, `${transcription.title}.txt`);
    } catch (err) {
      console.error('Error exporting transcription:', err);
      alert('Error al exportar la transcripción');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getFileIcon = (fileType) => {
    return fileType === 'video' ? <Video className="w-5 h-5" /> : <FileAudio className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow border border-primary-200 p-6">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">Subir Audio/Video</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Audiencia del 19 de octubre"
              className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              Archivo de Audio/Video
            </label>
            <div className="flex items-center gap-4">
              <label className="flex-1 cursor-pointer">
                <div className="flex items-center justify-center gap-3 px-4 py-3 border-2 border-dashed border-primary-300 rounded-lg hover:border-primary-500 transition-colors">
                  <Upload className="w-5 h-5 text-primary-600" />
                  <span className="text-sm text-primary-600">
                    {selectedFile ? selectedFile.name : 'Seleccionar archivo (máx. 50MB)'}
                  </span>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept="audio/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleUpload}
                disabled={!selectedFile || !title.trim() || uploading}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? 'Subiendo...' : 'Transcribir'}
              </button>
            </div>
            <p className="mt-2 text-xs text-primary-500">
              Formatos aceptados: MP3, MP4, M4A, WAV, WEBM, MPEG
            </p>
          </div>
        </div>
      </div>

      {/* Transcriptions List */}
      <div className="bg-white rounded-lg shadow border border-primary-200">
        <div className="p-6 border-b border-primary-200">
          <h3 className="text-lg font-semibold text-primary-900">Transcripciones</h3>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary-600" />
            <p className="text-primary-600 mt-4">Cargando transcripciones...</p>
          </div>
        ) : transcriptions.length === 0 ? (
          <div className="p-12 text-center">
            <FileAudio className="w-16 h-16 mx-auto text-primary-300 mb-4" />
            <p className="text-primary-600 font-medium">No hay transcripciones</p>
            <p className="text-primary-500 text-sm mt-2">Sube tu primer archivo de audio o video</p>
          </div>
        ) : (
          <div className="divide-y divide-primary-100">
            {transcriptions.map(transcription => (
              <motion.div
                key={transcription.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 hover:bg-primary-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getFileIcon(transcription.file_type)}
                      <h4 className="font-semibold text-primary-900">{transcription.title}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(transcription.status)}`}>
                        {getStatusIcon(transcription.status)}
                        {transcription.status === 'completed' ? 'Completado' :
                         transcription.status === 'processing' ? 'Procesando...' :
                         transcription.status === 'failed' ? 'Fallido' : 'Pendiente'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-primary-600 mb-2">
                      <span>{transcription.original_filename}</span>
                      {transcription.duration && (
                        <span>Duración: {transcriptionApi.formatDuration(transcription.duration)}</span>
                      )}
                      {transcription.file_size && (
                        <span>Tamaño: {transcriptionApi.formatFileSize(transcription.file_size)}</span>
                      )}
                    </div>

                    <p className="text-xs text-primary-500">
                      {new Date(transcription.created_at).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>

                    {transcription.status === 'completed' && transcription.transcription && (
                      <div className="mt-4">
                        <button
                          onClick={() => setSelectedTranscription(
                            selectedTranscription?.id === transcription.id ? null : transcription
                          )}
                          className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                        >
                          {selectedTranscription?.id === transcription.id ? 'Ocultar' : 'Ver transcripción'}
                        </button>
                      </div>
                    )}

                    {transcription.error_message && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-600">
                        Error: {transcription.error_message}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {transcription.status === 'completed' && (
                      <button
                        onClick={() => handleExport(transcription)}
                        className="p-2 hover:bg-primary-200 text-primary-700 rounded transition-colors"
                        title="Descargar"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    )}

                    {transcription.status === 'failed' && (
                      <button
                        onClick={() => handleRetry(transcription.id)}
                        className="p-2 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                        title="Reintentar"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(transcription.id)}
                      className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Transcription Detail */}
                <AnimatePresence>
                  {selectedTranscription?.id === transcription.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 pt-4 border-t border-primary-200"
                    >
                      <div className="space-y-4">
                        <div>
                          <h5 className="text-sm font-semibold text-primary-900 mb-2">Transcripción:</h5>
                          <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-800 whitespace-pre-wrap max-h-64 overflow-y-auto">
                            {transcription.transcription}
                          </div>
                        </div>

                        {transcription.summary && (
                          <div>
                            <h5 className="text-sm font-semibold text-primary-900 mb-2">Resumen:</h5>
                            <div className="p-4 bg-blue-50 rounded-lg text-sm text-gray-800 whitespace-pre-wrap">
                              {transcription.summary}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
