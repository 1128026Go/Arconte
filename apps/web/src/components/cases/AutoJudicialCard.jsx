import React from 'react';
import { FileText, Calendar, Download, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

/**
 * Componente para mostrar un AUTO judicial de forma destacada
 * siguiendo el estándar de visualización de la Rama Judicial
 */
export default function AutoJudicialCard({ auto }) {
  const getClasificacionColor = (clasificacion) => {
    switch (clasificacion) {
      case 'perentorio':
        return 'bg-red-50 border-red-300 text-red-900';
      case 'tramite':
        return 'bg-blue-50 border-blue-300 text-blue-900';
      default:
        return 'bg-amber-50 border-amber-300 text-amber-900';
    }
  };

  const getClasificacionIcon = (clasificacion) => {
    switch (clasificacion) {
      case 'perentorio':
        return <AlertTriangle className="w-5 h-5" />;
      case 'tramite':
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className={`border-2 rounded-lg p-5 mb-4 ${getClasificacionColor(auto.clasificacion)}`}>
      {/* Header del AUTO */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {getClasificacionIcon(auto.clasificacion)}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold uppercase">
                AUTO JUDICIAL - {auto.clasificacion}
              </h3>
              {auto.confianza && (
                <span className="text-xs px-2 py-0.5 bg-white/50 rounded">
                  {Math.round(auto.confianza * 100)}% confianza
                </span>
              )}
            </div>
            {!auto.notificado && (
              <span className="text-xs font-semibold mt-1 inline-block">
                ⚠️ NO NOTIFICADO
              </span>
            )}
          </div>
        </div>

        {/* Botón de descarga si tiene documentos */}
        {auto.con_documentos && auto.documents && auto.documents.length > 0 && (
          <a
            href={auto.documents[0].download_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border-2 border-current rounded-lg font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            Descargar PDF
          </a>
        )}
      </div>

      {/* Campos oficiales de la Rama Judicial */}
      <div className="bg-white/70 rounded-lg p-4 space-y-3">
        {/* 1. Fecha de actuación */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          <div>
            <div className="text-xs font-semibold uppercase text-current/70 mb-1">
              Fecha de actuación
            </div>
            <div className="flex items-center gap-2 font-medium">
              <Calendar className="w-4 h-4" />
              {auto.fecha_actuacion_fmt || auto.fecha_fmt || '—'}
            </div>
          </div>

          {/* 2. Actuación */}
          <div>
            <div className="text-xs font-semibold uppercase text-current/70 mb-1">
              Actuación
            </div>
            <div className="font-medium">
              {auto.actuacion || auto.tipo || '—'}
            </div>
          </div>
        </div>

        {/* 3. Anotación */}
        <div>
          <div className="text-xs font-semibold uppercase text-current/70 mb-1">
            Anotación
          </div>
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {auto.anotacion || auto.titulo || auto.descripcion || '—'}
          </div>
        </div>

        {/* 4. Fecha de registro de inicio */}
        {auto.fecha_registro_inicio_fmt && (
          <div className="grid grid-cols-2 gap-x-6">
            <div>
              <div className="text-xs font-semibold uppercase text-current/70 mb-1">
                Fecha de registro de inicio
              </div>
              <div className="font-medium">
                {auto.fecha_registro_inicio_fmt}
              </div>
            </div>

            {/* 5. Fecha de registro de término */}
            {auto.fecha_registro_termino_fmt && (
              <div>
                <div className="text-xs font-semibold uppercase text-current/70 mb-1">
                  Fecha de registro de término
                </div>
                <div className="font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-red-700 font-bold">
                    {auto.fecha_registro_termino_fmt}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Información adicional de documentos */}
        {auto.con_documentos && auto.documents && auto.documents.length > 1 && (
          <div className="pt-3 border-t border-current/20">
            <div className="text-xs font-semibold uppercase text-current/70 mb-2">
              Documentos adjuntos ({auto.documents.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {auto.documents.map((doc, index) => (
                <a
                  key={doc.id}
                  href={doc.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs px-3 py-1.5 bg-white hover:bg-gray-50 border border-current/30 rounded font-medium transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  {doc.filename || `Documento ${index + 1}`}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
