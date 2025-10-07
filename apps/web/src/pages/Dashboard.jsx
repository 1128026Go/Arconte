import React, { useState, useEffect } from "react";
import { listCases, getNotificationStats } from "../lib/api";
import MainLayout from "../components/Layout/MainLayout";
import {
  Folder, Bell, AlertTriangle, Calendar,
  TrendingUp, TrendingDown
} from 'lucide-react';
import { BarChart3, FileText, ArrowRight } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Dashboard() {
  const [stats, setStats] = useState({ unread: 0, high_priority: 0, today: 0 });
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const [casesData, statsData] = await Promise.all([
        listCases(),
        getNotificationStats()
      ]);
      setCases(casesData);
      setStats(statsData ?? { unread: 0, high_priority: 0, today: 0 });
    } catch (error) {
      console.error("Error loading dashboard:", error);
      setCases([]);
      setStats({ unread: 0, high_priority: 0, today: 0 });
    } finally {
      setLoading(false);
    }
  }
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900 mb-4"></div>
            <p className="text-slate-600">Cargando dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Generar datos de actividad simulados (Ultimos 7 dias)
  function generateActivityData() {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      data.push({
        date: format(date, 'dd/MM', { locale: es }),
        casos: Math.floor(Math.random() * 5) + 1
      });
    }
    return data;
  }

  // Obtener distribucion por estado de casos
  function getStatusDistribution() {
    const statuses = cases.reduce((acc, c) => {
      const estado = c.estado || 'Sin estado';
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">Resumen de actividad y metricas principales</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1 - Total Casos */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 mb-1">Total Casos</p>
              <h3 className="text-3xl font-bold text-navy-900">{cases.length}</h3>
              <div className="flex items-center gap-1 mt-2 text-sm font-medium text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span>12%</span>
                <span className="text-slate-500">vs mes anterior</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
              <Folder className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Card 2 - Notificaciones */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 mb-1">Notificaciones</p>
              <h3 className="text-3xl font-bold text-navy-900">{stats?.unread || 0}</h3>
              <p className="text-sm text-slate-500 mt-2">No leidas</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Bell className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Card 3 - Alta Prioridad */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 mb-1">Alta Prioridad</p>
              <h3 className="text-3xl font-bold text-navy-900">{stats?.high_priority || 0}</h3>
              <p className="text-sm text-slate-500 mt-2">Requieren atencion</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Card 4 - Hoy */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 mb-1">Hoy</p>
              <h3 className="text-3xl font-bold text-navy-900">{stats?.today || 0}</h3>
              <p className="text-sm text-slate-500 mt-2">Actualizaciones</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Activity Chart */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center mb-6">
            <TrendingUp className="w-5 h-5 text-gold-500 mr-2" />
            <h3 className="text-lg font-semibold text-navy-900">
              Actividad de Casos
            </h3>
          </div>
          <p className="text-sm text-slate-600 mb-4">Ultimos 7 dias</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={generateActivityData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#64748b' }}
                stroke="#cbd5e1"
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748b' }}
                stroke="#cbd5e1"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
              <Line
                type="monotone"
                dataKey="casos"
                stroke="#334155"
                strokeWidth={2}
                dot={{ fill: '#d4af37', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution Chart */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center mb-6">
            <BarChart3 className="w-5 h-5 text-gold-500 mr-2" />
            <h3 className="text-lg font-semibold text-navy-900">
              Distribucion por Estado
            </h3>
          </div>
          <p className="text-sm text-slate-600 mb-4">Estado actual de casos</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={getStatusDistribution()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {getStatusDistribution().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Cases */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center mb-6">
          <FileText className="w-5 h-5 text-gold-500 mr-2" />
          <h2 className="text-xl font-semibold text-navy-900">
            Casos Recientes
          </h2>
        </div>
        <div className="divide-y divide-slate-200">
          {cases.slice(0, 5).map(c => (
            <CaseRow key={c.id} case={c} />
          ))}
        </div>
        {cases.length > 5 && (
          <div className="mt-6 text-center">
            <a
              href="/cases"
              className="inline-flex items-center text-navy-700 hover:text-gold-500 font-medium text-sm transition-colors"
            >
              Ver todos los casos
              <ArrowRight className="w-4 h-4 ml-1" />
            </a>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

// Colores para grafico de pie - Paleta navy/gold
const COLORS = ['#334155', '#d4af37', '#64748b', '#dc2626', '#475569', '#f59e0b'];

// Label personalizado para el grafico de pie
const renderCustomLabel = ({ name, percent }) => {
  return `${name}: ${(percent * 100).toFixed(0)}%`;
};

function CaseRow({ case: c }) {
  return (
    <div className="py-4 flex items-center justify-between hover:bg-slate-50 transition-colors px-2 -mx-2 rounded">
      <div className="flex-1">
        <div className="font-semibold text-navy-900 mb-1">
          {c.radicado}
        </div>
        <div className="text-sm text-slate-600">
          {c.tipo_proceso || "Sin tipo"} - {c.despacho || "Sin despacho"}
        </div>
      </div>
      <a
        href={`/cases/${c.id}`}
        className="px-4 py-2 bg-slate-100 hover:bg-navy-50 text-navy-700 rounded-md text-sm font-medium transition-colors"
      >
        Ver detalles
      </a>
    </div>
  );
}









