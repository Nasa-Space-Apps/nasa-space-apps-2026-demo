"""Juego «Opportunity: tú decides», versión 2 (30 nodos).

Regla de oro: todo lo real sale de los dossiers verificados (agents/opportunity-research/salida/<id>/dossier.json).
Cada nodo real lleva `respaldo`: referencias «opp009#3» = dato 3 de los `datos_reales` de ese dossier. Los tests comprueban que existan.
Los nodos ficticios (2 por cada opción equivocada) no llevan fuentes ni citas ni cifras: narran lo que habría pasado.

Estructura: 12 historias + 6 decisiones (camino real = 18 nodos) + 12 ficticios (6 decisiones x 1 opción equivocada x 2 niveles) = 30.
Se genera: data/juego2_opportunity.json y .js, y public/story/juego2.html.
"""
import json
from pathlib import Path

AQUI = Path(__file__).parent
DATOS = AQUI / 'data'
PLANTILLAS = AQUI / 'templates'
SALIDA_HTML = AQUI.parent / 'public' / 'story'
DOSSIERS = AQUI.parent / 'agents' / 'opportunity-research' / 'salida'
SALIDA_HTML.mkdir(parents=True, exist_ok=True)

CAPS = {1: 'Una pregunta y un riesgo', 2: 'Elegir un mundo', 3: 'Despegue y llegada', 4: 'Marte pone a prueba', 5: 'El agua y el adiós'}


def dossier(ev):
    return json.loads((DOSSIERS / ev / 'dossier.json').read_text(encoding='utf-8'))


_cache = {}


def dato(ref):
    ev, i = ref.split('#')
    if ev not in _cache:
        _cache[ev] = dossier(ev)
    return _cache[ev]['datos_reales'][int(i)]


def fuentes_de(refs):
    """Fuentes (URL) de los datos citados; sirve para el modo creador."""
    vistas, out = set(), []
    for r in refs:
        d = dato(r)
        u = d['fuente_url']
        if u not in vistas:
            vistas.add(u)
            host = u.split('/')[2].replace('www.', '')
            out.append({'titulo': u, 'editor': host, 'url': u, 'tipo': 'dossier verificado'})
    return out


def base_de(refs):
    return sorted({r.split('#')[0] for r in refs})


def historia(id, cap, titulo, fecha, texto, refs, dato_titulo, dato_texto, escena, emocion, siguiente=None, final=False):
    n = {'id': id, 'tipo': 'historia', 'camino': 'real', 'ficticio': False, 'hipotetico': False, 'capitulo': cap, 'capitulo_titulo': CAPS[cap],
         'personaje': 'Opportunity', 'titulo': titulo, 'fecha': fecha, 'narrativa': {'texto': texto, 'escena_visual': escena, 'emocion': emocion},
         'respaldo': refs, 'eventos_base': base_de(refs), 'datos_clave': [], 'fuentes': fuentes_de(refs),
         'dato_desbloqueado': {'titulo': dato_titulo, 'texto': dato_texto}}
    if siguiente:
        n['siguiente'] = siguiente
    if final:
        n['final'] = True
    return n


def decision(id, cap, titulo, fecha, situacion, sabe, en_juego, pregunta, opciones, resultado, resultado_refs, dato_titulo, dato_texto, escena, emocion):
    """sabe = [(texto, [refs])]; opciones = [(texto, detalle, correcta, siguiente)]"""
    refs = [r for _, rs in sabe for r in rs] + situacion[1]
    ops = [{'id': f'{id}-{"AB"[i]}', 'texto': t, 'detalle': d, 'correcta': c, 'siguiente': s} for i, (t, d, c, s) in enumerate(opciones)]
    allrefs = refs + resultado_refs
    return {'id': id, 'tipo': 'decision', 'camino': 'real', 'ficticio': False, 'hipotetico': False, 'capitulo': cap, 'capitulo_titulo': CAPS[cap],
            'personaje': 'Equipo de la misión', 'titulo': titulo, 'fecha': fecha,
            'narrativa': {'texto': situacion[0], 'escena_visual': escena, 'emocion': emocion},
            'contexto': {'lo_que_sabes': [t for t, _ in sabe], 'en_juego': en_juego},
            'pregunta': pregunta, 'opciones': ops, 'resultado_real': resultado,
            'respaldo': refs, 'respaldo_resultado': resultado_refs, 'eventos_base': base_de(allrefs), 'datos_clave': [], 'fuentes': fuentes_de(allrefs),
            'tiempo_s': 40, 'opcion_por_defecto': next(o['id'] for o in ops if not o['correcta']),
            'dato_desbloqueado': {'titulo': dato_titulo, 'texto': dato_texto}}


def alterna1(id, cap, titulo, fecha, texto, escena, emocion, siguiente):
    return {'id': id, 'tipo': 'escena_alternativa', 'camino': 'alternativo', 'ficticio': True, 'hipotetico': True, 'nivel': 1, 'capitulo': cap,
            'capitulo_titulo': CAPS[cap], 'personaje': 'Opportunity', 'titulo': titulo, 'fecha': fecha,
            'narrativa': {'texto': texto, 'escena_visual': escena, 'emocion': emocion}, 'respaldo': [], 'eventos_base': [], 'datos_clave': [],
            'fuentes': [], 'siguiente': siguiente}


def alterna2(id, cap, titulo, fecha, texto, en_realidad, en_realidad_refs, escena, emocion, volver_a):
    return {'id': id, 'tipo': 'fallo', 'camino': 'alternativo', 'ficticio': True, 'hipotetico': True, 'nivel': 2, 'capitulo': cap,
            'capitulo_titulo': CAPS[cap], 'personaje': 'Opportunity', 'titulo': titulo, 'fecha': fecha,
            'narrativa': {'texto': texto, 'escena_visual': escena, 'emocion': emocion}, 'respaldo': [], 'eventos_base': [], 'datos_clave': [],
            'fuentes': [], 'volver_a': volver_a, 'leccion': en_realidad, 'en_realidad_respaldo': en_realidad_refs}


N = []

