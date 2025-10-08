import React, { useEffect, useState } from "react";
import { listCases, createCase, markRead } from "../lib/api";
import { fmtDate } from "../lib/date";
import { normalizeList } from '../lib/caseMap';
import MainLayout from '../components/Layout/MainLayout';

export default function CasesPage() {
  const [items, setItems] = useState([]);
  const [radicado, setRadicado] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try { 
      const raw = await listCases(); 
      setItems(normalizeList(raw)); 
    }
    catch (e) { setErr(e.message); }
  }

  useEffect(() => { load(); }, []);

  async function addCase(e) {
    e.preventDefault();
    if (!radicado.trim()) return;
    setSaving(true);
    setErr("");
    try {
      await createCase(radicado.trim());
      setRadicado("");
      const raw = await listCases(); 
      setItems(normalizeList(raw));
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <MainLayout>
      <header style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 24}}>
        <h1 style={{fontSize: 28, fontWeight: 700}}>Mis Procesos ({items.length})</h1>
      </header>

      <form onSubmit={addCase} style={{display:"flex", gap:8, marginBottom:16}}>
        <input
          value={radicado}
          onChange={e=>setRadicado(e.target.value)}
          placeholder="Número de radicado"
          aria-label="Número de radicado"
          style={{flex:1, border:"1px solid #ddd", borderRadius:6, padding:"8px 10px"}}
        />
        <button type="submit" disabled={saving}
          style={{padding:"8px 12px", borderRadius:6, background:"#111", color:"#fff", opacity: saving?0.6:1}}>
          {saving ? "Agregando…" : "Agregar caso"}
        </button>
      </form>

      {err ? <div style={{color:"#b91c1c", marginBottom:12}}>Error: {err}</div> : null}

      <ul style={{display:"grid", gap:12, listStyle:"none", padding:0}}>
        {items.map(c => (
          <li key={c.id} style={{border:"1px solid #e5e7eb", borderRadius:10, padding:12}}>
            <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
              <div style={{fontWeight:600}}>
                <a
                  href={`/cases/${c.id}`}
                  style={{textDecoration:"none", color:"#111"}}
                >
                  {c.radicado}
                </a>
                {c.has_unread && (
                  <span style={{
                    marginLeft: 8,
                    backgroundColor: "#dc2626",
                    color: "white",
                    fontSize: "10px",
                    padding: "2px 6px",
                    borderRadius: "10px"
                  }}>
                    NUEVO
                  </span>
                )}
              </div>
              <div style={{fontSize:12, color:"#555"}}>Última actualización: {fmtDate(c.updated_at)}</div>
            </div>
            <div style={{marginTop:4, fontSize:14}}>Estado: {c.status ?? "—"}</div>
            {c.tipo_proceso && <div style={{marginTop:4, fontSize:14}}>Tipo de proceso: {c.tipo_proceso}</div>}
            {c.despacho && <div style={{marginTop:4, fontSize:14}}>Ciudad/Despacho: {c.despacho}</div>}

            {c.parties?.length ? (
              <div style={{marginTop:8}}>
                <div style={{fontSize:13, fontWeight:600}}>Partes</div>
                <ul style={{margin:0, paddingLeft:18}}>
                  {c.parties.slice(0,4).map((p,i)=>(
                    <li key={i} style={{fontSize:13}}>{p.role ?? "Parte"}: {p.name ?? "—"}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {c.acts?.length ? (
              <div style={{marginTop:8}}>
                <div style={{fontSize:13, fontWeight:600}}>Anotaciones y Actuaciones ({c.acts.length})</div>
                <ul style={{margin:0, paddingLeft:18, marginTop:4}}>
                  {c.acts.slice(0,5).map((a,i)=>(
                    <li key={i} style={{fontSize:13, marginTop:4}}>
                      <strong>{fmtDate(a.date)}</strong> — {a.title ?? "Actuación"}
                      {a.type && <span style={{marginLeft:6, fontSize:11, color:"#6b7280"}}>({a.type})</span>}
                    </li>
                  ))}
                  {c.acts.length > 5 && (
                    <li style={{fontSize:12, color:"#6b7280", marginTop:4}}>
                      + {c.acts.length - 5} actuaciones más
                    </li>
                  )}
                </ul>
              </div>
            ) : null}

            <div style={{marginTop:8, display:"flex", gap:8, flexWrap:"wrap"}}>
              {c.has_unread ? (
                <button
                  onClick={async () => {
                    try {
                      await markRead(c.id);
                      const raw = await listCases();
                      setItems(normalizeList(raw));
                    } catch(e) {
                      setErr(e.message);
                    }
                  }}
                  style={{padding:"6px 10px", borderRadius:6, border:"1px solid #ddd", background:"#f3f4f6"}}
                >
                  Marcar leido
                </button>
              ) : (
                <span style={{fontSize:12, color:"#6b7280"}}>Sin novedades pendientes.</span>
              )}
              <span style={{fontSize:12, color:"#6b7280"}}>
                Sincronizacion automatica via ingesta (en construccion).
              </span>
            </div>
          </li>
        ))}
      </ul>
    </MainLayout>
  );
}



