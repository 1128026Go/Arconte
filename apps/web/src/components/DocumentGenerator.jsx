import { useState } from 'react';
import { FileText, Download, Loader, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import documentApi from '../services/documentApi';

const DOCUMENT_TYPES = [
  { value: 'tutela', label: 'Acción de Tutela', icon: '⚖️' },
  { value: 'derecho_peticion', label: 'Derecho de Petición', icon: '📝' },
  { value: 'demanda', label: 'Demanda', icon: '📋' },
  { value: 'contrato', label: 'Contrato', icon: '📄' },
];

const FORM_FIELDS = {
  tutela: [
    { name: 'accionante', label: 'Accionante', type: 'text', required: true },
    { name: 'documento', label: 'Documento de Identidad', type: 'text', required: true },
    { name: 'accionado', label: 'Accionado', type: 'text', required: true },
    { name: 'derecho_vulnerado', label: 'Derecho Fundamental Vulnerado', type: 'text', required: true },
    { name: 'hechos', label: 'Hechos', type: 'textarea', required: true },
  ],
  derecho_peticion: [
    { name: 'peticionario', label: 'Peticionario', type: 'text', required: true },
    { name: 'documento', label: 'Documento de Identidad', type: 'text', required: true },
    { name: 'destinatario', label: 'Destinatario', type: 'text', required: true },
    { name: 'asunto', label: 'Asunto', type: 'text', required: true },
    { name: 'solicitud', label: 'Solicitud', type: 'textarea', required: true },
  ],
  demanda: [
    { name: 'demandante', label: 'Demandante', type: 'text', required: true },
    { name: 'demandado', label: 'Demandado', type: 'text', required: true },
    { name: 'tipo_proceso', label: 'Tipo de Proceso', type: 'text', required: true },
    { name: 'hechos', label: 'Hechos', type: 'textarea', required: true },
    { name: 'pretensiones', label: 'Pretensiones', type: 'textarea', required: true },
  ],
  contrato: [
    { name: 'tipo_contrato', label: 'Tipo de Contrato', type: 'text', required: true },
    { name: 'parte_1', label: 'Primera Parte', type: 'text', required: true },
    { name: 'parte_2', label: 'Segunda Parte', type: 'text', required: true },
    { name: 'objeto', label: 'Objeto del Contrato', type: 'textarea', required: true },
    { name: 'valor', label: 'Valor', type: 'text', required: false },
    { name: 'plazo', label: 'Plazo', type: 'text', required: false },
  ],
};

export default function DocumentGenerator({ caseId = null, onClose = null }) {
  const [selectedType, setSelectedType] = useState('');
  const [formData, setFormData] = useState({});
  const [title, setTitle] = useState('');
  const [generatedDocument, setGeneratedDocument] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleTypeChange = (type) => {
    setSelectedType(type);
    setFormData({});
    setGeneratedDocument(null);
    setError(null);

    // Auto-generar título
    const docType = DOCUMENT_TYPES.find(t => t.value === type);
    setTitle(`${docType?.label || 'Documento'} - ${new Date().toLocaleDateString()}`);
  };

  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleGenerate = async () => {
    setError(null);
    setIsGenerating(true);

    try {
      const result = await documentApi.generateDocument(
        selectedType,
        title,
        formData,
        caseId
      );

      setGeneratedDocument(result.document);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al generar el documento');
      console.error('Error generating document:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async (format) => {
    if (!generatedDocument) return;

    try {
      const blob = await documentApi.exportDocument(generatedDocument.id, format);
      const fileName = `${title}.${format}`;
      documentApi.downloadBlob(blob, fileName);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al exportar el documento');
    }
  };

  const currentFields = FORM_FIELDS[selectedType] || [];
  const isFormValid = title && currentFields.every(field =>
    !field.required || (formData[field.name] && formData[field.name].trim())
  );

  return (
    <div className="bg-white rounded-lg shadow-lg border border-primary-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Generador de Documentos con IA</h2>
              <p className="text-sm text-primary-100 mt-1">Powered by Gemini 2.0</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:bg-primary-500 p-2 rounded transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Selector de tipo de documento */}
        {!generatedDocument && (
          <>
            <div>
              <label className="block text-sm font-medium text-primary-900 mb-3">
                Tipo de Documento
              </label>
              <div className="grid grid-cols-2 gap-3">
                {DOCUMENT_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => handleTypeChange(type.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedType === type.value
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-primary-200 hover:border-primary-400'
                    }`}
                  >
                    <div className="text-2xl mb-2">{type.icon}</div>
                    <div className="text-sm font-medium text-primary-900">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Título del documento */}
            {selectedType && (
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">
                  Título del Documento
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ej: Acción de Tutela - Derecho a la Salud"
                />
              </div>
            )}

            {/* Formulario dinámico */}
            {selectedType && currentFields.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-primary-900">Información Requerida</h3>
                {currentFields.map(field => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-primary-700 mb-2">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        rows="4"
                        className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder={`Ingrese ${field.label.toLowerCase()}`}
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder={`Ingrese ${field.label.toLowerCase()}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Botón generar */}
            {selectedType && (
              <button
                onClick={handleGenerate}
                disabled={!isFormValid || isGenerating}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Generando documento...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generar Documento con IA
                  </>
                )}
              </button>
            )}
          </>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start gap-2">
            <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Documento generado */}
        {generatedDocument && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">¡Documento generado exitosamente!</span>
            </div>

            {/* Vista previa */}
            <div>
              <h3 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Vista Previa
              </h3>
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-primary-800 font-mono">
                  {generatedDocument.content}
                </pre>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3">
              <button
                onClick={() => handleExport('txt')}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Descargar TXT
              </button>
              <button
                onClick={() => {
                  setGeneratedDocument(null);
                  setSelectedType('');
                  setFormData({});
                }}
                className="flex-1 bg-primary-100 hover:bg-primary-200 text-primary-700 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Generar Otro
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
