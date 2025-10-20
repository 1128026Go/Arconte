import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MainLayout from '../components/Layout/MainLayout';
import {
  Users, TrendingUp, Mail, CheckCircle, Clock, XCircle,
  Calendar, BarChart3, ArrowRight, Download, Filter, Search
} from 'lucide-react';
import { staggerContainer, staggerItem, fadeInUp } from '../utils/animations';

export default function MarketingDashboard() {
  const [signups, setSignups] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    contacted: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, contacted
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSignups();
  }, []);

  const loadSignups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/beta-signups', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSignups(data.data || []);
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error loading signups:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`/api/beta-signups/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        loadSignups();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const exportCSV = () => {
    const headers = ['Nombre', 'Email', 'Teléfono', 'Firma', 'Casos', 'Origen', 'Estado', 'Fecha'];
    const rows = filteredSignups.map(s => [
      s.name,
      s.email,
      s.phone || '',
      s.firm,
      s.case_volume,
      s.hear_about || '',
      s.status,
      new Date(s.created_at).toLocaleDateString()
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beta-signups-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredSignups = signups.filter(s => {
    const matchesFilter = filter === 'all' || s.status === filter;
    const matchesSearch = searchTerm === '' ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.firm.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Analytics por origen
  const sourceStats = signups.reduce((acc, s) => {
    const source = s.hear_about || 'Desconocido';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});

  // Analytics por volumen de casos
  const caseVolumeStats = signups.reduce((acc, s) => {
    acc[s.case_volume] = (acc[s.case_volume] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="loading-spinner" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Marketing Dashboard</h1>
            <p className="text-gray-600">Gestiona tus beta testers y analiza métricas</p>
          </div>
          <button
            onClick={exportCSV}
            className="btn-dashboard btn-dashboard-primary"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
        >
          <motion.div variants={staggerItem} className="stat-card">
            <div className="stat-icon bg-blue-50">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <p className="stat-label">Total Signups</p>
            <h3 className="stat-value">{stats.total}</h3>
            <div className="stat-trend up mt-2">
              <TrendingUp className="w-4 h-4" />
              <span>de 50 meta</span>
            </div>
          </motion.div>

          <motion.div variants={staggerItem} className="stat-card">
            <div className="stat-icon bg-yellow-50">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="stat-label">Pendientes</p>
            <h3 className="stat-value">{stats.pending}</h3>
          </motion.div>

          <motion.div variants={staggerItem} className="stat-card">
            <div className="stat-icon bg-green-50">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="stat-label">Aprobados</p>
            <h3 className="stat-value">{stats.approved}</h3>
          </motion.div>

          <motion.div variants={staggerItem} className="stat-card">
            <div className="stat-icon bg-purple-50">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
            <p className="stat-label">Contactados</p>
            <h3 className="stat-value">{stats.contacted}</h3>
          </motion.div>

          <motion.div variants={staggerItem} className="stat-card">
            <div className="stat-icon bg-red-50">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <p className="stat-label">Rechazados</p>
            <h3 className="stat-value">{stats.rejected || 0}</h3>
          </motion.div>
        </motion.div>

        {/* Analytics Charts */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Source Distribution */}
          <motion.div variants={staggerItem} className="card-glass card-bordered p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-blue" />
              Origen de Leads
            </h3>
            <div className="space-y-3">
              {Object.entries(sourceStats).map(([source, count]) => (
                <div key={source} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{source}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{ width: `${(count / stats.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Case Volume Distribution */}
          <motion.div variants={staggerItem} className="card-glass card-bordered p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-blue" />
              Volumen de Casos
            </h3>
            <div className="space-y-3">
              {Object.entries(caseVolumeStats).map(([volume, count]) => (
                <div key={volume} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{volume} casos</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        style={{ width: `${(count / stats.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Filters & Search */}
        <div className="card-glass p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, email o firma..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos ({stats.total})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pendientes ({stats.pending})
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'approved'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Aprobados ({stats.approved})
              </button>
              <button
                onClick={() => setFilter('contacted')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'contacted'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Contactados ({stats.contacted})
              </button>
            </div>
          </div>
        </div>

        {/* Signups Table */}
        <div className="card-glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Firma</th>
                  <th>Casos</th>
                  <th>Origen</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredSignups.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12">
                      <div className="empty-state">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                          No hay signups
                        </h3>
                        <p className="text-gray-500">
                          {searchTerm || filter !== 'all'
                            ? 'Intenta ajustar los filtros'
                            : 'Los beta testers aparecerán aquí'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSignups.map((signup) => (
                    <motion.tr
                      key={signup.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <td className="font-medium">{signup.name}</td>
                      <td className="text-sm text-gray-600">
                        <a href={`mailto:${signup.email}`} className="hover:text-blue-600">
                          {signup.email}
                        </a>
                      </td>
                      <td className="text-sm">{signup.firm}</td>
                      <td className="text-sm">{signup.case_volume}</td>
                      <td className="text-sm capitalize">{signup.hear_about || '—'}</td>
                      <td className="text-sm text-gray-500">
                        {new Date(signup.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <span className={`badge ${
                          signup.status === 'pending' ? 'badge-warning' :
                          signup.status === 'approved' ? 'badge-success' :
                          signup.status === 'contacted' ? 'badge-info' :
                          'badge-danger'
                        }`}>
                          {signup.status}
                        </span>
                      </td>
                      <td>
                        <select
                          value={signup.status}
                          onChange={(e) => updateStatus(signup.id, e.target.value)}
                          className="text-sm px-2 py-1 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="pending">Pendiente</option>
                          <option value="approved">Aprobado</option>
                          <option value="contacted">Contactado</option>
                          <option value="rejected">Rechazado</option>
                        </select>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="card-glass p-6"
        >
          <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition group">
              <Mail className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mb-2" />
              <h4 className="font-semibold">Email a Pendientes</h4>
              <p className="text-sm text-gray-600">Enviar recordatorio automático</p>
            </button>

            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition group">
              <CheckCircle className="w-8 h-8 text-gray-400 group-hover:text-green-600 mb-2" />
              <h4 className="font-semibold">Aprobar en Masa</h4>
              <p className="text-sm text-gray-600">Aprobar todos los pendientes</p>
            </button>

            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition group">
              <Download className="w-8 h-8 text-gray-400 group-hover:text-purple-600 mb-2" />
              <h4 className="font-semibold">Generar Reporte</h4>
              <p className="text-sm text-gray-600">Informe completo PDF</p>
            </button>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
