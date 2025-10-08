import React, { useEffect, useMemo, useState } from 'react';
import { billing } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import MainLayout from '../components/Layout/MainLayout';
import { FileText, DollarSign, Clock, CheckCircle, AlertCircle, Plus, Download } from 'lucide-react';

export default function Billing() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [term, setTerm] = useState('');
  const [status, setStatus] = useState('');

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv =>
      (!term || `${inv.invoice_number || inv.id} ${inv.client_name || ''}`.toLowerCase().includes(term.toLowerCase())) &&
      (!status || inv.status === status)
    );
  }, [invoices, term, status]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [invoicesData, statsData] = await Promise.all([
        billing.getInvoices(),
        billing.getStatistics()
      ]);
      
      setInvoices(Array.isArray(invoicesData) ? invoicesData : invoicesData?.data || []);
      setStatistics(statsData || {});
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function markAsPaid(invoiceId) {
    try {
      await billing.markPaid(invoiceId);
      await loadData(); // Refresh data
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  async function downloadPdf(invoiceId) {
    try {
      const pdfData = await billing.generatePdf(invoiceId);
      // Handle PDF download
      const blob = new Blob([pdfData], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-navy-900">Facturación</h1>
            <p className="text-slate-600 mt-1">Gestiona facturas y control financiero</p>
          </div>
          <Button className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-white">
            <Plus className="h-4 w-4" />
            Nueva Factura
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="border-navy-200">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-navy-100 p-2">
                <FileText className="h-5 w-5 text-navy-700" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Facturas</p>
                <p className="text-2xl font-bold text-navy-900">{statistics.total_invoices || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="border-gold-200">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gold-100 p-2">
                <DollarSign className="h-5 w-5 text-gold-700" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Facturado</p>
                <p className="text-2xl font-bold text-navy-900">{formatMoney(statistics.total_amount || 0)}</p>
              </div>
            </div>
          </Card>

          <Card className="border-primary-200">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary-100 p-2">
                <Clock className="h-5 w-5 text-primary-700" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Pendientes</p>
                <p className="text-2xl font-bold text-navy-900">{statistics.pending_invoices || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="border-error-200">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-error-100 p-2">
                <AlertCircle className="h-5 w-5 text-error-700" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Vencidas</p>
                <p className="text-2xl font-bold text-navy-900">{statistics.overdue_invoices || 0}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar por número o cliente..."
                value={term}
                onChange={e => setTerm(e.target.value)}
                className="w-64"
              />
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los estados</option>
                <option value="draft">Borrador</option>
                <option value="sent">Enviada</option>
                <option value="paid">Pagada</option>
                <option value="overdue">Vencida</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
            <Button variant="outline" onClick={loadData}>
              Refrescar
            </Button>
          </div>
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {/* Invoices Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy-50">
                <tr className="border-b border-navy-200 text-left">
                  <th className="py-3 px-4 font-semibold text-navy-700">#</th>
                  <th className="py-3 px-4 font-semibold text-navy-700">Cliente</th>
                  <th className="py-3 px-4 font-semibold text-navy-700">Fecha Emisión</th>
                  <th className="py-3 px-4 font-semibold text-navy-700">Vencimiento</th>
                  <th className="py-3 px-4 font-semibold text-navy-700">Total</th>
                  <th className="py-3 px-4 font-semibold text-navy-700">Estado</th>
                  <th className="py-3 px-4 font-semibold text-navy-700 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td className="py-8 text-center" colSpan={7}>
                      <div className="flex items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                        <span className="ml-2">Cargando facturas...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td className="py-8 text-center text-slate-500" colSpan={7}>
                      No se encontraron facturas
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map(invoice => (
                    <tr key={invoice.id} className="hover:bg-navy-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-navy-900">{invoice.invoice_number || `#${invoice.id}`}</span>
                      </td>
                      <td className="py-3 px-4 text-navy-700">{invoice.client_name || 'Cliente no especificado'}</td>
                      <td className="py-3 px-4 text-navy-700">{formatDate(invoice.created_at)}</td>
                      <td className="py-3 px-4 text-navy-700">{formatDate(invoice.due_date)}</td>
                      <td className="py-3 px-4 font-semibold text-navy-900">{formatMoney(invoice.total_amount || 0)}</td>
                      <td className="py-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadge(invoice.status)}`}>
                          {getStatusLabel(invoice.status)}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {invoice.status !== 'paid' && (
                            <Button
                              variant="ghost"
                              onClick={() => markAsPaid(invoice.id)}
                              className="text-green-600 hover:text-green-700 p-1"
                              title="Marcar como pagada"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            onClick={() => downloadPdf(invoice.id)}
                            className="text-blue-600 hover:text-blue-700 p-1"
                            title="Descargar PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('es-CO');
}

function formatMoney(amount) {
  const value = Number(amount || 0);
  return value.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
}

function getStatusBadge(status) {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'overdue':
      return 'bg-red-100 text-red-800';
    case 'sent':
      return 'bg-blue-100 text-blue-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
}

function getStatusLabel(status) {
  switch (status) {
    case 'draft':
      return 'Borrador';
    case 'sent':
      return 'Enviada';
    case 'paid':
      return 'Pagada';
    case 'overdue':
      return 'Vencida';
    case 'cancelled':
      return 'Cancelada';
    default:
      return status || 'Desconocido';
  }
}