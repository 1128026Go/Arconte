import React from 'react';

interface Act {
  id?: number;
  fecha?: string;
  tipo?: string;
  descripcion?: string;
}

interface Props {
  actuaciones: Act[];
}

export default function ActivityTable({ actuaciones }: Props) {
  if (!actuaciones || actuaciones.length === 0) {
    return <p>No hay actuaciones registradas.</p>;
  }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left', padding: '0.5rem' }}>Fecha</th>
          <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left', padding: '0.5rem' }}>Tipo</th>
          <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left', padding: '0.5rem' }}>DescripciÃ³n</th>
        </tr>
      </thead>
      <tbody>
        {actuaciones.map((act, index) => (
          <tr key={index}>
            <td style={{ borderBottom: '1px solid #eee', padding: '0.5rem' }}>{act.fecha || '-'}</td>
            <td style={{ borderBottom: '1px solid #eee', padding: '0.5rem' }}>{act.tipo || '-'}</td>
            <td style={{ borderBottom: '1px solid #eee', padding: '0.5rem' }}>{act.descripcion || '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
