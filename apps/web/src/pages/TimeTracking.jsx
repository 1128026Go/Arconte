import React, { useEffect, useState } from 'react';
import { timeTracking } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import MainLayout from '../components/Layout/MainLayout';
import { Clock, Play, Pause, Plus, Trash2, Timer } from 'lucide-react';

export default function TimeTracking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [entries, setEntries] = useState([]);
  const [currentTimer, setCurrentTimer] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState({
    description: '',
    minutes: '',
    date: new Date().toISOString().slice(0, 10),
    billable_rate: ''
  });

  async function loadEntries() {
    setLoading(true);
    setError('');
    try {
      const [entriesData, timerData] = await Promise.all([
        timeTracking.getAll({ from: dateFrom, to: dateTo }),
        timeTracking.current().catch(() => null)
      ]);
      
      setEntries(Array.isArray(entriesData) ? entriesData : entriesData?.data || []);
      setCurrentTimer(timerData);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function startTimer() {
    try {
      const timer = await timeTracking.start({
        description: 'Nueva sesión de trabajo',
        started_at: new Date().toISOString()
      });
      setCurrentTimer(timer);
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  async function stopTimer() {
    try {
      await timeTracking.stop();
      setCurrentTimer(null);
      await loadEntries(); // Refresh to show new entry
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  async function addQuickEntry(minutes) {
    try {
      await timeTracking.create({
        description: `Entrada rápida - ${minutes} minutos`,
        minutes: minutes,
        date: new Date().toISOString().slice(0, 10),
        billable_rate: 50000 // Default rate
      });
      await loadEntries();
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  async function addCustomEntry() {
    try {
      await timeTracking.create({
        ...newEntry,
        minutes: parseInt(newEntry.minutes),
        billable_rate: parseFloat(newEntry.billable_rate) || 0
      });
      setNewEntry({
        description: '',
        minutes: '',
        date: new Date().toISOString().slice(0, 10),
        billable_rate: ''
      });
      setShowAddModal(false);
      await loadEntries();
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  async function deleteEntry(id) {
    if (!confirm('¿Estás seguro de eliminar esta entrada?')) return;
    
    try {
      await timeTracking.delete(id);
      await loadEntries();
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  useEffect(() => {
    loadEntries();
  }, [dateFrom, dateTo]);

  const totalMinutes = entries.reduce((sum, entry) => sum + (entry.minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const totalEarnings = entries.reduce((sum, entry) => 
    sum + ((entry.minutes || 0) / 60 * (entry.billable_rate || 0)), 0
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Control de Tiempo</h1>
            <p className="text-gray-600">Registra y gestiona tu tiempo de trabajo</p>
          </div>
          <div className="flex gap-2">
            {currentTimer ? (
              <Button variant="danger" onClick={stopTimer} className="flex items-center gap-2">
                <Pause className="h-4 w-4" />
                Detener Timer
              </Button>
            ) : (
              <Button onClick={startTimer} className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Iniciar Timer
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Agregar Entrada
            </Button>
          </div>
        </div>

        {/* Current Timer */}
        {currentTimer && (
          <Card className="border-blue-200 bg-blue-50">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Timer className="h-5 w-5 text-blue-600 animate-pulse" />
              </div>
              <div>
                <p className="font-medium text-blue-900">Timer Activo</p>
                <p className="text-sm text-blue-700">{currentTimer.description}</p>
                <p className="text-xs text-blue-600">
                  Iniciado: {formatDateTime(currentTimer.started_at)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Horas Totales</p>
                <p className="text-2xl font-bold">{totalHours}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Timer className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Entradas</p>
                <p className="text-2xl font-bold">{entries.length}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <div className="h-5 w-5 text-purple-600">$</div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ingresos Estimados</p>
                <p className="text-2xl font-bold">{formatMoney(totalEarnings)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <Input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-40"
                placeholder="Desde"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-40"
                placeholder="Hasta"
              />
              <Button variant="outline" onClick={loadEntries}>
                Filtrar
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => addQuickEntry(15)}>
                + 15 min
              </Button>
              <Button variant="outline" onClick={() => addQuickEntry(30)}>
                + 30 min
              </Button>
              <Button variant="outline" onClick={() => addQuickEntry(60)}>
                + 1 hora
              </Button>
            </div>
          </div>
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {/* Time Entries Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-600">
                  <th className="py-3 font-medium">Fecha</th>
                  <th className="py-3 font-medium">Descripción</th>
                  <th className="py-3 font-medium">Duración</th>
                  <th className="py-3 font-medium">Tarifa/Hora</th>
                  <th className="py-3 font-medium">Total</th>
                  <th className="py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td className="py-8 text-center" colSpan={6}>
                      <div className="flex items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                        <span className="ml-2">Cargando entradas...</span>
                      </div>
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td className="py-8 text-center text-gray-500" colSpan={6}>
                      No se encontraron entradas de tiempo
                    </td>
                  </tr>
                ) : (
                  entries.map(entry => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="py-3">{formatDate(entry.date)}</td>
                      <td className="py-3">
                        <div className="max-w-xs truncate" title={entry.description}>
                          {entry.description}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="font-medium">
                          {formatDuration(entry.minutes)}
                        </span>
                      </td>
                      <td className="py-3">{formatMoney(entry.billable_rate || 0)}</td>
                      <td className="py-3 font-medium">
                        {formatMoney(((entry.minutes || 0) / 60) * (entry.billable_rate || 0))}
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          variant="ghost"
                          onClick={() => deleteEntry(entry.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="Eliminar entrada"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add Entry Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-lg bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold">Agregar Entrada de Tiempo</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <Input
                    value={newEntry.description}
                    onChange={e => setNewEntry({ ...newEntry, description: e.target.value })}
                    placeholder="Descripción del trabajo realizado"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Minutos</label>
                  <Input
                    type="number"
                    value={newEntry.minutes}
                    onChange={e => setNewEntry({ ...newEntry, minutes: e.target.value })}
                    placeholder="60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha</label>
                  <Input
                    type="date"
                    value={newEntry.date}
                    onChange={e => setNewEntry({ ...newEntry, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tarifa por Hora (COP)</label>
                  <Input
                    type="number"
                    value={newEntry.billable_rate}
                    onChange={e => setNewEntry({ ...newEntry, billable_rate: e.target.value })}
                    placeholder="50000"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={addCustomEntry}>
                  Agregar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('es-CO');
}

function formatDateTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? dateString : date.toLocaleString('es-CO');
}

function formatDuration(minutes) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
}

function formatMoney(amount) {
  const value = Number(amount || 0);
  return value.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
}
