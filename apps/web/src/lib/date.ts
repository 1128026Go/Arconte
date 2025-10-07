export function fmtDate(s?: string | number | Date) {
  if (!s) return "â€”";
  const d = new Date(s);
  const ts = d.getTime();
  if (isNaN(ts)) return "â€”";
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(d);
}
