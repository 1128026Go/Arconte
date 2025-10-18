# Sistema de Suscripciones con ePayco - Arconte

**Fecha**: 2025-10-10
**Objetivo**: Implementar sistema de planes Free/Premium con integración de ePayco para pagos recurrentes

---

## 📊 Modelo de Negocio Recomendado

### Plan GRATUITO (Free)
- ✅ **Casos simultáneos**: Máximo 3 casos activos
- ✅ **Consultas diarias**: Máximo 10 actualizaciones/día
- ✅ **Notificaciones**: Email básico (1 vez al día)
- ✅ **Historial**: Últimos 30 días de actuaciones
- ✅ **Búsqueda jurisprudencia**: 5 búsquedas/día
- ✅ **Soporte**: Básico (email, 48-72h respuesta)
- ✅ **Retención de datos**: 90 días

### Plan PREMIUM (Pago)
- ⭐ **Casos simultáneos**: Ilimitados
- ⭐ **Consultas diarias**: Ilimitadas
- ⭐ **Notificaciones**: Email + SMS + Push en tiempo real
- ⭐ **Historial**: Completo sin límite de tiempo
- ⭐ **Búsqueda jurisprudencia**: Ilimitada + filtros avanzados
- ⭐ **Exportar documentos**: PDF, Excel, Word
- ⭐ **IA Legal**: Análisis de casos con IA
- ⭐ **Alertas personalizadas**: Configurables por tipo de actuación
- ⭐ **Soporte**: Prioritario (chat en vivo, < 4h respuesta)
- ⭐ **Retención de datos**: Ilimitada
- ⭐ **API Access**: Acceso programático a datos

**Precio sugerido**:
- Mensual: $49.900 COP/mes (~$12 USD)
- Anual: $479.900 COP/año (~$120 USD) - **Ahorro 20%**

---

## 🏗️ Arquitectura de Base de Datos