# ===================== CAPÍTULO 1 =====================
N.append(historia('n01', 1, 'Cuatro propuestas', '1987-1997',
    'Todo empezó con una persona y una idea. Steve Squyres, profesor de la Universidad de Cornell, quería enviar a Marte un robot que trabajara como lo hace un geólogo en el campo: un «geólogo de campo robótico». Su interés por Marte había nacido de joven, mirando fotos de la misión Viking en la universidad. Entre 1987 y 1997 escribió cuatro propuestas a la NASA para una misión con un rover. Las tres primeras fueron rechazadas, y cada vez él las fue mejorando. Su meta científica era ir a lugares donde hubo agua líquida en el pasado.',
    ['opp001#0', 'opp001#1', 'opp001#2', 'opp001#5', 'opp001#8'],
    'Cuatro intentos', 'Squyres escribió cuatro propuestas entre 1987 y 1997; las tres primeras fueron rechazadas.',
    'Un joven profesor ante una mesa con fotos de Marte de la misión Viking y borradores de una propuesta.', 'perseverancia', 'n02'))

N.append(historia('n02', 1, 'Dos fracasos en un año', '1999',
    'En 1999 la NASA perdió dos misiones a Marte. El Mars Climate Orbiter se destruyó en la atmósfera marciana el 23 de septiembre, nueve meses después de su lanzamiento. La causa fue un error de navegación: el software de tierra usaba unidades inglesas y el de a bordo, unidades métricas. El Mars Polar Lander desapareció durante la entrada en la atmósfera. Estos fracasos pesaron mucho en las decisiones que vinieron después.',
    ['opp004#0', 'opp004#1', 'opp009#10'],
    'Un error de unidades', 'El Mars Climate Orbiter se perdió porque un software usaba unidades inglesas y otro, métricas.',
    'Una sala de control en silencio, con pantallas sin señal y el equipo mirando en la misma dirección.', 'tensión y cautela', 'n03'))

N.append(decision('n03', 1, '¿Uno o dos rovers?', 'Julio de 2000',
    ('Julio de 2000. La NASA ya decidió construir un rover en lugar de un orbitador científico, y estudia enviar dos rovers a lugares distintos de Marte en 2003. El plan original era un solo rover, pariente del Pathfinder de 1997. En pocas semanas hay que decidir si se sigue adelante con dos.',
     ['opp008#0', 'opp008#2', 'opp008#1']),
    [('En 1999 se perdieron dos misiones a Marte: el Mars Climate Orbiter, por un error de unidades en la navegación, y el Mars Polar Lander, durante la entrada en la atmósfera.', ['opp004#0', 'opp009#10']),
     ('Un rover costaría entre 350 y 400 millones de dólares, cohete incluido. El segundo costaría unos 200 millones más.', ['opp009#3']),
     ('Cada rover podría recorrer unos 100 metros por día marciano y trabajaría al menos 90 días marcianos.', ['opp009#6', 'opp009#7']),
     ('El objetivo es aprender sobre el agua y el clima antiguos de Marte.', ['opp008#7'])],
    'Más ciencia y más seguridad cuestan más dinero; gastar menos significa depender de una sola máquina.',
    '¿Qué se construye para 2003?',
    [('Construir un solo rover.', 'Cuesta menos y es el plan original, pero toda la misión dependería de una sola nave.', False, 'n03a'),
     ('Construir dos rovers iguales, para dos lugares distintos.', 'Cuesta unos 200 millones más, que saldrían de otras divisiones de la NASA, pero habría dos naves trabajando.', True, 'n04')],
    'El 10 de agosto de 2000 la NASA anunció oficialmente que lanzaría dos grandes rovers científicos en 2003, en lugar del plan original de uno. Serían duplicados exactos y irían a lugares muy distintos de Marte. Scott Hubbard, de la NASA, explicó que con dos rovers se duplicaba el retorno científico y se daba más resiliencia al programa.',
    ['opp009#0', 'opp008#5', 'opp008#6'],
    'Dos es más seguro', 'Con dos rovers se duplicaba el retorno científico y el programa era más resiliente (Scott Hubbard, NASA).',
    'Una mesa de reuniones con la maqueta de un rover y un calendario que marca 2003.', 'duda'))
N.append(alterna1('n03a', 1, 'Todo depende de una nave', '2003',
    'La NASA sigue adelante con un solo rover. El proyecto es más sencillo y más barato, y el equipo del JPL pone toda su energía en una sola máquina. Cada prueba cuenta más, porque no hay una segunda nave que pueda cubrir un error. El rover queda listo a tiempo para la ventana de lanzamiento de 2003. En los pasillos del laboratorio todavía se habla de 1999: dos misiones perdidas en un año, y esta vez no habría repuesto.',
    'Un único rover sobre la plataforma de pruebas, con un espacio vacío a su lado.', 'esperanza con miedo', 'n03b'))
N.append(alterna2('n03b', 1, 'Sin segunda oportunidad', '2004',
    'El rover viaja sin problemas durante meses. Pero en la entrada a la atmósfera de Marte la señal se corta y no vuelve. Sin una segunda nave, el equipo no tiene cómo compensar la pérdida. La misión termina antes de empezar, y la pregunta sobre el agua antigua de Marte queda sin respuesta.',
    'En la realidad la NASA eligió dos rovers: duplicaban el retorno científico y daban resiliencia al programa. Además, a diferencia del Polar Lander de 1999, los nuevos módulos transmitirían señales durante toda la entrada en la atmósfera para poder diagnosticar fallos.',
    ['opp008#6', 'opp009#11'],
    'Una sala de control con la pantalla en negro y los ingenieros en silencio.', 'decepción', 'n03'))

# ===================== CAPÍTULO 2 =====================
N.append(historia('n04', 2, 'Un destino con pistas', '2000-2002',
    'Los rovers necesitaban un lugar donde buscar agua. En 2000, el instrumento TES del satélite Mars Global Surveyor descubrió hematita gris cristalina en una región de Meridiani Planum de unos 300 por 500 kilómetros, según el equipo que la descubrió. La hematita es un óxido de hierro que puede formarse cuando circula agua subterránea por rocas ricas en hierro. En 2002, el instrumento THEMIS, de Mars Odyssey, la confirmó con más detalle y mostró que el lugar no estaba cubierto de grandes rocas ni de extensas zonas de polvo, los dos peligros habituales para los aterrizajes.',
    ['opp005#0', 'opp005#1', 'opp005#4', 'opp010#1'],
    'Un mineral como pista', 'La hematita es un óxido de hierro que puede formarse cuando circula agua subterránea por rocas ricas en hierro.',
    'Un mapa de Marte visto desde la órbita con una región señalada en el ecuador.', 'expectativa', 'n05'))

