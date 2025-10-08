import React, { useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { Card } from '../components/ui/Card';
import {
  BookOpen,
  Briefcase,
  FileText,
  Bot,
  ShoppingBag,
  Clock,
  DollarSign,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Play,
  HelpCircle
} from 'lucide-react';

export default function Tutorial() {
  const [activeSection, setActiveSection] = useState('dashboard');

  const sections = [
    {
      id: 'dashboard',
      title: 'Panel Principal (Dashboard)',
      icon: LayoutDashboard,
      content: {
        description: 'El Dashboard es tu centro de control principal. Aquí verás un resumen de toda tu actividad legal.',
        features: [
          'Resumen de casos activos y su estado',
          'Notificaciones y alertas importantes',
          'Próximos recordatorios y audiencias',
          'Estadísticas de rendimiento',
          'Accesos rápidos a funciones principales'
        ],
        tips: [
          'Revisa el dashboard cada mañana para estar al día',
          'Las tarjetas son clicables para ver más detalles',
          'Puedes personalizar qué widgets ver en configuración'
        ]
      }
    },
    {
      id: 'cases',
      title: 'Gestión de Casos',
      icon: Briefcase,
      content: {
        description: 'Administra todos tus casos legales desde un solo lugar.',
        features: [
          'Agregar casos por número de radicado',
          'Ver información completa: anotaciones, ciudad, partes',
          'Monitoreo automático de actuaciones',
          'Notificaciones de cambios importantes',
          'Historial completo de cada proceso'
        ],
        steps: [
          { step: 1, text: 'Ir a "Casos" en el menú lateral' },
          { step: 2, text: 'Click en "Agregar caso"' },
          { step: 3, text: 'Ingresar número de radicado' },
          { step: 4, text: 'El sistema buscará la información automáticamente' },
          { step: 5, text: 'Revisa las actuaciones y recibe notificaciones' }
        ],
        tips: [
          'El sistema sincroniza automáticamente con Rama Judicial',
          'Puedes marcar actuaciones como leídas',
          'Las notificaciones aparecen en tiempo real'
        ]
      }
    },
    {
      id: 'documents',
      title: 'Gestión Documental',
      icon: FileText,
      content: {
        description: 'Organiza, almacena y comparte documentos legales de forma segura.',
        features: [
          'Subir documentos (PDF, Word, etc.)',
          'Organizar por casos o categorías',
          'Compartir con clientes mediante links',
          'Control de versiones',
          'Búsqueda avanzada de documentos'
        ],
        tips: [
          'Usa nombres descriptivos para tus documentos',
          'Organiza por carpetas de casos',
          'Los links de compartir expiran por seguridad'
        ]
      }
    },
    {
      id: 'ai',
      title: 'Asistente con IA',
      icon: Bot,
      content: {
        description: 'Tu asistente legal inteligente powered by Gemini AI.',
        features: [
          'Consultas legales en lenguaje natural',
          'Redacción de documentos jurídicos',
          'Análisis de jurisprudencia',
          'Predicción de resultados de casos',
          'Soporte multimodal (voz, PDF, imágenes)'
        ],
        examples: [
          '¿Cómo redactar una demanda de tutela?',
          'Explícame el proceso de sucesión en Colombia',
          'Ayúdame con un contrato laboral',
          'Analiza este PDF legal (sube archivo)'
        ],
        tips: [
          'Sé específico en tus preguntas',
          'Puedes subir documentos para análisis',
          'El historial de chat se guarda automáticamente'
        ]
      }
    },
    {
      id: 'marketplace',
      title: 'Marketplace de Abogados',
      icon: ShoppingBag,
      content: {
        description: 'Conecta con abogados especializados para tus casos.',
        features: [
          'Búsqueda por especialidad y ciudad',
          'Sistema de matching inteligente (score)',
          'Perfiles verificados con ratings',
          'Historial de casos ganados',
          'Pagos seguros con escrow'
        ],
        steps: [
          { step: 1, text: 'Publicar tu caso o buscar abogados' },
          { step: 2, text: 'Filtrar por especialidad, ciudad, tarifa' },
          { step: 3, text: 'Ver match score y perfiles' },
          { step: 4, text: 'Contratar al abogado ideal' },
          { step: 5, text: 'Pago seguro con sistema escrow' }
        ],
        tips: [
          'El match score considera múltiples factores',
          'Los abogados verificados tienen badge especial',
          'Puedes ver reviews de otros clientes'
        ]
      }
    },
    {
      id: 'billing',
      title: 'Facturación',
      icon: DollarSign,
      content: {
        description: 'Gestiona facturas y control financiero de forma profesional.',
        features: [
          'Crear facturas electrónicas',
          'Integración con DIAN',
          'Control de pagos y vencimientos',
          'Reportes financieros',
          'Descarga en PDF'
        ],
        tips: [
          'Marca facturas como pagadas al recibir pago',
          'Las facturas vencidas se resaltan en rojo',
          'Puedes exportar reportes mensuales'
        ]
      }
    },
    {
      id: 'analytics',
      title: 'Analytics y Reportes',
      icon: BarChart3,
      content: {
        description: 'Analiza el rendimiento de tu práctica legal con datos.',
        features: [
          'Estadísticas de casos',
          'Tiempo invertido por caso',
          'Ingresos y facturación',
          'Tasas de éxito',
          'Reportes personalizables'
        ],
        tips: [
          'Revisa analytics mensualmente',
          'Identifica áreas de mejora',
          'Usa los datos para tomar decisiones'
        ]
      }
    }
  ];

  const currentSection = sections.find(s => s.id === activeSection);
  const Icon = currentSection?.icon || BookOpen;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-navy-900">Tutorial y Guía Completa</h1>
          <p className="text-slate-600 mt-1">
            Aprende a usar Arconte como un profesional
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Menu */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <h3 className="font-semibold text-navy-900 mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-gold-500" />
                Secciones
              </h3>
              <nav className="space-y-1">
                {sections.map(section => {
                  const SectionIcon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeSection === section.id
                          ? 'bg-gold-50 text-gold-700 font-medium'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <SectionIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">{section.title}</span>
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 p-3">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-navy-900">{currentSection?.title}</h2>
                  <p className="text-slate-600">{currentSection?.content.description}</p>
                </div>
              </div>

              {/* Features */}
              {currentSection?.content.features && (
                <div className="mb-6">
                  <h3 className="font-semibold text-navy-800 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success-500" />
                    Funcionalidades principales
                  </h3>
                  <ul className="space-y-2">
                    {currentSection.content.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <ChevronRight className="h-5 w-5 text-gold-500 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Steps */}
              {currentSection?.content.steps && (
                <div className="mb-6">
                  <h3 className="font-semibold text-navy-800 mb-3 flex items-center gap-2">
                    <Play className="h-5 w-5 text-primary-500" />
                    Pasos a seguir
                  </h3>
                  <div className="space-y-3">
                    {currentSection.content.steps.map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold">
                          {item.step}
                        </div>
                        <p className="text-slate-700 pt-1">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Examples */}
              {currentSection?.content.examples && (
                <div className="mb-6">
                  <h3 className="font-semibold text-navy-800 mb-3">Ejemplos de uso</h3>
                  <div className="space-y-2">
                    {currentSection.content.examples.map((example, index) => (
                      <div key={index} className="bg-slate-50 rounded-lg px-4 py-2 border border-slate-200">
                        <p className="text-sm text-slate-700 italic">"{example}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              {currentSection?.content.tips && (
                <div className="bg-gold-50 rounded-lg p-4 border border-gold-200">
                  <h3 className="font-semibold text-gold-900 mb-3 flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Consejos pro
                  </h3>
                  <ul className="space-y-2">
                    {currentSection.content.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-gold-600">💡</span>
                        <span className="text-gold-900 text-sm">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// Import for icon
import { LayoutDashboard } from 'lucide-react';
