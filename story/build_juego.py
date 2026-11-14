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

CAPS = {1: 'Una pregunta y un riesgo', 2: 'Elegir un mundo', 3: 'Despegue y llegada',
        4: 'Marte pone a prueba', 5: 'El agua y el adiós'}


def fuentes(ids, n=3):
    out, seen = [], set()
    pool = [f for i in ids for f in E[i]['fuentes']]
    pool.sort(key=lambda f: f['tipo'] not in STRONG)
    for f in pool:
        if f['url'] in seen:
            continue
        seen.add(f['url'])
        out.append({k: f[k] for k in ('titulo', 'editor', 'url', 'tipo') if k in f})
        if len(out) == n:
            break
    return out


def datos(ids):
    return [d for i in ids for d in E[i]['datos_clave']]


def nodo(id, tipo, camino, cap, pers, base, titulo, fecha, texto, escena, emocion, hip=False, dato=None, **extra):
    n = {'id': id, 'tipo': tipo, 'camino': camino, 'capitulo': cap, 'capitulo_titulo': CAPS[cap],
         'personaje': pers, 'eventos_base': base, 'hipotetico': hip, 'titulo': titulo, 'fecha': fecha,
         'narrativa': {'texto': texto, 'escena_visual': escena, 'emocion': emocion},
         'datos_clave': datos(base), 'fuentes': fuentes(base)}
    if dato:
        n['dato_desbloqueado'] = {'titulo': dato[0], 'texto': dato[1]}
    n.update(extra)
    return n


def decision(id, cap, pers, base, titulo, fecha, texto, escena, emocion, pregunta, opciones, real, nota=None):
    d = nodo(id, 'decision', 'real', cap, pers, base, titulo, fecha, texto, escena, emocion,
             pregunta=pregunta, opciones=opciones, resultado_real=real, tiempo_s=25,
             opcion_por_defecto=next(o['id'] for o in opciones if not o['correcta']))
    if nota:
        d['nota'] = nota
    return d


N = []
# ===== Capítulo 1 =====
N.append(nodo('n01', 'historia', 'real', 1, 'Steve Squyres, científico', ['opp001'], 'Una pregunta sobre Marte', '1987',
    'En 1987, el profesor Steve Squyres se hace una pregunta: ¿Marte fue húmedo y cálido, o frío y seco? Cree que la respuesta está en las rocas y que hacen falta «botas geológicas sobre el terreno». Imagina un robot que recorra Marte y examine las rocas de cerca. Por ahora, es solo una idea.',
    'Oficina universitaria de los años 80: un profesor frente a una pizarra con un mapa de Marte y el boceto de un robot con ruedas.',
    'curiosidad y determinación', dato=('La pregunta de 1987', '¿Marte fue húmedo y cálido, o frío y seco? Esa duda dio origen a la misión.'), siguiente='n02'))
N.append(nodo('n02', 'historia', 'real', 1, 'Dirección de la NASA', ['opp004'], 'Dos fracasos en un año', '1999',
    'En septiembre y diciembre de 1999 se pierden dos misiones a Marte. El Mars Climate Orbiter falla por un error de navegación. El Mars Polar Lander se pierde al entrar en la atmósfera, probablemente por una falla de un sensor de aterrizaje. Un informe independiente critica la filosofía «más rápido, mejor, más barato». La NASA cancela el plan de 2001 y lo rediseña para 2003.',
    'Sala de control en silencio: pantallas sin señal y un equipo de ingenieros mirando el vacío.',
    'tensión y cautela', dato=('Los fracasos de 1999', 'El Mars Climate Orbiter falló por un error de navegación; el Mars Polar Lander, probablemente por un sensor de aterrizaje.'), siguiente='n03'))
N.append(decision('n03', 1, 'Dirección de la NASA', ['opp008', 'opp009'], '¿Uno o dos rovers?', '2000-07-16',
    'Julio de 2000. En una reunión, el equipo propone construir un solo rover, parecido al Pathfinder. Todavía pesan los fracasos de 1999. ¿Qué se construye para la ventana de 2003?',
    'Sala de reuniones con la maqueta de un rover al centro y un equipo esperando una respuesta.', 'duda',
    '¿Qué se construye?',
    [{'id': 'n03-A', 'texto': 'Construir un solo rover, más sencillo y barato.', 'correcta': False, 'siguiente': 'n03a'},
     {'id': 'n03-B', 'texto': 'Construir dos rovers, para dos sitios distintos.', 'correcta': True, 'siguiente': 'n04'}],
    'Dan Goldin respondió con una pregunta: «¿Y si son dos rovers?». El 10 de agosto de 2000 la NASA anunció dos rovers para 2003. Dos rovers duplicaban la probabilidad de éxito y la cantidad de ciencia.'))