N.append(decision('n05', 2, 'Elegir el lugar de aterrizaje', '11 de abril de 2003',
    ('Abril de 2003. Después de más de dos años de talleres con científicos y de estudiar 155 sitios candidatos, la NASA debe fijar los destinos de los dos rovers. Los ingenieros quieren lugares seguros para aterrizar; los científicos, lugares donde buscar agua. Ya hay una región con una señal mineral enorme. Falta decidir hacia dónde va el segundo rover.',
     ['opp012#1', 'opp012#2']),
    [('Los criterios de ingeniería piden un sitio cerca del ecuador, de baja altitud, poco inclinado, poco rocoso y con poca polvareda.', ['opp012#2']),
     ('Las imágenes nocturnas de THEMIS muestran que Meridiani no está cubierto de grandes rocas ni de extensas zonas de polvo.', ['opp010#1']),
     ('Ningún otro lugar de Marte se acercaba a Meridiani en la intensidad de su señal mineral.', ['opp010#3']),
     ('El responsable científico de la NASA resumió el reto: hay que equilibrar el valor científico con la seguridad del aterrizaje.', ['opp012#14'])],
    'Un aterrizaje fallido cuesta toda la misión; un sitio aburrido cuesta toda la ciencia.',
    '¿A qué tipo de lugar va el segundo rover?',
    [('Una llanura casi sin rocas, con una señal de hematita que ningún otro lugar de Marte igualaba.', 'Es más segura para aterrizar y tiene una pista clara de agua, pero el paisaje es poco vistoso.', True, 'n06'),
     ('Una región de cañones y laderas, con paisajes espectaculares.', 'Sería impactante en las fotos y fácil de explicar al público, pero tiene más rocas y pendientes, más difíciles para aterrizar.', False, 'n05a')],
    'La NASA fijó los dos destinos el 11 de abril de 2003: el cráter Gusev y Meridiani Planum. Squyres los describió como complementarios. El segundo rover, Opportunity, estaba programado para lanzarse el 25 de junio de 2003 hacia Meridiani Planum, con aterrizaje previsto el 25 de enero de 2004.',
    ['opp012#0', 'opp012#8', 'opp012#6'],
    '155 candidatos', 'Antes de elegir los dos destinos se estudiaron 155 sitios potenciales en Marte.',
    'Una mesa con mapas de sitios marcianos y científicos señalando un punto en el ecuador.', 'responsabilidad'))
N.append(alterna1('n05a', 2, 'Un paisaje de postal', '2003',
    'La NASA elige una región de cañones y laderas. Las simulaciones de aterrizaje muestran más rocas y más pendientes de las que prefieren los ingenieros, pero los científicos defienden que las imágenes serían inolvidables. Los preparativos avanzan, y el rover viaja hacia Marte entre expectativa y nervios.',
    'Un paisaje de cañones marcianos y, en una esquina, la silueta de la cápsula descendiendo.', 'inquietud', 'n05b'))
N.append(alterna2('n05b', 2, 'Los airbags no resisten', '2004',
    'La entrada a la atmósfera sale según lo planeado, hasta el rebote. Al golpear una roca afilada, uno de los airbags se rasga y el módulo queda dañado. El rover no logra abrir sus pétalos. La misión termina el mismo día en que llegó.',
    'En la realidad se eligió una llanura: las imágenes de THEMIS mostraban que Meridiani no estaba cubierto de grandes rocas ni de extensas zonas de polvo, los dos peligros habituales para los aterrizajes.',
    ['opp010#1'],
    'Airbags rasgados sobre rocas oscuras y una cápsula inclinada.', 'decepción', 'n05'))

N.append(historia('n06', 3, 'Spirit abre el camino', '10 de junio de 2003',
    'Spirit, el primer rover, despegó el 10 de junio de 2003 en un cohete Delta II estándar, dos semanas y media antes que Opportunity. Para Opportunity hacía falta más potencia: una versión nueva, el Delta II Heavy, con nueve cohetes sólidos de 46 pulgadas de diámetro que aumentaban el rendimiento en más de un 20 %. Era la primera vez que ese cohete se usaba con un escenario superior en una misión real. Opportunity estaba programado para despegar el 25 de junio de 2003, rumbo a Meridiani Planum.',
    ['opp015#8', 'opp015#5', 'opp015#3', 'opp012#6'],
    'Más potencia', 'El Delta II Heavy aumentaba el rendimiento del Delta II en más de un 20 %.',
    'Un cohete despegando de noche y, al fondo, la plataforma de un segundo cohete a la espera.', 'ansiedad', 'n07'))

