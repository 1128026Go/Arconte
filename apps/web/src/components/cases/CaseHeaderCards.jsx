import React from 'react';
import { Clock, Calendar, Scale, Building2, User, FileText, MapPin, Briefcase } from 'lucide-react';

const InfoField = ({ label, value }) => (
  <div className="space-y-1">
    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</div>
    <div className="text-sm font-semibold text-navy-900">{value || '—'}</div>
  </div>
);

export default function CaseHeaderCards({ caseData }) {
  if (!caseData) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      {/* 3 tarjetas superiores */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-lg hover:shadow-md transition-shadow">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center mr-3">
              <Scale className="w-5 h-5 text-navy-600" />
            </div>
            <p className="text-sm text-slate-600">Estado</p>
          </div>
          <h3 className="text-lg font-bold text-navy-900">{caseData.estado_actual || 'Buscando información...'}</h3>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-lg hover:shadow-md transition-shadow">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center mr-3">
              <Clock className="w-5 h-5 text-navy-600" />
            </div>
            <p className="text-sm text-slate-600">Última verificación</p>
          </div>
          <h3 className="text-base font-bold text-navy-900">
            {caseData.ultima_verificacion_fmt || '—'}
          </h3>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-lg hover:shadow-md transition-shadow">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-sm text-slate-600">Última vista</p>
          </div>
          <h3 className="text-base font-bold text-navy-900">
            {caseData.ultima_vista_fmt || 'Primera visita'}
          </h3>
        </div>
      </div>

      {/* Ficha "Datos del proceso" (paridad con Rama Judicial) */}
      <div className="bg-white border border-slate-200 rounded-lg">
        <div className="bg-gradient-to-r from-navy-50 to-navy-100 border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-navy-900 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-gold-500" />
            Datos del Proceso
          </h2>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <InfoField
              label="Fecha de Radicación"
              value={caseData.fecha_radicacion_fmt}
            />
            <InfoField
              label="Despacho"
              value={caseData.despacho}
            />
            <InfoField
              label="Ponente"
              value={caseData.ponente}
            />
            <InfoField
              label="Tipo de Proceso"
              value={caseData.tipo_proceso || 'Sin Tipo de Proceso'}
            />
            <InfoField
              label="Clase de Proceso"
              value={caseData.clase_proceso || 'Sin Tipo de Proceso'}
            />
            <InfoField
              label="Subclase de Proceso"
              value={caseData.subclase_proceso || 'Sin Subclase de Proceso'}
            />
            <InfoField
              label="Recurso"
              value={caseData.recurso || 'Sin Tipo de Recurso'}
            />
            <InfoField
              label="Ubicación del Expediente"
              value={caseData.ubicacion_expediente || 'Secretaría'}
            />
            <InfoField
              label="Fecha Última Actuación"
              value={caseData.fecha_ultima_actuacion_fmt}
            />
          </div>

          {caseData.contenido_radicacion && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                Contenido de radicación
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                {caseData.contenido_radicacion}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