N[-1]['dato_desbloqueado'] = {'titulo': 'Dos es mejor que uno', 'texto': 'Dos rovers duplicaban la probabilidad de éxito y la cantidad de ciencia.'}
N.append(nodo('n03a', 'escena_alternativa', 'alternativo', 1, 'Dirección de la NASA', ['opp008'], 'Un solo rover', '2003',
    'Imagina que se construye un solo rover. El proyecto es más sencillo y llega a tiempo a la ventana de 2003. Pero toda la misión depende de una sola máquina, y los fracasos de 1999 siguen en la memoria del equipo.',
    'Un único rover sobre la plataforma de lanzamiento, con espacio vacío a su lado.', 'esperanza con miedo', hip=True, siguiente='n03b'))
N.append(nodo('n03b', 'fallo', 'alternativo', 1, 'Sala de control', ['opp004', 'opp009'], 'Sin segunda oportunidad', '2004',
    'Imagina que durante la llegada a Marte algo sale mal, como le pasó al Mars Polar Lander en 1999. No hay un segundo rover y la misión termina sin ciencia.',
    'Sala de control con la pantalla en negro y los ingenieros con la cabeza baja.', 'decepción', hip=True, volver_a='n03',
    leccion='Tener dos rovers duplicaba la probabilidad de éxito. Si uno fallaba, el otro podía seguir.'))

# ===== Capítulo 2 =====
N.append(nodo('n04', 'historia', 'real', 2, 'Científicos de la misión', ['opp005', 'opp010'], 'Un destino con pistas', '2000-2002',
    'Los dos rovers necesitan destino. Desde 2000 se sabe que en Meridiani Planum hay una mancha de hematita gris de unos 300 × 500 km, un mineral que normalmente se forma con agua. En 2002, las imágenes de THEMIS, en la sonda Mars Odyssey, muestran que el terreno es llano y con pocas rocas, lo que reduce el riesgo de aterrizar con airbags.',
    'Mapa espectral de Marte con una gran mancha gris sobre Meridiani Planum.', 'expectativa',
    dato=('Un sitio elegido por minerales', 'Meridiani fue el primer sitio de aterrizaje elegido por criterios minerales y no solo por cómo se ve.'), siguiente='n05'))
N.append(decision('n05', 2, 'Sede de la NASA', ['opp012', 'opp010'], 'Elegir el lugar de aterrizaje', '2003-04-11',
    'Abril de 2003. Tras más de dos años de talleres con la comunidad científica, la NASA debe elegir destinos entre cuatro finalistas. Piensas en el segundo rover. ¿Cuál eliges?',
    'Mesa con mapas de cuatro sitios marcianos y un grupo de científicos discutiendo.', 'responsabilidad',
    '¿Qué sitio eliges para Opportunity?',
    [{'id': 'n05-A', 'texto': 'Un terreno rocoso y accidentado, con paisajes espectaculares.', 'correcta': False, 'siguiente': 'n05a'},
     {'id': 'n05-B', 'texto': 'Meridiani Planum: terreno llano, con hematita detectada desde la órbita.', 'correcta': True, 'siguiente': 'n06'},
     {'id': 'n05-C', 'texto': 'La llanura más segura posible, aunque no tenga pistas de agua.', 'correcta': False, 'siguiente': 'n05c'}],
    'La NASA seleccionó Meridiani Planum y el cráter Gusev entre cuatro finalistas, y dejó fuera Isidis y Elysium. La decisión equilibró el valor científico con la seguridad del aterrizaje.',
    nota='El documento citado no dice con claridad qué rover iba a cada sitio; la asignación de Opportunity a Meridiani se conoce por otras fuentes y por el propio aterrizaje.'))
