import math
import heapq

# ─────────────────────────────────────────────────────────────
# MÓDULO DE CÁLCULO GEOGRÁFICO Y COSTOS
# ─────────────────────────────────────────────────────────────

def haversine(lat1, lon1, lat2, lon2):
    """
    Calcula la distancia ortodrómica entre dos puntos en la 
    superficie de una esfera (Tierra) en kilómetros.
    """
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def costo_cableado(distancia_km, capacidad_mw):
    """
    Calcula el costo base de conexión considerando un factor
    de escala por la capacidad (MW) de las plantas involucradas.
    """
    factor = 1 + (capacidad_mw / 100) * 0.2
    return distancia_km * 500_000 * factor

# ─────────────────────────────────────────────────────────────
# ALGORITMO DE PRIM: LISTA DE ADYACENCIA (O(E log V))
# ─────────────────────────────────────────────────────────────

def prim_lista_adyacencia(nodos):
    """
    Implementación eficiente del Algoritmo de Prim.
    Usa una Min-Priority Queue (heapq) para seleccionar siempre
    la arista de menor peso, optimizando el rendimiento en grafos dispersos.
    """
    n = len(nodos)
    # Construcción de la lista de adyacencia
    lista_adj = [[] for _ in range(n)]
    for i in range(n):
        for j in range(i + 1, n):
            dist = haversine(nodos[i]['lat'], nodos[i]['lon'], nodos[j]['lat'], nodos[j]['lon'])
            peso = costo_cableado(dist, (nodos[i]['cap'] + nodos[j]['cap']) / 2)
            lista_adj[i].append((peso, j))
            lista_adj[j].append((peso, i))
    
    visitado = [False] * n
    clave = [float('inf')] * n
    padre = [-1] * n
    clave[0] = 0
    
    # Heap almacena tuplas (peso, nodo)
    heap = [(0, 0)]
    mst = []
    costo_total = 0
    
    while heap:
        peso_u, u = heapq.heappop(heap)
        
        if visitado[u]: continue
        visitado[u] = True
        
        if padre[u] != -1:
            mst.append((padre[u], u))
            costo_total += peso_u
            
        for peso, v in lista_adj[u]:
            if not visitado[v] and peso < clave[v]:
                clave[v] = peso
                padre[v] = u
                heapq.heappush(heap, (peso, v))
                
    return mst, costo_total

# ─────────────────────────────────────────────────────────────
# ALGORITMO DE PRIM: MATRIZ DE ADYACENCIA (O(V²))
# ─────────────────────────────────────────────────────────────

def prim_matriz_adyacencia(nodos):
    """
    Implementación clásica mediante matriz de adyacencia.
    Útil para grafos densos, pero con complejidad O(V^2),
    lo cual lo hace menos eficiente para grandes volúmenes de nodos.
    """
    n = len(nodos)
    matriz = [[0.0] * n for _ in range(n)]
    
    # Construcción de la matriz
    for i in range(n):
        for j in range(i + 1, n):
            dist = haversine(nodos[i]['lat'], nodos[i]['lon'], nodos[j]['lat'], nodos[j]['lon'])
            peso = costo_cableado(dist, (nodos[i]['cap'] + nodos[j]['cap']) / 2)
            matriz[i][j] = matriz[j][i] = peso
            
    visitado = [False] * n
    clave = [float('inf')] * n
    padre = [-1] * n
    clave[0] = 0
    
    mst = []
    costo_total = 0
    
    for _ in range(n):
        # Selección del vértice con clave mínima
        u = -1
        for i in range(n):
            if not visitado[i] and (u == -1 or clave[i] < clave[u]):
                u = i
        
        visitado[u] = True
        if padre[u] != -1:
            mst.append((padre[u], u))
            costo_total += clave[u]
            
        # Actualización de claves
        for v in range(n):
            if not visitado[v] and matriz[u][v] > 0 and matriz[u][v] < clave[v]:
                clave[v] = matriz[u][v]
                padre[v] = u
                
    return mst, costo_total