N.append(decision('n07', 3, 'Una batería en el último momento', '6 de julio de 2003',
    ('Domingo 6 de julio de 2003, Cabo Cañaveral. El lanzamiento de Opportunity ya se retrasó varios días: el corcho de aislamiento térmico del primer escenario del cohete se despegó repetidamente. Hoy, durante la cuenta regresiva, falla una celda de batería del sistema de terminación de vuelo, parte del sistema de seguridad del cohete. Hay que decidir si se despega o se espera.',
     ['opp015#6', 'opp015#7']),
    [('Spirit ya viaja hacia Marte desde el 10 de junio.', ['opp015#8']),
     ('El aterrizaje de Opportunity está previsto para el 25 de enero de 2004.', ['opp015#11']),
     ('La nave pesa 1.062 kilos y va montada en un cohete Delta II Heavy.', ['opp015#2', 'opp015#5']),
     ('Es la primera vez que ese cohete vuela con un escenario superior en una misión real.', ['opp015#3'])],
    'Un día de espera cuesta poco; un fallo en el cohete lo pierde todo.',
    '¿Qué se hace con la batería averiada?',
    [('Despegar hoy, para no acumular más retrasos.', 'Se respeta el calendario, pero se vuela con el sistema de seguridad con una falla.', False, 'n07a'),
     ('Retrasar el lanzamiento un día y corregir la falla.', 'Se pierde un día más, pero se revisa el sistema de seguridad antes de despegar.', True, 'n08')],
    'El lanzamiento se pasó del domingo 6 al lunes 7 de julio de 2003. Esa noche, a las 11:18:15 p. m. (hora del este), Opportunity despegó desde Cabo Cañaveral. La nave se separó del tercer escenario unos 83 minutos después, ya fuera de la órbita terrestre. El JPL recibió su señal a las 12:43 a. m. a través de las antenas de Goldstone y confirmó que todos los sistemas funcionaban correctamente.',
    ['opp015#7', 'opp015#0', 'opp015#1', 'opp015#10'],
    'Un día de retraso', 'El lanzamiento se atrasó del 6 al 7 de julio de 2003 por la falla de una celda de batería.',
    'La plataforma de lanzamiento bajo reflectores, con el cohete cubierto de vapor frío.', 'presión'))
N.append(alterna1('n07a', 3, 'Cuenta regresiva', '2003',
    'Se decide no esperar. La cuenta regresiva avanza sin más novedades y el cohete se enciende entre una nube de humo y fuego. En la sala de control los ingenieros siguen cada dato sin quitar la vista de los monitores. Al principio todo parece normal.',
    'El cohete elevándose con una columna de fuego sobre el mar, de noche.', 'tensión', 'n07b'))
N.append(alterna2('n07b', 3, 'Una falla en el ascenso', '2003',
    'Pocos minutos después del despegue, los datos de seguimiento empiezan a salirse de lo esperado. El cohete se desvía de su trayectoria y los controladores deben ordenar su destrucción. Opportunity nunca llega al espacio.',
    'En la realidad se esperó un día y se corrigió la falla de la batería del sistema de seguridad. Opportunity despegó el lunes 7 de julio de 2003 y su señal confirmó que todos los sistemas funcionaban bien.',
    ['opp015#7', 'opp015#10'],
    'Restos luminosos cayendo sobre el océano en la noche.', 'decepción', 'n07'))

# ===================== CAPÍTULO 3 =====================
N.append(historia('n08', 3, 'Seis minutos de caída', '24 de enero de 2004',
    'Opportunity entró en la atmósfera de Marte a unas 12.000 millas por hora, unos 5.400 metros por segundo. La caída duró unos seis minutos. El calentamiento máximo llegó 42 segundos después de la entrada, con una deceleración máxima de 6,3 g. Lo que se veía en la sala de control llevaba unos 11 minutos de retraso por la distancia. A las 9:05 p. m., hora del Pacífico, el JPL recibió la primera señal desde la superficie, y Rob Manning anunció que habían llegado a Marte. El módulo había rebotado y rodado hasta caer dentro de un cráter de unos 22 metros, el cráter Eagle, y se detuvo sobre uno de sus tres pétalos. Pete Theisinger resumió el momento: «We are two for two».',
    ['opp018#8', 'opp018#7', 'opp018#9', 'opp018#11', 'opp018#0', 'opp018#1', 'opp018#16', 'opp018#15', 'opp018#2', 'opp018#14'],
    'Un rebote afortunado', 'El módulo rebotó, rodó y cayó dentro de un cráter de unos 22 metros: el cráter Eagle.',
    'La cápsula con los airbags inflados rodando sobre un paisaje plano y rojizo.', 'tensión y euforia', 'n09'))

N.append(historia('n09', 3, 'Rocas empapadas en agua', '2 de marzo de 2004',
    'El 2 de marzo de 2004, Steve Squyres anunció en una conferencia de prensa en Washington que las rocas de Meridiani Planum estuvieron empapadas en agua líquida: «El agua líquida fluyó una vez por estas rocas. Cambió su textura y cambió su química». Las pruebas eran varias: el espectrómetro Mössbauer detectó jarosita, un sulfato de hierro hidratado, en la roca El Capitan; el APXS halló una concentración muy alta de azufre; la roca tenía cavidades alargadas llamadas vugs, y esferas incrustadas, las «arándanos» o blueberries. Squyres precisó que aquel lugar fue un ambiente habitable, lo que no significa que hubiera vida. Y el equipo reconoció que no sabía cuánto tiempo atrás existió el agua.',
    ['opp021#0', 'opp021#1', 'opp021#3', 'opp021#4', 'opp021#7', 'opp021#8', 'opp021#14', 'opp021#15'],
    'Un mineral con agua', 'La jarosita, un sulfato de hierro hidratado, fue una de las pruebas de que hubo agua líquida en Meridiani.',
    'Una roca con esferas incrustadas fotografiada de cerca por el brazo del rover.', 'asombro', 'n10'))

N.append(historia('n10', 4, 'Una roca caída del cielo', '6 de enero de 2005',
    'El 6 de enero de 2005, el sol 339 de la misión, Opportunity identificó el primer meteorito de cualquier tipo hallado en otro planeta. Tiene el tamaño aproximado de una pelota de baloncesto y está hecho sobre todo de hierro y níquel. Su masa se estima en unos 40 kilos. Descansaba sobre una llanura de arenisca rica en sulfatos, sin ningún cráter visible a su alrededor. Los científicos no pueden saber si cayó hace 300.000 años o hace 3.000 millones.',
    ['opp030#0', 'opp030#1', 'opp030#2', 'opp030#5', 'opp030#6', 'opp030#7'],
    'Un meteorito en Marte', 'Fue el primer meteorito de cualquier tipo identificado en otro planeta.',
    'Una roca oscura sobre una llanura clara de arenisca, con las huellas del rover al fondo.', 'sorpresa', 'n11'))

