"""Completa los bloques de primer nivel de la base de Surveyor 3 a partir de los eventos ya fusionados.
Todo valor sale de datos_clave/fuentes de los eventos; no se agrega nada de memoria."""
import json
import sys

ENTRADA, SALIDA = sys.argv[1], sys.argv[2]
d = json.load(open(ENTRADA, encoding="utf-8"))
E = {e["id"]: e for e in d["eventos"]}


def src(*ids):
    vistos, out = set(), []
    for i in ids:
        for s in E[i]["fuentes"]:
            if s["url"] not in vistos:
                vistos.add(s["url"])
                out.append(s)
    return out


# 1) Corrección de fase: Surveyor 1 y 2 son antecedentes, no origen/lanzamiento/fin de esta misión
for i in ("sur011", "sur012", "sur013", "sur014"):
    E[i]["fase"] = "planificacion_y_desarrollo"
    E[i]["etapa"] = "Antecedentes: Surveyor 1 y 2"

m = d["mision"]
d["alcance"] += (" No se encontró una declaración oficial de fin de misión distinta del último contacto del 4 de mayo de 1967,"
                 " por eso fechas_clave.fin_oficial queda sin fecha.")
d["version"] = "0.2"

d["ficha_tecnica"] = {
    "masa_al_lanzamiento": {"valor": "~1.026 kg (NSSDC); ~997,9 kg (NASA Science)", "nota": "Las dos fuentes oficiales difieren; ver discrepancias.", "fuentes": src("sur022", "sur028")},
    "masa_al_aterrizar": {"valor": "~296 kg", "fuentes": src("sur028")},
    "lanzador": {"valor": "Atlas-Centaur AC-12 desde LC-36B, Cabo Cañaveral", "fuentes": src("sur022")},
    "sitio_de_aterrizaje": {"valor": "Cráter suave de ~200 m en Oceanus Procellarum, pendiente de 14 grados, ~370 km al sur de Copérnico (3,0162 S, 336,582 E según LRO)", "fuentes": src("sur034")},
    "instrumentos": {"valor": "Cámara de TV y muestreador de superficie (brazo excavador) que alcanzaba ~1,5 m y cavaba hasta ~18 cm", "fuentes": src("sur015", "sur039")},
}

d["equipo"] = [
    {"nombre": "Howard H. Haglund", "rol": "Gerente del proyecto Surveyor 3, JPL", "fuentes": src("sur020")},
    {"nombre": "Leonard D. Jaffe", "rol": "Científico del proyecto, JPL", "fuentes": src("sur020")},
    {"nombre": "Benjamin Milwitzky", "rol": "Gerente del programa, sede de NASA", "fuentes": src("sur020")},
    {"nombre": "Hughes Aircraft Company", "rol": "Contratista que construyó la nave", "fuentes": src("sur003")},
    {"nombre": "Ewen Whitaker", "rol": "Ubicó Surveyor 3 en fotos de Lunar Orbiter para el aterrizaje de precisión de Apollo 12", "fuentes": src("sur054")},
    {"nombre": "Charles \"Pete\" Conrad y Alan Bean", "rol": "Astronautas de Apollo 12 que visitaron Surveyor 3 y cortaron piezas", "fuentes": src("sur055", "sur056")},
]

d["totales_de_la_mision"] = {
    "imagenes_de_tv": {"valor": "6.326 (NASA Science y NSSDC); 6.315 en otras fuentes", "nota": "Discrepancia sin resolver.", "fuentes": src("sur037", "sur046")},
    "operacion_del_brazo": {"valor": "18 h 22 min; 4 zanjas de hasta 18 cm de profundidad", "fuentes": src("sur039", "sur046")},
    "exposicion_de_la_camara_en_la_luna": {"valor": "~31 meses; 32 ciclos día/noche lunares", "fuentes": src("sur061", "sur064")},
}

d["records"] = [
    {"descripcion": "Primera adquisición automática de la estrella Canopus", "valor": "17 abr 1967, 16:27:51 UT", "fuentes": src("sur027")},
    {"descripcion": "Primer aterrizaje de precisión en otro mundo (Apollo 12 junto a Surveyor 3)", "valor": "Toque a 110,5 h GET, 19 nov 1969", "nota": "Distancia a Surveyor 3 discutida: 155 a 180 m.", "fuentes": src("sur054")},
]

