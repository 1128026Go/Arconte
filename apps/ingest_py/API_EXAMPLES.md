# 📡 Ejemplos de Uso de la API de Vigilancia de Autos

## Endpoints Disponibles

### 1. Analizar Radicado (Detectar Autos)

**Endpoint**: `GET /autos/analyze/{radicado}`

**Descripción**: Consulta un proceso judicial y detecta/clasifica todos sus autos.

**Ejemplo 1: Análisis sin notificaciones**

```bash
curl http://localhost:8001/autos/analyze/11001310300020230012300
```

**Respuesta:**
```json
{
  "ok": true,
  "radicado": "11001310300020230012300",
  "total_actuaciones": 15,
  "autos_detectados": 5,
  "autos_perentorios": [
    {
      "fecha": "2024-03-15",
      "tipo": "Auto",
      "descripcion": "AUTO CONFIERE TRASLADO por 10 días para contestar demanda",
      "documento_url": "https://...",
      "is_auto": true,
      "auto_type": "perentorio",
      "requires_action": true,
      "classification_confidence": 0.8
    },
    {
      "fecha": "2024-02-20",
      "tipo": "Auto",
      "descripcion": "AUTO REQUIERE presentar pruebas dentro de 5 días",
      "documento_url": null,
      "is_auto": true,
      "auto_type": "perentorio",
      "requires_action": true,
      "classification_confidence": 0.9
    }
  ],
  "autos_tramite": [
    {
      "fecha": "2024-01-10",
      "tipo": "Auto",
      "descripcion": "AUTO ADMITE demanda",
      "documento_url": null,
      "is_auto": true,
      "auto_type": "tramite",
      "requires_action": false,
      "classification_confidence": 0.7
    }
  ],
  "notificaciones_enviadas": false
}
```

**Ejemplo 2: Análisis con notificaciones**

```bash
curl "http://localhost:8001/autos/analyze/11001310300020230012300?notify=true"
```

Misma respuesta pero con `"notificaciones_enviadas": true`. Las notificaciones se envían automáticamente para cada auto perentorio detectado.

---

### 2. Historial de Autos

**Endpoint**: `GET /autos/history/{radicado}`

**Descripción**: Obtiene el historial completo de autos de un proceso (ordenados por fecha, más recientes primero).

**Ejemplo:**

```bash
curl http://localhost:8001/autos/history/11001310300020230012300
```

**Respuesta:**
```json
{
  "ok": true,
  "radicado": "11001310300020230012300",
  "total_autos": 5,
  "autos": [
    {
      "fecha": "2024-03-15",
      "tipo": "Auto",
      "descripcion": "AUTO CONFIERE TRASLADO...",
      "auto_type": "perentorio",
      "requires_action": true,
      "classification_confidence": 0.8
    },
    {
      "fecha": "2024-03-10",
      "tipo": "Auto",
      "descripcion": "AUTO TÉNGASE POR notificado...",
      "auto_type": "tramite",
      "requires_action": false,
      "classification_confidence": 0.6
    }
    // ... más autos
  ]
}
```

---

### 3. Escaneo Manual de Múltiples Radicados

**Endpoint**: `POST /autos/scan`

**Descripción**: Dispara un escaneo manual de varios radicados simultáneamente. Útil para vigilancia on-demand.

**Ejemplo:**

```bash
curl -X POST "http://localhost:8001/autos/scan?radicados=11001310300020230012300&radicados=11001310300020230012301&radicados=11001310300020230012302"
```

**Respuesta:**
```json
{
  "ok": true,
  "total_escaneados": 3,
  "resultados": [
    {
      "radicado": "11001310300020230012300",
      "ok": true,
      "autos_perentorios": 2,
      "total_autos": 5
    },
    {
      "radicado": "11001310300020230012301",
      "ok": true,
      "autos_perentorios": 0,
      "total_autos": 3
    },
    {
      "radicado": "11001310300020230012302",
      "ok": false,
      "error": "Radicado no encontrado"
    }
  ]
}
```

Las notificaciones se envían automáticamente para cada auto perentorio encontrado.

---

## Integración con Frontend

### React/Next.js

