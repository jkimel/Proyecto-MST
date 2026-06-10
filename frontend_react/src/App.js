import React, { useState, useEffect, useCallback } from "react";
import MapaInteractivo from "./MapaInteractivo";
// ============================================================================
// 1. ESTRUCTURAS DE DATOS Y ALGORITMOS MATEMÁTICOS (PESO = DISTANCIA KM)
// ============================================================================

class MinHeap {
  constructor() { this.heap = []; }
  push(val) { this.heap.push(val); this.bubbleUp(); }
  pop() {
    if (this.size() === 1) return this.heap.pop();
    const min = this.heap[0]; this.heap[0] = this.heap.pop(); this.bubbleDown();
    return min;
  }
  size() { return this.heap.length; }
  bubbleUp() {
    let index = this.heap.length - 1;
    while (index > 0) {
      let parent = Math.floor((index - 1) / 2);
      if (this.heap[parent][0] <= this.heap[index][0]) break;
      [this.heap[parent], this.heap[index]] = [this.heap[index], this.heap[parent]];
      index = parent;
    }
  }
  bubbleDown() {
    let index = 0;
    while (true) {
      let left = 2 * index + 1, right = 2 * index + 2, smallest = index;
      if (left < this.size() && this.heap[left][0] < this.heap[smallest][0]) smallest = left;
      if (right < this.size() && this.heap[right][0] < this.heap[smallest][0]) smallest = right;
      if (smallest === index) break;
      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      index = smallest;
    }
  }
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371.0;
  const phi1 = (lat1 * Math.PI) / 180; const phi2 = (lat2 * Math.PI) / 180;
  const dphi = ((lat2 - lat1) * Math.PI) / 180; const dlambda = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dphi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// PRIM: Lista de Adyacencia O(E log V) - El peso es puramente la distancia geográfica
function primListaAdyacencia(nodos) {
  const n = nodos.length;
  if (n < 2) return { mst: [], allEdges: [], costo: 0, ops: 0 };
  const listaAdj = Array.from({ length: n }, () => []);
  const allEdges = [];
  let ops = 0;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dist = haversine(nodos[i].lat, nodos[i].lon, nodos[j].lat, nodos[j].lon);
      listaAdj[i].push({ v: j, peso: dist, dist });
      listaAdj[j].push({ v: i, peso: dist, dist });
      allEdges.push({ u: i, v: j, peso: dist, dist });
      ops++;
    }
  }

  const visitado = new Array(n).fill(false);
  const padre = new Array(n).fill(-1);
  const clave = new Array(n).fill(Infinity);
  clave[0] = 0;
  const heap = new MinHeap();
  heap.push([0, 0]); 
  const mst = [];
  let distanciaAcumulada = 0;

  while (heap.size() > 0) {
    const [c, u] = heap.pop();
    ops++;
    if (visitado[u]) continue;
    visitado[u] = true;
    if (padre[u] !== -1) {
      mst.push({ u: padre[u], v: u, peso: c, dist: c });
      distanciaAcumulada += c;
    }
    for (const { v, peso } of listaAdj[u]) {
      ops++;
      if (!visitado[v] && peso < clave[v]) {
        clave[v] = peso;
        padre[v] = u;
        heap.push([peso, v]);
      }
    }
  }
  return { mst, allEdges, costo: distanciaAcumulada, ops };
}

// PRIM: Matriz de Adyacencia O(V²)
function primMatrizAdyacencia(nodos) {
  const n = nodos.length;
  if (n < 2) return { mst: [], allEdges: [], costo: 0, ops: 0 };
  const mat = Array.from({ length: n }, () => new Array(n).fill(0));
  const allEdges = [];
  let ops = 0;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dist = haversine(nodos[i].lat, nodos[i].lon, nodos[j].lat, nodos[j].lon);
      mat[i][j] = mat[j][i] = dist;
      allEdges.push({ u: i, v: j, peso: dist, dist });
      ops++;
    }
  }

  const visitado = new Array(n).fill(false);
  const padre = new Array(n).fill(-1);
  const clave = new Array(n).fill(Infinity);
  clave[0] = 0;
  const mst = [];
  let distanciaAcumulada = 0;

  for (let iter = 0; iter < n; iter++) {
    let u = -1;
    for (let i = 0; i < n; i++) {
      ops++;
      if (!visitado[i] && (u === -1 || clave[i] < clave[u])) u = i;
    }
    visitado[u] = true;
    if (padre[u] !== -1) {
      mst.push({ u: padre[u], v: u, peso: clave[u], dist: clave[u] });
      distanciaAcumulada += clave[u];
    }
    for (let v = 0; v < n; v++) {
      ops++;
      if (!visitado[v] && mat[u][v] > 0 && mat[u][v] < clave[v]) {
        clave[v] = mat[u][v];
        padre[v] = u;
      }
    }
  }
  return { mst, allEdges, costo: distanciaAcumulada, ops };
}