N[-1]['dato_desbloqueado'] = {'titulo': 'Cuatro finalistas', 'texto': 'La NASA eligió entre cuatro sitios y dejó fuera Isidis y Elysium. Equilibró el valor científico con la seguridad.'}
N.append(nodo('n05a', 'escena_alternativa', 'alternativo', 2, 'Ingenieros de aterrizaje', ['opp010'], 'Un terreno difícil', '2004-01',
    'Imagina que se elige un lugar lleno de rocas y pendientes porque promete imágenes impresionantes. Los airbags tendrán que rebotar y rodar sobre ese terreno antes de que el módulo se enderece.',
    'Un paisaje marciano con rocas afiladas, visto desde la cápsula que cae.', 'inquietud', hip=True, siguiente='n05b'))
N.append(nodo('n05b', 'fallo', 'alternativo', 2, 'Sala de control', ['opp010'], 'Los airbags no resisten', '2004-01',
    'Imagina que la cápsula rebota sobre una roca y un airbag se rasga. El módulo queda dañado antes de abrir sus pétalos y la misión termina el mismo día que llega.',
    'Airbags desinflados y rasgados sobre rocas oscuras; la cápsula torcida.', 'decepción', hip=True, volver_a='n05',
    leccion='Un terreno llano y con pocas rocas reducía el riesgo del aterrizaje con airbags. Meridiani se eligió por ciencia y también por seguridad.'))
N.append(nodo('n05c', 'fallo', 'alternativo', 2, 'Científicos de la misión', ['opp005', 'opp010'], 'Seguro, pero vacío', '2004-2005',
    'Imagina que el rover aterriza sin problemas en una llanura segura. Pero sin pistas minerales no hay una razón clara para estar allí, y Opportunity recorre el terreno sin encontrar nada que cuente la historia del agua.',
    'Una llanura rojiza y vacía hasta el horizonte, con las huellas de un solo rover.', 'aburrimiento', hip=True, volver_a='n05',
    leccion='Meridiani fue el primer sitio elegido por criterios minerales y no solo por cómo se ve. La seguridad sola no responde preguntas científicas.'))
N.append(nodo('n06', 'historia', 'real', 2, 'Kennedy Space Center', ['opp013'], 'Los gemelos tienen nombre', '2003-06-08',
    'El 8 de junio de 2003, en el Kennedy Space Center, Sofi Collis, una niña de 9 años, revela los nombres de los dos rovers. Ganó entre casi 10.000 ensayos de un concurso de la NASA, LEGO y The Planetary Society. Los gemelos se llamarán Spirit y Opportunity.',
    'Una niña sonriente sobre un escenario, junto a las maquetas de dos rovers gemelos.', 'ilusión',
    dato=('Un nombre de 9 años', 'Sofi Collis, de 9 años, ganó entre casi 10.000 ensayos el concurso para nombrar a Spirit y Opportunity.'), siguiente='n07'))

# ===== Capítulo 3 =====
N.append(decision('n07', 3, 'Equipo de lanzamiento', ['opp015'], 'Un cohete con una grieta', '2003-06-25',
    '25 de junio de 2003. Hoy debería despegar el cohete que llevará a Opportunity. Pero los técnicos encuentran un aislante de corcho agrietado en el tanque. Hay presión por salir a tiempo. ¿Qué decides?',
    'Un cohete Delta II bajo los reflectores, con un técnico señalando una grieta en el tanque.', 'presión',
    '¿Qué haces con el lanzamiento?',
    [{'id': 'n07-A', 'texto': 'Lanzar hoy: la grieta es pequeña y no hay que perder tiempo.', 'correcta': False, 'siguiente': 'n07a'},
     {'id': 'n07-B', 'texto': 'Posponer el lanzamiento y revisar el cohete.', 'correcta': True, 'siguiente': 'n08'}],
    'El lanzamiento se retrasó por el aislante de corcho agrietado, por una celda de batería del sistema de terminación de vuelo y, el 7 de julio, por una válvula defectuosa. Esa noche, a las 11:18 p. m. (hora del este), el Delta II despegó con Opportunity.'))
N[-1]['dato_desbloqueado'] = {'titulo': 'Un cohete que debutaba', 'texto': 'La versión Delta II Heavy debutaba con esta misión y despegó de la plataforma SLC-17B, en Cabo Cañaveral.'}
N.append(nodo('n07a', 'escena_alternativa', 'alternativo', 3, 'Equipo de lanzamiento', ['opp015'], 'Cuenta regresiva con prisa', '2003-06-25',
    'Imagina que se decide lanzar con la grieta. La cuenta regresiva termina, el cohete se eleva y atraviesa las primeras nubes entre vibraciones fuertes.',
    'El cohete ascendiendo con una columna de fuego; un fragmento de aislante se desprende del tanque.', 'tensión', hip=True, siguiente='n07b'))
