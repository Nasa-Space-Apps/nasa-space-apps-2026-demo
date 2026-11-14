import json
from pathlib import Path

AQUI = Path(__file__).parent
DATOS = AQUI / 'data'
PLANTILLAS = AQUI / 'templates'
SALIDA_HTML = AQUI.parent / 'public' / 'story'
SALIDA_HTML.mkdir(parents=True, exist_ok=True)
STRONG = {'oficial NASA/JPL', 'científica'}
src = json.load(open(DATOS / 'linea_de_tiempo_opportunity.json', encoding='utf-8'))
E = {e['id']: e for e in src['eventos']}

ACTOS = {1: 'La idea', 2: 'El viaje', 3: 'El agua en Meridiani', 4: 'Años extra: récords, averías y hallazgos', 5: 'La tormenta y el adiós'}

# id: (acto, gancho, escena_visual, emocion, elementos, por_que, busqueda_sugerida)
N = {
'opp001': (1, 'Un profesor de Cornell cree que, para saber si Marte fue húmedo o seco, hacen falta «botas geológicas sobre el terreno». Nace la idea de un robot geólogo.',
  'Oficina universitaria de los años 80: un profesor frente a una pizarra con un mapa de Marte y el boceto de un robot con ruedas.',
  'curiosidad y determinación', ['Steve Squyres', 'pizarra con boceto de rover', 'mapa de Marte'],
  'Es el origen de todo: una pregunta científica clara (¿Marte fue húmedo o seco?) que el público de secundaria entiende de inmediato.',
  'Entrevistas a Squyres sobre el origen de MER; libro «Roving Mars».'),
'opp005': (1, 'Desde la órbita, un instrumento detecta una mancha de hematita de unos 300 × 500 km. Es un mineral que suele formarse con agua: ya hay destino.',
  'Mapa espectral de Marte con una gran mancha gris sobre Meridiani Planum, visto desde una sonda en órbita.',
  'descubrimiento y expectativa', ['Mars Global Surveyor', 'instrumento TES', 'mancha de hematita'],
  'Responde «¿por qué ahí?»: el sitio de aterrizaje se elige por una pista científica, no al azar.',
  'Artículos de Christensen et al. sobre hematita en Meridiani.'),
'opp008': (1, 'En una reunión se propone un solo rover. El jefe de la NASA pregunta: «¿Y si son dos rovers?». Esa pregunta duplica la misión.',
  'Sala de reuniones con la maqueta de un rover al centro; una sombra proyecta dos rovers en la pared.',
  'tensión que se vuelve entusiasmo', ['Dan Goldin', 'maqueta de rover', 'equipo de ingenieros'],
  'Es una decisión real que cambió la misión y sirve de punto de partida para la versión interactiva.',
  'Fuente primaria de la reunión de julio de 2000 (Goldin, Weiler); la actual es secundaria.'),
'opp015': (2, 'Tras retrasos por un aislante agrietado, una celda de batería y una válvula defectuosa, Opportunity despega de noche en un Delta II.',
  'Cohete Delta II iluminado por reflectores en la plataforma de Cabo Cañaveral, de noche, a punto de despegar.',
  'nervios y alivio', ['Delta II Heavy', 'plataforma SLC-17B', 'cuenta regresiva'],
  'Primer gran momento visual de la historia, con suspenso real por los retrasos.',
  'Cobertura de NASA del lanzamiento del 7 de julio de 2003.'),
'opp018': (2, 'Seis minutos de caída a unos 5.400 m/s: paracaídas, retrocohetes y airbags. Cuando se oye «rebotando», el equipo sabe que llegó.',
  'Secuencia de aterrizaje: la cápsula cae, se abre el paracaídas, los airbags la envuelven y rebota sobre un paisaje plano y rojizo.',
  'tensión extrema y euforia', ['cápsula con airbags', 'paracaídas', 'sala de control JPL', 'Rob Manning'],
  'Es el momento de mayor suspenso de la misión y el más fácil de animar paso a paso.',
  'Material de JPL sobre la entrada, descenso y aterrizaje (EDL) de MER-B.'),
'opp021': (3, 'La NASA anuncia que las rocas de Meridiani estuvieron empapadas en agua líquida. Opportunity encontró jarosita, sulfatos y pequeñas esferas.',
  'Primer plano de un afloramiento de roca con esférulas incrustadas y el brazo del rover con un instrumento acercándose.',
  'asombro', ['Steve Squyres', 'jarosita', 'brazo robótico con instrumentos'],
  'Responde la pregunta científica que abrió la historia: Marte tuvo agua líquida.',
  'Comunicado NASA 2004-074 y artículos de Science de diciembre de 2004.'),
'opp025': (3, 'Aparecen las «blueberries»: pequeñas esferas de hematita esparcidas por el suelo, otra huella de un pasado con agua.',
  'Suelo marciano rojizo cubierto de esferitas oscuras, vistas con la cámara del brazo.',
  'curiosidad lúdica', ['esférulas de hematita', 'cráter Fram'],
  'Tienen un nombre fácil de recordar y una imagen muy visual para el público joven.',
  'Resultados científicos de Squyres et al. 2004; fecha exacta del hallazgo (hay discusión).'),
'opp028': (3, 'El rover baja despacio por la pared del cráter Endurance hasta «Burns Cliff», una pila de rocas finamente estratificadas, y toma un enorme panorama.',
  'Pared vertical de capas de roca vista desde abajo, con el rover diminuto al pie de la pendiente.',
  'escala y asombro', ['Burns Cliff', 'cráter Endurance', 'panorama gigante'],
  'Da una imagen espectacular de escala y de capas de roca que «cuentan» la historia del lugar.',
  'Imágenes PIA07065 y PIA03241 en la web de NASA/JPL.'),
'opp030': (3, 'Junto a su propio escudo térmico descartado, Opportunity encuentra una roca de hierro y níquel: el primer meteorito identificado en otro planeta.',
  'Roca oscura del tamaño de una pelota de baloncesto junto a un escudo térmico abollado sobre la arena.',
  'sorpresa', ['Heat Shield Rock', 'escudo térmico descartado'],
  'Es un hallazgo inesperado y fácil de contar: una roca del espacio sobre otro mundo.',
  'Nota de prensa de JPL de enero de 2005.'),
'opp033': (4, 'Las ruedas se hunden más de 10 cm en una duna. Los ingenieros pasan más de una semana probando con un rover gemelo en la Tierra y logran sacarlo en unas cinco semanas.',
  'Rover con las ruedas medio enterradas en arena clara; en otra escena, ingenieros con un rover gemelo en una caja de arena.',
  'angustia y perseverancia', ['rover atrapado', 'rover gemelo de pruebas', 'duna Purgatory'],
  'Es el primer gran peligro de la misión y muestra el trabajo de equipo entre Marte y la Tierra.',
  'Reportes de JPL del sol 446 al 484 (abril-junio de 2005).'),
'opp045': (4, 'La NASA da por terminada la misión de Spirit, la gemela de Opportunity. Opportunity sigue su camino.',
  'Dos siluetas de rover en el horizonte; una se apaga, la otra sigue en movimiento.',
  'tristeza y resolución', ['Spirit', 'Opportunity'],
  'Da profundidad emocional: la gemela se despide y Opportunity continúa. Hay poco detalle en los datos actuales.',
  'Comunicado NASA de mayo de 2011 sobre el cierre de Spirit; contexto del sol en que dejó de comunicarse.'),
'opp047': (4, 'Opportunity encuentra «Homestake», una vena brillante de yeso. Squyres la considera la evidencia más poderosa de agua líquida que halló el rover.',
  'Vena clara y brillante cruzando una roca oscura, vista de cerca.',
  'triunfo científico', ['vena de yeso Homestake', 'Cape York', 'Steve Squyres'],
  'Es la prueba más fuerte de agua del rover y cierra el arco científico de la historia.',
  'Comunicado de JPL de diciembre de 2011 y estudios posteriores de Squyres et al.'),
'opp052': (4, 'Con una marcha de 80 m, el odómetro supera los 35,744 km del vehículo lunar del Apolo 17. Un rover en Marte pasa a un récord lunar.',
  'Huellas de ruedas en Marte extendiéndose al horizonte; un vehículo lunar del Apolo 17 en una esquina.',
  'orgullo', ['Opportunity', 'vehículo lunar del Apolo 17'],
  'Conecta con la historia de las misiones lunares, que el público conoce.',
  'Nota de prensa de NASA/JPL de mayo de 2013.'),
'opp054': (4, 'En una imagen aparece una roca blanca con el centro rojo donde cuatro días antes no había nada. Es la «rosquilla de mermelada».',
  'Dos fotos lado a lado: la misma zona vacía y, cuatro días después, una pequeña roca blanca con centro rojo.',
  'misterio', ['Pinnacle Island', 'rueda de Opportunity'],
  'Es un pequeño misterio con resolución clara: la rueda movió un fragmento. Atrae a estudiantes.',
  'Artículos de JPL de enero de 2014 y análisis de manganeso y azufre.'),
'opp059': (4, 'La memoria flash se degrada y el rover empieza a «olvidar» lo que hizo cada sol. La amnesia obliga a cambiar el software.',
  'Interfaz de datos con líneas que se borran al apagarse; el rover «durmiendo» en la noche marciana.',
  'preocupación', ['memoria flash de 256 MB', 'banco 7', 'ingenieros de software'],
  'Muestra que una misión larga también se enfrenta a fallos de hardware, no solo a terreno difícil.',
  'Reportes de JPL de 2014-2015 sobre la memoria flash.'),
'opp062': (4, 'Opportunity completa una distancia de maratón: el primer rover en lograrlo en otro mundo. Luego explora Marathon Valley.',
  'Línea de meta imaginaria en un camino marciano con huellas de rueda; el odómetro marca 42,198 km.',
  'celebración', ['Opportunity', 'odómetro', 'Marathon Valley'],
  'Un hito deportivo comprensible para cualquier estudiante.',
  'Página oficial de NASA sobre el maratón de Opportunity (24 de marzo de 2015).'),
'opp070': (5, 'Un orbitador detecta una tormenta de polvo que avanza hacia Opportunity. En pocos días cubre el planeta y convierte el día en noche sobre el rover.',
  'Cielo naranja que se oscurece sobre Perseverance Valley; el rover pequeño bajo un cielo casi negro.',
  'amenaza creciente', ['Mars Reconnaissance Orbiter', 'tormenta global de polvo', 'paneles solares'],
  'Inicia el desenlace con un antagonista natural claro. Los paneles solares dependen de la luz.',
  'Comunicados de JPL de junio de 2018; fecha exacta de detección (hay discusión).'),
'opp072': (5, 'Opportunity toma 354 imágenes para un último panorama; las finales son en blanco y negro porque la tormenta impidió usar los filtros. Luego, silencio.',
  'Panorama nocturno oscuro con luz tenue sobre Perseverance Valley; el rover inmóvil, con los paneles cubiertos de polvo.',
  'melancolía', ['Perseverance Valley', 'panorama de 360°', 'sol 5111'],
  'Es el punto emocional de la historia. Aviso: la frase «mi batería está baja y se está haciendo oscuro» no es un texto del rover, es una traducción poética de un periodista.',
  'Archivo oficial de JPL y del periodista Jacob Margolis sobre la frase.'),
'opp077': (5, "Tras ocho meses de intentos, JPL transmite las últimas instrucciones mientras suena «I'll Be Seeing You». Se declara completa una misión pensada para 90 soles y que duró 15 años.",
  'Sala de control casi a oscuras, pantallas con la señal plana; ingenieros escuchando la canción.',
  'despedida y gratitud', ['Thomas Zurbuchen', 'John Callas', 'antena de Goldstone'],
  'Es el cierre de la misión, con una frase real: «Farewell, Opportunity, and well done».',
  'Conferencia de prensa de NASA del 13 de febrero de 2019.'),
'opp081': (5, 'Años después, Perseverance supera los 45,16 km de Opportunity. Lo logra en unos cinco años y medio, en gran parte por conducir de forma autónoma.',
  'Dos rovers en un mismo horizonte: uno viejo y polvoriento, otro nuevo y brillante, con un odómetro entre ambos.',
  'legado y esperanza', ['Perseverance', 'Opportunity', 'AutoNav'],
  'Cierra el círculo: el pasado inspira el futuro. Es un buen final para el público joven.',
  'Página oficial de NASA sobre el récord de Perseverance (octubre de 2026).'),
}
assert len(N) == 20


