<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlansSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Plan Gratuito (no se muestra en la página de suscripción)
        Plan::updateOrCreate(
            ['name' => 'free'],
            [
                'display_name' => 'Plan Gratuito',
                'description' => 'Perfecto para comenzar a gestionar tus casos jurídicos',
                'price' => 0,
                'billing_cycle' => 'monthly',
                'max_cases' => 3,
                'max_daily_queries' => 10,
                'max_jurisprudencia_searches' => 5,
                'features' => [
                    'Hasta 3 casos activos',
                    '10 consultas diarias',
                    '5 búsquedas de jurisprudencia',
                    'Notificaciones por email',
                    'Historial de 30 días',
                    'Soporte básico'
                ],
                'is_active' => true
            ]
        );

        // Plan Básico - Mensual
        Plan::updateOrCreate(
            ['name' => 'basic'],
            [
                'display_name' => 'Plan Básico',
                'description' => 'Ideal para abogados independientes',
                'price' => 29900,
                'billing_cycle' => 'monthly',
                'max_cases' => 20,
                'max_daily_queries' => 50,
                'max_jurisprudencia_searches' => 30,
                'features' => [
                    'Hasta 20 casos activos',
                    '50 consultas diarias',
                    '30 búsquedas de jurisprudencia',
                    'Notificaciones en tiempo real',
                    'Historial ilimitado',
                    'Exportar documentos PDF',
                    'Soporte prioritario'
                ],
                'is_active' => true
            ]
        );

        // Plan Profesional - Mensual (MÁS POPULAR)
        Plan::updateOrCreate(
            ['name' => 'professional'],
            [
                'display_name' => 'Plan Profesional',
                'description' => 'Para profesionales que demandan excelencia',
                'price' => 49900,
                'billing_cycle' => 'monthly',
                'max_cases' => -1, // ilimitado
                'max_daily_queries' => -1, // ilimitado
                'max_jurisprudencia_searches' => -1, // ilimitado
                'features' => [
                    'Casos ilimitados',
                    'Consultas ilimitadas',
                    'Búsquedas ilimitadas de jurisprudencia',
                    'Análisis legal con IA',
                    'Alertas personalizadas',
                    'Exportar en múltiples formatos',
                    'Notificaciones SMS + Email',
                    'Soporte premium 24/7',
                    'Acceso API completo'
                ],
                'is_active' => true
            ]
        );

        // Plan Anual (antes Enterprise)
        Plan::updateOrCreate(
            ['name' => 'annual'],
            [
                'display_name' => 'Plan Anual',
                'description' => 'Plan profesional con descuento anual',
                'price' => 399900,
                'billing_cycle' => 'yearly',
                'max_cases' => -1, // ilimitado
                'max_daily_queries' => -1, // ilimitado
                'max_jurisprudencia_searches' => -1, // ilimitado
                'features' => [
                    'Casos ilimitados',
                    'Consultas ilimitadas',
                    'Búsquedas ilimitadas de jurisprudencia',
                    'Análisis legal con IA',
                    'Alertas personalizadas',
                    'Exportar en múltiples formatos',
                    'Notificaciones SMS + Email',
                    'Soporte premium 24/7',
                    'Acceso API completo',
                    'Ahorro de 20% vs plan mensual'
                ],
                'is_active' => true
            ]
        );

        // Plan Enterprise
        Plan::updateOrCreate(
            ['name' => 'enterprise'],
            [
                'display_name' => 'Plan Enterprise',
                'description' => 'Solución completa para firmas legales',
                'price' => 149900,
                'billing_cycle' => 'monthly',
                'max_cases' => -1, // ilimitado
                'max_daily_queries' => -1, // ilimitado
                'max_jurisprudencia_searches' => -1, // ilimitado
                'features' => [
                    'Todo lo del Plan Profesional',
                    'Gestión de equipos y usuarios',
                    'Panel administrativo avanzado',
                    'Reportes y analytics personalizados',
                    'Integraciones empresariales',
                    'SLA garantizado 99.9%',
                    'Gestor de cuenta dedicado',
                    'Capacitación y onboarding',
                    'Personalización de la plataforma'
                ],
                'is_active' => true
            ]
        );

        $this->command->info('✅ Planes creados exitosamente:');
        $this->command->info('   - Plan Gratuito (3 casos, 10 consultas/día)');
        $this->command->info('   - Plan Básico ($29.900 COP/mes)');
        $this->command->info('   - Plan Profesional ($49.900 COP/mes) ⭐ MÁS POPULAR');
        $this->command->info('   - Plan Anual ($399.900 COP/año)');
        $this->command->info('   - Plan Enterprise ($149.900 COP/mes)');
    }
}