### 1. Tabla `plans` (Planes disponibles)
```sql
CREATE TABLE plans (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,              -- 'free', 'premium'
    display_name VARCHAR(100) NOT NULL,     -- 'Plan Gratuito', 'Plan Premium'
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0, -- En COP
    billing_cycle VARCHAR(20),              -- 'monthly', 'yearly', 'lifetime'
    max_cases INT DEFAULT 3,
    max_daily_queries INT DEFAULT 10,
    max_jurisprudencia_searches INT DEFAULT 5,
    features JSON,                          -- Array de features habilitados
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### 2. Tabla `subscriptions` (Suscripciones de usuarios)
```sql
CREATE TABLE subscriptions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    plan_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,            -- 'active', 'cancelled', 'expired', 'suspended'

    -- ePayco Integration
    epayco_subscription_id VARCHAR(100),    -- ID de suscripción en ePayco
    epayco_customer_id VARCHAR(100),        -- ID de cliente en ePayco
    payment_method VARCHAR(50),             -- 'credit_card', 'pse', 'cash'

    -- Dates
    starts_at TIMESTAMP NOT NULL,
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    trial_ends_at TIMESTAMP NULL,           -- Para trial gratuito de 7 días
    cancelled_at TIMESTAMP NULL,
    ends_at TIMESTAMP NULL,

    -- Billing
    last_payment_at TIMESTAMP NULL,
    next_payment_at TIMESTAMP NULL,

    created_at TIMESTAMP,
    updated_at TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES plans(id),
    INDEX idx_user_status (user_id, status),
    INDEX idx_epayco_subscription (epayco_subscription_id)
);
```

### 3. Tabla `payments` (Historial de pagos)
```sql
CREATE TABLE payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    subscription_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,

    -- ePayco data
    epayco_reference VARCHAR(100) UNIQUE,   -- Referencia única de ePayco
    epayco_transaction_id VARCHAR(100),     -- x_transaction_id
    epayco_response TEXT,                   -- JSON completo de respuesta

    -- Payment info
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'COP',
    status VARCHAR(20) NOT NULL,            -- 'pending', 'approved', 'rejected', 'failed'
    payment_method VARCHAR(50),

    -- Metadata
    description TEXT,
    paid_at TIMESTAMP NULL,

    created_at TIMESTAMP,
    updated_at TIMESTAMP,

    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_epayco_reference (epayco_reference),
    INDEX idx_user_status (user_id, status)
);
```

### 4. Tabla `usage_tracking` (Seguimiento de uso por usuario)
```sql
CREATE TABLE usage_tracking (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    date DATE NOT NULL,

    -- Contadores diarios
    cases_created INT DEFAULT 0,
    queries_made INT DEFAULT 0,
    jurisprudencia_searches INT DEFAULT 0,

    created_at TIMESTAMP,
    updated_at TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, date),
    INDEX idx_user_date (user_id, date)
);
```

---

## 🔌 Integración con ePayco

### Credenciales Requeridas
Agregar al archivo `.env` de Laravel:

```env
# ePayco Configuration
EPAYCO_PUBLIC_KEY=tu_public_key_aqui
EPAYCO_PRIVATE_KEY=tu_private_key_aqui
EPAYCO_P_CUST_ID_CLIENTE=tu_p_cust_id_aqui
EPAYCO_CUSTOMER_ID=tu_customer_id_aqui
EPAYCO_TEST_MODE=true                      # false en producción
EPAYCO_URL_CONFIRMATION=https://tuapp.com/api/webhooks/epayco/confirmation
EPAYCO_URL_RESPONSE=https://tuapp.com/checkout/response
```

### Instalación del SDK de ePayco

```bash
composer require epayco/epayco-php
```

### Flujo de Pago con ePayco

#### **Opción 1: Checkout Estándar (Recomendado para MVP)**
1. Usuario selecciona plan Premium
2. Frontend redirige a checkout de ePayco
3. Usuario completa pago en página de ePayco
4. ePayco redirige de vuelta con respuesta
5. Webhook de confirmación actualiza suscripción

```php
// Ejemplo de creación de checkout
$epayco = new Epayco([
    'apiKey' => env('EPAYCO_PUBLIC_KEY'),
    'privateKey' => env('EPAYCO_PRIVATE_KEY'),
    'lenguage' => 'ES',
    'test' => env('EPAYCO_TEST_MODE')
]);

$payment = $epayco->charge->create([
    'name' => 'Plan Premium Arconte - Mensual',
    'description' => 'Suscripción mensual Plan Premium',
    'invoice' => 'SUB-' . $user->id . '-' . time(),
    'currency' => 'COP',
    'amount' => '49900',
    'tax_base' => '41933',
    'tax' => '7967',  // IVA 19%
    'country' => 'CO',
    'lang' => 'ES',
    'external' => 'false',
    'extra1' => 'user_id:' . $user->id,
    'extra2' => 'plan_id:' . $plan->id,
    'confirmation' => env('EPAYCO_URL_CONFIRMATION'),
    'response' => env('EPAYCO_URL_RESPONSE'),
    'method_confirmation' => 'POST'
]);
```

#### **Opción 2: Suscripciones Recurrentes de ePayco**
```php
// Crear plan de suscripción en ePayco
$subscriptionPlan = $epayco->plan->create([
    'id_plan' => 'premium-monthly',
    'name' => 'Plan Premium Mensual',
    'description' => 'Suscripción Premium Arconte',
    'amount' => '49900',
    'currency' => 'COP',
    'interval' => 'month',
    'interval_count' => '1',
    'trial_days' => '7'
]);

// Suscribir cliente
$subscription = $epayco->subscription->create([
    'id_plan' => 'premium-monthly',
    'customer' => $epaycoCustomerId,
    'token_card' => $tokenCard,
    'doc_type' => 'CC',
    'doc_number' => '123456789',
    'url_confirmation' => env('EPAYCO_URL_CONFIRMATION'),
    'method_confirmation' => 'POST'
]);
```

---

## 🛠️ Implementación Backend (Laravel)

### 1. Servicio de ePayco (`app/Services/EpaycoService.php`)

```php
<?php

namespace App\Services;

