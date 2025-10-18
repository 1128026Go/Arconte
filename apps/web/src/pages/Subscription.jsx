import React, { useState, useEffect } from "react";
import { subscriptions } from "../lib/api";
import { Link } from "react-router-dom";
import { Scale, Check, AlertCircle, Crown, ArrowLeft, Loader, Info, ChevronDown } from "lucide-react";

export default function SubscriptionPage() {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingPlan, setProcessingPlan] = useState(null);
  const [expandedPlan, setExpandedPlan] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [plansData, currentData] = await Promise.all([
        subscriptions.getPlans(),
        subscriptions.getCurrent()
      ]);

      setPlans(plansData.plans || []);
      setCurrentSubscription(currentData.subscription);
    } catch (err) {
      setError("Error al cargar los planes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade(planName, billingCycle) {
    try {
      setProcessingPlan(planName);
      console.log('Iniciando checkout:', { planName, billingCycle });

      const response = await subscriptions.checkout(planName, billingCycle);
      console.log('Respuesta checkout:', response);

      if (response.checkout_url) {
        console.log('Redirigiendo a:', response.checkout_url);
        window.location.href = response.checkout_url;
      } else {
        console.error('No se recibió checkout_url:', response);
        alert("No se pudo generar el enlace de pago. Por favor intenta de nuevo.");
      }
    } catch (err) {
      console.error('Error en checkout:', err);
      alert("Error al procesar el pago: " + (err.message || 'Error desconocido'));
    } finally {
      setProcessingPlan(null);
    }
  }

  // Formato colombiano de precios
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO').format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-gold-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Cargando planes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 text-slate-600 hover:text-navy-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Volver</span>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold-500 rounded-full flex items-center justify-center">
                  <Scale className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-navy-900">Arconte</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-navy-900 mb-3">
            Elige tu plan ideal
          </h2>
          <p className="text-lg text-slate-600">
            Planes flexibles para abogados y firmas legales
          </p>
        </div>

        {error && (
          <div className="max-w-5xl mx-auto mb-8 bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Plans Grid - Diseño horizontal profesional */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-[1400px] mx-auto mb-12">
          {plans
            .filter(plan => plan.name !== 'free')
            .sort((a, b) => {
              // Orden: basic, professional, enterprise, annual
              const order = { basic: 1, professional: 2, enterprise: 3, annual: 4 };
              return (order[a.name] || 99) - (order[b.name] || 99);
            })
            .map((plan) => {
              const isCurrentPlan = currentSubscription?.plan.id === plan.id;
              const isProfessional = plan.name === 'professional';
              const isExpanded = expandedPlan === plan.id;

              // Mostrar solo los primeros 5 features
              const visibleFeatures = plan.features?.slice(0, 5) || [];
              const hiddenFeatures = plan.features?.slice(5) || [];
              const hasMoreFeatures = hiddenFeatures.length > 0;

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-2xl transition-all duration-300 flex flex-col ${
                    isCurrentPlan
                      ? 'border-2 border-gold-400 shadow-2xl'
                      : isProfessional
                      ? 'border-2 border-gold-400 shadow-xl hover:shadow-2xl scale-105'
                      : 'border border-slate-200 shadow-md hover:shadow-xl hover:border-navy-300'
                  }`}
                  style={{ minWidth: '280px', maxWidth: '350px' }}
                >
                  {/* Popular Badge - Solo para Professional */}
                  {isProfessional && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="bg-gradient-to-r from-gold-600 to-gold-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        MÁS POPULAR
                      </div>
                    </div>
                  )}

                  {/* Card Content - Flex column para alinear botón al fondo */}
                  <div className="p-6 flex flex-col h-full">
                    {/* Header */}
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-navy-900 mb-1">
                        {plan.display_name}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {plan.description}
                      </p>
                    </div>

                    {/* Price - Grande y prominente */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-navy-900">
                          ${formatPrice(plan.price)}
                        </span>
                        <span className="text-base text-slate-600">
                          /{plan.billing_cycle === 'monthly' ? 'mes' : 'año'}
                        </span>
                      </div>
                      {plan.name === 'annual' && (
                        <span className="inline-block mt-2 text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full">
                          Ahorra 20%
                        </span>
                      )}
                    </div>

                    {/* Features - Máximo 5 visibles */}
                    <div className="mb-6 flex-grow">
                      <ul className="space-y-3">
                        {visibleFeatures.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                              isProfessional ? 'text-gold-600' : 'text-navy-800'
                            }`} />
                            <span className="text-sm text-slate-700">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Ver más features */}
                      {hasMoreFeatures && (
                        <div className="mt-3">
                          <button
                            onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                            className="text-xs text-navy-700 hover:text-navy-900 font-medium flex items-center gap-1"
                          >
                            {isExpanded ? 'Ver menos' : `+${hiddenFeatures.length} más`}
                            <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>

                          {isExpanded && (
                            <ul className="mt-3 space-y-3">
                              {hiddenFeatures.map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                                    isProfessional ? 'text-gold-600' : 'text-navy-800'
                                  }`} />
                                  <span className="text-sm text-slate-700">{feature}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Limits - Compacto */}
                    <div className="mb-6 pb-6 border-t border-slate-200 pt-4">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        <div>
                          <span className="text-slate-500">Casos:</span>
                          <span className="ml-1 font-semibold text-slate-700">
                            {plan.limits.max_cases === -1 ? '∞' : plan.limits.max_cases}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Consultas:</span>
                          <span className="ml-1 font-semibold text-slate-700">
                            {plan.limits.max_daily_queries === -1 ? '∞' : plan.limits.max_daily_queries}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button - Alineado al fondo */}
                    <div className="mt-auto">
                      {!isCurrentPlan ? (
                        <button
                          onClick={() => {
                            console.log('Clicked plan:', plan.name, plan.billing_cycle);
                            handleUpgrade(plan.name, plan.billing_cycle);
                          }}
                          disabled={processingPlan === plan.name}
                          className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                            isProfessional
                              ? 'bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-700 hover:to-gold-600 text-white shadow-md hover:shadow-lg'
                              : 'bg-navy-800 hover:bg-navy-900 text-white shadow-md hover:shadow-lg'
                          }`}
                        >
                          {processingPlan === plan.name ? (
                            <div className="flex items-center justify-center gap-2">
                              <Loader className="w-4 h-4 animate-spin" />
                              Procesando...
                            </div>
                          ) : (
                            'Comenzar ahora'
                          )}
                        </button>
                      ) : (
                        <div className="w-full py-3 px-4 bg-slate-100 text-slate-700 font-semibold text-sm rounded-lg text-center border border-slate-300">
                          Plan Actual
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer Info - Texto simple */}
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-slate-500 text-sm flex items-center justify-center gap-2">
            <Info className="w-4 h-4" />
            Todos los pagos son procesados de forma segura a través de ePayco
          </p>
        </div>
      </div>
    </div>
  );
}