d["discrepancias"] = [
    {"tema": "Número de imágenes de TV", "valores": ["6.326 (NASA Science, NSSDC)", "6.315 (SP-146, Wikipedia)"], "recomendacion": "Citar 6.326 de fuente oficial y avisar de la diferencia.", "fuentes": src("sur037")},
    {"tema": "Masa al lanzamiento", "valores": ["1.026 kg (NSSDC)", "~997,9 kg (NASA Science)"], "recomendacion": "Dar ambas con su fuente.", "fuentes": src("sur022")},
    {"tema": "Número de ensayos de carga del brazo", "valores": ["4 (NASA Science)", "7 (SP-184)", "8 (otra fuente)"], "recomendacion": "Citar la fuente oficial concreta; no mezclar.", "fuentes": src("sur017", "sur049")},
    {"tema": "Distancia entre el módulo Intrepid y Surveyor 3", "valores": ["~180 m (NASA Science, NSSDC)", "~155 m (nota de LRO, SP-284)", "~163 m (Rummel)"], "recomendacion": "Decir «unos 155 a 180 metros».", "fuentes": src("sur053", "sur054")},
    {"tema": "Fecha del aterrizaje y de la caminata de Apollo 12", "valores": ["18-19 nov (NASA Science, hora de EE. UU.)", "19-20 nov (NSSDC, collectSPACE, UTC)"], "recomendacion": "Usar UTC y aclararlo.", "fuentes": src("sur053", "sur055")},
    {"tema": "Rebotes del alunizaje", "valores": ["Alturas de ~10 m y ~3 m (NASA Science)", "Distancias entre toques de ~20 m y ~11 m (NSSDC)"], "recomendacion": "Son magnitudes distintas; contrastar con el informe JPL 32-1177.", "fuentes": src("sur032")},
    {"tema": "Fecha del eclipse de Sol por la Tierra", "valores": ["24 abr 1967 (texto de SP-184, NSSDC)", "26 abr 1967 (pie de figura con ruido de OCR)"], "recomendacion": "Usar 24 abr.", "fuentes": src("sur041")},
    {"tema": "Estado actual de la cámara de TV", "valores": ["Expuesta en el Smithsonian (NSSDC)", "Almacenada en préstamo (collectSPACE, nov 2019)"], "recomendacion": "Dejar sin verificar.", "fuentes": src("sur067")},
]

d["pendientes_de_verificar"] = [
    "No se pudo leer el Surveyor III Mission Report (SP-146): el PDF de NTRS supera 10 MB y la copia de nasa.gov da 404.",
    "No hay fuente abierta sobre las pruebas de calificación, el ensamblaje ni la entrega al Cabo Cañaveral.",
    "No se documentan intentos de reactivar Surveyor 3 tras la noche lunar; la causa del silencio (frío) viene solo de una fuente secundaria.",
    "No se encontró una fuente oficial de NASA sobre Streptococcus mitis que no sea una presentación sin fecha; el artículo de 2011 no se leyó completo.",
    "No se encontró el informe de la junta de revisión del fallo de Surveyor 2 (causa raíz).",
    "Las páginas del Apollo Lunar Surface Journal no se pudieron abrir con las herramientas; los tiempos GET de la transcripción están sin contrastar.",
    "No se encontró una declaración oficial de fin de misión distinta del último contacto.",
]

d["recursos_para_la_plataforma"].update({
    "modelos_3d": [
        {"nombre": "Apollo Lunar Module (GLB) - NASA 3D Resources", "url": "https://github.com/nasa/NASA-3D-Resources/tree/master/3D%20Models/Apollo%20Lunar%20Module"},
        {"nombre": "Apollo 12 - Landing Site (STL) - NASA 3D Resources", "url": "https://github.com/nasa/NASA-3D-Resources/tree/master/3D%20Printing/Apollo%2012%20-%20Landing%20Site"},
    ],
    "datos": [{"nombre": "NSSDC: Surveyor 3", "url": "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1967-035A"}],
    "portales": [{"nombre": "NASA Science: Surveyor 3", "url": "https://science.nasa.gov/mission/surveyor-3/"}],
    "nota": "No existe modelo 3D de Surveyor en NASA-3D-Resources (revisado el árbol completo del repositorio el 2026-11-15); habría que construirlo de forma procedural.",
})

json.dump(d, open(SALIDA, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print("ok", len(d["eventos"]), "eventos")
