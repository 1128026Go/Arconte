import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { listCases, getNotificationStats } from "../lib/api";
import MainLayout from "../components/Layout/MainLayout";
import { Link } from "react-router-dom";
import {
  Folder, Bell, AlertTriangle, Calendar,
  TrendingUp, TrendingDown, Crown, Zap
} from 'lucide-react';
import { BarChart3, FileText, ArrowRight } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { staggerContainer, staggerItem, fadeInUp } from "../utils/animations";
import ChatBot from "../components/ChatBot";

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
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando dashboard...</p>
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
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-primary-900 mb-2">Dashboard</h1>
        <p className="text-primary-600">Resumen de actividad y métricas principales</p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {/* Card 1 - Total Casos */}
        <motion.div variants={staggerItem} className="stat-card">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="stat-label">Total Casos</p>
              <h3 className="stat-value">{cases.length}</h3>
              <div className="stat-trend up mt-2">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>12% vs mes anterior</span>
              </div>
            </div>
            <div className="stat-icon bg-primary-50">
              <Folder className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </motion.div>

        {/* Card 2 - Notificaciones */}
        <motion.div variants={staggerItem} className="stat-card">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="stat-label">Notificaciones</p>
              <h3 className="stat-value">{stats?.unread || 0}</h3>
              <p className="stat-label mt-2">No leídas</p>
            </div>
            <div className="stat-icon bg-warning-light/10">
              <Bell className="w-6 h-6 text-warning" />
            </div>
          </div>
        </motion.div>

        {/* Card 3 - Alta Prioridad */}
        <motion.div variants={staggerItem} className="stat-card">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="stat-label">Alta Prioridad</p>
              <h3 className="stat-value">{stats?.high_priority || 0}</h3>
              <p className="stat-label mt-2">Requieren atención</p>
            </div>
            <div className="stat-icon bg-warning/10">
              <AlertTriangle className="w-6 h-6 text-warning-dark" />
            </div>
          </div>
        </motion.div>

        {/* Card 4 - Hoy */}
        <motion.div variants={staggerItem} className="stat-card">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="stat-label">Hoy</p>
              <h3 className="stat-value">{stats?.today || 0}</h3>
              <p className="stat-label mt-2">Actualizaciones</p>
            </div>
            <div className="stat-icon bg-primary-100">
              <Calendar className="w-6 h-6 text-primary-700" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Subscription Promo Banner */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="mb-8"
      >
        <Link to="/subscription" className="block">
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 rounded-xl p-8 shadow-lg group"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
                backgroundSize: '30px 30px'
              }}></div>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <div className="text-white">
                  <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    Potencia tu práctica legal
                    <Zap className="w-6 h-6 text-yellow-300" />
                  </h3>
                  <p className="text-white/90 text-lg">
                    Desbloquea casos ilimitados, IA legal avanzada y más con nuestros planes profesionales
                  </p>
                </div>
              </div>

              <div className="flex-shrink-0">
                <div className="bg-white text-primary-800 px-8 py-4 rounded-lg font-bold text-lg shadow-md group-hover:scale-105 transition-transform flex items-center gap-2">
                  Ver Planes
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </motion.div>
        </Link>
      </motion.div>

      {/* Charts Grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
      >
        {/* Activity Chart */}
        <motion.div variants={staggerItem} className="card-glass card-bordered">
          <div className="flex items-center mb-6">
            <TrendingUp className="w-5 h-5 text-primary-600 mr-2" />
            <h3 className="text-lg font-semibold text-primary-900">
              Actividad de Casos
            </h3>
          </div>
          <p className="text-sm text-primary-600 mb-4">Últimos 7 días</p>
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
                stroke="#475569"
                strokeWidth={3}
                dot={{ fill: '#64748b', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Status Distribution Chart */}
        <motion.div variants={staggerItem} className="card-glass card-bordered">
          <div className="flex items-center mb-6">
            <BarChart3 className="w-5 h-5 text-primary-600 mr-2" />
            <h3 className="text-lg font-semibold text-primary-900">
              Distribución por Estado
            </h3>
          </div>
          <p className="text-sm text-primary-600 mb-4">Estado actual de casos</p>
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
        </motion.div>
      </motion.div>

      {/* Recent Cases */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="card-glass card-bordered"
      >
        <div className="flex items-center mb-6">
          <FileText className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-xl font-semibold text-primary-900">
            Casos Recientes
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {cases.slice(0, 5).map(c => (
            <CaseRow key={c.id} case={c} />
          ))}
        </div>
        {cases.length > 5 && (
          <div className="mt-6 text-center">
            <a
              href="/cases"
              className="inline-flex items-center text-primary-600 hover:text-primary-800 font-medium text-sm transition-colors"
            >
              Ver todos los casos
              <ArrowRight className="w-4 h-4 ml-1" />
            </a>
          </div>
        )}
      </motion.div>

      {/* Chatbot flotante */}
      <ChatBot />
    </MainLayout>
  );
}

// Colores para grafico de pie - Paleta sobria
const COLORS = ['#475569', '#64748b', '#94a3b8', '#78716c', '#57534e', '#a8a29e'];

// Label personalizado para el grafico de pie
const renderCustomLabel = ({ name, percent }) => {
  return `${name}: ${(percent * 100).toFixed(0)}%`;
};

function CaseRow({ case: c }) {
  return (
    <motion.div
      whileHover={{ scale: 1.01, backgroundColor: 'rgba(71, 85, 105, 0.05)' }}
      className="py-4 flex items-center justify-between px-2 -mx-2 rounded transition-colors"
    >
      <div className="flex-1">
        <div className="font-semibold text-primary-900 mb-1">
          {c.radicado}
        </div>
        <div className="text-sm text-primary-600">
          {c.tipo_proceso || "Sin tipo"} - {c.despacho || "Sin despacho"}
        </div>
      </div>
      <a
        href={`/cases/${c.id}`}
        className="px-4 py-2 bg-primary-600/10 hover:bg-primary-600 hover:text-white text-primary-700 rounded-lg text-sm font-medium transition-all"
      >
        Ver detalles
      </a>
    </motion.div>
  );
}
