import React from 'react';
import ActivityTable from './ActivityTable';

type Party = {
  id?: number;
  role?: string;
  name?: string;
};

type Act = {
  id?: number;
  date?: string;
  type?: string;
  title?: string;
};

type Props = {
  data: {
    id: number;
    radicado: string;
    estado_actual?: string;
    parties?: Party[];
    acts?: Act[];
  };
};

export default function CaseDetail({ data }: Props) {
  return (
    <div>
      <p><strong>Radicado:</strong> {data.radicado}</p>
      <p><strong>Estado actual:</strong> {data.estado_actual || 'N/D'}</p>

      {data.parties && data.parties.length > 0 && (
        <div>
          <h3>Partes</h3>
          <ul>
            {data.parties.map((party, index) => (
              <li key={party.id ?? index}>
                <strong>{party.role ?? 'Parte'}:</strong> {party.name ?? '—'}
              </li>
            ))}
          </ul>
        </div>
      )}

      <h3>Actuaciones</h3>
      <ActivityTable actuaciones={(data.acts ?? []).map((act) => ({
        fecha: act.date,
        tipo: act.type,
        descripcion: act.title,
      }))} />
    </div>
  );
}
