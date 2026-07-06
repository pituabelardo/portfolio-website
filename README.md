# portfolio — jorge antolín

web 3d navegable: remas en canoa, descubres 4 islas, cada isla abre un case.
todo estático — sirve la carpeta tal cual en cualquier hosting (netlify, vercel, github pages…).

## dónde meter cada cosa

### (a) link de youtube de "capullos"
`js/config.js` → `CAPULLOS_YOUTUBE_ID`
pega solo el id del vídeo (lo que va después de `v=` en la url).
ejemplo: para `https://youtube.com/watch?v=Ab12Cd34` → `CAPULLOS_YOUTUBE_ID: "Ab12Cd34"`.

### (b) case de estrategia de liga u (cuando esté el contenido real)
`index.html` → busca el `<article id="liga-u-strategy">` (marcado con el
comentario `CASE_PLACEHOLDERS`). el case ya tiene la estructura definitiva:
un `.poster-grid` con tres `.case-slot` (marcadores a rayas cream, mismas
proporciones que los pósters reales) + un `.case-text` con dos párrafos
provisionales.
- sustituye cada `<div class="case-slot">…</div>` por un `<img>` real
  (mira los `<img>` de talens: `loading="lazy"`, `width`/`height` y un
  `alt` descriptivo).
- reescribe los dos párrafos del `.case-text` con el contenido definitivo
  y borra la frase de "the placeholders above hold its seat".
- los `case-meta` (role/for/format) ya son los definitivos.
no hay nada que tocar en `js/config.js` ni en el mundo 3d: la isla ya es
la cancha y no sabe nada de "coming soon".

### (c) redes sociales
`js/config.js` → `SOCIAL_LINKS` (descomenta y rellena).
además, en `index.html` → JSON-LD (bloque `application/ld+json`), añade las urls al array `"sameAs"`.

## novedades v7 — "gijón es gijón"

tres órdenes: las islas que venden, delante; liga u deja de estar en obras;
y gijón pasa de esqueleto a casa.

- **archipiélago reordenado** (solo `js/config.js`): capullos (-26, 92) a ~73
  del spawn y de frente; liga u (58, 48) segunda y bien visible; talens
  (-118, -52) y ministerie (108, -96) al fondo, presentes en la bruma sin
  competir. desde el primer frame jugable se leen capullos Y liga u con sus
  carteles. separaciones ≥90, ninguna isla a z>150 (esa agua es de gijón),
  la boya de bienvenida queda fuera de la línea recta spawn→capullos, y el
  skyline no lo tapa ninguna isla. todo lo que lee posiciones (anillos de
  espuma uIsl, rocas, autopilot, brújula, fishSpotClear) se verificó en las
  posiciones nuevas (299 muestras de peces, 0 violaciones).
