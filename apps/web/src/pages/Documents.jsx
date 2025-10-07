import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  FileText,
  FileImage,
  File,
  Upload,
  Download,
  Trash2,
  Share2,
  Search,
  Filter,
  X,
  Eye,
  Clock
} from 'lucide-react';
import { documents } from '../lib/api';

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    case_id: '',
    date_from: '',
    date_to: ''
  });

  useEffect(() => {
    loadDocuments();
  }, [filters]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await documents.getAll(filters);
      setDocs(response.data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    setUploading(true);

    try {
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name);

        await documents.upload(formData);
      }

      await loadDocuments();
      alert('Documentos subidos exitosamente');
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Error al subir documentos');
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return;

    try {
      await documents.delete(id);
      await loadDocuments();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Error al eliminar documento');
    }
  };

  const handleDownload = async (doc) => {
    try {
      const blob = await documents.download(doc.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.title;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading:', error);
      alert('Error al descargar documento');
    }
  };

  const getFileIcon = (mime) => {
    if (mime?.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (mime?.includes('image')) return <FileImage className="w-5 h-5 text-green-500" />;
    return <File className="w-5 h-5 text-blue-500" />;
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  const filteredDocs = docs.filter(doc =>
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Documentos</h1>
        <p className="text-gray-600 mt-1">Sube, organiza y comparte tus documentos</p>
      </div>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 mb-6 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} disabled={uploading} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        {uploading ? (
          <p className="text-gray-600">Subiendo documentos...</p>
        ) : isDragActive ? (
          <p className="text-blue-600 font-medium">Suelta los archivos aquí...</p>
        ) : (
          <>
            <p className="text-gray-700 font-medium mb-1">
              Arrastra archivos aquí o haz clic para seleccionar
            </p>
            <p className="text-sm text-gray-500">
              PDF, Imágenes, Word, Excel (máx. 10MB por archivo)
            </p>
          </>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Filter className="w-5 h-5" />
          Filtros
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de archivo
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Todos</option>
              <option value="pdf">PDF</option>
              <option value="image">Imagen</option>
              <option value="document">Documento</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desde
            </label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ type: '', case_id: '', date_from: '', date_to: '' })}
              className="w-full px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      )}

      {/* Documents Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-2">Cargando documentos...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-12">
          <File className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No hay documentos para mostrar</p>
          <p className="text-sm text-gray-500 mt-1">
            Sube tu primer documento arrastrándolo arriba
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getFileIcon(doc.mime)}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {doc.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatBytes(doc.size)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                <Clock className="w-4 h-4" />
                {formatDate(doc.created_at)}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedDoc(doc)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                >
                  <Eye className="w-4 h-4" />
                  Ver
                </button>
                <button
                  onClick={() => handleDownload(doc)}
                  className="flex items-center justify-center gap-1 px-3 py-2 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="flex items-center justify-center gap-1 px-3 py-2 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">{selectedDoc.title}</h2>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Tipo</p>
                  <p className="font-medium">{selectedDoc.mime}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tamaño</p>
                  <p className="font-medium">{formatBytes(selectedDoc.size)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha de subida</p>
                  <p className="font-medium">{formatDate(selectedDoc.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Caso asociado</p>
                  <p className="font-medium">{selectedDoc.case_id || 'Ninguno'}</p>
                </div>
              </div>

              {selectedDoc.ocr_text && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Texto extraído (OCR)</h3>
                  <div className="bg-gray-50 p-4 rounded text-sm max-h-60 overflow-y-auto">
                    {selectedDoc.ocr_text}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t flex gap-2">
              <button
                onClick={() => handleDownload(selectedDoc)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                Descargar
              </button>
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