N.append(decision('n11', 4, 'Atrapado en la arena', '26 de abril de 2005',
    ('26 de abril de 2005, sol 446. Opportunity conduce marcha atrás cuando sus ruedas se hunden más de 10 centímetros en un rizo de arena de un tercio de metro de alto y 2,5 metros de ancho. Llevaba casi 40 metros de un recorrido planeado de 90. Las ruedas patinan. En la Tierra hay que decidir cómo sacarlo.',
     ['opp033#0', 'opp033#2', 'opp033#1', 'opp033#3', 'opp033#4']),
    [('Las ruedas se hunden en material arenoso blando y siguen patinando.', ['opp033#2']),
     ('Desde el sol 436, el motor de dirección de la rueda delantera derecha opera con restricciones.', ['opp033#13']),
     ('El rover conducía marcha atrás: el equipo alterna la dirección de conducción para repartir la lubricación de las ruedas.', ['opp033#4']),
     ('Estaba en el sol 446 de una misión planeada para al menos 90 días marcianos.', ['opp033#0', 'opp012#9'])],
    'Un error puede dejar al rover atrapado para siempre; esperar cuesta semanas de ciencia.',
    '¿Cómo se intenta sacar a Opportunity?',
    [('Seguir conduciendo con fuerza hasta salir de la arena.', 'Es la salida más rápida, pero las ruedas patinan y podrían hundirse todavía más.', False, 'n11a'),
     ('Reproducir la duna en la Tierra, probar maniobras y solo entonces mover el rover.', 'Tarda semanas, pero se prueba antes de arriesgar la única máquina que hay en Marte.', True, 'n12')],
    'El equipo construyó una enorme caja de arena con arena, arcilla y material para tratar piscinas para simular las condiciones de Marte. Pasó más de una semana diseñando y probando antes de elegir cómo sacar al rover. La salida requirió más de cinco semanas de planificación, pruebas y conducción cuidadosamente supervisada. Opportunity quedó libre el sol 484, el 4 de junio de 2005.',
    ['opp033#6', 'opp033#5', 'opp033#11', 'opp033#8', 'opp033#9'],
    'Marte en una caja', 'El equipo simuló Marte en una caja de arena con arena, arcilla y material para tratar piscinas.',
    'Ingenieros alrededor de una gran caja de arena con un rover de prueba y, en una pantalla, la duna real.', 'angustia'))
N.append(alterna1('n11a', 4, 'A toda potencia', '2005',
    'El equipo ordena avanzar con más fuerza para salir de un solo impulso. Las ruedas giran, levantan arena y el rover se hunde un poco más con cada vuelta. En la Tierra, los ingenieros miran los datos de cada movimiento con preocupación.',
    'Ruedas girando en la arena y un surco cada vez más profundo.', 'urgencia', 'n11b'))
N.append(alterna2('n11b', 4, 'Enterrado en la duna', '2005',
    'Tras varios intentos, las ruedas quedan cubiertas hasta los cubos y el rover ya no avanza. La duna lo sujeta lejos de las rocas que quería estudiar. La misión, que ya había superado con mucho el tiempo para el que fue diseñada, termina ahí.',
    'En la realidad el equipo no movió el rover enseguida: construyó una caja de arena para simular Marte y pasó más de una semana diseñando y probando antes de elegir la maniobra. Opportunity salió el 4 de junio de 2005.',
    ['opp033#6', 'opp033#5', 'opp033#9'],
    'El rover inmóvil, hundido en la arena, con el paisaje intacto alrededor.', 'frustración', 'n11'))

N.append(historia('n12', 4, 'El brazo atascado', '2008',
    'El 15 de abril de 2008 (sol 1502), el motor del hombro del brazo robótico se bloqueó al inicio de un despliegue, con el brazo todavía plegado bajo el chasis. El diagnóstico apuntó a un problema eléctrico y no a un atasco mecánico. El 14 de mayo, el equipo dirigió la máxima corriente posible al motor caliente y logró llevar el brazo a una posición frontal. Entonces tomó una decisión: no volver a plegarlo nunca más. Opportunity conduciría con el brazo extendido al frente el resto de su vida, aunque eso limitaba los obstáculos que podía cruzar.',
    ['opp039#0', 'opp039#3', 'opp039#6', 'opp039#7', 'opp039#8'],
    'El brazo al frente', 'Desde mayo de 2008 Opportunity condujo con el brazo robótico extendido al frente.',
    'El rover avanzando con el brazo extendido hacia adelante sobre una llanura arenosa.', 'alivio y adaptación', 'n13'))

N.append(decision('n13', 4, 'Rumbo a un cráter lejano', '28 de agosto de 2008',
    ('28 de agosto de 2008, sol 1634. Opportunity sale del cráter Victoria, de 800 metros de diámetro, donde pasó casi doce meses dentro y otros doce examinándolo desde el borde. A unos 12 kilómetros al sureste está Endeavour, un cráter de unos 22 kilómetros de diámetro y 300 metros de profundidad. Hay que decidir hacia dónde seguir.',
     ['opp040#0', 'opp040#1', 'opp041#10', 'opp041#2', 'opp041#3']),
    [('Un satélite acaba de detectar arcillas (filosilicatos) en el borde occidental de Endeavour, minerales que se forman en agua.', ['opp041#14']),
     ('Llegar tomaría unos dos años si el rover avanza unos 100 metros al día.', ['opp041#5']),
     ('Podrían no llegar.', ['opp041#4']),
     ('Para entonces Opportunity llevaba casi cinco años en Marte, en una misión diseñada para 90 días.', ['opp041#11'])],
    'Quedarse es seguro pero conocido; irse promete más, pero podría no terminar.',
    '¿Hacia dónde sigue Opportunity?',
    [('Emprender el viaje a Endeavour.', 'Es un camino largo y arriesgado, sin garantía de llegar, hacia un cráter con arcillas y capas de roca mucho más profundas.', True, 'n14'),
     ('Quedarse explorando los alrededores de Victoria.', 'Es un terreno que ya conocen tras dos años allí y con poco riesgo, pero se renuncia a las arcillas de Endeavour.', False, 'n13a')],
    'El 22 de septiembre de 2008 la NASA anunció el destino Endeavour. Steve Squyres admitió que podían no llegar, pero que era la dirección científicamente correcta. John Callas lo describió como el objetivo más audaz y agresivo que el equipo había tenido. El viaje real duró casi tres años y unos 21 kilómetros, y Opportunity llegó a Endeavour el 9 de agosto de 2011.',
    ['opp041#1', 'opp041#4', 'opp041#6', 'opp040#4'],
    'Casi tres años de viaje', 'Opportunity tardó casi tres años y unos 21 kilómetros en llegar al cráter Endeavour (9 de agosto de 2011).',
    'Un rover pequeño en una llanura enorme y, en el horizonte, el borde lejano de un gran cráter.', 'riesgo y ambición'))