- **liga u es una cancha, no una obra**: fuera grúa, andamios, barriles y
  cartel de "coming soon" (y `comingSoon` fuera de config). la isla se
  redisena alrededor de una CANCHA COMPLETA: pad plano tallado en la meseta
  ocre, parquet con líneas pintadas (canvas 512), dos canastas con tableros
  y redes al viento, gradas de madera, marcador ("liga u 22–21, 4th
  quarter"), cuatro focos con glow y los banderines de esquina a esquina —
  ya no es obra, es noche de liga. la canasta gigante del mar sigue en la
  ruta de entrada con su collider. LAND_CAMS reencuadrada: la varada
  protagoniza la cancha. el hud dice "beach at liga u — strategy" a secas.
  el case del menú ya no es soon-box: misma estructura que capullos
  (claim + `.poster-grid` con tres `.case-slot` a rayas cream + `.case-text`
  con párrafos provisionales y meta definitiva). ver punto (b) arriba.
- **gijón es gijón** (contra las capturas de `portfolio/ref-gijon/`):
  - **cimadevilla es un BARRIO**: ~39 casas estrechas e irregulares en tres
    terrazas trepando las laderas del cerro (fachadas blanco/crema/ocre/
    terracota/azul lavado/verde botella, tejados terracota a dos aguas,
    ventanitas oscuras horneadas en vértices, cipreses entre medias), con
    la cumbre verde para el elogio.
  - **puerto deportivo** al pie oeste: lámina de agua calma oscura CERRADA
    por rompeolas gris en L + muelles de piedra, tres pantalanes de madera
    y 10 barquitos low-poly (casco + mástil + vela triangular opcional).
    cero mar colándose detrás de la ciudad.
  - **el elogio con su forma REAL**: anillo en C ABIERTO y volado en
    horizontal (torus 1.55π con las bocas TAPADAS para que no parezca
    tubería), que sobrevuela dos patas elípticas abiertas con base
    ensanchada. hormigón pálido, nada de malva.
  - **la laboral con su silueta**: claustro horizontal ENORME en piedra
    dorada bruñida por la bruma, tejados de pizarra, pabellones de esquina,
    torre esbelta escalonada con cuerpo de columnata y aguja, y la cúpula
    elíptica al lado. las colinas del fondo le dejan una ventana (se saltan
    los bultos a <58 de su x).
  - **cohesión**: las fachadas del muro también ganan ventanas horneadas;
    la playa sigue seca (se subió y suavizó el delantal mojado: el oleaje
    amortiguado ya no puede asomar como lámina azul entre arena mojada y
    losa seca — bug cazado por raycast).
  - sigue siendo 3 draw calls (L1/L2/L3 fusionadas por profundidad), cero
    colisión, cero agua detrás o entre la ciudad.
- **presupuesto v7 (medido, 390×844 render por software, tier mobile)**:
  peor caso 84 calls / ~37k tris (límites: 150 / 150k); mirando a gijón
  43 / 29k. desktop high: peor caso 149 calls / 66k. fps por software muy
  por encima de 25. escape instantáneo verificado en mitad de dive;
  dive/board/land/launch se cancelan limpio (matriz probada + spam);
  reduced-motion salta intro, dive, board, varada y relanzamiento.

### known deltas (v7)
- el elogio es una aproximación low-poly: el recorte interior curvo de las
  patas se sugiere con bases ensanchadas, no con el arco cóncavo real.
- los "soportales" del muro y la plaza del náutico no existen; el muro es
  losa + balaustrada.

## novedades v6.1 — "la física manda"

pasada correctiva sobre la v6, toda de peso y contacto:

- **la canoa ya no se entierra al varar**: el asiento se calcula con el punto
  MÁS ALTO del terreno bajo popa/quilla/proa, y el casco cabecea tangente a la
  pendiente — queda apoyado sobre la arena, nunca dentro.
- **san lorenzo conserva su arena**: la bahía sur es mar abrigado — el oleaje
  muere antes de la orilla (amortiguación en el vertex shader que empieza más
  allá del alcance del barco, `waveH()` sigue en sync) — y la playa se divide
  en losa seca elevada + delantal mojado que es lo único que se hunde bajo el
  agua.
- **el remo dice la verdad**: cadencia proporcional a la velocidad (fase
  acumulada, no reloj fijo), girar a la derecha = remar a babor (su izquierda)
  y viceversa (la pala bloquea el lado exterior del giro), y marcha atrás =
  palada invertida con el cuerpo echado atrás.
- **los pies no se hunden**: durante los pasitos del desembarco la altura del
  terreno se muestrea EN VIVO (max con la trayectoria), con offset de suela —
  las islas aterrazadas (liga u, talens) ya no se tragan las botas.
- **abordaje nuevo, directo**: fuera la trepada con pataleo — ahora sale del
  agua de un salto limpio y aterriza sentado (bob → arco sobre la borda con
  spray → se sienta y el casco acusa el peso → gafas arriba y gotas).
  ~2s de click a remar, cancelaciones cruzadas con dive intactas.

## novedades v6 — "el mundo se toca"

la v6 es la pasada de física y de pertenencia: nada levita, nada se atraviesa,
y gijón deja de ser un decorado para ser casa.

- **la canoa se moja**: el casco va asentado EN el agua (calado real ~0.4,
  francobordo ~0.7), no sobre ella. la elipse de descarte del shader ahora es
  dinámica (uniform `uBoatEll`): se ajusta a la línea de flotación real, se
  estira cuando la proa pica y se desplaza con la escora, así el agujero del
  agua no asoma nunca. el `waterLip` es un menisco que abraza el casco. cerca
  de la costa el casco usa la misma atenuación de oleaje que el shader
  (`shoreDamp`), para que barco y mar cuenten la misma ola.
- **todo es sólido**: la boya de bienvenida y las tres boyas-cartel de los
  bordes están en `rocks` — se embisten, no se atraviesan.
- **peces de verdad**: cuerpo comprimido lateralmente (más alto que ancho),
  cola en media luna separada por su pedúnculo (con su propio pivote: ondula
  en el aire), aleta dorsal, pectorales y ojos. banking hacia el interior del
  arco y escala aleatoria por salto. `fishSpotClear` intacto; siguen siendo
  2 draw calls por pez.
- **gijón de verdad** (3 draw calls por capas de profundidad, antes 1):
  - el mar TERMINA en la playa: masa de tierra continua de lado a lado
    (colinas verdes/ocres + cabos costeros flanqueando + losa profunda).
    cero agua entre o detrás de los edificios, desde cualquier cámara.
  - color real: cerro de santa catalina verde hierba con el elogio en piedra
    clara, san pedro en piedra, arena dorada que se hunde bajo el agua, muro
    con BALAUSTRADA blanca nítida, fachadas blanco/crema/terracota/ocre con
    tejados. la bruma malva queda solo para la laboral (capa lejana); la
    niebla de escena hace el resto con la distancia.
  - LETRONAS: las letras rojas gigantes "GIJÓN" (náutico/escalerona) en el
    extremo este, junto al agua — trazos extruidos en caja, espejadas en
    geometría para leerse desde el mar. el elogio sostiene el oeste.
- **varar en la playa**: las 4 islas tienen anillo de arena continuo
  (`beachify()`: pendiente que nace bajo el agua, banda casi plana de ~5
  unidades, y de ahí el terreno de cada isla). cualquier punto del anillo es
  embarcadero. física de varada: fricción de arena (nada de muros), la proa
  encalla, se levanta un pelín y la canoa queda clavada apuntando a donde
  apuntaba. coreografía nueva (`land`, mismo patrón que dive/board): suelta
  el remo en la borda → se levanta → salta de la proa a la arena → dos
  pasitos playa arriba → SOLO entonces se abre el case (`onDock` al final).
  al cerrar el case, la vuelta ligera (`launch`): salta a bordo, se sienta,
  la canoa se desliza atrás al agua. cámara compuesta POR ISLA (LAND_CAMS):
  el remero en primer término y el momento memorable arriba. el autopilot de
  la brújula termina varando, no en un prompt. escape instantáneo en
  cualquier frame; dive/board/land/launch se cancelan limpiamente entre sí;
  reduced-motion abre el case directo. el muelle de capullos queda de atrezzo
  (girado fuera de la ruta de aproximación).
- **los bordes venden**: al norte, este y oeste, una boya-cartel de madera
  ("island #5 — plot for sale") + toast del capitán con copy propio por rumbo
  + chip `mailto:jantolin@acb.es` (asunto "let's build island #5") estilo
  dock-btn. el borde sur es de gijón: morriña, cero marketing.
- **el menú son las profundidades**: el fondo del contenido es una columna
  de agua cocida a la altura del documento (`#depth-bg`, aria-hidden):
  superficie luminosa con rayos de luz → ultramar → abisal en el footer.
  about y footer cambian a tinta cream (AA sobre el tramo profundo), los
  cases siguen siendo balsas claras. burbujas dispersas subiendo y un rape
  abisal discreto (con su señuelo parpadeante) cerca del footer. dom de
  contenido intocable; reduced-motion = gradiente estático sin partículas.
  nota técnica: `#content` se promociona a capa propia en modo contenido
  (`translateZ(0)`) — evita un artefacto de composición con el gradiente.
- **abordaje ágil**: la vuelta menú→mar solapa hundimiento del menú, velo y
  emergencia de cámara. el mundo toma el frame a ~450ms (antes 820) y se
  revela con frames ya renderizados debajo; el timeline del abordaje se
  recorta (bob y heave más cortos, el pataleo INTACTO): ~2.75s de click a
  remar, sin frames muertos.

### presupuesto v6 (medido con renderer.info, 390×844 render por software)
- spawn 89 calls / ~52k tris · junto a isla 64 / ~46k · mirando a gijón 43 / ~46k.
- coste de simulación js: ~0.1 ms/frame. texturas ≤512px; sin post-proceso;
  three r128 intacto; capa seo intacta.

## novedades v5 — "un solo plano"

la v5 es una pasada de precisión: las transiciones mar↔menú se ruedan como un
único plano de cine, y el skyline pasa de "siluetas" a documental de gijón.

- **canoa más viva**: velocidad punta 26→29 y más empuje de palada. el mundo se
  cruza sin que sobre mar.
- **el remero tiene piernas y gafas**: piernecitas (pantalón marino + botas) que
  van dobladas y ocultas al remar, y unas gafas de scuba coral que viven
  PERMANENTEMENTE en su frente — son atrezzo de personaje, no un prop mágico.
- **salida al menú, un solo plano (~3s)**: suelta el remo (que se queda cruzado
  en la borda), se pone de pie, gira a perfil con pausa torera, se baja las
  gafas con la mano, y se tira de cabeza con los brazos en flecha. la cámara le
  sigue, se hunde ~2 unidades bajo el agua (velo turquesa→ultramar con burbujas
  y rayos de luz) y el menú emerge desde abajo como una lámina cream con
  esquinas redondeadas: el portfolio vive literalmente bajo el mar.
- **la vuelta, el gag**: el menú se hunde, emergemos junto a la canoa y él está
  en el agua con las gafas puestas. agarra la borda, sube medio cuerpo (la canoa
  escora fuerte), patalea con las piernecitas en el aire, rueda dentro, gafas
  arriba, sacudida de gotas y recupera el remo (`WORLD.boardIn(cb)`). la primera
  visita conserva el loader + intro aérea de siempre.
- **escape sigue siendo instantáneo** en cualquier punto de cualquier secuencia,
  y las secuencias se cancelan limpiamente entre sí (escape a mitad de salto +
  reentrada ya no deja estados zombis). `prefers-reduced-motion` salta todo.
- **skyline documental de gijón** (geografía real, mirada desde el mar):
  cerro de santa catalina verde al oeste con el elogio del horizonte en la
  cumbre (dos patas elípticas abiertas + arco volado), san pedro a su pie
  tocando el agua, playa de san lorenzo cuya arena se hunde bajo la línea de
  flotación, el muro de piedra con su BALAUSTRADA blanca (el detalle gijonés),
  escaleras, edificios de relleno detrás y la laboral lejana con más bruma
  (tercera capa de profundidad). nada flota; sigue siendo 1 draw call.
- **peces con validación de trayectoria**: salida, aterrizaje y dos puntos
  intermedios del arco se comprueban contra islas (keepR+8), rocas (r+2, la
  canasta incluida) y el borde del mapa, con hasta 8 reintentos. verificado
  estadísticamente: 112 saltos junto a todas las islas, 0 violaciones.
- **detalle obsesivo**: el remo nunca abandona la canoa mientras su dueño nada;
  hud, brújula, toasts y botón de atraque se funden (y dejan de ser clicables)
  durante las secuencias; la escora del abordaje no descubre el recorte de agua
  del casco.

### presupuesto v5 (medido con renderer.info)
- móvil 390×844: 50–78 draw calls / ~30k tris / 25fps con render por software (≈60 real).
- desktop: 81–128 draw calls / ~58k tris.
- texturas ≤512px; sin post-proceso; three r128 intacto; capa seo sin tocar.

## novedades v4 — "un mundo con alma"

la v4 es la segunda gran pasada de arte sobre la v3, más una renovación del dry land
y un cambio de tipografía. lo nuevo:

- **el remero es jorge**: la cara vive solo en el frente real (nunca se ve desde la
  cámara del juego) y lleva mullet corto por geometría — pompón + gorro + mullet + espalda.
- **fix del casco**: el mar ya no se ve dentro de la canoa. el shader del agua descarta
  los fragmentos dentro de una elipse orientada al barco (uniform `uBoat`): la canoa
  desplaza agua de verdad. un aro de espuma disimula la costura al estar parado.
- **cada isla tiene su momento** (referencias p5aholic day/028 y day/013 traducidas a toon):
  - ministerie: "el monolito de vigilancia" — jaula facetada girando sobre la aguja con
    una espiral de neón rojo pulsando y el ojo flotando dentro.
  - talens x pantone: "la órbita de color" — anillo de chips de pintura orbitando la mesa
    gris + un marco de galería dorado en la cumbre que encuadra el mar (el horizonte es el arte).
  - liga u: media cancha con parquet y líneas pintadas sobre la meseta + canasta gigante
    plantada en el agua en la ruta de entrada (aro coral, tablero cream, red al viento).
    la grúa y los banderines se quedan: la liga sigue en obras.
  - capullos: luciérnagas de hora dorada entre los brotes (un solo draw call).
- **dive-in**: el botón del mar ahora es "abandon ship 🤿" — el remero se levanta,
  se tira en bomba y el splash es la transición a dry land (`WORLD.diveOut(cb)`).
  escape sigue saliendo al instante; `prefers-reduced-motion` salta la animación.
- **skyline de gijón** al sur del mapa: elogio del horizonte, san pedro y la torre de
  la laboral como siluetas con bruma (1 draw call, sin colisión). el capitán lo comenta
  si navegas hacia allí.
- **hud tintado por isla**: al entrar en aguas de una isla, el botón de atraque y los
  acentos del hud adoptan su color, con texto ink/cream calculado por luminancia (AA).
- **dry land renovado**: fondo generativo del hero con el nombre repetido ondulando
  (canvas 2d, ref day/018) + "flotsam": barquito de papel, gotas, pez, nudo… colgados
  en los márgenes con física de muelle que reacciona al scroll (ref patrickheng.com).
  decidimos NO convertir la página en scroll horizontal: la columna vertical mantiene
  intactos seo, deep links, lectores de pantalla y el fallback sin js — la física vive
  solo en la capa decorativa (`js/dryland.js`, todo `aria-hidden`).
- **tipografía nueva**: fuera bricolage grotesque (demasiado liga u). ahora
  **anton** (display, cartel deportivo) + **dm sans** (cuerpo) + **space mono** (labels,
  se queda: es la voz del capitán). justificación completa en el comentario de `css/style.css`.
- **pasada de luz**: sparkles de sol redondos (antes eran celdas cuadradas), crestas
  más cálidas, rocas del mar en gris ciruela cálido, cámara que se abre e inclina
  hacia arriba al acercarte a una isla para encuadrar su corona.

### presupuesto v4 (medido con renderer.info)
- móvil: ~73 draw calls / ~28k tris / fluido (44fps con render por software ≈ 60+ real).
- desktop: ~127 draw calls / ~56k tris.
- texturas procedurales ≤512px; sin post-proceso; three r128 intacto.

## la experiencia (v3 "painted gold")

la v3 es una reescritura visual completa de `js/world.js` con dirección de arte
tipo "mundo de juguete pintado a mano" (referencias: summer afternoon, coastal world),
manteniendo three.js r128 sin build: toda la calidad sale del shading, no de la versión.

- **shading toon con rampas**: todos los materiales usan `MeshToonMaterial` con una
  rampa de 4 pasos generada por código (DataTexture) + rim light cálido inyectado
  por shader. cero texturas descargadas: todo es canvas o procedural (≤512px).
- **terreno orgánico**: las islas son heightfields polares esculpidos con ruido
  (value noise + fbm inline), color por altura y pendiente vía vertex colors
  (arena mojada → arena → hierba/ocre/gris/obsidiana según isla).
- **cada isla, su mundo**: capullos = jardín con colinas blandas, árboles blob,
  hierba y flores instanciadas con viento en vertex shader, brotes que florecen al
  acercarte, muelle de madera y farol. estrategia = meseta ocre aterrazada en obras,
  grúa, andamios, barriles y banderines al viento. talens = mesa gris con estratos
  donde solo los chips pantone y las salpicaduras tienen color. ministerie = risco
  oscuro con aguja de obsidiana, ventanas rojas, ojo que te sigue y foco barredor.
- **agua de referencia**: gradiente de profundidad de 3 paradas con banding pictórico,
  bajíos turquesa, espuma animada estilo wind waker alrededor de cada isla (anillos
  por distancia analítica, sin pase de profundidad), sparkles de sol cerca de la canoa
  y estela doble: partículas suaves + ribbon que se desvanece.
- **canoa y remero nuevos**: casco barrido con curvatura real y arrufo en proa/popa,
  franja cream, interior de listones; remero cartoon de cabeza grande con carita
  dibujada a canvas, gorro azul con pompón coral y brazos que agarran el remo de
  verdad (se resuelven cada frame contra la pala). rema, se inclina y descansa
  con el remo cruzado sobre la borda.
- **atmósfera**: sol con glow aditivo, motas de luz flotantes (solo tier high),
  nubes esponjosas, niebla a juego con el horizonte, grano de película y viñeta css.
- física con deriva y balanceo, rocas e islas sólidas (colisión), peces, gaviotas.
- respeta `prefers-reduced-motion` (sin intro aérea) y degrada por tiers:
  high / mobile / low / sin-webgl (dry land).

### presupuesto de rendimiento (medido)
- móvil: ~65 draw calls y ~26k triángulos (presupuesto: <150 / <150k).
- desktop: ~135 draw calls, ~52k triángulos.
- el bundle 3d sigue cargándose en diferido; el contenido html pinta primero.

## navegación
- desktop: wasd/flechas para remar. enter para atracar.
- móvil: arrastra en cualquier punto (aparece un joystick visual).
- brújula (abajo derecha): rota con tu rumbo, cada punto de color es una isla
  (distancia = lejanía del centro). **tocar un punto = la canoa navega sola**
  hasta la isla y abre el case. cualquier input manual cancela el piloto automático.
- contador de progreso bajo la brújula; al cerrar un case se sugiere la siguiente parada.

## otras notas
- dominio: ahora mismo todo apunta a `https://jorgeantolin.com/`. si el dominio final es otro,
  haz buscar-y-reemplazar en `index.html`, `sitemap.xml` y `robots.txt`.
- imágenes de los cases: `assets/*.webp` (ya optimizadas desde los pdfs originales).
- la versión "dry land" (contenido html) es a la vez el fallback para móviles flojos/sin webgl
  y la capa que leen buscadores e ias. no la borres.
- rendimiento: el bundle 3d (three.js + world.js) se carga en diferido; el contenido pinta primero.