N.append(nodo('n07b', 'fallo', 'alternativo', 3, 'Sala de control', ['opp015'], 'Opportunity nunca sale de la Tierra', '2003-06-25',
    'Imagina que el aislante se desprende y el cohete falla durante el ascenso. Opportunity nunca llega al espacio.',
    'Restos del cohete cayendo sobre el océano al atardecer.', 'decepción', hip=True, volver_a='n07',
    leccion='Retrasar el lanzamiento costó días, pero permitió revisar el cohete. Salir a tiempo no vale si pone en riesgo toda la misión.'))
N.append(nodo('n08', 'historia', 'real', 3, 'Sala de control del JPL', ['opp018'], 'Seis minutos de caída', '2004-01-24',
    'Opportunity entra en la atmósfera de Marte a unos 5.400 m/s. Se suelta la etapa de crucero, se abre el paracaídas, disparan los retrocohetes y se inflan los airbags. El conjunto cae, rebota y rueda. Las señales tardan unos 11 minutos en llegar a la Tierra y, cuando se oye «rebotando», el equipo sabe que llegó. Por fin, el módulo se endereza y abre sus pétalos.',
    'La cápsula cae con el paracaídas abierto, los airbags la envuelven y rebota sobre un paisaje plano y rojizo.', 'tensión extrema y euforia',
    dato=('Una noticia con retraso', 'Las señales de Marte tardaban unos 11 minutos en llegar a la Tierra, y Opportunity entró en la atmósfera a unos 5.400 m/s.'), siguiente='n09'))
N.append(nodo('n09', 'historia', 'real', 3, 'Steve Squyres, científico', ['opp021'], 'Rocas empapadas en agua', '2004-03-02',
    'El 2 de marzo de 2004 la NASA anuncia que las rocas de Meridiani estuvieron empapadas en agua líquida. El espectrómetro Mössbauer detectó jarosita, un mineral que se forma con agua. El APXS halló mucho azufre y sales de sulfato. Las rocas mostraban pequeñas esferas y estructuras sedimentarias. La pregunta de 1987 tenía su primera respuesta.',
    'Primer plano de una roca con esferitas incrustadas y el brazo del rover acercándose.', 'asombro',
    dato=('Jarosita', 'La jarosita es un mineral que se forma con agua. Encontrarla fue una pista clave.'), siguiente='n10'))

# ===== Capítulo 4 =====
N.append(nodo('n10', 'historia', 'real', 4, 'Opportunity, el rover', ['opp030'], 'Una roca caída del cielo', '2005-01',
    'En enero de 2005, junto a su propio escudo térmico descartado, Opportunity halla «Heat Shield Rock», un meteorito de hierro y níquel del tamaño de una pelota de baloncesto. Es el primer meteorito de cualquier tipo identificado en otro planeta.',
    'Una roca oscura del tamaño de una pelota de baloncesto junto a un escudo térmico abollado.', 'sorpresa',
    dato=('Primer meteorito en otro planeta', 'Heat Shield Rock fue el primer meteorito de cualquier tipo identificado en otro planeta.'), siguiente='n11'))
N.append(decision('n11', 4, 'Ingenieros del JPL', ['opp033'], 'Atrapado en la arena', '2005-04-26',
    '26 de abril de 2005, sol 446. Al cruzar un rizo de arena de unos 30 cm de alto, las ruedas se hunden más de 10 cm. Opportunity lleva casi 40 m de un recorrido planeado de 90 m y la dirección de su rueda delantera derecha ya está deshabilitada. ¿Cómo sales?',
    'Un rover con las ruedas medio enterradas en arena clara, con huellas que se detienen.', 'angustia',
    '¿Cómo intentas salir?',
    [{'id': 'n11-A', 'texto': 'Acelerar en línea recta para salir de un impulso.', 'correcta': False, 'siguiente': 'n11a'},
     {'id': 'n11-B', 'texto': 'Probar primero con un rover gemelo en la Tierra y salir despacio con giros «en K».', 'correcta': True, 'siguiente': 'n12'}],
    'Los ingenieros pasaron más de una semana probando con un rover gemelo de prueba antes de elegir cómo salir. El equipo diseñó giros «en K». Opportunity salió el sol 484, tras unas cinco semanas.',
    nota='La fecha de salida está discutida: 4 de junio de 2005 (Cornell) frente a reportes del sol 484.'))
