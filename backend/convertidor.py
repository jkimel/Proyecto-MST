import pandas as pd
from geopy.geocoders import Nominatim
import time

def procesar_dataset(input_csv, output_json):
    # 1. Inicializar el geolocalizador oficial de OpenStreetMap
    geolocator = Nominatim(user_agent="argentina_power_network_mst")
    
    # 2. Leer y filtrar el dataset
    print("📖 Leyendo dataset original...")
    df = pd.read_csv(input_csv)
    df_arg = df[df['country'] == 'ARG'].copy()
    df_arg = df_arg.dropna(subset=['latitude', 'longitude'])
    
    # Filtrar solo las columnas necesarias antes del bucle para optimizar memoria
    mapeo = {
        'name': 'nombre',
        'latitude': 'lat',
        'longitude': 'lon',
        'capacity_mw': 'cap',
        'primary_fuel': 'tipo'
    }
    df_arg = df_arg.rename(columns=mapeo)
    columnas_finales = list(mapeo.values())
    
    plantas_procesadas = []
    total = len(df_arg)
    
    print(f"🌍 Iniciando geolocalización precisa para {total} plantas...")
    
    # 3. Bucle de consulta geoespacial fila por fila
    for index, row in df_arg.iterrows():
        nombre_planta = row['nombre']
        lat, lon = row['lat'], row['lon']
        
        provincia = "Otras"
        try:
            # Consulta inversa basada en polígonos reales de fronteras
            location = geolocator.reverse((lat, lon), timeout=10)
            if location and 'address' in location.raw:
                address = location.raw['address']
                # Buscamos la provincia en las etiquetas comunes de OSM
                provincia = address.get('state', address.get('region', "Otras"))
        except Exception as e:
            print(f"⚠️ Alerta en {nombre_planta}: No se pudo determinar la provincia por red. Asignando 'Otras'.")
        
        # Estructuramos el objeto limpio
        planta_limpia = {
            'nombre': nombre_planta,
            'lat': lat,
            'lon': lon,
            'cap': row['cap'],
            'tipo': row['tipo'],
            'zona': provincia
        }
        plantas_procesadas = [] + plantas_procesadas + [planta_limpia]
        
        print(f" [{len(plantas_procesadas)}/{total}] -> {nombre_planta} asignada a: {provincia}")
        
        # Pausa obligatoria de 1 segundo para no ser bloqueados por el servidor público
        time.sleep(1)

    # 4. Crear el DataFrame final y exportar
    df_final = pd.DataFrame(plantas_procesadas)
    df_final.to_json(output_json, orient='records', indent=2, force_ascii=False)
    
    print(f"\n✅ Base de datos geográfica generada con éxito en: {output_json}")

# Ejecución del proceso
procesar_dataset('global_power_plant_database.csv', '../frontend/public/plantas_argentina.json')