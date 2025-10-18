import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function CheckoutResponse() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  // Obtener datos de la transacción (formato ePayco o formato simple)
  const transactionState = searchParams.get('x_transaction_state') || searchParams.get('x_response');
  const refPayco = searchParams.get('ref_payco');
  const transactionId = searchParams.get('x_transaction_id') || searchParams.get('transaction_id');
  const reference = searchParams.get('x_invoice') || searchParams.get('reference');
  const amount = searchParams.get('x_amount');

  // Determinar el status basado en el estado de la transacción
  let status = searchParams.get('status');
  if (!status && transactionState) {
    if (transactionState === 'Aprobada' || transactionState === 'Aceptada') {
      status = 'success';
    } else if (transactionState === 'Pendiente') {
      status = 'pending';
    } else {
      status = 'error';
    }
  }

  useEffect(() => {
    // Countdown para redirigir automáticamente
    if (status === 'success' || countdown <= 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/dashboard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status, countdown, navigate]);

  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-500',
          bgColor: 'bg-green-50',
          title: '¡Pago Exitoso!',
          message: 'Tu suscripción ha sido activada correctamente. Ya puedes disfrutar de todas las funciones Premium.',
          actionText: 'Ir al Dashboard',
          actionColor: 'bg-green-600 hover:bg-green-700'
        };
      case 'pending':
        return {
          icon: Clock,
          iconColor: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          title: 'Pago Pendiente',
          message: 'Tu pago está siendo procesado. Te notificaremos por email cuando se complete.',
          actionText: 'Entendido',
          actionColor: 'bg-yellow-600 hover:bg-yellow-700'
        };
      case 'error':
      default:
        return {
          icon: XCircle,
          iconColor: 'text-red-500',
          bgColor: 'bg-red-50',
          title: 'Error en el Pago',
          message: 'No pudimos procesar tu pago. Por favor, intenta nuevamente o contacta con soporte.',
          actionText: 'Volver a Intentar',
          actionColor: 'bg-red-600 hover:bg-red-700'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-700 via-navy-600 to-slate-600 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Icon Header */}
          <div className={`${config.bgColor} p-8 flex justify-center`}>
            <Icon className={`h-24 w-24 ${config.iconColor}`} />
          </div>

          {/* Content */}
          <div className="p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {config.title}
            </h1>
            <p className="text-gray-600 mb-6">
              {config.message}
            </p>

            {/* Transaction Details */}
            {(reference || refPayco) && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Detalles de la Transacción
                </h3>
                <div className="space-y-1 text-sm text-gray-600">
                  {refPayco && (
                    <div className="flex justify-between">
                      <span>Ref. ePayco:</span>
                      <span className="font-mono font-semibold">{refPayco}</span>
                    </div>
                  )}
                  {reference && (
                    <div className="flex justify-between">
                      <span>Factura:</span>
                      <span className="font-mono font-semibold">{reference}</span>
                    </div>
                  )}
                  {transactionId && (
                    <div className="flex justify-between">
                      <span>ID Transacción:</span>
                      <span className="font-mono text-xs">{transactionId}</span>
                    </div>
                  )}
                  {amount && (
                    <div className="flex justify-between">
                      <span>Monto:</span>
                      <span className="font-semibold">${new Intl.NumberFormat('es-CO').format(amount)} COP</span>
                    </div>
                  )}
                  {transactionState && (
                    <div className="flex justify-between">
                      <span>Estado:</span>
                      <span className="font-semibold">{transactionState}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Auto-redirect countdown */}
            {status === 'success' && (
              <p className="text-sm text-gray-500 mb-6">
                Serás redirigido automáticamente en {countdown} segundos...
              </p>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  if (status === 'error') {
                    navigate('/pricing');
                  } else {
                    navigate('/dashboard');
                  }
                }}
                className={`w-full ${config.actionColor} text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg`}
              >
                {config.actionText}
              </button>

              {status !== 'success' && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-200"
                >
                  Ir al Dashboard
                </button>
              )}
            </div>

            {/* Support Link */}
            {status === 'error' && (
              <p className="mt-6 text-sm text-gray-500">
                ¿Necesitas ayuda?{' '}
                <a href="mailto:soporte@arconte.com" className="text-navy-700 hover:text-navy-900 font-medium">
                  Contacta con soporte
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {status === 'success'
              ? 'Recibirás un email de confirmación con los detalles de tu suscripción.'
              : status === 'pending'
              ? 'El procesamiento puede tomar hasta 24 horas.'
              : 'Si el problema persiste, verifica los datos de tu tarjeta.'}
          </p>
        </div>
      </div>
    </div>
  );
}
