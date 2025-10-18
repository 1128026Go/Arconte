import { useState, useEffect } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { apiSecure } from '@/lib/apiSecure';
import { useNavigate } from 'react-router-dom';

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const navigate = useNavigate();

  useEffect(() => {
    loadPlans();
    loadCurrentSubscription();
  }, []);

  const loadPlans = async () => {
    try {
      const { data } = await apiSecure.get('/subscriptions/plans');
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentSubscription = async () => {
    try {
      const { data } = await apiSecure.get('/subscriptions/current');
      setCurrentSubscription(data.subscription);
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const handleSelectPlan = async (plan) => {
    if (plan.name === 'free') {
      alert('Ya tienes acceso al plan gratuito');
      return;
    }

    setCheckoutLoading(plan.id);
    try {
      const { data } = await apiSecure.post('/subscriptions/checkout', {
        plan: plan.name,
        billing_cycle: plan.billing_cycle
      });

      if (data.checkout_url) {
        // Redirigir a ePayco
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert(error.response?.data?.message || 'Error al procesar el pago. Intenta nuevamente.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const isCurrentPlan = (plan) => {
    if (!currentSubscription) return false;
    return currentSubscription.plan.id === plan.id;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando planes...</p>
        </div>
      </div>
    );
  }

  // Agrupar planes por tipo
  const freePlan = plans.find(p => p.name === 'free');
  const monthlyPlan = plans.find(p => p.name === 'premium' && p.billing_cycle === 'monthly');
  const yearlyPlan = plans.find(p => p.name === 'premium_yearly' || (p.name === 'premium' && p.billing_cycle === 'yearly'));

  const displayPlans = billingCycle === 'monthly'
    ? [freePlan, monthlyPlan].filter(Boolean)
    : [freePlan, yearlyPlan].filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Elige el plan perfecto para ti
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Gestiona tus casos jurídicos con inteligencia artificial
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-10">
          <div className="relative flex rounded-full bg-white shadow-sm p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900'
              } rounded-full px-6 py-2 text-sm font-semibold transition-all duration-200`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`${
                billingCycle === 'yearly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900'
              } rounded-full px-6 py-2 text-sm font-semibold transition-all duration-200 flex items-center gap-2`}
            >
              Anual
              <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {displayPlans.map((plan) => {
            const isCurrent = isCurrentPlan(plan);
            const isPremium = plan.name.includes('premium');

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105 ${
                  isPremium ? 'ring-4 ring-blue-600 ring-opacity-50' : ''
                }`}
              >
                {/* Popular Badge */}
                {isPremium && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-bl-lg">
                      MÁS POPULAR
                    </div>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrent && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Plan Actual
                    </span>
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.display_name}
                  </h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-baseline">
                      <span className="text-5xl font-extrabold text-gray-900">
                        ${plan.price.toLocaleString('es-CO')}
                      </span>
                      {plan.price > 0 && (
                        <span className="ml-2 text-gray-500">
                          COP/{billingCycle === 'monthly' ? 'mes' : 'año'}
                        </span>
                      )}
                    </div>
                    {billingCycle === 'yearly' && plan.price > 0 && (
                      <p className="text-sm text-green-600 mt-2 font-semibold">
                        Ahorra ${((49900 * 12) - plan.price).toLocaleString('es-CO')} COP al año
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-4 mb-8">
                    {isPremium ? (
                      <>
                        <li className="flex items-start">
                          <CheckIcon className="h-6 w-6 text-green-500 flex-shrink-0 mr-3" />
                          <span className="text-gray-700"><strong>Casos ilimitados</strong></span>
                        </li>
                        <li className="flex items-start">
                          <CheckIcon className="h-6 w-6 text-green-500 flex-shrink-0 mr-3" />
                          <span className="text-gray-700"><strong>Consultas ilimitadas</strong></span>
                        </li>
                        <li className="flex items-start">
                          <CheckIcon className="h-6 w-6 text-green-500 flex-shrink-0 mr-3" />
                          <span className="text-gray-700">Búsqueda de jurisprudencia ilimitada</span>
                        </li>
                        <li className="flex items-start">
                          <CheckIcon className="h-6 w-6 text-green-500 flex-shrink-0 mr-3" />
                          <span className="text-gray-700">Notificaciones en tiempo real (Email + SMS)</span>
                        </li>
                        <li className="flex items-start">
                          <CheckIcon className="h-6 w-6 text-green-500 flex-shrink-0 mr-3" />
                          <span className="text-gray-700">Historial completo sin límites</span>
                        </li>
                        <li className="flex items-start">
                          <CheckIcon className="h-6 w-6 text-green-500 flex-shrink-0 mr-3" />
                          <span className="text-gray-700">Exportar documentos (PDF, Excel)</span>
                        </li>
                        <li className="flex items-start">
                          <CheckIcon className="h-6 w-6 text-green-500 flex-shrink-0 mr-3" />
                          <span className="text-gray-700">IA Legal - Análisis de casos</span>
                        </li>
                        <li className="flex items-start">
                          <CheckIcon className="h-6 w-6 text-green-500 flex-shrink-0 mr-3" />
                          <span className="text-gray-700">Alertas personalizadas</span>
                        </li>
                        <li className="flex items-start">
                          <CheckIcon className="h-6 w-6 text-green-500 flex-shrink-0 mr-3" />
                          <span className="text-gray-700">Soporte prioritario (&lt; 4h)</span>
                        </li>
                        <li className="flex items-start">
                          <CheckIcon className="h-6 w-6 text-green-500 flex-shrink-0 mr-3" />
                          <span className="text-gray-700">Acceso API programático</span>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-start">
                          <CheckIcon className="h-6 w-6 text-blue-500 flex-shrink-0 mr-3" />
                          <span className="text-gray-700">Hasta {plan.limits.max_cases} casos</span>
                        </li>
                        <li className="flex items-start">
                          <CheckIcon className="h-6 w-6 text-blue-500 flex-shrink-0 mr-3" />
                          <span className="text-gray-700">{plan.limits.max_daily_queries} consultas diarias</span>
                        </li>
                        <li className="flex items-start">
                          <CheckIcon className="h-6 w-6 text-blue-500 flex-shrink-0 mr-3" />
                          <span className="text-gray-700">{plan.limits.max_jurisprudencia_searches} búsquedas de jurisprudencia/día</span>
                        </li>
                        <li className="flex items-start">
                          <CheckIcon className="h-6 w-6 text-blue-500 flex-shrink-0 mr-3" />
                          <span className="text-gray-700">Notificaciones por email</span>
                        </li>
                        <li className="flex items-start">
                          <CheckIcon className="h-6 w-6 text-blue-500 flex-shrink-0 mr-3" />
                          <span className="text-gray-700">Historial de 30 días</span>
                        </li>
                        <li className="flex items-start">
                          <CheckIcon className="h-6 w-6 text-blue-500 flex-shrink-0 mr-3" />
                          <span className="text-gray-700">Soporte básico por email</span>
                        </li>
                      </>
                    )}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={checkoutLoading === plan.id || isCurrent}
                    className={`w-full py-3 px-6 rounded-lg font-semibold text-center transition-all duration-200 ${
                      isCurrent
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : isPremium
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300'
                    }`}
                  >
                    {checkoutLoading === plan.id ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Procesando...
                      </span>
                    ) : isCurrent ? (
                      'Plan Actual'
                    ) : plan.price > 0 ? (
                      'Actualizar a Premium'
                    ) : (
                      'Comenzar Gratis'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Back to Dashboard */}
        <div className="text-center mt-12">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Volver al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