```typescript
// services/autosService.ts

export interface AutoPerentorio {
  fecha: string;
  tipo: string;
  descripcion: string;
  auto_type: 'perentorio' | 'tramite';
  requires_action: boolean;
  classification_confidence: number;
}

export interface AnalysisResponse {
  ok: boolean;
  radicado: string;
  total_actuaciones: number;
  autos_detectados: number;
  autos_perentorios: AutoPerentorio[];
  autos_tramite: AutoPerentorio[];
  notificaciones_enviadas: boolean;
}

export async function analyzeRadicado(
  radicado: string,
  notify: boolean = false
): Promise<AnalysisResponse> {
  const response = await fetch(
    `http://localhost:8001/autos/analyze/${radicado}?notify=${notify}`
  );

  if (!response.ok) {
    throw new Error('Error analizando radicado');
  }

  return response.json();
}

export async function getAutoHistory(radicado: string) {
  const response = await fetch(
    `http://localhost:8001/autos/history/${radicado}`
  );

  if (!response.ok) {
    throw new Error('Error obteniendo historial');
  }

  return response.json();
}

export async function scanMultipleRadicados(radicados: string[]) {
  const params = radicados.map(r => `radicados=${r}`).join('&');
  const response = await fetch(
    `http://localhost:8001/autos/scan?${params}`,
    { method: 'POST' }
  );

  if (!response.ok) {
    throw new Error('Error en escaneo múltiple');
  }

  return response.json();
}
```

**Componente de ejemplo:**

```tsx
// components/AutosAlert.tsx
import { useEffect, useState } from 'react';
import { analyzeRadicado, AutoPerentorio } from '@/services/autosService';