// ============================================================================
// 2. COMPONENTES VISUALES Y GRÁFICOS (UI)
// ============================================================================

const COLORES_TIPO = {
  Hydro: "#3B82F6", Gas: "#F59E0B", Nuclear: "#8B5CF6", Wind: "#10B981",
  Solar: "#F97316", Coal: "#6B7280", Oil: "#EF4444", Other: "#EC4899",
};

function GrafoAbstract({ nodos, mst }) {
  const W = 340, H = 240, cx = W / 2, cy = H / 2, r = 85;
  if (!nodos.length) return null;
  const pts = nodos.map((_, i) => ({
    x: cx + r * Math.cos((2 * Math.PI * i) / nodos.length - Math.PI / 2),
    y: cy + r * Math.sin((2 * Math.PI * i) / nodos.length - Math.PI / 2),
  }));
  const mstSet = new Set(mst.map((e) => `${e.u}-${e.v}`));

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      {nodos.map((_, i) => nodos.map((_, j) => {
        if (j <= i) return null;
        const key = `${i}-${j}`; const esMST = mstSet.has(key) || mstSet.has(`${j}-${i}`);
        return <line key={key} x1={pts[i].x} y1={pts[i].y} x2={pts[j].x} y2={pts[j].y} stroke={esMST ? "#00F0FF" : "#1f293d"} strokeWidth={esMST ? 2 : 0.5} opacity={esMST ? 0.9 : 0.3} />;
      }))}
      {nodos.map((n, i) => (
        <g key={i}>
          <circle cx={pts[i].x} cy={pts[i].y} r="5" fill={COLORES_TIPO[n.tipo] || "#EC4899"} />
          <text x={pts[i].x} y={pts[i].y - 8} textAnchor="middle" style={{ fontSize: 8, fill: "#94a3b8" }}>{i}</text>
        </g>
      ))}
    </svg>
  );
}

