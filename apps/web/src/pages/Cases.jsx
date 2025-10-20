import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { listCases, createCase, markRead, cases } from "../lib/api";
import { fmtDate } from "../lib/date";
import { normalizeList } from '../lib/caseMap';
import MainLayout from '../components/Layout/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Search, Filter, Plus, FileText, MapPin, Calendar, TrendingUp, X, Trash2, AlertTriangle } from 'lucide-react';
import { staggerContainer, staggerItem, fadeInUp } from "../utils/animations";

export default function CasesPage() {
  const [items, setItems] = useState([]);
  const [radicado, setRadicado] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState("updated"); // updated, radicado, ciudad
  const [showFilters, setShowFilters] = useState(false);

  // Modal de confirmación de eliminación
  const [deleteModal, setDeleteModal] = useState({ show: false, caseId: null, radicado: '' });
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setErr("");
    try {
      const raw = await listCases();
      setItems(normalizeList(raw));
    }
    catch (e) { setErr(e.message); }
  }

  useEffect(() => { load(); }, []);

  // Auto-refresh para casos que están siendo procesados
  useEffect(() => {
    const hasPendingCases = items.some(c =>
      !c.estado_checked ||
      c.estado_actual?.includes('Buscando') ||
      c.estado_actual?.includes('buscando')
    );

    if (!hasPendingCases) return;

    const hasWaitingCases = items.some(c => c.estado_actual?.includes('En espera'));
    const intervalMs = hasWaitingCases ? 30000 : 3000;

    const interval = setInterval(() => {
      load();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [items]);

  async function addCase(e) {
    e.preventDefault();
    if (!radicado.trim()) return;
    setSaving(true);
    setErr("");
    try {
      await createCase(radicado.trim());
      setRadicado("");
      const raw = await listCases();
      setItems(normalizeList(raw));
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteModal.caseId) return;

    setDeleting(true);
    setErr("");
    try {
      await cases.delete(deleteModal.caseId);
      // Cerrar modal
      setDeleteModal({ show: false, caseId: null, radicado: '' });
      // Recargar lista
      const raw = await listCases();
      setItems(normalizeList(raw));
    } catch (e) {
      setErr(e.message);
    } finally {
      setDeleting(false);
    }
  }

  // Extraer ciudades y tipos únicos para los filtros
  const cities = useMemo(() => {
    const citySet = new Set();
    items.forEach(c => {
      if (c.despacho) {
        // Extraer ciudad del despacho (formato: "Ciudad - Despacho" o "Juzgado de ... - Ciudad")
        const parts = c.despacho.split('-');
        if (parts.length > 0) {
          const city = parts[0].trim();
          citySet.add(city);
        }
      }
    });
    return Array.from(citySet).sort();
  }, [items]);

  const processTypes = useMemo(() => {
    const typeSet = new Set();
    items.forEach(c => {
      if (c.tipo_proceso) typeSet.add(c.tipo_proceso);
    });
    return Array.from(typeSet).sort();
  }, [items]);

  // Casos filtrados y ordenados
  const filteredCases = useMemo(() => {
    let filtered = items.filter(c => {
      // Búsqueda por radicado, partes, etc.
      const matchSearch = !searchTerm ||
        c.radicado?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.despacho?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.tipo_proceso?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.parties?.some(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filtro por ciudad
      const matchCity = !filterCity || c.despacho?.includes(filterCity);

      // Filtro por tipo de proceso
      const matchType = !filterType || c.tipo_proceso === filterType;

      // Filtro por estado
      const matchStatus = !filterStatus ||
        (filterStatus === 'unread' && c.has_unread) ||
        (filterStatus === 'read' && !c.has_unread);

      return matchSearch && matchCity && matchType && matchStatus;
    });

    // Ordenar
    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'radicado':
          return (a.radicado || '').localeCompare(b.radicado || '');
        case 'ciudad':
          return (a.despacho || '').localeCompare(b.despacho || '');
        case 'tipo':
          return (a.tipo_proceso || '').localeCompare(b.tipo_proceso || '');
        case 'updated':
        default:
          return new Date(b.updated_at) - new Date(a.updated_at);
      }
    });

    return filtered;
  }, [items, searchTerm, filterCity, filterType, filterStatus, sortBy]);

  // Contador de filtros activos
  const activeFiltersCount = [filterCity, filterType, filterStatus].filter(Boolean).length;

  return (
    <MainLayout>
      {/* Header */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Procesos</h1>
        <p className="text-gray-600">Gestiona y consulta todos tus casos judiciales</p>
      </motion.div>

      {/* Formulario agregar caso */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
      <Card className="mb-6 p-6 card-glass">
        <h2 className="text-lg font-semibold text-navy-900 mb-4">Agregar Nuevo Caso</h2>
        <form onSubmit={addCase} className="flex gap-3">
          <div className="flex-1">
            <input
              value={radicado}
              onChange={e => setRadicado(e.target.value)}
              placeholder="Ej: 73001600045020220057700"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              Radicados de prueba: 11001400300120230012300 | 76001310300120240001234 | 05001330300120230098765
            </p>
          </div>
          <Button
            type="submit"
            disabled={saving}
            className="bg-gold-500 hover:bg-gold-600 text-white px-6 disabled:opacity-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            {saving ? "Agregando..." : "Agregar"}
          </Button>
        </form>
        {err && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {err}
          </div>
        )}
      </Card>
      </motion.div>

      {/* Barra de búsqueda y filtros */}
      <Card className="mb-6 p-4 card-glass">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por radicado, ciudad, partes..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            />
          </div>

          {/* Botón filtros */}
          <Button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 ${showFilters ? 'bg-gold-500 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-gold-600 text-white text-xs rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          {/* Ordenar */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none bg-white"
          >
            <option value="updated">Más recientes</option>
            <option value="radicado">Radicado (A-Z)</option>
            <option value="ciudad">Ciudad (A-Z)</option>
            <option value="tipo">Tipo de proceso</option>
          </select>
        </div>

        {/* Panel de filtros expandible */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro por ciudad */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Ciudad/Despacho
              </label>
              <select
                value={filterCity}
                onChange={e => setFilterCity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
              >
                <option value="">Todas las ciudades</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Filtro por tipo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Tipo de Proceso
              </label>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
              >
                <option value="">Todos los tipos</option>
                {processTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Filtro por estado */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <TrendingUp className="w-4 h-4 inline mr-1" />
                Estado
              </label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
              >
                <option value="">Todos</option>
                <option value="unread">Con novedades</option>
                <option value="read">Sin novedades</option>
              </select>
            </div>

            {/* Botón limpiar filtros */}
            {activeFiltersCount > 0 && (
              <div className="md:col-span-3 flex justify-end">
                <Button
                  onClick={() => {
                    setFilterCity('');
                    setFilterType('');
                    setFilterStatus('');
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpiar filtros
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Contador de resultados */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Mostrando <span className="font-semibold text-navy-900">{filteredCases.length}</span> de{' '}
          <span className="font-semibold text-navy-900">{items.length}</span> casos
        </p>
        {filteredCases.length > 0 && items.length > 0 && filteredCases.length < items.length && (
          <Button
            onClick={() => {
              setSearchTerm('');
              setFilterCity('');
              setFilterType('');
              setFilterStatus('');
            }}
            className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            Ver todos
          </Button>
        )}
      </div>

      {/* Lista de casos */}
      {filteredCases.length === 0 ? (
        <Card className="p-12 text-center empty-state card-glass">
          <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            {items.length === 0 ? 'No tienes casos registrados' : 'No se encontraron casos'}
          </h3>
          <p className="text-slate-500 mb-4">
            {items.length === 0
              ? 'Agrega tu primer caso usando el formulario de arriba'
              : 'Intenta ajustar los filtros o la búsqueda'
            }
          </p>
          {items.length > 0 && (
            <Button
              onClick={() => {
                setSearchTerm('');
                setFilterCity('');
                setFilterType('');
                setFilterStatus('');
              }}
              className="bg-gold-500 hover:bg-gold-600 text-white"
            >
              Limpiar filtros
            </Button>
          )}
        </Card>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid gap-4"
        >
          {filteredCases.map(c => (
            <motion.div key={c.id} variants={staggerItem}>
            <Card className="p-5 card-glass hover:scale-[1.01] transition-transform duration-200">
              {/* Header del caso */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Link
                      to={`/cases/${c.id}`}
                      className="text-xl font-bold text-navy-900 hover:text-gold-600 transition-colors"
                    >
                      {c.radicado}
                    </Link>
                    {c.has_unread && (
                      <span className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                        NUEVO
                      </span>
                    )}
                    {(!c.estado_checked || c.estado_actual?.includes('Buscando') || c.estado_actual?.includes('buscando')) && (
                      <span className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Procesando...
                      </span>
                    )}
                  </div>
                  {c.tipo_proceso && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <FileText className="w-4 h-4" />
                      <span className="font-medium">{c.tipo_proceso}</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {fmtDate(c.updated_at)}
                  </div>
                </div>
              </div>

              {/* Despacho/Ciudad */}
              {c.despacho && (
                <div className="flex items-center gap-2 mb-3 text-sm">
                  <MapPin className="w-4 h-4 text-gold-500" />
                  <span className="text-slate-700">{c.despacho}</span>
                </div>
              )}

              {/* Estado */}
              {c.status && (
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
                    {c.status}
                  </span>
                </div>
              )}

              {/* Partes */}
              {c.parties?.length > 0 && (
                <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Partes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {c.parties.slice(0, 4).map((p, i) => (
                      <div key={i} className="text-sm text-slate-600">
                        <span className="font-medium">{p.role || 'Parte'}:</span>{' '}
                        {p.name || '—'}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actuaciones recientes */}
              {c.acts?.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">
                    Últimas Actuaciones ({c.acts.length})
                  </h4>
                  <div className="space-y-2">
                    {c.acts.slice(0, 3).map((a, i) => (
                      <div key={i} className="text-sm">
                        <div className="flex items-start gap-2">
                          <Calendar className="w-3 h-3 text-blue-500 mt-0.5" />
                          <div className="flex-1">
                            <span className="font-medium text-blue-900">{fmtDate(a.date)}</span>
                            {' — '}
                            <span className="text-slate-700">{a.title || 'Actuación'}</span>
                            {a.type && (
                              <span className="ml-2 text-xs text-slate-500">({a.type})</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {c.acts.length > 3 && (
                      <p className="text-xs text-slate-500 mt-2">
                        + {c.acts.length - 3} actuaciones más
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
                <Link
                  to={`/cases/${c.id}`}
                  className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Ver detalles
                </Link>
                {c.has_unread && (
                  <Button
                    onClick={async () => {
                      try {
                        await markRead(c.id);
                        const raw = await listCases();
                        setItems(normalizeList(raw));
                      } catch(e) {
                        setErr(e.message);
                      }
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
                  >
                    Marcar como leído
                  </Button>
                )}
                <Button
                  onClick={() => setDeleteModal({ show: true, caseId: c.id, radicado: c.radicado })}
                  className="ml-auto px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Modal de confirmación de eliminación */}
      <AnimatePresence>
      {deleteModal.show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
          <Card className="max-w-md w-full p-6 glass">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-navy-900 mb-2">
                  ¿Eliminar caso?
                </h3>
                <p className="text-slate-600 text-sm mb-2">
                  Estás a punto de eliminar el caso:
                </p>
                <p className="font-mono font-bold text-navy-900 mb-2">
                  {deleteModal.radicado}
                </p>
                <p className="text-slate-600 text-sm">
                  Esta acción no se puede deshacer. Se eliminarán todas las partes y actuaciones asociadas.
                </p>
              </div>
            </div>

            {err && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {err}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setDeleteModal({ show: false, caseId: null, radicado: '' })}
                disabled={deleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Eliminar caso'}
              </Button>
            </div>
          </Card>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </MainLayout>
  );
}