N.append(alterna1('n13a', 4, 'Un lugar ya conocido', '2009',
    'Se decide seguir explorando los alrededores de Victoria. El trabajo continúa con buenos datos y poco riesgo, pero el borde de Endeavour sigue en el horizonte, sin visitar. Los meses pasan y los paneles siguen cargándose cada día.',
    'El rover cerca del borde de un cráter conocido y, a lo lejos, una línea de colinas sin explorar.', 'monotonía', 'n13b'))
N.append(alterna2('n13b', 4, 'Una misión sin su mayor hallazgo', '2011',
    'Con el paso de los años el rover acumula desgaste en ruedas y motores, y cada vez avanza menos. Nunca llega al borde de Endeavour. Los minerales que podían explicar cómo circuló el agua allí quedan sin estudiar de cerca.',
    'En la realidad Opportunity emprendió el viaje y llegó a Endeavour el 9 de agosto de 2011, tras casi tres años y unos 21 kilómetros. Allí hizo uno de sus hallazgos más importantes: la vena de yeso Homestake.',
    ['opp040#4', 'opp047#2'],
    'El rover inmóvil, con polvo en los paneles y un cráter lejano sin visitar al fondo.', 'ocasión perdida', 'n13'))

# ===================== CAPÍTULO 5 =====================
N.append(historia('n14', 5, 'La vena de yeso', 'Noviembre de 2011',
    'En noviembre de 2011, en el borde del cráter Endeavour, el equipo examinó una vena brillante con el microscopio, el espectrómetro APXS y la cámara panorámica. Mide entre 40 y 50 centímetros de largo y de uno a dos de ancho, el grosor de un pulgar. Los instrumentos encontraron abundante calcio y azufre, casi sulfato de calcio puro, y la cámara sugiere que es yeso. Squyres calificó el hallazgo como la historia «definitiva» de que el agua fluyó por fracturas subterráneas de la roca. Nada parecido se había visto en los 33 kilómetros de llanuras que Opportunity exploró durante 90 meses antes de llegar a Endeavour.',
    ['opp047#2', 'opp047#0', 'opp047#3', 'opp047#4', 'opp047#5', 'opp047#6'],
    'Yeso en Marte', 'Homestake es una vena de yeso de 40 a 50 cm; nada parecido apareció en 33 km de llanuras.',
    'Una vena clara y brillante cruzando una roca oscura, vista de cerca.', 'triunfo científico', 'n15'))

N.append(historia('n15', 5, 'La tormenta', 'Mayo-junio de 2018',
    'A fines de mayo de 2018 una tormenta de polvo creció en Marte; fue detectada por primera vez el 30 de mayo. Las tormentas de escala planetaria ocurren cada seis a ocho años terrestres, y la anterior había sido en 2007. El 1 de junio los paneles solares de Opportunity generaban unos 645 vatios-hora; una semana después producían solo 22. La tormenta habría cubierto al mismo tiempo Norteamérica, la Antártida y la Unión Europea. El nivel de opacidad del aire llegó a 10,8, el más alto jamás medido por una misión a Marte; en la tormenta de 2007, que Opportunity sobrevivió, el máximo había sido 5,5.',
    ['opp070#5', 'opp070#1', 'opp070#3', 'opp070#4', 'opp075#4', 'opp075#5'],
    'Mucho más fuerte', 'La opacidad llegó a 10,8 en 2018; en la tormenta de 2007, que Opportunity sobrevivió, fue de 5,5.',
    'Un cielo naranja que se oscurece sobre un valle y un rover pequeño con los paneles cubiertos de polvo.', 'amenaza creciente', 'n16'))

N.append(historia('n16', 5, 'La última panorámica', '3-10 de junio de 2018',
    'El 3 de junio de 2018 Opportunity analizó su último rasgo de superficie, un afloramiento de roca. Entre el 13 de mayo y el 10 de junio tomó 354 imágenes para su panorámica final, y algunas partes quedaron en blanco y negro porque la tormenta llegó antes de que pudiera usar todos los filtros. El 10 de junio llegó su última comunicación. John Callas explicó que el mensaje indicaba cielos increíblemente oscuros: era de noche durante el día. La científica Abigail Fraeman dijo que básicamente decía que no tenían energía. La frase «mi batería está baja y se está haciendo oscuro» fue una interpretación poética de un periodista, no un mensaje literal del rover.',
    ['opp071#0', 'opp071#2', 'opp071#13', 'opp071#8', 'opp072#11', 'opp072#10', 'opp072#9'],
    'Una frase que no es del rover', 'La frase «mi batería está baja y se está haciendo oscuro» fue una interpretación poética de un periodista.',
    'Una panorámica de un valle con zonas en blanco y negro y el cielo muy oscuro.', 'melancolía', 'n17'))

