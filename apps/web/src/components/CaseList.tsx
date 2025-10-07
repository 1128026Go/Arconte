import React from 'react';
import { Link } from 'react-router-dom';

interface Case {
  id: number;
  radicado: string;
  estado_actual?: string;
}

interface Props {
  cases: Case[];
}

/**
 * Lista simple de procesos.  Cada elemento enlaza a la pÃ¡gina de detalle
 * usando su identificador.
 */
export default function CaseList({ cases }: Props) {
  if (!cases || cases.length === 0) {
    return <p>No hay procesos registrados.</p>;
  }
  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {cases.map((c) => (
        <li key={c.id} style={{ marginBottom: '0.5rem' }}>
          <Link to={`/cases/${c.id}`}>{c.radicado}</Link> - {c.estado_actual || 'Sin estado'}
        </li>
      ))}
    </ul>
  );
}