use Epayco\Epayco;
use Illuminate\Support\Facades\Log;

class EpaycoService
{
    protected $epayco;

    public function __construct()
    {
        $this->epayco = new Epayco([
            'apiKey' => config('services.epayco.public_key'),
            'privateKey' => config('services.epayco.private_key'),
            'lenguage' => 'ES',
            'test' => config('services.epayco.test_mode')
        ]);
    }

    public function createCheckout(array $data)
    {
        try {
            return $this->epayco->charge->create($data);
        } catch (\Exception $e) {
            Log::error('ePayco Checkout Error', [
                'message' => $e->getMessage(),
                'data' => $data
            ]);
            throw $e;
        }
    }

    public function createCustomer(array $data)
    {
        try {
            return $this->epayco->customer->create($data);
        } catch (\Exception $e) {
            Log::error('ePayco Customer Creation Error', [
                'message' => $e->getMessage(),
                'data' => $data
            ]);
            throw $e;
        }
    }

    public function createSubscription(array $data)
    {
        try {
            return $this->epayco->subscription->create($data);
        } catch (\Exception $e) {
            Log::error('ePayco Subscription Error', [
                'message' => $e->getMessage(),
                'data' => $data
            ]);
            throw $e;
        }
    }

    public function cancelSubscription(string $subscriptionId)
    {
        try {
            return $this->epayco->subscription->cancel($subscriptionId);
        } catch (\Exception $e) {
            Log::error('ePayco Cancel Subscription Error', [
                'message' => $e->getMessage(),
                'subscription_id' => $subscriptionId
            ]);
            throw $e;
        }
    }

    public function getTransaction(string $transactionId)
    {
        try {
            return $this->epayco->charge->get($transactionId);
        } catch (\Exception $e) {
            Log::error('ePayco Get Transaction Error', [
                'message' => $e->getMessage(),
                'transaction_id' => $transactionId
            ]);
            throw $e;
        }
    }
}
```

### 2. Middleware de Verificación de Plan (`app/Http/Middleware/CheckSubscription.php`)

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckSubscription
{
    public function handle(Request $request, Closure $next, string $feature = null)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $subscription = $user->activeSubscription();

        if (!$subscription) {
            return response()->json([
                'error' => 'No active subscription',
                'message' => 'Necesitas una suscripción activa para acceder a esta función'
            ], 403);
        }

        // Verificar feature específico si se proporciona
        if ($feature && !$subscription->plan->hasFeature($feature)) {
            return response()->json([
                'error' => 'Feature not available',
                'message' => 'Esta función no está disponible en tu plan actual',
                'upgrade_required' => true
            ], 403);
        }

        return $next($request);
    }
}
```

### 3. Middleware de Límites de Uso (`app/Http/Middleware/CheckUsageLimit.php`)

```php
<?php

namespace App\Http\Middleware;

use App\Models\UsageTracking;
use Closure;
use Illuminate\Http\Request;

class CheckUsageLimit
{
    public function handle(Request $request, Closure $next, string $limitType)
    {
        $user = $request->user();
        $subscription = $user->activeSubscription();
        $plan = $subscription->plan;

        // Si es premium, permitir ilimitado
        if ($plan->name === 'premium') {
            return $next($request);
        }

        // Obtener uso de hoy
        $usage = UsageTracking::firstOrCreate([
            'user_id' => $user->id,
            'date' => now()->toDateString()
        ]);

        // Verificar límite según tipo
        switch ($limitType) {
            case 'cases':
                $currentCount = $user->cases()->count();
                if ($currentCount >= $plan->max_cases) {
                    return response()->json([
                        'error' => 'Limit reached',
                        'message' => "Has alcanzado el límite de {$plan->max_cases} casos. Actualiza a Premium para casos ilimitados.",
                        'upgrade_required' => true
                    ], 429);
                }
                break;

            case 'queries':
                if ($usage->queries_made >= $plan->max_daily_queries) {
                    return response()->json([
                        'error' => 'Daily limit reached',
                        'message' => "Has alcanzado el límite de {$plan->max_daily_queries} consultas diarias. Actualiza a Premium para consultas ilimitadas.",
                        'upgrade_required' => true
                    ], 429);
                }
                break;

            case 'jurisprudencia':
                if ($usage->jurisprudencia_searches >= $plan->max_jurisprudencia_searches) {
                    return response()->json([
                        'error' => 'Daily limit reached',
                        'message' => "Has alcanzado el límite de {$plan->max_jurisprudencia_searches} búsquedas de jurisprudencia diarias.",
                        'upgrade_required' => true
                    ], 429);
                }
                break;
        }

        return $next($request);
    }
}
```