N.append(decision('n17', 5, 'El silencio después de la tormenta', '29 de octubre de 2018',
    ('29 de octubre de 2018. Desde el 11 de septiembre, el JPL envía comandos varias veces al día y un receptor escucha cualquier señal que llegue de Opportunity. El plan decía que, si pasaban 45 días activos sin respuesta, el proyecto empezaría a reasignar personal, aunque la escucha pasiva seguiría al menos hasta finales de enero de 2019. Hoy se cumple el plazo y no hay respuesta.',
     ['opp075#1', 'opp075#8', 'opp075#9']),
    [('Se espera que los vientos retiren el polvo de los paneles; la temporada de vientos de limpieza va de noviembre a enero.', ['opp076#3', 'opp076#4']),
     ('Hay una hipótesis, no confirmada, de que el rover se congeló o entró en un modo de falla irreversible por no tener calentador.', ['opp076#5']),
     ('Cuando se perdió el contacto, Opportunity tenía almacenados solo 22 vatios-hora, frente a los 300 normales.', ['opp076#8']),
     ('Opportunity llevaba casi quince años en Marte; su garantía original era de 90 días.', ['opp076#11'])],
    'Seguir cuesta el esfuerzo de un equipo; parar cierra la posibilidad de que el rover despierte.',
    '¿Qué hace la NASA ahora?',
    [('Dar por terminada la campaña de comandos activos.', 'Se cumple el plan y el equipo puede dedicarse a otras misiones; la escucha pasiva seguiría un tiempo.', False, 'n17a'),
     ('Seguir intentando el contacto por tiempo indefinido y reevaluar en enero.', 'Cuesta tiempo y esfuerzo, pero la temporada de vientos que limpia el polvo apenas comienza.', True, 'n18')],
    'El 29 de octubre de 2018 la NASA anunció que continuaría los intentos de contacto con Opportunity por tiempo indefinido y que reevaluaría la situación en enero de 2019. John Callas declaró que el equipo seguiría trabajando hasta recibir instrucciones de la cúpula de la NASA de cerrar el proyecto.',
    ['opp076#1', 'opp076#2', 'opp076#12'],
    'Más de mil comandos', 'En ocho meses el equipo envió más de 1.000 comandos al rover silencioso.',
    'Una antena de espacio profundo apuntando a un cielo oscuro y una sala de control con una señal plana.', 'incertidumbre'))
N.append(alterna1('n17a', 5, 'Se cierra la campaña activa', '2018',
    'Termina la campaña de comandos diarios. El personal pasa a otros proyectos y el receptor sigue escuchando de forma pasiva. En Marte llega la temporada de vientos, pero ya nadie le habla al rover. Los paneles siguen bajo el polvo, en el valle.',
    'Una sala de control medio vacía y, en Marte, el viento moviendo polvo sobre un rover inmóvil.', 'resignación', 'n17b'))
N.append(alterna2('n17b', 5, 'Una pregunta sin respuesta', '2019',
    'Pasan los meses sin señal. Al terminar enero, el proyecto se cierra sin saber si el rover habría respondido a nuevos comandos. Opportunity queda en el Valle Perseverance con una pregunta abierta: ¿se habría despertado si alguien hubiera seguido intentándolo?',
    'En la realidad la NASA siguió intentando por tiempo indefinido y reevaluó en enero de 2019. Al final el equipo envió más de 1.000 comandos durante ocho meses.',
    ['opp076#1', 'opp076#2', 'opp076#10'],
    'Un rover inmóvil bajo un cielo claro, sin nadie que le responda.', 'tristeza', 'n17'))

N.append(historia('n18', 5, 'Farewell, Opportunity', '12-13 de febrero de 2019',
    'Los últimos comandos se enviaron alrededor de las 8 p. m., hora del Pacífico, del 12 de febrero de 2019, mientras sonaba «I\'ll Be Seeing You», de Billie Holiday, en el centro de operaciones del JPL. Se transmitieron por la antena de 70 metros de Goldstone, y el último comando tardó trece minutos y medio en llegar a Marte. Al día siguiente, Thomas Zurbuchen declaró completa la misión y John Callas cerró con una frase: «Farewell, Opportunity, and well done». Opportunity había sido diseñada para durar 90 días marcianos y recorrer 1.000 metros. Superó su vida prevista unas 60 veces, recorrió más de 45 kilómetros y devolvió más de 217.000 imágenes, incluidas 15 panorámicas en color de 360 grados. Su descanso final: el Valle Perseverance. Zurbuchen dijo que su legado continúa en Curiosity, en InSight y en el rover Mars 2020.',
    ['opp077#0', 'opp077#1', 'opp077#5', 'opp077#2', 'opp077#3', 'opp077#6', 'opp077#7', 'opp077#9', 'opp077#12'],
    'Sesenta veces más', 'Opportunity superó unas 60 veces su vida prevista, recorrió más de 45 km y tomó más de 217.000 imágenes.',
    'Una sala de control casi a oscuras, pantallas con la señal plana e ingenieros escuchando una canción.', 'despedida y gratitud', None, True))

# ===================== VALIDACIÓN =====================
assert len(N) == 30, len(N)
ids = [n['id'] for n in N]
assert len(set(ids)) == 30
B = {n['id']: n for n in N}
for n in N:
    for r in n.get('respaldo', []) + n.get('respaldo_resultado', []) + n.get('en_realidad_respaldo', []):
        dato(r)  # falla si la referencia no existe
    for k in ('siguiente', 'volver_a'):
        if k in n:
            assert n[k] in B, (n['id'], k)
    for o in n.get('opciones', []):
        assert o['siguiente'] in B

# ===================== ENRIQUECIMIENTO PARA OTROS AGENTES =====================
ROL = {'historia': 'historia_real', 'decision': 'decision', 'escena_alternativa': 'ficticio_consecuencia', 'fallo': 'ficticio_final_alternativo'}
orden, i = {}, 'n01'
while i:
    orden[i] = len(orden) + 1
    n = B[i]
    i = n.get('siguiente') or (next(o['siguiente'] for o in n['opciones'] if o['correcta']) if n['tipo'] == 'decision' else None)
assert len(orden) == 18
rama = {}  # id ficticio -> (decisión, opción)
for n in N:
    if n['tipo'] == 'decision':
        mala = next(o for o in n['opciones'] if not o['correcta'])
        rama[mala['siguiente']] = (n['id'], mala['id'])
        rama[B[mala['siguiente']]['siguiente']] = (n['id'], mala['id'])


def detalle(refs, rol):
    out_ = []
    for r in refs:
        d = dato(r)
        out_.append({'ref': r, 'rol': rol, 'afirmacion': d['afirmacion'], 'fuente_url': d['fuente_url'], 'cita': d['cita']})
    return out_


for n in N:
    n['rol'] = ROL[n['tipo']]
    n['orden_camino_real'] = orden.get(n['id'])
    n['rama_de'] = rama[n['id']][0] if n['id'] in rama else None
    n['opcion_origen'] = rama[n['id']][1] if n['id'] in rama else None
    n['respaldo_detalle'] = (detalle(n.get('respaldo', []), 'narrativa') + detalle(n.get('respaldo_resultado', []), 'resultado_real')
                             + detalle(n.get('en_realidad_respaldo', []), 'en_realidad'))