N[-1]['dato_desbloqueado'] = {'titulo': 'Purgatoides', 'texto': 'Los rizos de arena parecidos que Opportunity evitó después se llamaron «purgatoides».'}
N.append(nodo('n11a', 'escena_alternativa', 'alternativo', 4, 'Ingenieros del JPL', ['opp033'], 'A toda potencia', '2005-04',
    'Imagina que se ordena avanzar a máxima potencia en línea recta. Las ruedas giran, levantan arena y el rover se hunde un poco más en cada vuelta.',
    'Ruedas girando en la arena, con un surco cada vez más profundo.', 'urgencia', hip=True, siguiente='n11b'))
N.append(nodo('n11b', 'fallo', 'alternativo', 4, 'Opportunity, el rover', ['opp033'], 'Enterrado en la duna', '2005-04',
    'Imagina que Opportunity queda inmóvil, con las ruedas cubiertas, lejos de las rocas que quería estudiar. Su misión termina en 2005, cuando apenas empezaba su tiempo extra.',
    'El rover inmóvil, medio enterrado, con el paisaje intacto a su alrededor.', 'frustración', hip=True, volver_a='n11',
    leccion='Salir de un atasco exige paciencia. Probar antes en la Tierra con un rover gemelo evitó empeorarlo.'))
N.append(nodo('n12', 'historia', 'real', 4, 'Ingenieros del JPL', ['opp039'], 'El brazo atascado', '2008-04-15',
    'En abril de 2008 el brazo robótico se atasca al intentar desplegarse desde su posición plegada. El 14 de mayo, aplicando la máxima corriente al motor ya caliente, el equipo logra extenderlo de nuevo. Squyres anuncia que no volverán a recogerlo: desde ahora Opportunity conducirá con el brazo al frente.',
    'Un brazo robótico extendido hacia adelante mientras el rover avanza sobre la arena.', 'alivio y adaptación',
    dato=('Conducir con el brazo al frente', 'Desde 2008 Opportunity condujo con el brazo robótico extendido al frente.'), siguiente='n13'))
N.append(decision('n13', 4, 'Steve Squyres, científico', ['opp040', 'opp041'], 'Rumbo a un cráter lejano', '2008-08',
    'Agosto de 2008. Opportunity sale del cráter Victoria tras casi un año dentro. A unos 12 km al sureste está Endeavour, un cráter de unos 22 km de diámetro y 300 m de profundidad, que expondría una pila de capas mucho más profunda. El viaje podría durar dos años y el rover podría no llegar. ¿Qué decides?',
    'Un rover pequeño en una llanura enorme, con un cráter lejano en el horizonte.', 'riesgo y ambición',
    '¿Hacia dónde va Opportunity?',
    [{'id': 'n13-A', 'texto': 'Quedarse explorando los alrededores de Victoria, que ya se conocen.', 'correcta': False, 'siguiente': 'n13a'},
     {'id': 'n13-B', 'texto': 'Emprender el viaje hacia Endeavour, aunque podría no llegar.', 'correcta': True, 'siguiente': 'n14'}],
    'La NASA anunció el viaje a Endeavour. Squyres admitió que quizá no llegaran, pero que era la dirección científicamente correcta. La travesía fue de casi tres años y unos 21 km.',
    nota='La llegada a Endeavour (agosto de 2011) viene de una fuente secundaria y discutida; la fecha de salida de Victoria también varía entre fuentes.'))
N[-1]['dato_desbloqueado'] = {'titulo': 'Un cráter gigante', 'texto': 'Endeavour mide unos 22 km de diámetro y unos 300 m de profundidad.'}
N.append(nodo('n13a', 'escena_alternativa', 'alternativo', 4, 'Opportunity, el rover', ['opp041'], 'Siempre las mismas rocas', '2009',
    'Imagina que Opportunity se queda cerca de Victoria. Los días se repiten: mismas rocas, mismos panoramas. Las capas más profundas siguen fuera de su alcance.',
    'El rover dando vueltas cerca de un cráter conocido; en el fondo, el horizonte lejano sin explorar.', 'monotonía', hip=True, siguiente='n13b'))
