import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { analytics } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import MainLayout from '../components/Layout/MainLayout';
import { BarChart3, TrendingUp, TrendingDown, Users, FileText, DollarSign, Clock, Calendar } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { staggerContainer, staggerItem, fadeInUp } from '../utils/animations';

export default function Analytics() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({});
  const [casesData, setCasesData] = useState([]);
  const [timeData, setTimeData] = useState([]);
  const [documentsData, setDocumentsData] = useState([]);

  async function loadAnalytics() {
    setLoading(true);
    setError('');
    try {
      const [dashboard, cases, time, documents] = await Promise.all([
        analytics.dashboard(),
        analytics.cases(),
        analytics.time(),
        analytics.documents()
      ]);
      
      setDashboardData(dashboard || {});
      setCasesData(Array.isArray(cases) ? cases : cases?.data || []);
      setTimeData(Array.isArray(time) ? time : time?.data || []);
      setDocumentsData(Array.isArray(documents) ? documents : documents?.data || []);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  // Datos simulados para demo si no hay datos del API
  const mockKpis = [
    { label: 'Casos Activos', value: dashboardData.active_cases || 24, delta: 8.2, icon: FileText, color: 'blue' },
    { label: 'Horas Facturables', value: dashboardData.billable_hours || 156, delta: 12.5, icon: Clock, color: 'green' },
    { label: 'Ingresos del Mes', value: dashboardData.monthly_revenue || 2450000, delta: -3.1, icon: DollarSign, color: 'purple' },
    { label: 'Documentos Subidos', value: dashboardData.documents_count || 89, delta: 15.3, icon: FileText, color: 'orange' }
  ];

  const mockCasesChart = casesData.length > 0 ? casesData : [
    { month: 'Ene', cases: 12, resolved: 8 },
    { month: 'Feb', cases: 15, resolved: 12 },
    { month: 'Mar', cases: 18, resolved: 14 },
    { month: 'Abr', cases: 22, resolved: 19 },
    { month: 'May', cases: 17, resolved: 15 },
    { month: 'Jun', cases: 24, resolved: 20 }
  ];

  const mockTimeChart = timeData.length > 0 ? timeData : [
    { day: 'Lun', hours: 8.5 },
    { day: 'Mar', hours: 7.2 },
    { day: 'Mié', hours: 9.1 },
    { day: 'Jue', hours: 6.8 },
    { day: 'Vie', hours: 8.0 },
    { day: 'Sab', hours: 4.5 },
    { day: 'Dom', hours: 2.0 }
  ];

  const mockDocumentTypes = documentsData.length > 0 ? documentsData : [
    { name: 'PDF', value: 45, color: '#dc2626' },
    { name: 'Word', value: 30, color: '#2563eb' },
    { name: 'Excel', value: 15, color: '#16a34a' },
    { name: 'Imágenes', value: 10, color: '#ca8a04' }
  ];

  const COLORS = ['#dc2626', '#2563eb', '#16a34a', '#ca8a04', '#7c3aed', '#db2777'];

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
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600">Métricas y estadísticas del sistema</p>
          </div>
          <Button onClick={loadAnalytics} className="flex items-center gap-2 btn-dashboard btn-dashboard-primary">
            <BarChart3 className="h-4 w-4" />
            Refrescar Datos
          </Button>
        </motion.div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {/* KPI Cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 md:grid-cols-4"
        >
          {mockKpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            const isPositive = kpi.delta >= 0;
            return (
              <motion.div key={idx} variants={staggerItem}>
              <Card className="stat-card">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 bg-${kpi.color}-100`}>
                    <Icon className={`h-5 w-5 text-${kpi.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">{kpi.label}</p>
                    <p className="text-2xl font-bold">
                      {typeof kpi.value === 'number' && kpi.label.includes('Ingresos') 
                        ? formatMoney(kpi.value)
                        : formatNumber(kpi.value)
                      }
                    </p>
                    <div className={`flex items-center text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(kpi.delta)}% vs mes anterior
                    </div>
                  </div>
                </div>
              </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Charts Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
          {/* Cases Chart */}
          <motion.div variants={staggerItem}>
          <Card className="card-glass card-bordered">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Casos por Mes</h3>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockCasesChart} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cases" fill="#3b82f6" name="Nuevos Casos" />
                  <Bar dataKey="resolved" fill="#10b981" name="Resueltos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          </motion.div>

          {/* Time Chart */}
          <motion.div variants={staggerItem}>
          <Card className="card-glass card-bordered">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Horas por Día</h3>
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockTimeChart} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} horas`, 'Tiempo trabajado']} />
                  <Line 
                    type="monotone" 
                    dataKey="hours" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          </motion.div>

          {/* Document Types */}
          <motion.div variants={staggerItem}>
          <Card className="card-glass card-bordered">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Tipos de Documentos</h3>
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockDocumentTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {mockDocumentTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
          </motion.div>

          {/* Summary Stats */}
          <motion.div variants={staggerItem}>
          <Card className="card-glass card-bordered">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Resumen Mensual</h3>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Eficiencia de Casos</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 rounded-full bg-gray-200">
                    <div className="h-2 w-20 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-sm font-medium">83%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tiempo Facturable</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 rounded-full bg-gray-200">
                    <div className="h-2 w-18 rounded-full bg-blue-500"></div>
                  </div>
                  <span className="text-sm font-medium">75%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Satisfacción Cliente</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 rounded-full bg-gray-200">
                    <div className="h-2 w-22 rounded-full bg-purple-500"></div>
                  </div>
                  <span className="text-sm font-medium">92%</span>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Promedio facturas/mes:</span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tiempo promedio/caso:</span>
                  <span className="font-medium">8.5 horas</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Documentos por caso:</span>
                  <span className="font-medium">3.7</span>
                </div>
              </div>
            </div>
          </Card>
          </motion.div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <Card>
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              <span className="ml-2">Cargando analytics...</span>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}

function formatNumber(value) {
  if (typeof value === 'number') {
    return value.toLocaleString('es-CO');
  }
  return String(value ?? '');
}

function formatMoney(amount) {
  const value = Number(amount || 0);
  return value.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
}
