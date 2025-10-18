import React, { useState, useMemo } from 'react';
import { FileText, Calendar, AlertCircle } from 'lucide-react';
import AutoJudicialCard from './AutoJudicialCard';

export default function ActsListCompact({ acts }) {
  const [openTextId, setOpenTextId] = useState(null);

  // Ordenar todas las actuaciones por fecha (más recientes primero)
  const sortedActs = useMemo(() => {
    if (!acts || acts.length === 0) {
      return [];
    }

    return [...acts].sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
  }, [acts]);

  const openText = async (docId) => {
    try {
      const response = await fetch(`/api/documents/${docId}/text`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      // Mostrar texto en modal o nueva ventana
      alert(data.text_content || 'No hay texto extraído');
    } catch (error) {
      console.error('Error al obtener texto:', error);
      alert('Error al cargar el texto del documento');
    }
  };

  if (!acts || acts.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No hay actuaciones registradas
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* TODAS LAS ACTUACIONES EN UNA SOLA LISTA */}
      <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
        {sortedActs.map((a) => (
        <div key={a.id} className="group relative py-3 px-4 hover:bg-slate-50 transition-colors">
          {/* Fila compacta */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Tipo de actuación */}
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium whitespace-nowrap">
              {a.actuacion || a.tipo}
            </span>

            {/* Fecha */}
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {a.fecha_fmt}
            </span>

            {/* Badge de documento */}
            {a.con_documentos && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">
                📄 Doc
              </span>
            )}

            {/* Badge de clasificación (AUTOS) */}
            {a.clasificacion && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                AUTO: {a.clasificacion}
              </span>
            )}

            {/* Badge perentorio */}
            {a.fecha_final_fmt && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Vence: {a.fecha_final_fmt}
              </span>
            )}

            {/* Título truncado */}
            <div className="truncate text-sm font-medium text-navy-900 flex-1 min-w-0">
              {a.titulo || a.anotacion?.slice(0, 90) || a.descripcion}
            </div>
          </div>

          {/* Panel hover con detalles completos */}
          <div className="pointer-events-none absolute left-0 right-0 translate-y-1 opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 bg-white border border-slate-300 rounded-xl shadow-lg p-4 mt-2 z-10 mx-4">
            {/* Encabezado con fechas */}
            <div className="flex items-center gap-3 text-xs text-slate-600 mb-3 pb-2 border-b border-slate-200">
              <span className="font-medium">{a.fecha_inicial_fmt || a.fecha_fmt}</span>
              {a.fecha_final_fmt && (
                <>
                  <span className="text-slate-400">·</span>
                  <span className="text-red-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Vence: {a.fecha_final_fmt}
                  </span>
                </>
              )}
              {a.clasificacion && (
                <>
                  <span className="text-slate-400">·</span>
                  <span className="bg-amber-50 px-2 py-0.5 rounded text-amber-700">
                    {a.clasificacion} ({Math.round(a.confianza * 100)}% confianza)
                  </span>
                </>
              )}
            </div>

            {/* Descripción completa */}
            <div className="mt-2 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {a.anotacion || a.descripcion || a.titulo}
            </div>

            {/* Acciones de documentos */}
            {a.con_documentos && a.documents && a.documents.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200 flex gap-3 flex-wrap">
                {a.documents.map((doc) => (
                  <div key={doc.id} className="flex gap-2">
                    {doc.download_url && (
                      <a
                        href={doc.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-navy-600 hover:text-navy-800 underline flex items-center gap-1"
                      >
                        <FileText className="w-4 h-4" />
                        Descargar documento
                      </a>
                    )}
                    {doc.id && (
                      <button
                        onClick={() => openText(doc.id)}
                        className="text-sm text-emerald-600 hover:text-emerald-800 underline"
                      >
                        Ver texto
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        ))}
      </div>
    </div>
  );
}