N.append(nodo('n13b', 'fallo', 'alternativo', 4, 'Steve Squyres, científico', ['opp041', 'opp047'], 'Una misión sin nuevos hallazgos', '2011',
    'Imagina que la misión sigue sin grandes descubrimientos y se apaga sin haber llegado a Endeavour. Nunca encuentra la vena de yeso, la evidencia más poderosa de agua líquida.',
    'El rover cubierto de polvo en el mismo lugar durante años, con el cráter lejano sin visitar.', 'ocasión perdida', hip=True, volver_a='n13',
    leccion='La NASA aceptó el riesgo de no llegar porque era la dirección científicamente correcta. Quedarse seguro habría impedido el mayor hallazgo.'))

# ===== Capítulo 5 =====
N.append(nodo('n14', 'historia', 'real', 5, 'Steve Squyres, científico', ['opp047'], 'La vena de yeso', '2011-11',
    'Tres años después de dejar Victoria, Opportunity encuentra «Homestake», una vena brillante de unos 40 a 50 cm de largo y del ancho de un pulgar, rica en calcio y azufre y probablemente yeso. Ese mineral se formó con agua en condiciones más neutras que las de los sulfatos ácidos hallados antes. Squyres la calificó como la evidencia más poderosa de agua líquida que halló Opportunity.',
    'Una vena clara y brillante cruzando una roca oscura, vista de cerca.', 'triunfo científico',
    dato=('La evidencia más poderosa', 'Homestake: una vena de yeso de unos 40 a 50 cm, la evidencia más poderosa de agua líquida que halló Opportunity.'), siguiente='n15'))
N.append(nodo('n15', 'historia', 'real', 5, 'Opportunity, el rover', ['opp070', 'opp071', 'opp072'], 'La noche sobre Perseverance Valley', '2018-05-30',
    'A fines de mayo de 2018, el Mars Reconnaissance Orbiter detecta una tormenta de polvo que avanza hacia Opportunity. El 3 de junio el rover analiza su último rasgo de superficie, un afloramiento tabular. El 10 de junio la opacidad llega a 10,8, un récord, y sobre el valle Perseverance se instala la noche perpetua. Ese día Opportunity se comunica por última vez.',
    'Un cielo naranja que se oscurece sobre el valle; el rover pequeño bajo un cielo casi negro.', 'amenaza y despedida',
    dato=('Una tormenta récord', 'El 10 de junio de 2018 la opacidad del aire llegó a 10,8, la mayor medida en una misión a Marte.'),
    nota='La fecha de detección de la tormenta está discutida: 30 de mayo (JPL, corregido el 12 de junio), 31 de mayo o 1 de junio.', siguiente='n16'))
N.append(decision('n16', 5, 'Sede de la NASA', ['opp075', 'opp076'], 'El silencio después de la tormenta', '2018-10-29',
    'En septiembre, con el aire más limpio, el equipo empezó a enviar comandos varias veces al día. Si pasaban 45 días sin respuesta, se concluiría que probablemente hubo una falla. Hoy es 29 de octubre y los 45 días terminaron sin respuesta. ¿Qué decides?',
    'Una antena de espacio profundo apuntando a un cielo oscuro y una sala de control con una señal plana.', 'incertidumbre',
    '¿Qué hace la NASA?',
    [{'id': 'n16-A', 'texto': 'Dar por terminada la misión: ya pasó el plazo.', 'correcta': False, 'siguiente': 'n16a'},
     {'id': 'n16-B', 'texto': 'Mantener los intentos de contacto y esperar la temporada de vientos que limpia el polvo (noviembre a enero).', 'correcta': True, 'siguiente': 'n17'}],
    'La NASA decidió mantener su estrategia de contacto por tiempo indefinido y reevaluar hacia enero de 2019. Se esperaba que el viento de la temporada de limpieza retirase el polvo de los paneles.',
    nota='Las hipótesis de falla irrecuperable o de congelamiento por falta de calentador son de los ingenieros, no hechos comprobados.'))
N[-1]['dato_desbloqueado'] = {'titulo': 'Un plan de recuperación', 'texto': 'El plan incluía hasta 45 días de comandos y escucha pasiva durante meses, hasta unos 26 de enero de 2019.'}
N.append(nodo('n16a', 'escena_alternativa', 'alternativo', 5, 'Sede de la NASA', ['opp076'], 'Se apaga la antena', '2018-11',
    'Imagina que se apaga la antena y se archiva el caso. El viento de la temporada de limpieza sopla de noviembre a enero sobre Perseverance Valley, pero ya nadie está escuchando.',
    'Una sala de control vacía; en Marte, el viento barre polvo sobre los paneles de un rover inmóvil.', 'resignación', hip=True, siguiente='n16b'))
