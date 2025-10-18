
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCase, markRead, markViewed, refreshCase } from "../lib/api";
import MainLayout from '../components/Layout/MainLayout';
import CaseAttachments from '../components/CaseAttachments';
import CaseHeaderCards from '../components/cases/CaseHeaderCards';
import ActsListCompact from '../components/cases/ActsListCompact';
import {
  Calendar, User, FileText, Scale, AlertCircle, RefreshCw
} from 'lucide-react';

export default function CaseDetail() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [err, setErr] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!id) return;
    getCase(id)
      .then((data) => {
        console.log('Case data received:', data);
        setCaseData(data);
        // Auto-marcar como leído
        if (data.has_unread) {
          markRead(id).catch(console.error);
        }
        // Marcar como visto (actualiza last_viewed_at)
        markViewed(id).catch(console.error);
      })
      .catch((e) => {
        console.error('Error loading case:', e);
        setErr(e.message);
      });
  }, [id]);

  // Auto-refresh si el caso está siendo procesado
  useEffect(() => {
    if (!caseData || !id) return;

    const isPending = !caseData.estado_checked ||
                     caseData.estado_actual?.includes('Buscando') ||
                     caseData.estado_actual?.includes('buscando');

    if (!isPending) return;

    const interval = setInterval(() => {
      getCase(id)
        .then((data) => {
          setCaseData(data);
        })
        .catch(console.error);
    }, 3000);

    return () => clearInterval(interval);
  }, [id, caseData?.estado_checked, caseData?.estado_actual]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshCase(id);
      // Recargar el caso después del refresh
      const data = await getCase(id);
      setCaseData(data);
    } catch (error) {
      console.error("Error refreshing case:", error);
      setErr("Error al reintentar: " + error.message);
    } finally {
      setRefreshing(false);
    }
  };

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
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-3xl font-bold text-navy-900 flex items-center">
            <Scale className="w-8 h-8 mr-3 text-gold-500" />
            Proceso {caseData.radicado}
          </h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-5 py-2.5 bg-navy-600 hover:bg-navy-700 disabled:bg-slate-400 text-white rounded-lg shadow-md hover:shadow-lg transition-all font-medium text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualizando...' : 'Refrescar caso'}
          </button>
        </div>
      </div>

      {/* Banner de caso en procesamiento */}
      {(!caseData.estado_checked || caseData.estado_actual?.includes('Buscando')) && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-lg mb-6">
          <div className="flex items-center">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
            <div>
              <p className="font-semibold">Procesando información del caso</p>
              <p className="text-sm text-blue-700 mt-1">
                Estamos obteniendo los datos desde la Rama Judicial. Esto puede tardar unos segundos.
                La página se actualizará automáticamente.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alert de actualizaciones sin leer */}
      {caseData.has_unread && caseData.estado_checked && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-lg mb-6">
          <div className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Este caso tiene actualizaciones sin leer
          </div>
        </div>
      )}

      {/* Header Cards con datos del proceso */}
      <CaseHeaderCards caseData={caseData} />

      {/* Sujetos Procesales */}
      {caseData.parties && caseData.parties.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-navy-50 to-navy-100 border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-navy-900 flex items-center">
              <User className="w-5 h-5 mr-2 text-gold-500" />
              Sujetos Procesales ({caseData.parties.length})
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {caseData.parties.map((party, index) => (
                <div
                  key={party.id || index}
                  className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center mr-3 flex-shrink-0">
                      <User className="w-5 h-5 text-navy-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gold-600 uppercase tracking-wide mb-1">
                        {party.rol || party.role || "Parte"}
                      </div>
                      <div className="text-sm font-semibold text-navy-900 mb-1 break-words">
                        {party.nombre || party.name || "—"}
                      </div>
                      {party.documento && (
                        <div className="text-xs text-slate-500 flex items-center mt-1">
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
      )}

      {/* Actuaciones - Lista completa */}
      <div>
        <div className="bg-navy-50 border border-slate-200 rounded-lg px-6 py-4 mb-4">
          <h2 className="text-lg font-semibold text-navy-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-gold-500" />
            Actuaciones ({caseData.acts?.length || 0})
          </h2>
        </div>

        {caseData.acts && caseData.acts.length > 0 ? (
          <ActsListCompact acts={caseData.acts} />
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-600">
              {caseData.estado_checked === false || caseData.estado_actual?.includes('Buscando')
                ? 'Cargando actuaciones...'
                : 'No hay actuaciones registradas'}
            </p>
          </div>
        )}
      </div>

      {/* Archivos Adjuntos */}
      <CaseAttachments caseId={id} />
    </MainLayout>
  );
}
