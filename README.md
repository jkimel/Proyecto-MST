# Proyecto-MST

Sistema de optimización de infraestructura eléctrica basado en el **Algoritmo de Prim** para la obtención del Árbol de Expansión Mínima (MST). El sistema permite analizar la red eléctrica nacional permitiendo el filtrado dinámico por tipo de energía y ubicación geográfica.

## 1. Stack Tecnológico
* **Backend:** Python (Pandas, Geopy) para procesamiento y geocodificación.
* **Algoritmos:** Implementación de Prim ($O(E \log V)$) utilizando Lista de Adyacencia y MinHeap.
* **Frontend:** React + Leaflet para visualización interactiva de mapas y grafos.

## 2. Requisitos Previos
* [Node.js](https://nodejs.org/) (v18 o superior).
* [Python 3.x](https://www.python.org/).

## 3. Guía de Instalación

### A. Procesamiento de Datos (Backend)
1. Abrir terminal en la carpeta `backend/`.
2. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```
1. Generar el dataset procesado:
   ```bash
   python convertidor.py
   ```
### B. Interfaz Visual (Frontend)
1. Abrir terminal en la carpeta frontend_react/.
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Ejecutar la aplicación:
   ```bash
   npm start
   ```
## 4. Estructura de Datos
El sistema permite filtrar por cualquier tipo de fuente de energía disponible en el dataset y seleccionar zonas geográficas específicas. La lógica central del algoritmo se encuentra en prim.py, lo que permite validar la eficiencia algorítmica de forma independiente a la interfaz visual.