export function AutosAlert({ radicado }: { radicado: string }) {
  const [autosPerentorios, setAutosPerentorios] = useState<AutoPerentorio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAutos() {
      try {
        const result = await analyzeRadicado(radicado, false);
        setAutosPerentorios(result.autos_perentorios);
      } catch (error) {
        console.error('Error checking autos:', error);
      } finally {
        setLoading(false);
      }
    }

    checkAutos();
  }, [radicado]);

  if (loading) return <div>Verificando autos...</div>;

  if (autosPerentorios.length === 0) {
    return <div className="text-green-600">✓ Sin autos perentorios pendientes</div>;
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded p-4">
      <h3 className="text-red-800 font-bold mb-2">
        🔴 {autosPerentorios.length} Auto(s) Perentorio(s) Detectado(s)
      </h3>

      {autosPerentorios.map((auto, idx) => (
        <div key={idx} className="mb-2 p-2 bg-white rounded">
          <div className="text-sm text-gray-600">{auto.fecha}</div>
          <div className="font-medium">{auto.tipo}</div>
          <div className="text-sm">{auto.descripcion}</div>
          <div className="text-xs text-red-600 mt-1">
            ⚠️ Requiere actuación urgente
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

### PHP/Laravel

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class AutosVigilanciaService
{
    private $baseUrl = 'http://localhost:8001';

    public function analyzeRadicado(string $radicado, bool $notify = false): array
    {
        $response = Http::get("{$this->baseUrl}/autos/analyze/{$radicado}", [
            'notify' => $notify
        ]);

        return $response->json();
    }

    public function getAutoHistory(string $radicado): array
    {
        $response = Http::get("{$this->baseUrl}/autos/history/{$radicado}");
        return $response->json();
    }

    public function scanMultiple(array $radicados): array
    {
        $response = Http::post("{$this->baseUrl}/autos/scan", [], [
            'query' => ['radicados' => $radicados]
        ]);

        return $response->json();
    }

    public function hasAutosPerentorios(string $radicado): bool
    {
        $result = $this->analyzeRadicado($radicado);
        return count($result['autos_perentorios'] ?? []) > 0;
    }
}
```

**Uso en controlador:**

```php
<?php

namespace App\Http\Controllers;

use App\Services\AutosVigilanciaService;
use Illuminate\Http\Request;

class ExpedienteController extends Controller
{
    private $autosService;

    public function __construct(AutosVigilanciaService $autosService)
    {
        $this->autosService = $autosService;
    }

    public function show($radicado)
    {
        // Obtener datos del expediente
        $expediente = Expediente::where('radicado', $radicado)->first();

        // Verificar autos perentorios
        $autosAnalysis = $this->autosService->analyzeRadicado($radicado);

        return view('expediente.show', [
            'expediente' => $expediente,
            'autos_perentorios' => $autosAnalysis['autos_perentorios'],
            'tiene_autos_urgentes' => count($autosAnalysis['autos_perentorios']) > 0
        ]);
    }

    public function scanAll(Request $request)
    {
        $radicados = Expediente::where('estado', 'activo')
            ->pluck('radicado')
            ->toArray();

        $resultados = $this->autosService->scanMultiple($radicados);

        return response()->json($resultados);
    }
}
```

---

### Python

```python
import httpx
from typing import List, Dict, Any

class AutosVigilanciaClient:
    """Cliente Python para el API de vigilancia de autos."""

    def __init__(self, base_url: str = "http://localhost:8001"):
        self.base_url = base_url
        self.client = httpx.AsyncClient()

    async def analyze_radicado(
        self,
        radicado: str,
        notify: bool = False
    ) -> Dict[str, Any]:
        """Analiza un radicado para detectar autos."""
        response = await self.client.get(
            f"{self.base_url}/autos/analyze/{radicado}",
            params={"notify": notify}
        )
        response.raise_for_status()
        return response.json()

    async def get_history(self, radicado: str) -> Dict[str, Any]:
        """Obtiene historial de autos."""
        response = await self.client.get(
            f"{self.base_url}/autos/history/{radicado}"
        )
        response.raise_for_status()
        return response.json()

    async def scan_multiple(self, radicados: List[str]) -> Dict[str, Any]:
        """Escanea múltiples radicados."""
        params = [("radicados", r) for r in radicados]
        response = await self.client.post(
            f"{self.base_url}/autos/scan",
            params=params
        )
        response.raise_for_status()
        return response.json()

    async def close(self):
        """Cierra el cliente HTTP."""
        await self.client.aclose()


# Uso
async def main():
    client = AutosVigilanciaClient()

    try:
        # Analizar un radicado
        result = await client.analyze_radicado("11001310300020230012300")

        if result["autos_perentorios"]:
            print(f"🔴 {len(result['autos_perentorios'])} autos perentorios!")
            for auto in result["autos_perentorios"]:
                print(f"  - {auto['fecha']}: {auto['descripcion']}")

        # Obtener historial
        history = await client.get_history("11001310300020230012300")
        print(f"Total de autos históricos: {history['total_autos']}")

    finally:
        await client.close()


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

## Testing con curl

### Test completo

```bash
#!/bin/bash

RADICADO="11001310300020230012300"
BASE_URL="http://localhost:8001"

echo "=== Test 1: Análisis sin notificaciones ==="
curl -s "$BASE_URL/autos/analyze/$RADICADO" | jq .

echo -e "\n=== Test 2: Historial de autos ==="
curl -s "$BASE_URL/autos/history/$RADICADO" | jq .

echo -e "\n=== Test 3: Análisis con notificaciones ==="
curl -s "$BASE_URL/autos/analyze/$RADICADO?notify=true" | jq .

echo -e "\n=== Test 4: Escaneo múltiple ==="
curl -s -X POST "$BASE_URL/autos/scan?radicados=$RADICADO&radicados=11001310300020230012301" | jq .
```

---

## Webhooks (Implementación futura)

Para notificaciones en tiempo real, se puede configurar un webhook:

```json
POST /webhooks/autos/perentorio
{
  "radicado": "11001310300020230012300",
  "auto": {
    "fecha": "2024-03-15",
    "tipo": "Auto",
    "descripcion": "AUTO REQUIERE...",
    "auto_type": "perentorio"
  },
  "timestamp": "2024-03-15T10:30:00Z"
}
```

---

## Monitoreo y Logs

### Ver logs en tiempo real

```bash
# Ver logs del scheduler
tail -f logs/scheduler.log

# Filtrar solo autos perentorios
tail -f logs/scheduler.log | grep "PERENTORIO"

# Ver notificaciones enviadas
tail -f logs/notifications.log
```

### Métricas útiles

```bash
# Contar autos perentorios detectados hoy
grep "PERENTORIO detectado" logs/scheduler.log | grep "$(date +%Y-%m-%d)" | wc -l

# Ver últimos 10 autos detectados
grep "Auto.*detectado" logs/scheduler.log | tail -10
```

---

## Troubleshooting API

### Error 502: No se puede conectar al backend

**Causa**: El microservicio no puede acceder a la Rama Judicial.

**Solución**:
- Verificar conexión a internet
- Revisar si la Rama Judicial está disponible
- Aumentar timeout en configuración

### Error 404: Radicado no encontrado

**Causa**: El radicado no existe o está mal formateado.

**Solución**:
- Verificar formato del radicado (23 dígitos)
- Confirmar que existe en la Rama Judicial

### No se detectan autos

**Causa**: Palabras clave no coinciden o formato diferente.

**Solución**:
- Revisar logs: `grep "Clasificación" logs/app.log`
- Agregar nuevas palabras clave en `auto_classifier.py`
- Ajustar patrones regex

---

Para más información, consultar la documentación completa en `AUTOS_VIGILANCIA.md`.