### 4. Modelo Plan (`app/Models/Plan.php`)

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = [
        'name',
        'display_name',
        'description',
        'price',
        'billing_cycle',
        'max_cases',
        'max_daily_queries',
        'max_jurisprudencia_searches',
        'features',
        'is_active'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'features' => 'array',
        'is_active' => 'boolean',
        'max_cases' => 'integer',
        'max_daily_queries' => 'integer',
        'max_jurisprudencia_searches' => 'integer'
    ];

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    public function hasFeature(string $feature): bool
    {
        return in_array($feature, $this->features ?? []);
    }

    public function isFree(): bool
    {
        return $this->name === 'free';
    }

    public function isPremium(): bool
    {
        return $this->name === 'premium';
    }
}
```

### 5. Modelo Subscription (`app/Models/Subscription.php`)

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    protected $fillable = [
        'user_id',
        'plan_id',
        'status',
        'epayco_subscription_id',
        'epayco_customer_id',
        'payment_method',
        'starts_at',
        'current_period_start',
        'current_period_end',
        'trial_ends_at',
        'cancelled_at',
        'ends_at',
        'last_payment_at',
        'next_payment_at'
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'current_period_start' => 'datetime',
        'current_period_end' => 'datetime',
        'trial_ends_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'ends_at' => 'datetime',
        'last_payment_at' => 'datetime',
        'next_payment_at' => 'datetime'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active' &&
               (!$this->ends_at || $this->ends_at->isFuture());
    }

    public function onTrial(): bool
    {
        return $this->trial_ends_at && $this->trial_ends_at->isFuture();
    }

    public function cancel()
    {
        $this->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'ends_at' => $this->current_period_end ?? now()
        ]);
    }
}
```

---

## 🎨 Implementación Frontend (React)

### 1. Página de Planes (`apps/web/src/pages/Pricing.jsx`)

