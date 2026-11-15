"""Cierra la base v0 de Beagle 2: une tres duplicados semánticos de la ronda 2, corrige fases y notas, y completa los bloques
de primer nivel con datos que ya están en los eventos (ids de la fusión de la ronda 2). No agrega hechos de memoria."""
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


# 1) Unir duplicados semánticos: (se elimina, absorbe)
for borrar, queda in [("bgl060", "bgl059"), ("bgl006", "bgl005"), ("bgl014", "bgl010")]:
    dest, orig = E[queda], E[borrar]
    dest["fuentes"] = src(queda, borrar)
    dest["datos_clave"] = (dest["datos_clave"] + [x for x in orig["datos_clave"] if x not in dest["datos_clave"]])[:5]
    del E[borrar]

# 2) Fase y notas
E["bgl037"]["fase"] = "legado"
E["bgl037"]["etapa"] = "Contexto científico posterior"
E["bgl059"]["nota"] = ("Contradice parcialmente la cifra de 2 o 3 paneles de 2015. Dos medios difieren en el énfasis: Astronomy Now da como más "
                       "probable tres paneles abiertos y uno fallido; Astronomy.com dice que tres de cuatro o los cuatro encajan por igual. "
                       "La nota de prensa de la Universidad De Montfort es de noviembre de 2016 y el trabajo no tenía revista científica; es "
                       "un análisis anterior y distinto del artículo formal de octubre de 2017.")
E["bgl061"]["discutido"] = False
E["bgl061"]["nota"] = ("El análisis 3D de noviembre de 2016 (De Montfort y Leicester) es un trabajo previo y distinto, sin revista científica; "
                       "este artículo de Royal Society Open Science es de octubre de 2017.")

d["eventos"] = [E[e["id"]] for e in d["eventos"] if e["id"] in E]

m = d["mision"]
m["fechas_clave"] = {
    "lanzamiento": {"fecha": "2003-06-02", "eventos": []},
    "aterrizaje": {"fecha": "2003-12-25", "eventos": []},
    "ultimo_contacto": {"fecha": None, "eventos": []},
    "fin_oficial": {"fecha": "2004-02-06", "eventos": []},
}
d["alcance"] += (" Beagle 2 nunca estableció contacto tras la separación, así que ultimo_contacto no tiene fecha; fin_oficial es la declaración de "
                 "pérdida por el comité de gestión del 6 de febrero de 2004. No hubo fase de operaciones.")
d["version"] = "0.2"

