/**
 * Formatea una fecha en formato legible en español colombiano
 * @param {string | number | Date} s - La fecha a formatear
 * @returns {string} - Fecha formateada o "—" si es inválida
 */
export function fmtDate(s) {
  if (!s) return "—";
  const d = new Date(s);
  const ts = d.getTime();
  if (isNaN(ts)) return "—";
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(d);
}