```jsx
import { useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { apiSecure } from '@/lib/apiSecure';

const plans = [
  {
    name: 'Gratuito',
    id: 'free',
    price: 0,
    billing: 'Gratis para siempre',
    description: 'Perfecto para comenzar a gestionar tus casos',
    features: [
      'Hasta 3 casos simultáneos',
      '10 consultas diarias',
      '5 búsquedas de jurisprudencia/día',
      'Notificaciones por email',
      'Historial de 30 días',
      'Soporte básico por email'
    ],
    cta: 'Comenzar Gratis',
    highlighted: false
  },
  {
    name: 'Premium',
    id: 'premium',
    price: 49900,
    billing: 'mensual',
    description: 'Para profesionales que necesitan poder ilimitado',
    features: [
      'Casos ilimitados',
      'Consultas ilimitadas',
      'Búsqueda de jurisprudencia ilimitada',
      'Notificaciones en tiempo real (Email + SMS)',
      'Historial completo sin límites',
      'Exportar documentos (PDF, Excel)',
      'IA Legal - Análisis de casos',
      'Alertas personalizadas',
      'Soporte prioritario (< 4h)',
      'Acceso API programático'
    ],
    cta: 'Actualizar a Premium',
    highlighted: true
  }
];

export default function Pricing() {
  const [loading, setLoading] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');

  const handleSelectPlan = async (planId) => {
    if (planId === 'free') {
      // Plan gratuito - solo mensaje
      alert('Ya tienes acceso al plan gratuito');
      return;
    }

    setLoading(planId);
    try {
      const { data } = await apiSecure.post('/subscriptions/checkout', {
        plan: planId,
        billing_cycle: billingCycle
      });

      // Redirigir a checkout de ePayco
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Error al procesar el pago. Intenta nuevamente.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">
            Precios
          </h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Elige el plan perfecto para ti
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <div className="relative flex rounded-full bg-gray-100 p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`${
                billingCycle === 'monthly'
                  ? 'bg-white shadow-sm'
                  : 'text-gray-500'
              } rounded-full px-6 py-2 text-sm font-semibold transition`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`${
                billingCycle === 'yearly'
                  ? 'bg-white shadow-sm'
                  : 'text-gray-500'
              } rounded-full px-6 py-2 text-sm font-semibold transition`}
            >
              Anual
              <span className="ml-2 text-xs text-blue-600 font-bold">
                Ahorra 20%
              </span>
            </button>
          </div>
        </div>

        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:gap-x-8 xl:gap-x-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`${
                plan.highlighted
                  ? 'ring-2 ring-blue-600 scale-105'
                  : 'ring-1 ring-gray-200'
              } rounded-3xl p-8 xl:p-10 relative transition-transform hover:scale-105`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white">
                    Más Popular
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between gap-x-4">
                <h3 className="text-lg font-semibold leading-8 text-gray-900">
                  {plan.name}
                </h3>
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-600">
                {plan.description}
              </p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900">
                  ${plan.price.toLocaleString('es-CO')}
                </span>
                {plan.price > 0 && (
                  <span className="text-sm font-semibold leading-6 text-gray-600">
                    COP/{billingCycle === 'monthly' ? 'mes' : 'año'}
                  </span>
                )}
              </p>
              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={loading === plan.id}
                className={`${
                  plan.highlighted
                    ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-500'
                    : 'text-blue-600 ring-1 ring-inset ring-blue-200 hover:ring-blue-300'
                } mt-8 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50`}
              >
                {loading === plan.id ? 'Procesando...' : plan.cta}
              </button>
              <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <CheckIcon className="h-6 w-5 flex-none text-blue-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 🔄 Flujo Completo de Pago

### 1. Usuario selecciona plan
```
Usuario → Click "Actualizar a Premium" → POST /api/subscriptions/checkout
```

### 2. Backend crea checkout de ePayco
```php
// SubscriptionController@checkout
public function checkout(Request $request)
{
    $user = $request->user();
    $plan = Plan::where('name', $request->plan)->firstOrFail();

    $epayco = app(EpaycoService::class);

    $checkoutData = [
        'name' => $plan->display_name,
        'description' => 'Suscripción ' . $plan->display_name,
        'invoice' => 'SUB-' . $user->id . '-' . time(),
        'currency' => 'COP',
        'amount' => $plan->price,
        'tax_base' => round($plan->price / 1.19, 2),
        'tax' => round($plan->price - ($plan->price / 1.19), 2),
        'country' => 'CO',
        'lang' => 'ES',
        'external' => 'false',
        'extra1' => 'user_id:' . $user->id,
        'extra2' => 'plan_id:' . $plan->id,
        'confirmation' => config('services.epayco.url_confirmation'),
        'response' => config('services.epayco.url_response')
    ];

    $response = $epayco->createCheckout($checkoutData);

    return response()->json([
        'checkout_url' => $response->urlbanco ?? $response->url,
        'reference' => $checkoutData['invoice']
    ]);
}
```

### 3. ePayco procesa el pago y envía webhook
```php
// WebhookController@epaycoConfirmation
public function epaycoConfirmation(Request $request)
{
    Log::info('ePayco Webhook Received', $request->all());

    $signature = $request->header('x-signature');
    // Validar firma de ePayco

    $status = $request->x_response; // 'Aceptada', 'Rechazada', 'Pendiente'
    $reference = $request->x_id_invoice;
    $transactionId = $request->x_transaction_id;
    $amount = $request->x_amount;

    // Extraer user_id y plan_id de extra1 y extra2
    preg_match('/user_id:(\d+)/', $request->x_extra1, $userMatch);
    preg_match('/plan_id:(\d+)/', $request->x_extra2, $planMatch);

    $userId = $userMatch[1] ?? null;
    $planId = $planMatch[1] ?? null;

    if (!$userId || !$planId) {
        Log::error('Invalid ePayco webhook data');
        return response()->json(['error' => 'Invalid data'], 400);
    }

    $user = User::find($userId);
    $plan = Plan::find($planId);

    // Crear o actualizar suscripción
    if ($status === 'Aceptada') {
        $subscription = Subscription::updateOrCreate(
            ['user_id' => $userId, 'status' => 'active'],
            [
                'plan_id' => $planId,
                'status' => 'active',
                'epayco_subscription_id' => $reference,
                'starts_at' => now(),
                'current_period_start' => now(),
                'current_period_end' => now()->addMonth(),
                'last_payment_at' => now(),
                'next_payment_at' => now()->addMonth()
            ]
        );

        // Registrar pago
        Payment::create([
            'subscription_id' => $subscription->id,
            'user_id' => $userId,
            'epayco_reference' => $reference,
            'epayco_transaction_id' => $transactionId,
            'epayco_response' => json_encode($request->all()),
            'amount' => $amount,
            'currency' => 'COP',
            'status' => 'approved',
            'payment_method' => $request->x_franchise ?? 'unknown',
            'paid_at' => now()
        ]);

        // Enviar email de confirmación
        // Mail::to($user->email)->send(new SubscriptionActivated($subscription));
    }

    return response()->json(['success' => true]);
}
```

---

## ✅ Checklist de Implementación

### Fase 1: Base de Datos (1-2 días)
- [ ] Crear migración de tabla `plans`
- [ ] Crear migración de tabla `subscriptions`
- [ ] Crear migración de tabla `payments`
- [ ] Crear migración de tabla `usage_tracking`
- [ ] Ejecutar migraciones
- [ ] Seeders para planes iniciales (Free y Premium)

### Fase 2: Backend (3-4 días)
- [ ] Instalar SDK de ePayco (`composer require epayco/epayco-php`)
- [ ] Crear servicio `EpaycoService`
- [ ] Crear modelos: `Plan`, `Subscription`, `Payment`, `UsageTracking`
- [ ] Crear middleware `CheckSubscription`
- [ ] Crear middleware `CheckUsageLimit`
- [ ] Crear controlador `SubscriptionController`
- [ ] Crear controlador `WebhookController`
- [ ] Agregar rutas de suscripciones
- [ ] Configurar webhooks de ePayco

### Fase 3: Frontend (2-3 días)
- [ ] Crear página `Pricing.jsx`
- [ ] Crear componente `PlanCard.jsx`
- [ ] Crear página `Checkout/Response.jsx`
- [ ] Agregar indicador de plan actual en Dashboard
- [ ] Agregar modal de upgrade cuando se alcance límite
- [ ] Crear página `Subscription/Manage.jsx` (ver plan, cancelar, etc.)

### Fase 4: Testing (2 días)
- [ ] Probar flujo completo de pago con tarjeta de prueba ePayco
- [ ] Verificar webhooks de confirmación
- [ ] Probar límites de plan gratuito
- [ ] Probar upgrade y downgrade de planes
- [ ] Verificar tracking de uso diario

### Fase 5: Producción (1 día)
- [ ] Configurar variables de producción en ePayco
- [ ] Cambiar `EPAYCO_TEST_MODE=false`
- [ ] Configurar URLs de webhook en producción
- [ ] Monitorear primeros pagos reales

**Tiempo total estimado**: 8-12 días de desarrollo

---

## 🎯 Próximos Pasos Recomendados

1. **Configurar cuenta ePayco**: Si aún no tienes cuenta, créala en https://epayco.co
2. **Obtener credenciales de prueba**: Desde el dashboard de ePayco
3. **Revisar y aprobar este diseño**: Ajustar límites de planes si es necesario
4. **Comenzar implementación por fases**: Empezar con Fase 1 (Base de datos)

¿Quieres que comience con la implementación? Puedo empezar creando las migraciones y modelos.