d["ficha_tecnica"] = {
    "masa_al_lanzamiento": {"valor": "~69 kg; otras fuentes dan 60 kg (diseño, NASA 2001), 71 kg o unos 33 kg de masa aterrizada", "nota": "Las fuentes difieren; ver discrepancias.", "fuentes": src("bgl015", "bgl010")},
    "masa_al_aterrizar": {"valor": "~33,2 kg", "fuentes": src("bgl015")},
    "lanzador": {"valor": "Soyuz-Fregat (Starsem) desde Baikonur, 2 de junio de 2003, con la Mars Express", "fuentes": src("bgl019")},
    "sitio_de_aterrizaje": {"valor": "Isidis Planitia: elipse de 30 x 5 km, hacia 11° N y 90° E", "fuentes": src("bgl024")},
    "sistema_de_entrada": {"valor": "Escudo térmico NORCOAT, paracaídas y airbags; sin motor propio", "fuentes": src("bgl015", "bgl009", "bgl018")},
    "carga_cientifica": {"valor": "Brazo PAW con cámaras, microscopio y espectrómetros, paquete de análisis de gases GAP y el topo PLUTO", "fuentes": src("bgl010")},
}
d["equipo"] = [
    {"nombre": "Colin Pillinger", "rol": "Impulsor y líder de Beagle 2 (Open University)", "fuentes": src("bgl001")},
    {"nombre": "Mark Sims", "rol": "Director de la misión Beagle 2 (Universidad de Leicester)", "fuentes": src("bgl057")},
    {"nombre": "Michael Croon", "rol": "Ex miembro del equipo de Mars Express que pidió imágenes a HiRISE y detectó el candidato", "fuentes": src("bgl050")},
    {"nombre": "René Bonnefoy", "rol": "Presidente de la comisión de investigación ESA/Reino Unido (inspector general de la ESA)", "fuentes": src("bgl036")},
    {"nombre": "Open University, Astrium y Universidad de Leicester", "rol": "Dirección científica, contratista principal y equipos de instrumentos", "fuentes": src("bgl005")},
]
d["totales_de_la_mision"] = {
    "imagenes_de_hirise_examinadas": {"valor": "26 imágenes entre 2006 y 2014 sin resultado, antes de que Croon pidiera nuevas tomas", "fuentes": src("bgl045")},
    "tiempo_hasta_el_hallazgo": {"valor": "~11 años: del aterrizaje previsto (25 dic 2003) al anuncio (16 ene 2015)", "nota": "Calculado a partir de las fechas de los eventos.", "fuentes": src("bgl024", "bgl052")},
}
d["records"] = [
    {"descripcion": "Años de silencio entre el aterrizaje previsto y el hallazgo", "valor": "~11 años (25 dic 2003 a 16 ene 2015)", "fuentes": src("bgl024", "bgl052")},
]
d["discrepancias"] = [
    {"tema": "Costo del proyecto", "valores": ["£25 M", "£45 M (Science Museum)", "£66 M", "Aporte del BNSC: £22 M"], "recomendacion": "Mostrar un rango y citar la fuente de cada cifra.", "fuentes": src("bgl004")},
    {"tema": "Masa de Beagle 2", "valores": ["60 kg (diseño, NASA 2001)", "69 kg al lanzamiento y 33,2 kg al aterrizar (National Space Centre)", "unos 33 kg aterrizada (Spaceflight Now)", "71 kg (extracto de búsqueda)"], "recomendacion": "Distinguir masa de diseño, de lanzamiento y de aterrizaje.", "fuentes": src("bgl010", "bgl015")},
    {"tema": "Fecha de la separación de Mars Express", "valores": ["19 de diciembre de 2003, 08:31 GMT (fuentes posteriores)", "20 de diciembre (comunicado de ESA de 2003, fecha prevista)"], "recomendacion": "Usar el 19 de diciembre.", "fuentes": src("bgl021")},
    {"tema": "Primera aparición de Beagle 2 en HiRISE", "valores": ["Imágenes del 28 feb 2013 y 29 jun 2014 (Universidad de Arizona, NASA)", "Solo 2014 (blog de ESA)", "Anuncio en enero de 2015"], "recomendacion": "Separar imágenes de archivo del anuncio.", "fuentes": src("bgl046", "bgl048")},
    {"tema": "Cuántos paneles solares se desplegaron", "valores": ["2 o 3 visibles (Arizona)", "«más de un panel» (NASA)", "3 abiertos y 1 atascado de 4 (análisis de 2016)"], "recomendacion": "Decir «parcialmente desplegado» y mostrar el rango.", "fuentes": src("bgl053", "bgl059")},
    {"tema": "Distancia al objetivo y tamaño", "valores": ["~5 km del centro previsto (JPL)", "~20 km del objetivo original (The Conversation)", "~2 m (JPL) frente a ~1,5 m (artículo científico)"], "recomendacion": "Citar la fuente de cada cifra.", "fuentes": src("bgl056")},
    {"tema": "Publicación del informe de la comisión", "valores": ["Entregado el 21 de abril de 2004; solo se difundieron las recomendaciones", "Informe completo en la web del BNSC el 3 de febrero de 2005 (Hansard, Physics World)"], "recomendacion": "Verificar con el Hansard antes de afirmar «completo».", "fuentes": src("bgl038", "bgl044")},
    {"tema": "Fechas de aterrizaje de Beagle 2 y Spirit", "valores": ["24 dic 2003 y 3 ene 2004 (Science News)", "25 dic 2003 y 4 ene 2004 (otras fuentes)"], "recomendacion": "Usar las fechas en UTC y aclararlo.", "fuentes": src("bgl033")},
]
d["pendientes_de_verificar"] = [
    "No se encontró fecha oficial de la selección ni de la aprobación final del Comité del Programa Científico de la ESA (1999).",
    "No hay fuente abierta sobre las pruebas de calificación de giro, eyección y térmicas, ni sobre retrasos concretos de calendario.",
    "El informe completo de la comisión de investigación no se leyó; la fecha de su publicación (3 feb 2005) solo la dan el Hansard y Physics World.",
    "Las fechas de los intentos de contacto de enero y febrero de 2004 salen de extractos de búsqueda apoyados en Wikipedia; falta una fuente primaria de ESA, sobre todo del 12 al 22 de enero.",
    "No hay fuente abierta sobre las reacciones de la ESA, la UK Space Agency y la Open University al hallazgo de 2015, ni sobre imágenes de la Mars Express del sitio.",
    "La fecha exacta de la petición de Croon a HiRISE está como «enero de 2015» (imprecisa).",
    "El vínculo con el Schiaparelli de ExoMars sale de una fuente de JPL que no menciona a Beagle 2.",
    "Un resultado de búsqueda habló de un tema musical de cinco notas, mientras otras fuentes dicen nueve; sin resolver.",
    "El artículo de Nature de 2003 sobre la misión pide inicio de sesión y no se pudo leer.",
]
d["recursos_para_la_plataforma"].update({
    "modelos_3d": [],
    "vistas_desde_orbita": [
        {"nombre": "HiRISE: Beagle 2 (ESP_039308_1915)", "url": "https://www.uahirise.org/ESP_039308_1915"},
        {"nombre": "NASA Science: Beagle 2 Lander on Mars, With Panels Deployed", "url": "https://science.nasa.gov/resource/beagle-2-lander-on-mars-with-panels-deployed/"},
    ],
    "portales": [
        {"nombre": "ESA Mars Express: Beagle-2 on Mars", "url": "https://sci.esa.int/web/mars-express/-/55264-beagle-2-on-mars"},
        {"nombre": "ESA: Beagle retrospective", "url": "https://blogs.esa.int/mex/2015/01/16/beagle-retrospective/"},
    ],
    "nota": "No existe modelo 3D de Beagle 2 en NASA-3D-Resources (revisados sus 1.583 archivos el 2026-11-15); la demo ya tiene un vehículo procedural ficticio 'beagle-2'.",
})

json.dump(d, open(SALIDA, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print("ok", len(d["eventos"]), "eventos")