def solidez(fs):
    return 'fuerte' if any(f['tipo'] in STRONG for f in fs) else 'debil'


evs = []
for i, (eid, (acto, gancho, escena, emo, elem, why, busc)) in enumerate(N.items(), 1):
    e = E[eid]
    evs.append({
        'id': eid, 'orden_historia': i, 'acto': acto, 'acto_titulo': ACTOS[acto],
        'fecha_inicio': e['fecha_inicio'], 'fecha_fin': e['fecha_fin'], 'precision_fecha': e.get('precision_fecha'),
        'sol': e['sol'], 'titulo': e['titulo'],
        'narrativa': {'gancho': gancho, 'escena_visual': escena, 'emocion': emo, 'elementos': elem, 'por_que_se_eligio': why},
        'hechos': {'detalle': e['detalle'], 'datos_clave': e['datos_clave'], 'discutido': e['discutido'], 'nota': e['nota']},
        'fuentes': e['fuentes'], 'solidez_fuentes': solidez(e['fuentes']), 'busqueda_sugerida': busc,
    })

out = {
    'esquema_version': 'historia-1.0', 'mision': src['mision']['nombre'], 'idioma': 'es',
    'titulo': 'Opportunity: la historia en 20 momentos',
    'publico': 'Estudiantes de 5.º de secundaria (último año)',
    'criterio_de_seleccion': 'Prioridad 1: potencial para contar la historia de la misión y generar imágenes y animaciones. Prioridad 2: fuentes confiables (no determinante; otro agente ampliará fuentes).',
    'actos': [{'n': k, 'titulo': v, 'eventos': [e['id'] for e in evs if e['acto'] == k]} for k, v in ACTOS.items()],
    'eventos': evs,
    'resumen': {'eventos': len(evs), 'con_fuente_fuerte': sum(e['solidez_fuentes'] == 'fuerte' for e in evs),
                'con_fuente_debil': [e['id'] for e in evs if e['solidez_fuentes'] == 'debil'],
                'discutidos': [e['id'] for e in evs if e['hechos']['discutido']]},
    'aviso': 'Los campos de «narrativa» son redacción editorial hecha a partir de los hechos del evento; no son citas. Los hechos y fuentes provienen de linea_de_tiempo_opportunity.json.',
}
json.dump(out, open(DATOS / 'historia_opportunity.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print(json.dumps(out['resumen'], ensure_ascii=False))

t = open(PLANTILLAS / 'historia.template.html', encoding='utf-8').read()
data = open(DATOS / 'historia_opportunity.json', encoding='utf-8').read().replace('</', '<\/')
open(SALIDA_HTML / 'historia.html', 'w', encoding='utf-8').write(t.replace('__DATA__', data))