ARISTAS = []
for n in N:
    if 'siguiente' in n:
        ARISTAS.append({'desde': n['id'], 'hacia': n['siguiente'], 'tipo': 'continuar', 'etiqueta': ''})
    for o in n.get('opciones', []):
        ARISTAS.append({'desde': n['id'], 'hacia': o['siguiente'], 'tipo': 'opcion_correcta' if o['correcta'] else 'opcion_equivocada',
                        'opcion': o['id'], 'etiqueta': o['texto']})
    if 'volver_a' in n:
        ARISTAS.append({'desde': n['id'], 'hacia': n['volver_a'], 'tipo': 'volver_a_decidir', 'etiqueta': 'Volver a decidir'})
assert len(ARISTAS) == 35, len(ARISTAS)

DICCIONARIO = {
    'tipo': 'historia | decision | escena_alternativa | fallo (lo que usa el reproductor)',
    'rol': 'historia_real | decision | ficticio_consecuencia (nivel 1) | ficticio_final_alternativo (nivel 2): la misma idea con nombres claros',
    'camino': 'real (los 18 nodos de la historia verdadera) | alternativo (los 12 ficticios)',
    'ficticio': 'true si el nodo no ocurrió; no lleva fuentes, citas ni cifras',
    'orden_camino_real': 'posición 1-18 en la historia real; null en los ficticios',
    'rama_de / opcion_origen': 'en un ficticio: la decisión y la opción equivocada que lo originan',
    'nivel': 'solo ficticios: 1 = consecuencia, 2 = final alternativo (vuelve a la decisión)',
    'narrativa.texto': 'texto del nodo, listo para mostrar a un estudiante de 5.º de secundaria',
    'narrativa.escena_visual': 'descripción de la escena para generar la ilustración o animación',
    'narrativa.emocion': 'tono emocional del nodo',
    'contexto.lo_que_sabes / contexto.en_juego': 'solo decisiones: lo que el equipo sabía en ese momento y qué se arriesgaba',
    'pregunta / opciones[]': 'solo decisiones: 2 opciones con id, texto, detalle (ventaja y costo), correcta y siguiente',
    'resultado_real': 'solo decisiones: lo que ocurrió de verdad al elegir la opción correcta',
    'leccion': 'solo ficticios de nivel 2: «lo que pasó en realidad»',
    'dato_desbloqueado': 'dato curioso verificado para la cartilla de ese nodo',
    'respaldo': 'referencias «opp009#3» = dato 3 de datos_reales del dossier verificado de ese evento',
    'respaldo_detalle[]': 'las mismas referencias ya resueltas: afirmación verificada, cita literal y URL; rol indica dónde se usa',
    'fuentes[]': 'URLs de los dossiers de las que sale el nodo (modo creador)',
    'aristas[]': 'conexiones del grafo: continuar | opcion_correcta | opcion_equivocada | volver_a_decidir',
}
USO = [
    'Los 18 nodos reales solo pueden afirmar lo que está en respaldo_detalle. No añadas datos, fechas, cifras ni citas nuevas.',
    'Los 12 nodos ficticios se narran como si hubieran ocurrido, pero sin fuentes, citas ni cifras; en la interfaz van marcados como línea alternativa.',
    'Al terminar una rama ficticia se muestra siempre «lo que pasó en realidad» (campo leccion) y se vuelve a la decisión.',
    'Cada decisión debe dar el contexto necesario (contexto.lo_que_sabes y contexto.en_juego) antes de mostrar las opciones.',
]

out = {
    'esquema_version': 'juego-2.0', 'mision': 'Opportunity', 'idioma': 'es', 'titulo': 'Opportunity: tú decides',
    'publico': 'Estudiantes de 5.º de secundaria (último año)', 'inicio': 'n01',
    'capitulos': [{'n': k, 'titulo': v} for k, v in CAPS.items()],
    'reglas': 'Cada decisión tiene dos opciones: la correcta sigue la historia real y la otra abre una rama de 2 nodos ficticios narrados como si hubieran ocurrido, que termina en un final alternativo. Al final de la rama se muestra lo que pasó en realidad.',
    'aviso': 'Los nodos con ficticio=true no ocurrieron y no llevan fuentes. Todo lo demás sale de los dossiers verificados (campo `respaldo`).',
    'nodos': N,
    'aristas': ARISTAS,
    'diccionario': DICCIONARIO,
    'uso_para_agentes': USO,
    'resumen': {'nodos': len(N), 'historia': sum(n['tipo'] == 'historia' for n in N), 'decisiones': sum(n['tipo'] == 'decision' for n in N),
                'ficticios_nivel_1': sum(n['tipo'] == 'escena_alternativa' for n in N), 'ficticios_nivel_2': sum(n['tipo'] == 'fallo' for n in N)},
}
(DATOS / 'juego2_opportunity.json').write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(out['resumen'], ensure_ascii=False))

t = (PLANTILLAS / 'juego2.template.html').read_text(encoding='utf-8')
data = (DATOS / 'juego2_opportunity.json').read_text(encoding='utf-8').replace('</', '<\\/')
# La plantilla carga ../data/juego2_opportunity.js (sirve con file://); el HTML final lleva los datos dentro y no lo necesita.
(DATOS / 'juego2_opportunity.js').write_text('window.DATOS = ' + (DATOS / 'juego2_opportunity.json').read_text(encoding='utf-8') + ';\n', encoding='utf-8')
t = t.replace('<script src="../data/juego2_opportunity.js"></script>\n', '')
(SALIDA_HTML / 'juego2.html').write_text(t.replace('__DATA__', data), encoding='utf-8')

# Visor interno del mapa (grafo), solo para el equipo.
m = (PLANTILLAS / 'juego2_mapa.template.html').read_text(encoding='utf-8')
m = m.replace('<script src="../data/juego2_opportunity.js"></script>\n', '')
(SALIDA_HTML / 'juego2_mapa.html').write_text(m.replace('__DATA__', data), encoding='utf-8')
