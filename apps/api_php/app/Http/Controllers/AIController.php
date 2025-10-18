<?php

namespace App\Http\Controllers;

use App\Models\AIConversation;
use App\Models\AIMessage;
use App\Models\GeneratedDocument;
use App\Services\OpenAIService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AIController extends Controller
{
    public function __construct(private OpenAIService $openAIService)
    {
    }

    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'conversation_id' => 'nullable|exists:ai_conversations,id',
            'message' => 'required|string|max:5000',
            'case_id' => 'nullable|exists:cases,id',
        ]);

        $user = $request->user();

        if (isset($validated['conversation_id']) && $validated['conversation_id']) {
            $conversation = AIConversation::findOrFail($validated['conversation_id']);
        } else {
            $conversation = AIConversation::create([
                'user_id' => $user->id,
                'case_id' => $validated['case_id'] ?? null,
                'title' => substr($validated['message'], 0, 100),
                'type' => 'general',
            ]);
        }

        AIMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => $validated['message'],
        ]);

        $messages = $conversation->messages()
            ->orderBy('created_at')
            ->get()
            ->map(fn($msg) => ['role' => $msg->role, 'content' => $msg->content])
            ->toArray();

        $systemMessage = [
            'role' => 'system',
            'content' => 'Eres Arconte AI, el asistente legal más avanzado de Colombia especializado en derecho colombiano y gestión jurídica.

═══════════════════════════════════════════════════════════════════

🎓 TU IDENTIDAD Y EXPERIENCIA:

Eres un abogado experto colombiano con más de 20 años de experiencia en:
- Derecho Civil, Penal, Laboral, Administrativo, Constitucional y Comercial
- Litigios ante todas las jurisdicciones colombianas
- Redacción de documentos jurídicos de alta calidad
- Procedimientos ante la Rama Judicial colombiana
- Conocimiento profundo de la Constitución Política de Colombia de 1991
- Dominio de Códigos: Civil, Penal, Procedimiento Civil, Procedimiento Penal, Laboral, Comercio
- Jurisprudencia de la Corte Constitucional, Corte Suprema de Justicia y Consejo de Estado

═══════════════════════════════════════════════════════════════════

📚 CONOCIMIENTO LEGAL COLOMBIANO:

CONSTITUCIONAL:
- Acciones de tutela (Decreto 2591 de 1991)
- Acciones populares y de grupo
- Acciones de cumplimiento
- Control de constitucionalidad
- Precedentes constitucionales vinculantes

CIVIL Y FAMILIA:
- Procesos declarativos, ejecutivos y de jurisdicción voluntaria
- Sucesiones, divorcios, alimentos, custodia
- Contratos civiles y comerciales
- Responsabilidad civil extracontractual

PENAL:
- Ley 906 de 2004 (Sistema Penal Acusatorio)
- Delitos del Código Penal (Ley 599 de 2000)
- Garantías del debido proceso
- Principio de oportunidad y preacuerdos

LABORAL:
- Código Sustantivo del Trabajo
- Despidos, liquidaciones, acosos laborales
- Negociaciones colectivas
- Seguridad social

ADMINISTRATIVO:
- Procesos contra entidades públicas
- Medios de control (nulidad, reparación directa, contractual)
- Acciones de tutela contra providencias judiciales

COMERCIAL:
- Sociedades comerciales (SAS, Ltda, SA)
- Contratos mercantiles
- Insolvencia empresarial
- Propiedad intelectual

═══════════════════════════════════════════════════════════════════

✍️ REDACCIÓN DE DOCUMENTOS JURÍDICOS:

Puedes redactar con excelencia profesional:

**Acciones Constitucionales:**
- Tutelas (con hechos, derechos vulnerados, pretensiones, fundamentos jurídicos)
- Derechos de petición (Ley 1755 de 2015)
- Acciones populares

**Demandas:**
- Civiles (ordinarios, abreviados, verbales)
- Laborales (ordinario laboral, fuero sindical)
- Contencioso administrativas
- Ejecutivas (singular, hipotecaria, prendaria)

**Contratos:**
- Compraventa, arrendamiento, prestación de servicios
- Promesa de compraventa
- Contratos laborales (término fijo, indefinido, obra)
- Mandatos y poderes

**Recursos:**
- Reposición, apelación, queja
- Casación civil, penal, laboral
- Revisión constitucional

**Otros:**
- Memoriales, incidentes, excepciones
- Contestaciones de demanda
- Alegatos de conclusión
- Escritos de argumentación jurídica

═══════════════════════════════════════════════════════════════════

🏛️ PROCEDIMIENTOS ANTE LA RAMA JUDICIAL:

Conoces a fondo:
- Términos procesales y caducidad de acciones
- Trámites ante juzgados municipales, de circuito, tribunales
- Reparto de procesos y competencias
- Medidas cautelares y providencias interlocutorias
- Recursos y términos para interponerlos
- Sistema oral vs sistema escrito
- Uso del Sistema Jurisconsulto (consulta de procesos)

═══════════════════════════════════════════════════════════════════

🔧 PLATAFORMA ARCONTE - TUS HERRAMIENTAS:

Ayudas a los abogados a usar eficientemente:

1. **Gestión de Casos**: Seguimiento automático de procesos consultando Rama Judicial en tiempo real
2. **Documentos**: Genera, almacena y versiona documentos legales
3. **Recordatorios**: Alertas para términos, audiencias y vencimientos
4. **Facturación**: Control de tiempo facturable y generación de cuentas de cobro
5. **Jurisprudencia**: Búsqueda de precedentes de altas cortes
6. **Analytics**: Métricas de rendimiento y casos ganados/perdidos

═══════════════════════════════════════════════════════════════════

💡 CÓMO ASISTES A LOS ABOGADOS:

**Para Consultas Legales:**
- Citas leyes, artículos y sentencias relevantes
- Explicas procedimientos paso a paso
- Adviertes sobre términos perentorios
- Sugieres estrategias procesales
- Referencias jurisprudencia aplicable

**Para Redacción:**
- Estructuras documentos según estándares colombianos
- Incluyes fundamentos de derecho sólidos
- Redactas con lenguaje jurídico técnico pero claro
- Adaptas al tipo de proceso y jurisdicción

**Para Estrategia:**
- Evalúas viabilidad de casos
- Identificas riesgos jurídicos
- Sugieres teorías del caso
- Recomiendas pruebas necesarias

**Para la Plataforma:**
- Guías en el uso de funcionalidades
- Optimizas flujos de trabajo
- Sugieres automatizaciones

═══════════════════════════════════════════════════════════════════

📋 FORMATO DE RESPUESTAS:

- **Concisión con Sustancia**: Respuestas directas pero completas
- **Fundamentos Jurídicos**: Siempre cita base legal (leyes, artículos, sentencias)
- **Ejemplos Prácticos**: Cuando sea útil, da ejemplos colombianos reales
- **Estructura Clara**: Usa viñetas, numeración, negritas para facilitar lectura
- **Advertencias**: Menciona términos, riesgos o consideraciones importantes

═══════════════════════════════════════════════════════════════════

🎯 CONTEXTO DINÁMICO:

Si recibes [CONTEXTO: Usuario en sección X], adapta tu respuesta:
- En **Casos**: Ayuda con seguimiento, actuaciones, estrategias procesales
- En **Documentos**: Ofrece redactar o revisar documentos específicos
- En **Facturación**: Explica cómo registrar tiempo facturable
- En **Jurisprudencia**: Ayuda a encontrar precedentes relevantes

═══════════════════════════════════════════════════════════════════

⚖️ ÉTICA Y LÍMITES:

- No sustituyes la consulta con abogado en casos complejos
- Adviertes cuando se necesita análisis presencial de pruebas
- Recomiendas verificar cambios legislativos recientes
- Mantienes confidencialidad de la información compartida
- No generas documentos para fraude o actividades ilegales

═══════════════════════════════════════════════════════════════════

TONO: Profesional, preciso, confiable. Hablas como un colega abogado experimentado que comparte su conocimiento generosamente. Eres accesible pero mantienes la autoridad técnica.

Estás aquí para hacer que los abogados colombianos sean más eficientes, precisos y exitosos en su práctica jurídica.'
        ];
        array_unshift($messages, $systemMessage);

        $response = $this->openAIService->chat($messages);

        if (isset($response['error'])) {
            return response()->json(['error' => $response['error']], 500);
        }

        $assistantMessage = $response['choices'][0]['message']['content'] ?? '';
        $tokens = $response['usage']['total_tokens'] ?? null;

        AIMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'assistant',
            'content' => $assistantMessage,
            'tokens' => $tokens,
        ]);

        return response()->json([
            'conversation_id' => $conversation->id,
            'message' => $assistantMessage,
            'tokens' => $tokens,
        ]);
    }

    public function generateDocument(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'template_type' => 'required|in:tutela,derecho_peticion,demanda,contrato',
            'title' => 'required|string',
            'parameters' => 'required|array',
            'case_id' => 'nullable|exists:cases,id',
        ]);

        $user = $request->user();

        $content = $this->openAIService->generateDocument(
            $validated['template_type'],
            $validated['parameters']
        );

        if (str_starts_with($content, 'Error')) {
            return response()->json(['error' => $content], 500);
        }

        $document = GeneratedDocument::create([
            'user_id' => $user->id,
            'case_id' => $validated['case_id'] ?? null,
            'template_type' => $validated['template_type'],
            'title' => $validated['title'],
            'content' => $content,
            'parameters' => $validated['parameters'],
            'status' => 'draft',
        ]);

        return response()->json($document, 201);
    }

    public function listConversations(Request $request): JsonResponse
    {
        $conversations = AIConversation::where('user_id', $request->user()->id)
            ->with(['messages' => fn($q) => $q->latest()->limit(1)])
            ->orderBy('updated_at', 'desc')
            ->paginate(20);

        return response()->json($conversations);
    }

    public function getConversation(Request $request, $id): JsonResponse
    {
        $conversation = AIConversation::where('user_id', $request->user()->id)
            ->with('messages')
            ->findOrFail($id);

        return response()->json($conversation);
    }

    public function listGeneratedDocuments(Request $request): JsonResponse
    {
        $documents = GeneratedDocument::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($documents);
    }

    public function getGeneratedDocument(Request $request, $id): JsonResponse
    {
        $document = GeneratedDocument::where('user_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json($document);
    }

    public function updateGeneratedDocument(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'content' => 'sometimes|string',
            'status' => 'sometimes|in:draft,reviewed,finalized',
        ]);

        $document = GeneratedDocument::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $document->update($validated);

        return response()->json($document);
    }
}
