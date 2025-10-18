import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell, Plus, X, Check, Edit2, Trash2, Calendar as CalIcon, AlertCircle, Clock } from 'lucide-react';
import { reminders } from '../lib/api';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { es };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export default function Reminders() {
  const [allReminders, setAllReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    type: 'audiencia',
    priority: 'media',
    case_id: null
  });

  useEffect(() => { loadReminders(); }, []);

  const loadReminders = async () => {
    try {
      setLoading(true);
      const response = await reminders.getAll();
      setAllReminders(response.data || []);
    } catch (error) {
      // Error silencioso para mejor UX, se puede logear en development
      if (import.meta.env.DEV) {
        console.error('Error loading reminders:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedReminder) {
        await reminders.update(selectedReminder.id, formData);
      } else {
        await reminders.create(formData);
      }
      await loadReminders();
      closeModal();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar?')) return;
    try {
      await reminders.delete(id);
      await loadReminders();
    } catch (error) {
      alert('Error al eliminar');
    }
  };

  const handleComplete = async (id) => {
    try {
      await reminders.markComplete(id);
      await loadReminders();
    } catch (error) {
      alert('Error');
    }
  };

  const openModal = (reminder = null) => {
    if (reminder) {
      setSelectedReminder(reminder);
      setFormData({ ...reminder });
    } else {
      setSelectedReminder(null);
      setFormData({ title: '', description: '', due_date: '', type: 'audiencia', priority: 'media', case_id: null });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedReminder(null);
  };

  const getPriorityDot = (priority) => {
    const colors = { alta: 'bg-red-500', media: 'bg-yellow-500', baja: 'bg-green-500' };
    return colors[priority] || 'bg-gray-500';
  };

  const upcomingReminders = allReminders.filter(r => !r.completed_at && new Date(r.due_date) >= new Date());
  const overdueReminders = allReminders.filter(r => !r.completed_at && new Date(r.due_date) < new Date());
  const completedReminders = allReminders.filter(r => r.completed_at);

  const getActiveReminders = () => {
    switch (activeTab) {
      case 'upcoming': return upcomingReminders;
      case 'overdue': return overdueReminders;
      case 'completed': return completedReminders;
      default: return upcomingReminders;
    }
  };

  const calendarEvents = allReminders
    .filter(r => !r.completed_at)
    .map(r => ({
      id: r.id,
      title: r.title,
      start: new Date(r.due_date),
      end: new Date(r.due_date),
      resource: r
    }));

  const eventStyleGetter = (event) => {
    const colors = { alta: '#dc2626', media: '#f59e0b', baja: '#10b981' };
    return { style: { backgroundColor: colors[event.resource.priority] || '#3174ad', borderRadius: '5px', opacity: 0.8, color: 'white', border: '0px' } };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Recordatorios</h1>
          <p className="text-gray-600">Gestiona tus tareas y plazos</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-5 h-5" /> Nuevo
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Próximos</p>
              <p className="text-2xl font-bold text-blue-900">{upcomingReminders.length}</p>
            </div>
            <CalIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">Vencidos</p>
              <p className="text-2xl font-bold text-red-900">{overdueReminders.length}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Completados</p>
              <p className="text-2xl font-bold text-green-900">{completedReminders.length}</p>
            </div>
            <Check className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border rounded-lg p-4" style={{ height: '600px' }}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              eventPropGetter={eventStyleGetter}
              onSelectEvent={(event) => openModal(event.resource)}
              messages={{
                next: 'Siguiente', previous: 'Anterior', today: 'Hoy', month: 'Mes', week: 'Semana',
                day: 'Día', agenda: 'Agenda', noEventsInRange: 'No hay recordatorios'
              }}
            />
          )}
        </div>

        <div className="bg-white border rounded-lg">
          <div className="border-b">
            <div className="flex">
              {['upcoming', 'overdue', 'completed'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-3 text-sm font-medium ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                >
                  {tab === 'upcoming' ? 'Próximos' : tab === 'overdue' ? 'Vencidos' : 'Completados'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 space-y-3 max-h-[520px] overflow-y-auto">
            {getActiveReminders().length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay recordatorios</p>
              </div>
            ) : (
              getActiveReminders().map(reminder => (
                <div key={reminder.id} className="border rounded-lg p-3 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium flex-1">{reminder.title}</h3>
                    <div className={`w-3 h-3 rounded-full ${getPriorityDot(reminder.priority)}`}></div>
                  </div>
                  {reminder.description && <p className="text-sm text-gray-600 mb-2">{reminder.description}</p>}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <Clock className="w-4 h-4" />
                    {format(new Date(reminder.due_date), 'PPp', { locale: es })}
                  </div>
                  <div className="flex gap-2">
                    {!reminder.completed_at && (
                      <button onClick={() => handleComplete(reminder.id)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100">
                        <Check className="w-3 h-3" /> Completar
                      </button>
                    )}
                    <button onClick={() => openModal(reminder)} className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-blue-50 text-blue-700 rounded">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleDelete(reminder.id)} className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-red-50 text-red-700 rounded">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">{selectedReminder ? 'Editar' : 'Nuevo'} Recordatorio</h2>
              <button onClick={closeModal}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título *</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha y Hora *</label>
                <input type="datetime-local" required value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo *</label>
                <select required value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="audiencia">Audiencia</option>
                  <option value="plazo">Plazo</option>
                  <option value="reunion">Reunión</option>
                  <option value="pago">Pago</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prioridad *</label>
                <select required value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {selectedReminder ? 'Actualizar' : 'Crear'}
                </button>
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-lg">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
