export type Party = { role?: string; name?: string };
export type Act = { date?: string; title?: string };

export type CaseApi = {
  id: number;
  radicado: string;
  estado_actual?: string;
  last_checked_at?: string;
  has_unread?: boolean;
  parties?: Party[];
  acts?: Act[];
};

export type CaseUi = {
  id: number;
  radicado: string;
  status?: string;
  updated_at?: string;
  has_unread?: boolean;
  parties?: Party[];
  acts?: Act[];
};

export function normalizeCase(c: CaseApi): CaseUi {
  return {
    id: c.id,
    radicado: c.radicado,
    status: c.estado_actual,
    updated_at: c.last_checked_at,
    has_unread: c.has_unread,
    parties: c.parties,
    acts: c.acts,
  };
}

export function normalizeList(list: CaseApi[] = []): CaseUi[] {
  return list.map(normalizeCase);
}