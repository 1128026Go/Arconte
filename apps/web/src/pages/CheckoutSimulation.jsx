import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, CreditCard, Loader } from "lucide-react";

export default function CheckoutSimulation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  const planName = searchParams.get('name') || 'Plan';
  const amount = searchParams.get('amount') || '0';
  const invoice = searchParams.get('invoice') || '';

  const handleSimulateSuccess = () => {
    setProcessing(true);

    // Simular procesamiento de pago
    setTimeout(() => {
      const responseUrl = searchParams.get('response') || 'http://localhost:3000/checkout/response';

      // Simular respuesta exitosa de ePayco
      const params = new URLSearchParams({
        ref_payco: 'TEST-' + Date.now(),
        x_transaction_id: 'TXN-' + Date.now(),
        x_response: 'Aceptada',
        x_approval_code: 'APPROVED-' + Math.random().toString(36).substring(7),
        x_transaction_state: 'Aprobada',
        x_amount: amount,
        x_currency_code: 'COP',
        x_signature: 'test_signature',
        x_invoice: invoice,
        x_test_request: 'true'
      });

      window.location.href = `${responseUrl}?${params.toString()}`;
    }, 2000);
  };

  const handleSimulateFailure = () => {
    setProcessing(true);

    setTimeout(() => {
      const responseUrl = searchParams.get('response') || 'http://localhost:3000/checkout/response';

      // Simular respuesta rechazada
      const params = new URLSearchParams({
        ref_payco: 'TEST-' + Date.now(),
        x_transaction_id: 'TXN-' + Date.now(),
        x_response: 'Rechazada',
        x_approval_code: 'DECLINED',
        x_transaction_state: 'Rechazada',
        x_amount: amount,
        x_currency_code: 'COP',
        x_signature: 'test_signature',
        x_invoice: invoice,
        x_test_request: 'true'
      });

      window.location.href = `${responseUrl}?${params.toString()}`;
    }, 2000);
  };

  if (processing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <Loader className="w-16 h-16 text-gold-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-navy-900 mb-2">
            Procesando pago...
          </h2>
          <p className="text-slate-600">
            Por favor espera mientras procesamos tu transacción
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-700 via-navy-600 to-slate-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-navy-900 mb-2">
            Simulación de Pago
          </h1>
          <p className="text-slate-600 text-sm">
            Esta es una pasarela de pago simulada para testing
          </p>
        </div>

        {/* Payment Details */}
        <div className="bg-slate-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-600">Plan:</span>
            <span className="font-semibold text-navy-900">{planName}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-600">Monto:</span>
            <span className="font-semibold text-navy-900">
              ${new Intl.NumberFormat('es-CO').format(amount)} COP
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Referencia:</span>
            <span className="font-mono text-xs text-slate-500">{invoice}</span>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 text-sm">
            <strong>⚠️ Modo de prueba:</strong> Esta es una simulación. En producción,
            esto será reemplazado por la pasarela de pago real de ePayco.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleSimulateSuccess}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
            Simular Pago Exitoso
          </button>

          <button
            onClick={handleSimulateFailure}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5" />
            Simular Pago Rechazado
          </button>

          <button
            onClick={() => navigate('/subscription')}
            className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Para usar la pasarela real de ePayco, configura tus credenciales válidas en el .env
        </p>
      </div>
    </div>
  );
}
