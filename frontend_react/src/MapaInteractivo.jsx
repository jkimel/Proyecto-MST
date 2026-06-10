import React from "react";
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup} from "react-leaflet";
import "leaflet/dist/leaflet.css"; // CRÍTICO: Si no importás este CSS, el mapa se desarma

const COLORES_TIPO = {
  Hydro: "#3B82F6", Gas: "#F59E0B", Nuclear: "#8B5CF6", Wind: "#10B981",
  Solar: "#F97316", Coal: "#6B7280", Oil: "#EF4444", Other: "#EC4899",
};

export default function MapaInteractivo({ nodos, mst, allEdges, mostrarTodas, hoveredNode, setHoveredNode }) {
  if (!nodos.length) return null;

  /*Coordenadas centrales para enfocar la Patagonia al inicio */
  const centroPatagonia = [-43.5, -65.0]; 

  return (
    <div style={{ height: "500px", width: "100%", borderRadius: "8px", overflow: "hidden" }}>
      <MapContainer 
        center={centroPatagonia} 
        zoom={4.5} 
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        {/* Capa de mapa estilo UI Dark / Cyberpunk (CartoDB Dark Matter) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* 1. Dibujar todas las conexiones posibles (Gris tenue) si está activo el checkbox */}
        {mostrarTodas && allEdges.map((edge, i) => {
          const puntoA = [nodos[edge.u].lat, nodos[edge.u].lon];
          const puntoB = [nodos[edge.v].lat, nodos[edge.v].lon];
          return (
            <Polyline 
              key={`all-${i}`} 
              positions={[puntoA, puntoB]} 
              pathOptions={{ color: "#334155", weight: 1, opacity: 0.3 }} 
            />
          );
        })}

        {/* 2. Dibujar las aristas del MST calculadas por Prim (Cyan neón) */}
        {mst.map((edge, i) => {
          const puntoA = [nodos[edge.u].lat, nodos[edge.u].lon];
          const puntoB = [nodos[edge.v].lat, nodos[edge.v].lon];
          return (
            <Polyline 
              key={`mst-${i}`} 
              positions={[puntoA, puntoB]} 
              pathOptions={{ color: "#00F0FF", weight: 3, opacity: 0.9 }}
            >
              <Popup>
                <div style={{ color: "#000", fontSize: "11px" }}>
                  <strong>Tramo Eléctrico</strong><br />
                  Distancia: {Math.round(edge.dist)} km
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* 3. Dibujar los Nodos (Plantas de Energía como marcadores circulares personalizados) */}
        {nodos.map((n, i) => {
          const color = COLORES_TIPO[n.tipo] || "#EC4899";
          const esHovered = hoveredNode === i;
          
          return (
            <CircleMarker
              key={`nodo-${i}`}
              center={[n.lat, n.lon]}
              radius={esHovered ? 12 : 7}
              pathOptions={{
                fillColor: color,
                fillOpacity: 0.85,
                color: esHovered ? "#ffffff" : "#1e293b",
                weight: esHovered ? 2 : 1
              }}
              eventHandlers={{
                mouseover: () => setHoveredNode(i),
                mouseout: () => setHoveredNode(null),
              }}
            >
              <Popup>
                <div style={{ color: "#000", fontFamily: "sans-serif" }}>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "12px" }}>{n.nombre}</h4>
                  <p style={{ margin: 0, fontSize: "11px" }}>
                    <strong>Capacidad:</strong> {n.cap} MW<br />
                    <strong>Tipo:</strong> {n.tipo}<br />
                    <strong>Provincia:</strong> {n.zona}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}