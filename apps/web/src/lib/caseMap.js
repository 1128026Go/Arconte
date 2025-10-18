/**
 * Normaliza un caso de la API al formato de la UI
 * @param {Object} c - Caso desde la API
 * @returns {Object} - Caso normalizado para la UI
 */
export function normalizeCase(c) {
  return {
    id: c.id,
    radicado: c.radicado,
    status: c.estado_actual,
    tipo_proceso: c.tipo_proceso,
    despacho: c.despacho,
    updated_at: c.last_checked_at,
    has_unread: c.has_unread,
    parties: c.parties,
    acts: c.acts,
  };
}

/**
 * Normaliza una lista de casos de la API al formato de la UI
 * @param {Array} list - Lista de casos desde la API
 * @returns {Array} - Lista de casos normalizados para la UI
 */
export function normalizeList(list = []) {
  return list.map(normalizeCase);
}