import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import MainLayout from '../components/Layout/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  FileText,
  File,
  Upload,
  Download,
  Trash2,
  Share2,
  Search,
  Eye,
  Clock,
  Folder
} from 'lucide-react';
import { documents } from '../lib/api';

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await documents.getAll();
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
    } catch (error) {
      console.error('Error uploading:', error);
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
    }
  };

  const filteredDocs = docs.filter(doc => {
    const matchesSearch = doc.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || doc.type === selectedType;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: docs.length,
    pdf: docs.filter(d => d.type === 'pdf').length,
    image: docs.filter(d => d.type === 'image').length,
    word: docs.filter(d => d.type === 'word').length
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-navy-900">Documentos</h1>
            <p className="text-slate-600 mt-1">
              Gestiona y organiza tus documentos legales
            </p>
          </div>
        </div>

        {/* Upload Zone */}
        <Card>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-gold-500 bg-gold-50'
                : 'border-slate-300 hover:border-gold-500 hover:bg-gold-50/50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gold-100 flex items-center justify-center">
                <Upload className="h-6 w-6 text-gold-600" />
              </div>
              {uploading ? (
                <p className="text-navy-700 font-medium">Subiendo archivos...</p>
              ) : isDragActive ? (
                <p className="text-gold-700 font-medium">Suelta los archivos aquí</p>
              ) : (
                <>
                  <p className="text-navy-900 font-medium">
                    Arrastra archivos aquí o haz click para seleccionar
                  </p>
                  <p className="text-slate-500 text-sm">
                    PDF, Word, Excel, Imágenes (máx. 10MB)
                  </p>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-navy-200">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-navy-100 p-2">
                <Folder className="h-5 w-5 text-navy-700" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total</p>
                <p className="text-2xl font-bold text-navy-900">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="border-error-200">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-error-100 p-2">
                <FileText className="h-5 w-5 text-error-700" />
              </div>
              <div>
                <p className="text-sm text-slate-600">PDF</p>
                <p className="text-2xl font-bold text-navy-900">{stats.pdf}</p>
              </div>
            </div>
          </Card>
          <Card className="border-primary-200">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary-100 p-2">
                <FileText className="h-5 w-5 text-primary-700" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Word</p>
                <p className="text-2xl font-bold text-navy-900">{stats.word}</p>
              </div>
            </div>
          </Card>
          <Card className="border-success-200">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success-100 p-2">
                <File className="h-5 w-5 text-success-700" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Imágenes</p>
                <p className="text-2xl font-bold text-navy-900">{stats.image}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <TypeButton active={selectedType === 'all'} onClick={() => setSelectedType('all')}>
                Todos
              </TypeButton>
              <TypeButton active={selectedType === 'pdf'} onClick={() => setSelectedType('pdf')}>
                PDF
              </TypeButton>
              <TypeButton active={selectedType === 'word'} onClick={() => setSelectedType('word')}>
                Word
              </TypeButton>
              <TypeButton active={selectedType === 'image'} onClick={() => setSelectedType('image')}>
                Imágenes
              </TypeButton>
            </div>
          </div>
        </Card>

        {/* Documents Grid */}
        {loading ? (
          <Card>
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-600">Cargando documentos...</p>
            </div>
          </Card>
        ) : filteredDocs.length === 0 ? (
          <Card>
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-navy-100 mb-4">
                <FileText className="h-8 w-8 text-navy-600" />
              </div>
              <h3 className="text-lg font-semibold text-navy-900 mb-2">
                No hay documentos
              </h3>
              <p className="text-slate-600">
                Sube tu primer documento para empezar
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map(doc => (
              <DocumentCard key={doc.id} doc={doc} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function TypeButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
        active
          ? 'bg-navy-900 text-white'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {children}
    </button>
  );
}

function DocumentCard({ doc, onDelete }) {
  const getIcon = (type) => {
    switch (type) {
      case 'pdf': return FileText;
      case 'word': return FileText;
      case 'image': return File;
      default: return File;
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'pdf': return 'text-error-600 bg-error-100';
      case 'word': return 'text-primary-600 bg-primary-100';
      case 'image': return 'text-success-600 bg-success-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const Icon = getIcon(doc.type);
  const formatDate = (date) => new Date(date).toLocaleDateString('es-CO');
  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${getIconColor(doc.type)}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-navy-900 truncate">{doc.title}</h3>
            <p className="text-sm text-slate-600">{formatSize(doc.size || 0)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="h-3 w-3" />
          <span>{formatDate(doc.created_at)}</span>
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
          <Button
            variant="ghost"
            className="flex-1 text-navy-700 hover:text-navy-900 hover:bg-navy-50"
          >
            <Eye className="h-4 w-4 mr-1" />
            Ver
          </Button>
          <Button
            variant="ghost"
            className="flex-1 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
          >
            <Download className="h-4 w-4 mr-1" />
            Descargar
          </Button>
          <Button
            variant="ghost"
            onClick={() => onDelete(doc.id)}
            className="text-error-600 hover:text-error-700 hover:bg-error-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