N.append(nodo('n16b', 'fallo', 'alternativo', 5, 'Opportunity, el rover', ['opp076'], 'Una pregunta sin respuesta', '2019-01',
    'Imagina que la misión termina con una pregunta que nadie podrá contestar: ¿habría vuelto a comunicarse Opportunity si alguien hubiera seguido escuchando?',
    'Un rover inmóvil bajo un cielo claro, sin nadie que le responda.', 'tristeza', hip=True, volver_a='n16',
    leccion='Los plazos ayudan a decidir, pero la NASA prefirió seguir intentando mientras hubiera una razón para esperar.'))
N.append(nodo('n17', 'historia', 'real', 5, 'Sala de control del JPL', ['opp077'], 'Farewell, Opportunity', '2019-02-12',
    'Tras ocho meses de intentos, el 12 de febrero de 2019 JPL transmite las últimas instrucciones mientras suena «I\'ll Be Seeing You», de Billie Holiday, en la sala de control. El 13 de febrero Thomas Zurbuchen declara completa la misión y John Callas cierra con «Farewell, Opportunity, and well done». Opportunity pasó 15 años en Marte, unas 60 veces su vida prevista, recorrió más de 45 km y tomó más de 217.000 imágenes.',
    'Sala de control casi a oscuras, pantallas con la señal plana e ingenieros escuchando la canción.', 'despedida y gratitud',
    dato=('Quince años', 'Opportunity vivió unas 60 veces su vida prevista, recorrió más de 45 km y tomó más de 217.000 imágenes.'), final=True))

# ===== Validación =====
assert len(N) == 30, len(N)
ids = [n['id'] for n in N]
assert len(set(ids)) == 30
S = set(ids)
for n in N:
    for k in ('siguiente', 'volver_a'):
        if k in n:
            assert n[k] in S, (n['id'], k)
    if n['tipo'] == 'decision':
        assert sum(o['correcta'] for o in n['opciones']) == 1, n['id']
        for o in n['opciones']:
            assert o['siguiente'] in S
    if n['camino'] == 'real' and 'dato_desbloqueado' not in n:
        raise SystemExit('falta dato en ' + n['id'])
B = {n['id']: n for n in N}
reach, st = set(), ['n01']
while st:
    i = st.pop()
    if i in reach:
        continue
    reach.add(i)
    n = B[i]
    for k in ('siguiente', 'volver_a'):
        if k in n:
            st.append(n[k])
    for o in n.get('opciones', []):
        st.append(o['siguiente'])
assert reach == S, S - reach

out = {
    'esquema_version': 'juego-1.0', 'mision': src['mision']['nombre'], 'idioma': 'es',
    'titulo': 'Opportunity: tú decides', 'publico': 'Estudiantes de 5.º de secundaria (último año)',
    'inicio': 'n01', 'capitulos': [{'n': k, 'titulo': v} for k, v in CAPS.items()],
    'reglas': 'Cada decisión tiene una opción correcta, que coincide con la realidad, y una o dos equivocadas que terminan en un final alternativo hipotético. En modo presión, si se acaba el tiempo se elige la opción por defecto (una equivocada).',
    'aviso': 'Los nodos con hipotetico=true no ocurrieron: son escenarios imaginados a partir de riesgos reales y deben mostrarse como tales. Los hechos del camino real y sus fuentes provienen de linea_de_tiempo_opportunity.json.',
    'nodos': N,
    'resumen': {'nodos': len(N), 'historia': sum(n['tipo'] == 'historia' for n in N),
                'decisiones': sum(n['tipo'] == 'decision' for n in N),
                'escenas_alternativas': sum(n['tipo'] == 'escena_alternativa' for n in N),
                'fallos': sum(n['tipo'] == 'fallo' for n in N)},
}
json.dump(out, open(DATOS / 'juego_opportunity.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print(json.dumps(out['resumen'], ensure_ascii=False))

t = open(PLANTILLAS / 'juego.template.html', encoding='utf-8').read()
data = open(DATOS / 'juego_opportunity.json', encoding='utf-8').read().replace('</', '<\\/')
open(SALIDA_HTML / 'juego.html', 'w', encoding='utf-8').write(t.replace('__DATA__', data))
