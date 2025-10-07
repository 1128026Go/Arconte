import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCase, markRead } from "../lib/api";
import { fmtDate } from "../lib/date";
import MainLayout from '../components/Layout/MainLayout';
import {
  ChevronDown, ChevronUp, Calendar, User, FileText,
  Bell, Clock, Scale, AlertCircle
} from 'lucide-react';

export default function CaseDetail() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!id) return;
    getCase(id)
      .then((data) => {
        setCaseData(data);
        // Auto-marcar como leído
        if (data.has_unread) {
          markRead(id).catch(console.error);
        }
      })
      .catch((e) => setErr(e.message));
  }, [id]);

  if (err) {
    return (
      <MainLayout>
        <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <strong>Error:</strong> <span className="ml-2">{err}</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!caseData) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
          <span className="ml-3 text-navy-600">Cargando caso...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-6">
        <Link to="/cases" className="text-navy-600 hover:text-navy-800 text-sm mb-2 inline-flex items-center transition-colors">
          ← Volver a casos
        </Link>
        <h1 className="text-3xl font-bold text-navy-900 mt-2 flex items-center">
          <Scale className="w-8 h-8 mr-3 text-gold-500" />
          Proceso {caseData.radicado}
        </h1>
      </div>

      {/* Alert de actualizaciones sin leer */}
      {caseData.has_unread && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-lg mb-6">
          <div className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Este caso tiene actualizaciones sin leer
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 p-6 rounded-lg hover:shadow-md transition-shadow">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center mr-3">
              <Scale className="w-5 h-5 text-navy-600" />
            </div>
            <p className="text-sm text-slate-600">Estado</p>
          </div>
          <h3 className="text-lg font-bold text-navy-900">{caseData.estado_actual || "No verificado"}</h3>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-lg hover:shadow-md transition-shadow">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center mr-3">
              <Clock className="w-5 h-5 text-navy-600" />
            </div>
            <p className="text-sm text-slate-600">Última verificación</p>
          </div>
          <h3 className="text-lg font-bold text-navy-900">
            {caseData.last_checked_at ? fmtDate(caseData.last_checked_at) : "—"}
          </h3>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-lg hover:shadow-md transition-shadow">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center mr-3">
              <Calendar className="w-5 h-5 text-navy-600" />
            </div>
            <p className="text-sm text-slate-600">Última vista</p>
          </div>
          <h3 className="text-lg font-bold text-navy-900">
            {caseData.last_seen_at ? fmtDate(caseData.last_seen_at) : "—"}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actuaciones - Timeline */}
        <div className={caseData.parties?.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-navy-50 border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-navy-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-gold-500" />
                Actuaciones ({caseData.acts?.length || 0})
              </h2>
            </div>
            <div className="p-6">
              {caseData.acts?.length > 0 ? (
                <div className="relative space-y-6">
                  {/* Línea vertical del timeline */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />

                  {caseData.acts.map((act, index) => (
                    <div key={index} className="relative flex gap-4">
                      {/* Círculo con icono */}
                      <div className="relative z-10 w-12 h-12 rounded-full bg-navy-100 flex items-center justify-center ring-4 ring-white">
                        <Bell className="w-5 h-5 text-navy-600" />
                      </div>

                      {/* Card de contenido */}
                      <div className="flex-1 bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <span className="inline-block px-3 py-1 bg-navy-100 text-navy-700 text-xs font-semibold rounded-full">
                            {act.type || 'Actuación'}
                          </span>
                          <time className="text-sm text-slate-500 flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {act.date ? fmtDate(act.date) : 'Sin fecha'}
                          </time>
                        </div>

                        <h4 className="text-lg font-semibold text-navy-900 mb-3">
                          {act.title || act.type}
                        </h4>

                        {/* DESCRIPCIÓN COMPLETA */}
                        <div className="prose prose-sm max-w-none">
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {act.descripcion || act.title || 'No hay descripción disponible'}
                          </p>
                        </div>

                        {/* Información adicional si existe */}
                        {(act.anotacion || act.archivo) && (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            {act.anotacion && (
                              <div className="text-xs text-slate-600 mb-2">
                                <span className="font-semibold">Anotación:</span> {act.anotacion}
                              </div>
                            )}
                            {act.archivo && (
                              <div className="text-xs text-slate-600 flex items-center">
                                <FileText className="w-3 h-3 mr-1" />
                                <span className="font-semibold">Archivo:</span>
                                <span className="ml-1">{act.archivo}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500">No hay actuaciones registradas</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Partes */}
        {caseData.parties?.length > 0 && (
          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden sticky top-6">
              <div className="bg-navy-50 border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-navy-900 flex items-center">
                  <User className="w-5 h-5 mr-2 text-gold-500" />
                  Partes del Proceso
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {caseData.parties.map((party, index) => (
                    <div
                      key={index}
                      className="pb-4 border-b border-slate-200 last:border-0 last:pb-0 hover:bg-slate-50 -mx-2 px-2 py-2 rounded transition-colors"
                    >
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center mr-3 flex-shrink-0">
                          <User className="w-4 h-4 text-navy-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-gold-600 uppercase tracking-wide mb-1">
                            {party.role || "Parte"}
                          </div>
                          <div className="text-sm font-semibold text-navy-900 mb-1 break-words">
                            {party.name || "—"}
                          </div>
                          {party.documento && (
                            <div className="text-xs text-slate-500 flex items-center">
                              <FileText className="w-3 h-3 mr-1" />
                              Doc: {party.documento}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