function BarrasComplejidad({ nLista, opsLista, opsMatriz, tiempoLista, tiempoMatriz }) {
  const maxOps = Math.max(opsLista, opsMatriz, 1);
  return (
    <div style={{ padding: "0 8px" }}>
      {[
        { label: "Lista de Adyacencia + MinHeap — O(E log V)", ops: opsLista, time: tiempoLista, color: "#00F0FF" },
        { label: "Matriz de Adyacencia Convencional — O(V²)", ops: opsMatriz, time: tiempoMatriz, color: "#FF007F" }
      ].map((d) => (
        <div key={d.label} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>
            <span>{d.label}</span>
            <span style={{ color: "#fff" }}>{d.ops} ops ({d.time}ms)</span>
          </div>
          <div style={{ background: "#151c2c", borderRadius: 4, height: 16 }}>
            <div style={{ width: `${(d.ops / maxOps) * 100}%`, background: d.color, height: "100%", borderRadius: 4, transition: "width 0.5s" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TablaMST({ mst, nodos }) {
  if (!mst.length) return <p style={{ color: "#64748b", fontSize: 13 }}>Ejecutá el algoritmo primero.</p>;
  return (
    <div style={{ overflowX: "auto", padding: "10px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, color: "#e0e6ed" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #1f293d", color: "#94a3b8" }}>
            {["Origen", "Destino", "Distancia de la Arista"].map((h) => <th key={h} style={{ padding: "6px", textAlign: "left" }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {mst.map((e, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #151c2c" }}>
              <td style={{ padding: "6px" }}>{nodos[e.u]?.nombre} ({nodos[e.u]?.zona})</td>
              <td style={{ padding: "6px" }}>{nodos[e.v]?.nombre} ({nodos[e.v]?.zona})</td>
              <td style={{ padding: "6px", color: "#00F0FF", fontFamily: "monospace" }}>{Math.round(e.dist)} km</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// 3. APLICACIÓN PRINCIPAL (FETCH + FILTRADO DINÁMICO AUTOMÁTICO)
// ============================================================================

const TABS = [
  { id: "mapa", label: "Mapa Geográfico" },
  { id: "grafo", label: "Grafo Abstracto" },
  { id: "tabla", label: "Aristas MST" },
  { id: "comp", label: "Análisis de Complejidad" },
];

export default function App() {
  const [plantas, setPlantas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState("mapa");
  
  // Filtros de energía y zonas
  const [tipoEnergia, setTipoEnergia] = useState("Wind");
  const [zonasSeleccionadas, setZonasSeleccionadas] = useState([]);
  const [tipoAlgo, setTipoAlgo] = useState("lista");
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  // FETCH: Carga inicial de la base de datos
  useEffect(() => {
    fetch("/plantas_argentina.json")
      .then((res) => res.json())
      .then((data) => {
        setPlantas(data);
        // Al cargar, buscamos TODAS las provincias que tengan energía eólica (Wind) y las seleccionamos
        const zonasEolicas = [...new Set(data.filter(p => p.tipo === "Wind").map(p => p.zona))].sort();
        setZonasSeleccionadas(zonasEolicas);
        setCargando(false);
      })
      .catch((err) => {
        console.error("Error al cargar JSON", err);
        setCargando(false);
      });
  }, []);

  // Manejador del cambio de energía: Filtra y selecciona todas las provincias asociadas automáticamente
  const handleCambioEnergia = (nuevoTipo) => {
    setTipoEnergia(nuevoTipo);
    // Buscamos todas las provincias que tengan plantas de este nuevo tipo de energía
    const zonasDelTipo = [...new Set(plantas.filter(p => p.tipo === nuevoTipo).map(p => p.zona))].sort();
    // Las dejamos todas seleccionadas por defecto para que el usuario las vea inmediatamente
    setZonasSeleccionadas(zonasDelTipo);
    setResultado(null); // Reseteamos el cálculo anterior para evitar inconsistencias visuales
  };

  const nodosActivos = plantas.filter((p) => 
    p.tipo === tipoEnergia && zonasSeleccionadas.includes(p.zona)
  );

  const ejecutar = useCallback(() => {
    if (nodosActivos.length < 2) return;
    const t0 = performance.now();
    const resLista = primListaAdyacencia(nodosActivos);
    const t1 = performance.now();
    const resMatriz = primMatrizAdyacencia(nodosActivos);
    const t2 = performance.now();

    setResultado({
      mst: tipoAlgo === "lista" ? resLista.mst : resMatriz.mst,
      allEdges: resLista.allEdges,
      costoTotal: resLista.costo, 
      opsLista: resLista.ops, opsMatriz: resMatriz.ops,
      tiempoLista: (t1 - t0).toFixed(2), tiempoMatriz: (t2 - t1).toFixed(2),
      n: nodosActivos.length,
    });
  }, [nodosActivos, tipoAlgo]);

  const toggleZona = (zona) => {
    setZonasSeleccionadas((prev) => prev.includes(zona) ? prev.filter((z) => z !== zona) : [...prev, zona]);
    setResultado(null);
  };

  if (cargando) return <div style={{ color: "#fff", padding: "2rem", background: "#020617", height: "100vh" }}>Conectando con la base de datos nacional...</div>;

  const TIPOS_DISPONIBLES = [...new Set(plantas.map((p) => p.tipo))].sort();
  const TODAS_ZONAS = [...new Set(plantas.filter(p => p.tipo === tipoEnergia).map((p) => p.zona))].sort();

  return (
    <div style={{ maxWidth: 950, margin: "0 auto", padding: "1.5rem 1rem", backgroundColor: "#020617", color: "#f8fafc", minHeight: "100vh" }}>
      <h2> Red Eléctrica Óptima (MST)</h2>
      <p style={{ color: "#94a3b8", fontSize: 14 }}>Cálculo del trazado de menor longitud utilizando el Algoritmo de Prim</p>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16, marginTop: 20 }}>
        
        {/* CONTROLES */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          
          <div style={{ background: "#151c2c", borderRadius: "8px", padding: "1rem", border: "1px solid #1f293d" }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: "bold", color: "#00F0FF" }}>1. Tipo de Fuente</p>
            {/* Usamos nuestra nueva función manejadora */}
            <select value={tipoEnergia} onChange={(e) => handleCambioEnergia(e.target.value)} style={{ width: "100%", background: "#0b0f19", color: "#fff", padding: "6px", borderRadius: "4px", border: "1px solid #334155" }}>
              {TIPOS_DISPONIBLES.map(t => (
                <option key={t} value={t}>
                  {t === "Wind" ? "Wind (Eólica - Consigna)" : t === "Hydro" ? "Hydro (Hidroeléctrica)" : t}
                </option>
              ))}
            </select>
          </div>

          <div style={{ background: "#151c2c", borderRadius: "8px", padding: "1rem", border: "1px solid #1f293d" }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: "bold" }}>2. Provincias con esta Energía</p>
            {TODAS_ZONAS.length > 0 ? (
              TODAS_ZONAS.map((z) => (
                <label key={z} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, fontSize: 12 }}>
                  <input type="checkbox" checked={zonasSeleccionadas.includes(z)} onChange={() => toggleZona(z)} style={{ accentColor: "#00F0FF" }} />
                  {z}
                </label>
              ))
            ) : (
              <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>No hay provincias registradas.</p>
            )}
          </div>

          <div style={{ background: "#151c2c", borderRadius: "8px", padding: "1rem", border: "1px solid #1f293d" }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: "bold" }}>3. Estructura Evaluada</p>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}><input type="radio" checked={tipoAlgo === "lista"} onChange={() => setTipoAlgo("lista")} /> Lista (Heap) O(E log V)</label>
            <label style={{ display: "block", fontSize: 12 }}><input type="radio" checked={tipoAlgo === "matriz"} onChange={() => setTipoAlgo("matriz")} /> Matriz O(V²)</label>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#94a3b8", cursor: "pointer", padding: "4px 0" }}>
            <input type="checkbox" checked={mostrarTodas} onChange={(e) => setMostrarTodas(e.target.checked)} style={{ accentColor: "#00F0FF" }} />
            Mostrar todas las conexiones posibles
          </label>

          <button onClick={ejecutar} disabled={nodosActivos.length < 2} style={{ padding: "12px", borderRadius: "6px", background: "#00F0FF", color: "#000", border: "none", fontWeight: "bold", cursor: "pointer", boxShadow: "0 0 10px rgba(0,240,255,0.4)" }}>
            CALCULAR RED ÓPTIMA
          </button>

          {resultado && (
            <div style={{ background: "#151c2c", borderRadius: "8px", padding: "10px", border: "1px solid #1f293d" }}>
              <p style={{ margin: "0 0 4px", fontSize: 10, color: "#64748b" }}>EXTENSIÓN TOTAL TRAZADO</p>
              <p style={{ margin: 0, fontSize: 18, fontWeight: "bold", color: "#fbbf24", fontFamily: "monospace" }}>{Math.round(resultado.costoTotal).toLocaleString()} km</p>
              <p style={{ margin: "8px 0 0 0", fontSize: 10, color: "#64748b" }}>CANTIDAD DE PARQUES</p>
              <p style={{ margin: 0, fontSize: 14, color: "#fff" }}>{resultado.n} estaciones activas</p>
            </div>
          )}
        </div>

        {/* CONTENIDO DERECHO */}
        <div>
          <div style={{ display: "flex", borderBottom: "1px solid #1f293d", marginBottom: 10 }}>
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "8px 16px", background: "transparent", border: "none", color: tab === t.id ? "#00F0FF" : "#94a3b8", borderBottom: tab === t.id ? "2px solid #00F0FF" : "none", cursor: "pointer", fontSize: 13 }}>{t.label}</button>
            ))}
          </div>

          <div style={{ background: "#151c2c", borderRadius: "8px", border: "1px solid #1f293d", minHeight: "400px" }}>
            {tab === "mapa" && (<div> <MapaInteractivo nodos={nodosActivos} mst={resultado?.mst || []} allEdges={resultado?.allEdges || []} mostrarTodas={mostrarTodas} hoveredNode={hoveredNode} setHoveredNode={setHoveredNode} /></div>)}
            {tab === "grafo" && <div style={{ padding: 16 }}><GrafoAbstract nodos={nodosActivos} mst={resultado?.mst || []} /></div>}
            {tab === "tabla" && <TablaMST mst={resultado?.mst || []} nodos={nodosActivos} />}
            {tab === "comp" && <div style={{ padding: 16 }}><BarrasComplejidad nLista={resultado?.n || 0} opsLista={resultado?.opsLista || 0} opsMatriz={resultado?.opsMatriz || 0} tiempoLista={resultado?.tiempoLista || 0} tiempoMatriz={resultado?.tiempoMatriz || 0} /></div>}
          </div>
          <p style={{ fontSize: 11, color: "#4a5568", marginTop: 8 }}>Estaciones cargadas dinámicamente: {nodosActivos.length}.</p>
        </div>

      </div>
    </div>
  );
}