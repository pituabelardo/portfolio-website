/* world.js — the sea, the canoe, the four islands. v3 "painted gold"
   three.js r128 (global THREE), loaded lazily by main.js.

   ============================================================
   ART DIRECTION (v3) — read this before touching anything
   ============================================================
   goal: move from "programmer primitives" to "hand-painted toy world"
   (references: summer-afternoon.vlucendo.com, coastalworld.merci-michel.com)
   while keeping jorge's own soul: golden hour, ink/cream/ultramar/coral
   palette, gamberro copy, and mobile-first performance.

   why we stay on three r128 (deliberate decision):
   - the whole quality jump lives in shading + silhouettes + color ramps,
     none of which needs a newer three. r128 UMD keeps the site build-free,
     lazy-loaded from cdnjs, and served over plain http with zero risk.
   - no EffectComposer: post is replaced by (a) color grading baked into the
     water/sky shaders and (b) the existing css film grain + vignette.
     cheaper than bloom, and it degrades to nothing on mobile by definition.

   the visual system:
   1. shading — every lit surface uses MeshToonMaterial with a shared
      4-step procedural gradient ramp (DataTexture) + a warm rim light
      injected via onBeforeCompile. ambient occlusion is faked by baking
      darker vertex colors at bases/creases. no downloaded textures:
      everything is canvas- or data-generated.
   2. terrain — islands are polar heightfields displaced by inline value
      noise (fbm). color comes from height+slope ramps via vertex colors:
      wet sand → dry sand → grass → rock, blended smoothly, normals kept
      smooth for the "plasticine" look. each island keeps its theme:
        · capullos (garden): two soft mounds, spring-green ramp
          (#f0d68a sand → #7fd98a light grass → #3ec46d → #2b8f4e).
        · liga u (shipyard): terraced ochre plateau under construction
          (#f0d68a → #e0aa3e ochre → #ffd23f cap), wood scaffolds, crane.
        · talens x pantone (gallery): grayscale mesa with strata ledges
          (#e8e2d4 → #b9b3a4 → #8a857a → #66615a). only the pantone
          chips and the paint splats carry color. that's the thesis.
        · ministerie (watchtower): jagged near-black crag
          (#8f8a99 shore → #55506b → #2c2838), obsidian spire, red eye-light.
   3. water — same wave math as the physics (kept in sync!), but the
      fragment shader now does: 3-stop depth gradient, turquoise shallows,
      wind-waker style animated foam rings around every island (analytic
      distance, no depth pass — free), sun glitter sparkles, and painterly
      banding. plus a ribbon-mesh wake behind the canoe on top of the
      existing particle pool.
   4. canoe — swept hull with real curvature (cross-section stations,
      sheer line rising at bow/stern), cream gunwale, wood interior with
      plank stripes. paddler is a big-headed cartoon sailor: canvas-drawn
      face, blue beanie with coral pompom, noodle arms that actually hold
      and follow the paddle. he leans into every stroke.
   5. vegetation & wind — instanced grass blades and flowers with a wind
      vertex shader (injected via onBeforeCompile), blob trees with noisy
      canopies, bunting flags that wave, wooden docks, lanterns.
   6. atmosphere — additive sun glow sprite, drifting light motes (high
      tier), warm fog matched to the sky horizon.
   perf budget (mobile): < 150 draw calls, < 150k tris, textures ≤ 512px.
   ============================================================
   ART DIRECTION (v4) — "a world with a soul"
   ============================================================
   the v3 world was a beautiful toy. v4 makes it a place. plan:

   1. the paddler is jorge — seen from behind, always. so the face
      texture rotates to the true front (never visible from the game
      camera) and he gets his actual haircut: a short mullet flipping
      out under the beanie at the nape. silhouette read from camera:
      pompom → beanie → mullet → shoulders.
   2. hull bug — waves genuinely intersect the hull volume, so the sea
      was visible *inside* the canoe. fix: the water shader discards
      fragments inside a boat-oriented ellipse (uBoat uniform), i.e.
      the canoe now displaces water like a real hull. a cream waterline
      lip hides the seam. no depth pass, one uniform, zero extra calls.
   3. islands — each gets ONE memorable moment (refs: p5aholic day/028
      and day/013, translated to toon, never copied):
      · ministerie: "the surveillance monolith" — a dark faceted
        wireframe cage floating above the spire, red neon energy line
        pulsing inside, the eye hovering in its center (day/028's dark
        crystal + neon). the island now reads: they are watching.
      · talens x pantone: "the color orbit" — a ring of colored paint
        chips orbiting the grey mesa like day/013's daydream planet,
        plus a giant gilded empty gallery frame on the summit that
        frames the golden-hour sea: color is art, not a barrier.
      · liga u: the shipyard becomes a league being born — a stylized
        half-court (parquet deck, painted lines) carved into the
        plateau with a floating hoop: coral rim, cream board, net that
        waves in the wind shader. crane + bunting stay: still building.
      · capullos: golden-hour fireflies drifting between the buds
        (additive points, high tier), buds bloom wider when you dock.
   4. dive-in — WORLD.diveOut(cb): the paddler stands up, leaps into a
      cannonball, big splash (wake pool + rings), camera dips, and the
      splash IS the fade to dry land. reduced-motion skips straight
      to the callback. button copy: "abandon ship 🤿".
   5. gijón skyline — south of the map (z > BOUND_R), on a foggy dark
      cliff: chillida's elogio del horizonte, san pedro's tower and the
      universidad laboral tower as merged backlit silhouettes. 2 draw
      calls, no collision, pure homage. sailing near it earns a toast.
   6. typography — bricolage grotesque is out (too tied to liga u).
      new system: Anton for display (sports-poster punch, huge
      x-height, reads gamberro in lowercase), DM Sans for body
      (humanist warmth, effortless legibility), Space Mono stays for
      labels/HUD (it *is* the captain's voice). see css comment.
   7. global light pass — round soft sun glitter (the old square
      sparkle cells read "programmer"), warmer whitecaps, boat-hugging
      golden path toward the sun, eased UI tint per island.
   ============================================================ */

(function () {
  "use strict";

  var W = {};
  window.WORLD = W;

  /* ============================================================
     1 · palette + tunables
     ============================================================ */
  var COL = {
    skyTop: 0xef8d4b,     // burnt gold
    skyMid: 0xffcf92,     // warm amber
    horizon: 0xffe8c2,    // pale gold — fog matches this
    seaDeep: 0x20359e,    // deep ultramarine
    seaMid: 0x3050dc,     // brand ultramar, lifted
    seaLight: 0x6f8af2,   // crest blue
    seaShore: 0x49c9bd,   // turquoise shallows
    foam: 0xfdf6e6,
    sand: 0xf0d68a,
    sandWet: 0xd9b96a,
    ink: 0x14120f,
    cream: 0xf6eedd,
    coral: 0xff5a3c,
    coralDark: 0xd94528,
    yellow: 0xffd23f,
    ochre: 0xe0aa3e,
    green: 0x3ec46d,
    greenLight: 0x7fd98a,
    greenDark: 0x2b8f4e,
    blue: 0x2b47d9,
    wood: 0xa9613a,
    woodLight: 0xc57e4e,
    woodDark: 0x7c431f,
    skin: 0xe8b17e,
  };

  var SEA_R = 260;          // radius of the water plane / world
  var BOUND_R = 195;        // hard boundary for the boat
  var SPAWN_Z = 160;        // where the canoe starts
  var BUOY_Z = 126;         // welcome buoy position
  var ISLAND_R = 30;        // terrain disc radius (shared by all islands)
  var SHORE_FOAM_R = 30.0;  // where the shader foam rings anchor
  var MAX_SPEED = 29;       // boat top speed (units/s) — v5: a touch quicker
  var THRUST = 38;          // paddle power, scaled with MAX_SPEED
  /* v6: the canoe sits IN the water, not on it. HULL_Y is the hull group's
     rest offset from the local wave height: keel (local y≈0.13) ends up
     ~0.37 under the surface, gunwale (local 1.18) keeps ~0.68 freeboard.
     everything water-relative (discard ellipse, waterLip, board/dive
     choreography) is derived from this one number. */
  var HULL_Y = -0.5;
  var RIM_COLOR = 0xffc27a; // warm rim light for toon materials
  var WIND = { lo: 0.15, hi: 1.1, amp: 0.16, speed: 1.6 };

  /* ---------- state ---------- */
  var renderer, scene, camera, clock, stageEl;
  var water, waterUniforms;
  var canoe, paddle, paddler, hullGroup;
  var armL, armR, headMesh;
  var legL, legR, goggles;     // v5: little legs + permanent scuba goggles
  var waterLip = null;         // cream ellipse riding the waterline
  var islands = [];
  var flyers = [];            // clouds + seagulls
  var petals = [];            // capullos drifting petals
  var buoys = [];             // things that bob on waves {obj, x, z, amp}
  var searchlight = null;
  var beacon = null;
  var fishes = [];
  var rocks = [];             // {x, z, r} solid colliders
  var wakePool = [];
  var wakeIdx = 0;
  var wakeTimer = 0;
  var ribbon = null;          // wake ribbon mesh
  var trail = [];             // ribbon trail points
  var motes = null;           // drifting light motes
  var windShaders = [];       // shaders that need uTime
  var paused = false;
  var tier = "high";
  var onDockCb = null;
  var introT = 0;

  var input = { throttle: 0, turn: 0, touching: false, tx: 0, ty: 0 };
  var paddlePh = 0;   // v6.1: stroke phase accumulator (cadence ∝ speed)
  var boat = { x: 0, z: 160, heading: Math.PI, vx: 0, vz: 0, speed: 0, roll: 0 };
  var nearIsland = null;
  var toastEl, dockBtn, compassEl;
  var compassDots = [], compassRose, counterEl;
  var joyBase, joyNub;
  var autopilot = null;
  var visited = {};
  var boundaryToastAt = 0;
  var gijonToasted = false;

  /* ============================================================
     2 · math helpers + deterministic noise
     ============================================================ */
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function smoothstep(a, b, v) {
    var t = clamp((v - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }
  function normAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  /* wave height — MUST stay in sync with the water vertex shader */
  function waveH(x, z, t) {
    var px = x, py = -z;
    return Math.sin(px * 0.05 + t) * 1.1 +
           Math.cos(py * 0.045 + t * 0.8) * 0.9 +
           Math.sin((px + py) * 0.09 + t * 1.4) * 0.45;
  }

  /* deterministic 2d value noise (same result every load) */
  function hash2(x, y) {
    var s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  }
  function vnoise2(x, y) {
    var ix = Math.floor(x), iy = Math.floor(y);
    var fx = x - ix, fy = y - iy;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    var a = hash2(ix, iy), b = hash2(ix + 1, iy);
    var c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
    return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
  }
  function fbm2(x, y, oct) {
    var v = 0, amp = 0.5, f = 1;
    for (var i = 0; i < oct; i++) {
      v += vnoise2(x * f, y * f) * amp;
      f *= 2.03; amp *= 0.5;
    }
    return v; // ~0..1
  }

  /* ============================================================
     3 · toon shading system
     ============================================================ */
  var _gradTex = null;
  function gradTex() {
    if (_gradTex) return _gradTex;
    // 4-step ramp, lifted shadows so nothing goes muddy or black
    var steps = [118, 168, 216, 255];
    var data = new Uint8Array(steps.length * 3);
    for (var i = 0; i < steps.length; i++) {
      data[i * 3] = data[i * 3 + 1] = data[i * 3 + 2] = steps[i];
    }
    var tex = new THREE.DataTexture(data, steps.length, 1, THREE.RGBFormat);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    _gradTex = tex;
    return tex;
  }

  var _matCache = {};
  /* toonMat(color, opts)
     opts: vc (vertex colors), rim (0..1 rim strength), wind (vegetation sway),
           flat (flat shading), ds (double side), key (cache key override) */
  function toonMat(color, opts) {
    opts = opts || {};
    var key = (opts.key || color) + "|" + (opts.vc ? 1 : 0) + (opts.rim || 0) +
              (opts.wind ? 1 : 0) + (opts.flat ? 1 : 0) + (opts.ds ? 1 : 0);
    if (_matCache[key]) return _matCache[key];

    /* note: r128's MeshToonMaterial has no flatShading — opts.flat only
       differentiates the cache key (the look comes from geometry normals) */
    var mat = new THREE.MeshToonMaterial({
      color: color,
      gradientMap: gradTex(),
      vertexColors: !!opts.vc,
      side: opts.ds ? THREE.DoubleSide : THREE.FrontSide,
    });

    var rim = opts.rim || 0;
    var wind = !!opts.wind;
    if (rim > 0 || wind) {
      mat.onBeforeCompile = function (shader) {
        shader.uniforms.uTime = { value: 0 };
        shader.uniforms.uRimC = { value: new THREE.Color(RIM_COLOR) };
        shader.uniforms.uRimI = { value: rim * 0.55 };
        if (wind) {
          shader.vertexShader = shader.vertexShader
            .replace("#include <common>",
              "#include <common>\nuniform float uTime;")
            .replace("#include <begin_vertex>", [
              "#include <begin_vertex>",
              "vec3 wpp = vec3(0.0);",
              "#ifdef USE_INSTANCING",
              "wpp = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);",
              "#endif",
              "float windW = smoothstep(" + WIND.lo.toFixed(2) + ", " + WIND.hi.toFixed(2) + ", transformed.y);",
              "float wph = wpp.x * 0.4 + wpp.z * 0.33 + position.x * 0.25 + position.z * 0.2;",
              "float sway = sin(uTime * " + WIND.speed.toFixed(2) + " + wph) + sin(uTime * " + (WIND.speed * 1.7).toFixed(2) + " + wph * 1.3) * 0.5;",
              "transformed.x += sway * " + WIND.amp.toFixed(3) + " * windW;",
              "transformed.z += sway * " + (WIND.amp * 0.55).toFixed(3) + " * windW;",
            ].join("\n"));
        }
        if (rim > 0) {
          shader.fragmentShader = shader.fragmentShader
            .replace("#include <common>",
              "#include <common>\nuniform vec3 uRimC;\nuniform float uRimI;")
            .replace("#include <dithering_fragment>", [
              "float rimK = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 3.0);",
              "gl_FragColor.rgb += uRimC * rimK * uRimI;",
              "#include <dithering_fragment>",
            ].join("\n"));
        }
        if (wind) windShaders.push(shader);
      };
      mat.customProgramCacheKey = function () { return key; };
    }
    _matCache[key] = mat;
    return mat;
  }

  /* the four workhorse materials */
  function terrainMat() { return toonMat(0xffffff, { vc: true, rim: 0.9, key: "terrain" }); }
  function propMat() { return toonMat(0xffffff, { vc: true, rim: 0.35, key: "prop" }); }
  function windMat() { return toonMat(0xffffff, { vc: true, wind: true, ds: true, key: "windveg" }); }

  /* unlit + wind: flags and pennants always read their true color */
  var _flagMat = null;
  function flagMat() {
    if (_flagMat) return _flagMat;
    var mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
    mat.onBeforeCompile = function (shader) {
      shader.uniforms.uTime = { value: 0 };
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uTime;")
        .replace("#include <begin_vertex>", [
          "#include <begin_vertex>",
          "float wph = position.x * 0.5 + position.z * 0.4 + position.y * 0.3;",
          "float sway = sin(uTime * 2.4 + wph * 2.0) * 0.14 + sin(uTime * 4.1 + wph * 3.1) * 0.06;",
          "transformed.x += sway; transformed.z += sway * 0.6;",
        ].join("\n"));
      windShaders.push(shader);
    };
    mat.customProgramCacheKey = function () { return "flagmat"; };
    _flagMat = mat;
    return mat;
  }

  /* ============================================================
     4 · geometry helpers (vertex colors, merging, placing)
     ============================================================ */
  var _c1 = new THREE.Color(), _c2 = new THREE.Color();

  /* paint a whole geometry one color, optionally gradient bottom→top */
  function tint(geo, hex, hexTop, y0, y1) {
    var pos = geo.attributes.position;
    var arr = new Float32Array(pos.count * 3);
    _c1.setHex(hex);
    if (hexTop !== undefined) _c2.setHex(hexTop);
    for (var i = 0; i < pos.count; i++) {
      var c = _c1;
      if (hexTop !== undefined) {
        var k = smoothstep(y0, y1, pos.getY(i));
        c = _c1.clone().lerp(_c2, k);
      }
      arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(arr, 3));
    return geo;
  }

  var _m4 = new THREE.Matrix4(), _q4 = new THREE.Quaternion(), _e4 = new THREE.Euler();
  function placed(geo, x, y, z, ry, s, sy) {
    s = s === undefined ? 1 : s;
    _e4.set(0, ry || 0, 0);
    _q4.setFromEuler(_e4);
    _m4.compose(new THREE.Vector3(x, y, z), _q4, new THREE.Vector3(s, sy === undefined ? s : sy, s));
    geo.applyMatrix4(_m4);
    return geo;
  }

  /* merge a list of BufferGeometries that all have position/normal/color */
  function mergeGeos(list) {
    var pos = [], nor = [], col = [], idx = [], off = 0;
    list.forEach(function (g) {
      var p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color;
      for (var i = 0; i < p.count; i++) {
        pos.push(p.getX(i), p.getY(i), p.getZ(i));
        nor.push(n.getX(i), n.getY(i), n.getZ(i));
        col.push(c.getX(i), c.getY(i), c.getZ(i));
      }
      if (g.index) {
        for (var j = 0; j < g.index.count; j++) idx.push(g.index.array[j] + off);
      } else {
        for (var k = 0; k < p.count; k++) idx.push(k + off);
      }
      off += p.count;
      g.dispose();
    });
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    geo.setIndex(idx);
    return geo;
  }

  /* color ramp: [[h, hexColor], ...] sorted by h — returns THREE.Color */
  function rampColor(ramp, h, out) {
    if (h <= ramp[0][0]) return out.setHex(ramp[0][1]);
    for (var i = 1; i < ramp.length; i++) {
      if (h < ramp[i][0]) {
        var k = smoothstep(ramp[i - 1][0], ramp[i][0], h);
        return out.setHex(ramp[i - 1][1]).lerp(_c2.setHex(ramp[i][1]), k);
      }
    }
    return out.setHex(ramp[ramp.length - 1][1]);
  }

  /* ============================================================
     init
     ============================================================ */
  W.init = function (opts) {
    tier = opts.tier || "high";
    onDockCb = opts.onDock || function () {};
    var container = opts.container;
    stageEl = container;

    renderer = new THREE.WebGLRenderer({
      antialias: tier !== "low",
      powerPreference: "high-performance",
    });
    var dpr = Math.min(window.devicePixelRatio || 1, tier === "high" ? 2 : 1.5);
    renderer.setPixelRatio(dpr);
    // v8.1: size from the #stage box, not window.inner* — ios lies after reload
    var w0 = container.clientWidth || window.innerWidth;
    var h0 = container.clientHeight || window.innerHeight;
    renderer.setSize(w0, h0);
    container.appendChild(renderer.domElement);
    W._renderer = renderer;   // exposed for perf audits

    scene = new THREE.Scene();
    scene.background = new THREE.Color(COL.horizon);
    scene.fog = new THREE.Fog(COL.horizon, 110, tier === "low" ? 200 : 255);

    camera = new THREE.PerspectiveCamera(55, w0 / h0, 0.5, 900);
    var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      // no aerial swoop: start right behind the canoe
      var fx0 = Math.sin(boat.heading), fz0 = Math.cos(boat.heading);
      camera.position.set(boat.x - fx0 * 19, 10.5, boat.z - fz0 * 19);
      introT = 0;
    } else if (tier === "high") {
      camera.position.set(boat.x + 60, 110, boat.z + 120);
      introT = 3.6;
    } else {
      camera.position.set(boat.x + 26, 48, boat.z + 66);
      introT = 2.2;
    }

    var hemi = new THREE.HemisphereLight(0xffe3b8, 0x3a4bbf, 0.75);
    scene.add(hemi);
    var sun = new THREE.DirectionalLight(0xffd9a0, 1.15);
    sun.position.set(-90, 90, 40);
    scene.add(sun);

    buildSky();
    buildWater(opts.islands);
    buildCanoe();
    buildIslands(opts.islands);
    buildWelcome();
    buildEdgeBuoys();
    buildGijonSkyline();
    buildRocks();
    buildWake();
    buildRibbon();
    if (tier !== "low") {
      buildClouds();
      buildSeagulls();
      buildFish();
    }
    if (tier === "high") buildMotes();

    bindInput(container);
    bindHud();

    clock = new THREE.Clock();
    window.addEventListener("resize", onResize);
    // v8.1: ios emits these when it won't emit resize — take every signal,
    // plus delayed re-checks for the post-reload viewport settle
    window.addEventListener("orientationchange", function () { setTimeout(onResize, 250); });
    if (window.visualViewport) window.visualViewport.addEventListener("resize", onResize);
    setTimeout(onResize, 350);
    setTimeout(onResize, 1200);
    setTimeout(onResize, 3000);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) clock.stop(); else clock.start();
    });

    renderer.setAnimationLoop(tick);
    return Promise.resolve();
  };

  W.setPaused = function (p) {
    paused = p;
    /* the case pauses the world while we're beached; only when it has
       actually been open (p:true seen) does unpausing mean "case
       closed" — then the light relaunch plays itself. this dodges
       main.js's closeCase-inside-openCase unpause blip. */
    if (p && beached && beached.parked) beached.caseOpened = true;
    if (!p && beached && beached.parked && beached.caseOpened) startLaunch();
  };

  /* ============================================================
     v4 · diveOut — the cannonball exit.
     the paddler stands up, leaps overboard, and the splash is the
     transition to dry land. cb fires exactly at splashdown so the
     caller can fade the screen while the water is still flying.
     ============================================================ */
  var dive = null;   // { t, cb, cbFired, splashed }
  var board = null;  // { t, cb, done } — the climb-back-in sequence
  /* v6 · beaching states — same pattern as dive/board:
     land   = the disembark choreography (paddle down → stand → hop
              to the sand → two steps up the beach → onDock)
     beached= parked on the sand while the case is open (paddler
              stands on the beach behind the overlay)
     launch = the light way back (hop in → sit → slide off the sand) */
  var land = null, beached = null, launch = null;
  var groundedIsl = null;   // island whose sand the keel is touching
  var _idQ = new THREE.Quaternion();
  var _upQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 1, 0));
  var _gogQ = new THREE.Quaternion();

  W.diveOut = function (cb) {
    cb = cb || function () {};
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // paused (a case is open) means the sequence could never step:
    // hand straight over to the caller instead of hanging the veil
    if (reduced || dive || paused) { cb(); return; }
    // escape can freeze a boarding mid-climb; a new dive supersedes it
    if (board) { board = null; boardLean = 0; resetPaddlerPose(); }
    // beaching states cancel cleanly: pose resets, the dive proceeds
    // from wherever the canoe is (shallow water is still water)
    if (land || launch || beached) { land = null; launch = null; beached = null; resetPaddlerPose(); }
    autopilot = null;
    paddler.rotation.order = "YXZ";   // yaw first, then the head-first pitch
    dive = { t: 0, cb: cb, cbFired: false, splashed: false };
  };

  /* ============================================================
     v5 · boardIn — the climb back aboard.
     we surface next to the canoe: he's in the water (head + hands),
     grabs the rail, heaves half his body over (the canoe heels hard),
     kicks his little legs in the air, rolls in, goggles back up,
     drips dry. cb fires when he takes the paddle back.
     ============================================================ */
  var boardLean = 0;   // extra roll the climb imposes on the hull
  /* v6.1: the heave/kick climb never read right at the new waterline —
     now he BURSTS out of the water and lands seated. bob → leap arc
     over the rail (spray) → drop into the seat (the hull dips) →
     goggles up, drips dry. shorter, cleaner, physically honest. */
  var B_BOB = 0.3, B_LEAP = 0.95, B_SIT = 1.3, B_CB = 1.55, B_END = 2.05;
  W.boardIn = function (cb) {
    cb = cb || function () {};
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { cb(); return; }
    // escape can freeze a dive mid-air; boarding supersedes it (its old
    // cb is dropped — main.js already cleaned that transition up)
    if (dive) { dive = null; }
    if (board) { boardLean = 0; }
    // he climbs in from the WATER: if the canoe was parked on a beach
    // (or mid-launch), slide it afloat first — under the veil, unseen
    if (land || launch || beached) { land = null; launch = null; beached = null; unbeachInstant(); }
    resetPaddlerPose();
    autopilot = null;
    paddler.rotation.order = "YXZ";
    paddler.rotation.y = -Math.PI / 2;        // facing the hull from the water
    paddler.position.set(3.1, -1.95, -0.4);   // starboard, only head above water
                                              // (hull sits lower since v6: HULL_Y)
    legL.group.rotation.x = 0;
    legR.group.rotation.x = 0;
    setGoggles(1);                            // he swam here, goggles on
    paddler.visible = true;
    board = { t: 0, cb: cb, cbFired: false, splashed: false, thump: false };
    // camera starts under the surface, about to break it
    camPos.set(boat.x - Math.sin(boat.heading) * 8 + Math.cos(boat.heading) * 7, -2.6,
               boat.z - Math.cos(boat.heading) * 8 - Math.sin(boat.heading) * 7);
    camera.position.copy(camPos);
  };

  function stepBoard(dt, t) {
    board.t += dt;
    var b = board.t;
    var fx = Math.sin(boat.heading), fz = Math.cos(boat.heading);
    var rxs = fz, rzs = -fx;
    var ke = Math.min(1, dt * 10);

    if (b < B_BOB) {
      // treading water at starboard, winding up
      paddler.position.y = -1.95 + Math.sin(t * 2.6) * 0.12;
      _gogQ.setFromUnitVectors(_down, _v2.set(0.25, 0.5, 0.85).normalize());
      armToPose(armL, _gogQ, ke, 1.15);
      _gogQ.setFromUnitVectors(_down, _v2.set(-0.25, 0.5, 0.85).normalize());
      armToPose(armR, _gogQ, ke, 1.15);
    } else if (b < B_LEAP) {
      // the leap: bursts out of the water, over the rail, arms up
      var k1 = smoothstep(B_BOB, B_LEAP, b);
      if (!board.splashed) {
        board.splashed = true;
        for (var sp4 = 0; sp4 < 6; sp4++) {
          spawnWake(boat.x + rxs * (2.6 + hash2(sp4, 1)), boat.z + rzs * (2.6 + hash2(sp4, 2)),
                    0.8 + hash2(sp4, 3), 1.0, 0.7);
        }
      }
      paddler.position.x = lerp(3.1, 0, k1);
      paddler.position.y = lerp(-1.95, 0.4, k1) + Math.sin(k1 * Math.PI) * 2.3;
      paddler.position.z = -0.4;
      paddler.rotation.y = -Math.PI / 2 * (1 - k1);   // lands facing the bow
      var tuck2 = Math.sin(k1 * Math.PI);
      legL.group.rotation.x = -0.6 * tuck2;
      legR.group.rotation.x = -0.6 * tuck2;
      armToPose(armL, _upQ, ke * 1.3, 1.1);
      armToPose(armR, _upQ, ke * 1.3, 1.1);
    } else if (b < B_SIT) {
      // touchdown: drops into the seat, the hull takes the weight
      var k2 = smoothstep(B_LEAP, B_SIT, b);
      paddler.position.x = 0;
      paddler.position.y = 0.4 * (1 - k2);
      paddler.rotation.y = 0;
      legL.group.rotation.x = lerp(-0.6, LEG_FOLD, k2);
      legR.group.rotation.x = lerp(-0.6, LEG_FOLD, k2);
      armToPose(armL, _idQ, ke, 1);
      armToPose(armR, _idQ, ke, 1);
      boardLean = -0.16 * Math.sin(k2 * Math.PI);
      if (!board.thump && k2 > 0.2) {
        board.thump = true;
        spawnWake(boat.x + rxs * 1.2, boat.z + rzs * 1.2, 0.5, 0.6, 0.5);
        spawnWake(boat.x - rxs * 1.2, boat.z - rzs * 1.2, 0.5, 0.6, 0.5);
      }
    } else if (b < B_END) {
      // settle: damped wobble, goggles back up, shake-dry
      var k4 = smoothstep(B_SIT, B_END, b);
      var w = b - B_SIT;
      boardLean = 0.12 * Math.cos(w * 9) * Math.exp(-w * 3.6);
      setGoggles(1 - smoothstep(0, 0.55, k4));
      headMesh.rotation.z = Math.sin(k4 * Math.PI * 3) * 0.07 * (1 - k4);
      if (!board.cbFired && b >= B_CB) { board.cbFired = true; board.cb(); }
    } else {
      if (!board.cbFired) { board.cbFired = true; board.cb(); }
      resetPaddlerPose();
      headMesh.rotation.z = 0;
      boardLean = 0;
      board = null;
    }
  }

  /* v5 timeline: settle → stand (legs unfold) → turn to profile →
     goggles down → head-first leap. one continuous shot, ~3s. */
  var D_STAND = 0.45, D_TURN = 1.05, D_GOG = 1.55, D_LEAP = 2.1, D_SPLASH_END = 3.9;
  function resetPaddlerPose() {
    paddler.visible = true;
    paddler.position.set(0, 0, -0.4);
    paddler.rotation.set(0, 0, 0);
    paddler.rotation.order = "XYZ";
    paddler.scale.set(1, 1, 1);
    headMesh.rotation.x = 0;
    legL.group.rotation.x = LEG_FOLD;
    legR.group.rotation.x = LEG_FOLD;
    legL.group.rotation.z = 0;
    legR.group.rotation.z = 0;
    setGoggles(0);
  }

  /* ease arm to a raw quaternion pose (leaves ik) */
  function armToPose(arm, q, k, reach) {
    arm.group.quaternion.slerp(q, k);
    arm.mesh.scale.y += ((reach || 1) - arm.mesh.scale.y) * k;
    arm.mitt.position.y += (-arm.len * (reach || 1) - arm.mitt.position.y) * k;
  }

  function stepDive(dt, t) {
    dive.t += dt;
    var d = dive.t;
    var fx = Math.sin(boat.heading), fz = Math.cos(boat.heading);
    var rxs = fz, rzs = -fx;   // starboard in world
    var ke = Math.min(1, dt * 10);

    // paddle eases to its resting pose across the whole wind-up
    paddle.rotation.x += (0 - paddle.rotation.x) * ke * 0.5;
    paddle.rotation.z += (Math.PI / 2 - paddle.rotation.z) * ke * 0.5;
    paddle.position.y += (2.0 - paddle.position.y) * ke * 0.5;

    if (d < D_STAND) {
      // settle: small forward hunch, arms leave the paddle
      var k0 = smoothstep(0, D_STAND, d);
      armToPose(armL, _idQ, ke, 1);
      armToPose(armR, _idQ, ke, 1);
      paddler.rotation.x = 0.12 * Math.sin(k0 * Math.PI);
    } else if (d < D_TURN) {
      // stand up on the hull: legs unfold, body rises, micro-balance
      var k1 = smoothstep(D_STAND, D_TURN, d);
      legL.group.rotation.x = LEG_FOLD * (1 - k1);
      legR.group.rotation.x = LEG_FOLD * (1 - k1);
      paddler.position.y = k1 * 1.05;
      paddler.rotation.x = 0;
      paddler.rotation.z = Math.sin(t * 6.5) * 0.05 * (1 - k1 * 0.5);
      armToPose(armL, _idQ, ke, 1);
      armToPose(armR, _idQ, ke, 1);
    } else if (d < D_GOG) {
      // quarter turn: profile to the camera, a beat of torero calm
      var k2 = smoothstep(D_TURN, D_GOG, d);
      paddler.position.y = 1.05;
      paddler.rotation.y = k2 * Math.PI / 2;   // face the starboard rail
      paddler.rotation.z = Math.sin(t * 6.5) * 0.03 * (1 - k2);
    } else if (d < D_LEAP) {
      // goggles: right arm reaches up, pulls them from forehead to eyes
      var k3 = smoothstep(D_GOG, D_LEAP, d);
      var reach = Math.sin(Math.min(1, k3 * 1.6) * Math.PI);   // up then back down
      _gogQ.setFromUnitVectors(_down, _v2.set(-0.5, 0.95, 0.42).normalize());
      armToPose(armR, reach > 0.05 ? _gogQ : _idQ, ke, 1 + reach * 0.25);
      setGoggles(smoothstep(0.25, 0.75, k3));
      headMesh.rotation.x = 0.16 * k3;         // eyes drop to the water
    } else if (d < D_SPLASH_END) {
      // the leap: quick crouch, then a clean head-first arc to starboard
      var k4 = (d - D_LEAP) / 0.75;   // fixed arc duration; the tail of the
                                      // phase is the camera's underwater beat
      if (k4 <= 0.16) {
        var c = k4 / 0.16;
        paddler.position.y = 1.05 - 0.32 * Math.sin(c * Math.PI * 0.5);
        paddler.scale.set(1 + 0.08 * c, 1 - 0.14 * c, 1 + 0.08 * c);
      } else if (k4 <= 1) {
        var j = (k4 - 0.16) / 0.84;
        // arms to arrow overhead
        armToPose(armL, _upQ, ke * 1.4, 1.15);
        armToPose(armR, _upQ, ke * 1.4, 1.15);
        paddler.scale.set(1 - 0.05, 1 + 0.08, 1 - 0.05);
        paddler.position.x = j * 3.7;
        paddler.position.y = 0.73 + Math.sin(j * Math.PI) * 3.9 - j * j * 4.9;
        paddler.rotation.x = j * 2.35;          // pitch over, head leads
        legL.group.rotation.z = Math.sin(j * Math.PI) * 0.22;
        legR.group.rotation.z = -Math.sin(j * Math.PI) * 0.22;
        if (j > 0.72 && !dive.splashed) {
          dive.splashed = true;
          dive.splashAt = dive.t;
          if (!dive.cbFired) { dive.cbFired = true; dive.cb(); }
          var sx2 = boat.x + rxs * 3.7, sz2 = boat.z + rzs * 3.7;
          for (var sp3 = 0; sp3 < 9; sp3++) {
            var sa3 = (sp3 / 9) * Math.PI * 2;
            spawnWake(sx2 + Math.cos(sa3) * (0.5 + hash2(sp3, 1) * 1.4),
                      sz2 + Math.sin(sa3) * (0.5 + hash2(sp3, 2) * 1.4),
                      1.4 + hash2(sp3, 3) * 1.6, 1.5, 0.85);
          }
          spawnWake(sx2, sz2, 3.2, 1.8, 0.95);
        }
      } else {
        paddler.visible = false;   // gone beneath the surface
      }
    } else {
      // underwater beat is main.js's job (the veil) — reset and hand back
      if (!dive.cbFired) { dive.cbFired = true; dive.cb(); }
      resetPaddlerPose();
      dive = null;
    }
  }
  /* ============================================================
     v6 · varada — beach, hop off, walk up, THEN the case opens.
     same contract as dive/board: solveArms is skipped, escape can
     freeze any frame, dive/board cancel it cleanly, reduced-motion
     goes straight to the case.
     ============================================================ */
  var L_PADDLE = 0.4, L_STAND = 0.95, L_TURN = 1.25, L_LEAP = 1.85, L_STEPS = 2.7;
  var _lw = new THREE.Vector3();
  function setPaddlerWorld(x, y, z) {
    _lw.set(x, y, z);
    hullGroup.worldToLocal(_lw);
    paddler.position.copy(_lw);
  }
  function islHeightAt(isl, x, z) {
    var lx = x - isl.group.position.x, lz = z - isl.group.position.z;
    var rr = Math.sqrt(lx * lx + lz * lz);
    return isl.props.heightFn(rr / ISLAND_R, lx, lz);
  }

  function startLand(isl) {
    autopilot = null;
    visited[isl.def.id] = true;
    updateCounter();
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      beached = { isl: isl, parked: true, reduced: true };
      onDockCb(isl.def.id);
      return;
    }
    var dx = isl.group.position.x - boat.x;
    var dz = isl.group.position.z - boat.z;
    var dd = Math.sqrt(dx * dx + dz * dz) || 1;
    var dirX = dx / dd, dirZ = dz / dd;         // toward the island heart
    var p1x = boat.x + dirX * 6.2, p1z = boat.z + dirZ * 6.2;
    var p2x = boat.x + dirX * 8.8, p2z = boat.z + dirZ * 8.8;
    land = {
      t: 0, isl: isl, dirX: dirX, dirZ: dirZ,
      p1: new THREE.Vector3(p1x, Math.max(islHeightAt(isl, p1x, p1z), 0.4) + 0.12, p1z),
      p2: new THREE.Vector3(p2x, Math.max(islHeightAt(isl, p2x, p2z), 0.5) + 0.12, p2z),
      startW: new THREE.Vector3(), leapSet: false, cbFired: false,
    };
    paddler.rotation.order = "YXZ";
  }

  function stepLand(dt, t) {
    land.t += dt;
    var b = land.t;
    var ke = Math.min(1, dt * 10);
    boat.vx = 0; boat.vz = 0;
    canoe.updateMatrixWorld(true);
    // the paddle stays with the boat: eased to its resting pose
    paddle.rotation.x += (0 - paddle.rotation.x) * ke * 0.6;
    paddle.rotation.z += (Math.PI / 2 - paddle.rotation.z) * ke * 0.6;
    paddle.position.y += (2.0 - paddle.position.y) * ke * 0.6;
    // paddler faces the island for the whole walk
    var faceY = normAngle(Math.atan2(land.dirX, land.dirZ) - boat.heading);

    if (b < L_PADDLE) {
      // ships the oar, hands settle
      armToPose(armL, _idQ, ke, 1);
      armToPose(armR, _idQ, ke, 1);
    } else if (b < L_STAND) {
      // stands up on the hull, legs unfold
      var k1 = smoothstep(L_PADDLE, L_STAND, b);
      legL.group.rotation.x = LEG_FOLD * (1 - k1);
      legR.group.rotation.x = LEG_FOLD * (1 - k1);
      paddler.position.y = k1 * 1.05;
      paddler.rotation.z = Math.sin(t * 6.5) * 0.04 * (1 - k1 * 0.5);
      armToPose(armL, _idQ, ke, 1);
      armToPose(armR, _idQ, ke, 1);
    } else if (b < L_TURN) {
      // pivots to face the beach
      var k2 = smoothstep(L_STAND, L_TURN, b);
      paddler.position.y = 1.05;
      paddler.rotation.y = faceY * k2;
    } else if (b < L_LEAP) {
      // the hop: bow to sand, one clean arc
      var k3 = smoothstep(L_TURN, L_LEAP, b);
      if (!land.leapSet) {
        land.leapSet = true;
        paddler.getWorldPosition(land.startW);
      }
      paddler.rotation.y = faceY;
      var wx = lerp(land.startW.x, land.p1.x, k3);
      var wy = lerp(land.startW.y, land.p1.y, k3) + Math.sin(k3 * Math.PI) * 1.7;
      var wz = lerp(land.startW.z, land.p1.z, k3);
      setPaddlerWorld(wx, wy, wz);
      var tuck = Math.sin(k3 * Math.PI);
      legL.group.rotation.x = -0.55 * tuck;
      legR.group.rotation.x = -0.55 * tuck;
      // the hull, unloaded, bobs up a touch
      boardLean = 0.06 * tuck;
      if (k3 > 0.92 && !land.sandPuff) {
        land.sandPuff = true;
        spawnWake(land.p1.x, land.p1.z, 0.5, 0.5, 0.4);
      }
    } else if (b < L_STEPS) {
      // two little steps up the beach
      var k4 = smoothstep(L_LEAP, L_STEPS, b);
      paddler.rotation.y = faceY;
      var hopY = Math.abs(Math.sin(k4 * Math.PI * 2)) * 0.3;
      var wx2 = lerp(land.p1.x, land.p2.x, k4);
      var wz2 = lerp(land.p1.z, land.p2.z, k4);
      // v6.1: the ground is sampled LIVE — terraced islands rise in
      // steps between p1 and p2 and his boots must ride each one
      var wy2 = Math.max(lerp(land.p1.y, land.p2.y, k4),
                         islHeightAt(land.isl, wx2, wz2) + 0.12) + hopY;
      setPaddlerWorld(wx2, wy2, wz2);
      var swing = Math.sin(k4 * Math.PI * 4) * 0.5;
      legL.group.rotation.x = swing;
      legR.group.rotation.x = -swing;
      paddler.rotation.z = Math.sin(k4 * Math.PI * 4) * 0.04;
      boardLean = 0;
    } else {
      // ONLY NOW does the case open — he's standing on the island
      if (!land.cbFired) {
        land.cbFired = true;
        setPaddlerWorld(land.p2.x, land.p2.y, land.p2.z);
        legL.group.rotation.x = 0;
        legR.group.rotation.x = 0;
        beached = { isl: land.isl, parked: true };
        var islId = land.isl.def.id;
        land = null;
        onDockCb(islId);
      }
    }
  }

  /* the light way back: hop in, sit, the canoe slides off the sand */
  var LA_HOP = 0.55, LA_SIT = 0.85, LA_SLIDE = 1.8;
  function startLaunch() {
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var wasReduced = beached && beached.reduced;
    var isl = beached.isl;
    beached = null;
    if (reduced || wasReduced) { unbeachInstant(); resetPaddlerPose(); return; }
    canoe.updateMatrixWorld(true);
    var sw = new THREE.Vector3();
    paddler.getWorldPosition(sw);
    // slide target: back out along the radial until the keel floats
    var dx = boat.x - isl.group.position.x, dz = boat.z - isl.group.position.z;
    var dd = Math.sqrt(dx * dx + dz * dz) || 1;
    var nX = dx / dd, nZ = dz / dd;
    var out = 0;
    for (var rr = dd; rr < ISLAND_R + 8; rr += 0.5) {
      if (islHeightAt(isl, isl.group.position.x + nX * rr, isl.group.position.z + nZ * rr) < -1.0) { out = rr - dd + 0.6; break; }
      out = rr - dd + 0.6;
    }
    launch = { t: 0, isl: isl, standW: sw, g0x: boat.x, g0z: boat.z,
               f0x: boat.x + nX * out, f0z: boat.z + nZ * out, nX: nX, nZ: nZ };
    paddler.rotation.order = "YXZ";
  }

  function stepLaunch(dt, t) {
    launch.t += dt;
    var b = launch.t;
    var ke = Math.min(1, dt * 10);
    boat.vx = 0; boat.vz = 0;
    canoe.updateMatrixWorld(true);
    if (b < LA_HOP) {
      // hops from the sand back over the bow
      var k1 = smoothstep(0, LA_HOP, b);
      var sy = lerp(launch.standW.y, canoe.position.y + 1.05, k1) + Math.sin(k1 * Math.PI) * 1.5;
      setPaddlerWorld(lerp(launch.standW.x, boat.x, k1), sy, lerp(launch.standW.z, boat.z, k1));
      // spins mid-hop so he lands facing the bow (back to the camera,
      // as always — nobody needs to see the captain's face)
      var faceB = normAngle(Math.atan2(boat.x - launch.standW.x, boat.z - launch.standW.z) - boat.heading);
      paddler.rotation.y = faceB * (1 - smoothstep(0.15, 0.85, k1));
      var tuck = Math.sin(k1 * Math.PI);
      legL.group.rotation.x = -0.5 * tuck;
      legR.group.rotation.x = -0.5 * tuck;
    } else if (b < LA_SIT) {
      // sits, legs fold under the gunwale, faces the bow
      var k2 = smoothstep(LA_HOP, LA_SIT, b);
      paddler.position.set(0, (1 - k2) * 1.05, -0.4);
      paddler.rotation.y = paddler.rotation.y * (1 - k2);
      legL.group.rotation.x = LEG_FOLD * k2;
      legR.group.rotation.x = LEG_FOLD * k2;
      armToPose(armL, _idQ, ke, 1);
      armToPose(armR, _idQ, ke, 1);
    } else if (b < LA_SLIDE) {
      // the sand lets go: she slides stern-first back into the sea
      var k3 = smoothstep(LA_SIT, LA_SLIDE, b);
      var ease = k3 * k3 * (3 - 2 * k3);
      boat.x = lerp(launch.g0x, launch.f0x, ease);
      boat.z = lerp(launch.g0z, launch.f0z, ease);
      if (Math.floor(b * 6) !== Math.floor((b - dt) * 6)) {
        spawnWake(boat.x - launch.nX * 2.5, boat.z - launch.nZ * 2.5, 0.6, 0.7, 0.4);
      }
    } else {
      boat.x = launch.f0x; boat.z = launch.f0z;
      boat.vx = launch.nX * 3.5; boat.vz = launch.nZ * 3.5;
      resetPaddlerPose();
      launch = null;
    }
  }

  /* instant unbeach: used by boardIn / reduced-motion — slides the
     hull to floating depth with no animation (hidden under veils) */
  function unbeachInstant() {
    var isl = null, dd = 1e9;
    for (var i = 0; i < islands.length; i++) {
      var dx = boat.x - islands[i].group.position.x;
      var dz = boat.z - islands[i].group.position.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      if (d < dd) { dd = d; isl = islands[i]; }
    }
    if (!isl || dd > ISLAND_R + 4) return;
    var nX = (boat.x - isl.group.position.x) / dd, nZ = (boat.z - isl.group.position.z) / dd;
    for (var rr = dd; rr < ISLAND_R + 8; rr += 0.5) {
      if (islHeightAt(isl, isl.group.position.x + nX * rr, isl.group.position.z + nZ * rr) < -1.0) {
        boat.x = isl.group.position.x + nX * (rr + 0.6);
        boat.z = isl.group.position.z + nZ * (rr + 0.6);
        break;
      }
    }
    boat.vx = 0; boat.vz = 0;
  }

  W.getState = function () {
    return {
      x: boat.x, z: boat.z, speed: boat.speed, paused: paused, throttle: input.throttle,
      mode: dive ? "dive" : board ? "board" : land ? "land" : launch ? "launch" : beached ? "beached" : "sail",
    };
  };
  W.teleport = function (x, z, heading) {
    boat.x = x; boat.z = z;
    if (heading !== undefined) boat.heading = heading;
    boat.vx = 0; boat.vz = 0; boat.speed = 0;
    var fx = Math.sin(boat.heading), fz = Math.cos(boat.heading);
    camPos.set(x - fx * 19, 10.5, z - fz * 19);
    camTarget.set(x + fx * 11, 2.5, z + fz * 11);
    camera.position.copy(camPos);
    trail.length = 0;
    introT = 0;
  };

  /* ============================================================
     5 · sky: gradient dome + glowing sun
     ============================================================ */
  function buildSky() {
    var geo = new THREE.SphereGeometry(560, 24, 14);
    var mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        cTop: { value: new THREE.Color(COL.skyTop) },
        cMid: { value: new THREE.Color(COL.skyMid) },
        cBot: { value: new THREE.Color(COL.horizon) },
        cPink: { value: new THREE.Color(0xffa98c) },
        uSunDir: { value: new THREE.Vector3(-180, 80, -420).normalize() },
      },
      vertexShader: [
        "varying vec3 vDir;",
        "void main(){ vDir = normalize(position);",
        "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      ].join("\n"),
      fragmentShader: [
        "uniform vec3 cTop; uniform vec3 cMid; uniform vec3 cBot; uniform vec3 cPink;",
        "uniform vec3 uSunDir;",
        "varying vec3 vDir;",
        "void main(){",
        "  float y = vDir.y;",
        "  float a = smoothstep(0.03, 0.5, y);",
        "  float b = smoothstep(-0.05, 0.08, y);",
        "  vec3 col = mix(cBot, mix(cMid, cTop, a), b);",
        // pink band hugging the horizon, strongest toward the sun
        "  float sunAmt = pow(clamp(dot(vDir, uSunDir), 0.0, 1.0), 2.0);",
        "  float band = smoothstep(0.30, 0.02, abs(y - 0.07));",
        "  col = mix(col, cPink, band * (0.25 + sunAmt * 0.45));",
        // halo around the sun itself
        "  col += vec3(1.0, 0.85, 0.6) * pow(clamp(dot(vDir, uSunDir), 0.0, 1.0), 24.0) * 0.55;",
        "  gl_FragColor = vec4(col, 1.0);",
        "}",
      ].join("\n"),
    });
    scene.add(new THREE.Mesh(geo, mat));

    // sun: crisp core + big soft additive glow sprite
    var sunPos = new THREE.Vector3(-180, 82, -420);
    var core = new THREE.Mesh(
      new THREE.CircleGeometry(26, 30),
      new THREE.MeshBasicMaterial({ color: 0xfff6d8, fog: false })
    );
    core.position.copy(sunPos);
    core.lookAt(0, 30, 0);
    scene.add(core);

    var glowTex = makeGlowTexture();
    var glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: 0xffc987, blending: THREE.AdditiveBlending,
      transparent: true, opacity: 0.7, fog: false, depthWrite: false,
    }));
    glow.position.copy(sunPos);
    glow.scale.set(160, 160, 1);
    scene.add(glow);
  }

  var _glowTex = null;
  function makeGlowTexture() {
    if (_glowTex) return _glowTex;
    var cv = document.createElement("canvas");
    cv.width = cv.height = 256;
    var ctx = cv.getContext("2d");
    var g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(255, 240, 210, 1)");
    g.addColorStop(0.25, "rgba(255, 210, 140, 0.55)");
    g.addColorStop(0.6, "rgba(255, 170, 90, 0.16)");
    g.addColorStop(1, "rgba(255, 160, 80, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    _glowTex = new THREE.CanvasTexture(cv);
    return _glowTex;
  }

  /* ============================================================
     6 · water: depth gradient + shore foam rings + sparkles
     ============================================================ */
  function buildWater(defs) {
    var seg = tier === "high" ? 120 : tier === "mobile" ? 76 : 48;
    var geo = new THREE.PlaneGeometry(SEA_R * 2.4, SEA_R * 2.4, seg, seg);

    var isl = [];
    for (var i = 0; i < 4; i++) {
      var d = defs[i] || { pos: [9999, 9999] };
      isl.push(new THREE.Vector2(d.pos[0], -d.pos[1]));
    }

    waterUniforms = {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color(COL.seaDeep) },
      uMid: { value: new THREE.Color(COL.seaMid) },
      uLight: { value: new THREE.Color(COL.seaLight) },
      uShore: { value: new THREE.Color(COL.seaShore) },
      uFoam: { value: new THREE.Color(COL.foam) },
      uSun: { value: new THREE.Color(0xffd9a0) },
      uIsl: { value: isl },
      /* v4 hull fix: (boat.x, -boat.z, heading). the fragment shader
         discards water inside a boat-oriented ellipse so waves can
         never surface *inside* the canoe. */
      uBoat: { value: new THREE.Vector3(0, -SPAWN_Z, Math.PI) },
      /* v6: (a², b²) of the discard ellipse. sized to the REAL waterline
         footprint of the sunken hull and stretched dynamically when the
         bow digs in (pitch), so the hole never peeks past the hull. */
      uBoatEll: { value: new THREE.Vector2(3.8, 0.62) },
      fogColor: { value: new THREE.Color(COL.horizon) },
      fogNear: { value: scene.fog.near },
      fogFar: { value: scene.fog.far },
    };

    var mat = new THREE.ShaderMaterial({
      uniforms: waterUniforms,
      vertexShader: [
        "uniform float uTime;",
        "uniform vec2 uIsl[4];",
        "varying float vH;",
        "varying float vShore;",
        "varying float vFoamD;",     // distance beyond the island shore line
        "varying vec2 vWorld;",
        "varying float vFogDepth;",
        "void main() {",
        "  vec3 pos = position;",
        // keep in sync with waveH() in js
        "  float h = sin(pos.x * 0.05 + uTime) * 1.1",
        "          + cos(pos.y * 0.045 + uTime * 0.8) * 0.9",
        "          + sin((pos.x + pos.y) * 0.09 + uTime * 1.4) * 0.45;",
        "  float dmin = 9999.0;",
        "  for (int i = 0; i < 4; i++) { dmin = min(dmin, distance(pos.xy, uIsl[i])); }",
        "  vShore = smoothstep(58.0, 26.0, dmin);",
        "  vFoamD = dmin - " + SHORE_FOAM_R.toFixed(1) + ";",
        // v6.1: san lorenzo is a sheltered bay — the swell dies before
        // the sand (starts past the boat's range, so waveH stays in sync)
        "  float southK = smoothstep(206.0, 224.0, -pos.y);",
        "  float damp = (1.0 - vShore * 0.55) * (1.0 - southK * 0.85);",
        "  pos.z += h * damp;",
        "  vH = h * damp;",
        "  vWorld = vec2(pos.x, pos.y);",
        "  vec4 mv = modelViewMatrix * vec4(pos, 1.0);",
        "  vFogDepth = -mv.z;",
        "  gl_Position = projectionMatrix * mv;",
        "}",
      ].join("\n"),
      fragmentShader: [
        "uniform float uTime;",
        "uniform vec3 uDeep; uniform vec3 uMid; uniform vec3 uLight;",
        "uniform vec3 uShore; uniform vec3 uFoam; uniform vec3 uSun;",
        "uniform vec3 uBoat;",
        "uniform vec2 uBoatEll;",
        "uniform vec3 fogColor; uniform float fogNear; uniform float fogFar;",
        "varying float vH; varying float vShore; varying float vFoamD;",
        "varying vec2 vWorld; varying float vFogDepth;",
        "float hash21(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }",
        "float vnoise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);",
        "  float a = hash21(i); float b = hash21(i+vec2(1.0,0.0));",
        "  float c = hash21(i+vec2(0.0,1.0)); float d = hash21(i+vec2(1.0,1.0));",
        "  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y); }",
        "void main() {",
        // v4 hull fix: carve the hull footprint out of the water
        "  vec2 bd = vWorld - uBoat.xy;",
        "  vec2 bf = vec2(sin(uBoat.z), -cos(uBoat.z));",
        "  float lf = dot(bd, bf);",
        "  float ls = bd.x * bf.y - bd.y * bf.x;",
        "  if ((lf * lf) / uBoatEll.x + (ls * ls) / uBoatEll.y < 1.0) discard;",
        // 3-stop depth gradient with painterly banding.
        // fine noise breaks up the huge low-frequency wave patches
        "  float breakup = (vnoise(vWorld * 0.06 + uTime * 0.03) - 0.5) * 0.9;",
        "  float t = smoothstep(-2.6, 2.6, vH + breakup);",
        "  float tq = mix(t, floor(t * 5.0) / 5.0, 0.2);",   // subtle bands
        "  vec3 col = mix(uDeep, uMid, smoothstep(0.0, 0.55, tq));",
        "  col = mix(col, uLight, smoothstep(0.55, 1.0, tq));",
        // turquoise shallows
        "  col = mix(col, uShore, vShore * 0.85);",
        // wind-waker foam rings around islands (analytic, animated, noisy)
        "  float fn = vnoise(vWorld * 0.32 + uTime * 0.08);",
        "  float ring1 = 1.0 - smoothstep(0.0, 1.5, abs(vFoamD - 1.2 - sin(uTime * 1.25 + fn * 6.283) * 0.9));",
        "  float ring2 = 1.0 - smoothstep(0.0, 1.2, abs(vFoamD - 5.4 - sin(uTime * 0.85 + fn * 6.283 + 2.1) * 1.4));",
        "  float shoreHug = 1.0 - smoothstep(0.0, 1.2, vFoamD);",  // solid lap at the sand
        "  float foamM = max(max(ring1, ring2 * 0.5), shoreHug);",
        "  foamM *= 1.0 - smoothstep(7.0, 9.0, vFoamD);",          // nothing past the band
        "  float dissolve = smoothstep(0.25, 0.6, vnoise(vWorld * 0.9 + uTime * 0.13));",
        "  foamM *= mix(0.45, 1.0, dissolve);",
        "  col = mix(col, uFoam, clamp(foamM, 0.0, 1.0) * 0.75);",
        // whitecap foam on high crests, away from shore — warmed by the sun
        "  col = mix(col, mix(uFoam, uSun, 0.35), smoothstep(1.9, 2.45, vH) * 0.5 * (1.0 - vShore));",
        // sun glitter: ROUND twinkles (radial falloff inside each cell —
        // the old per-cell fill read as square confetti)
        "  vec2 spUv = vWorld * 1.3 + vec2(uTime * 0.35, 0.0);",
        "  vec2 cell = floor(spUv);",
        "  float ch = hash21(cell);",
        "  vec2 cOff = vec2(hash21(cell + 7.1), hash21(cell + 3.7)) * 0.5 + 0.25;",
        "  float dCell = length(fract(spUv) - cOff);",
        "  float dot2 = smoothstep(0.22, 0.02, dCell);",
        "  float tw = pow(max(0.0, sin(uTime * (1.2 + ch * 1.6) + ch * 6.283)), 14.0);",
        "  float sparkle = step(0.82, ch) * tw * dot2 * smoothstep(0.6, 1.8, vH) * (1.0 - vShore);",
        "  sparkle *= 1.0 - smoothstep(55.0, 130.0, vFogDepth);",   // only near the boat
        "  col += uSun * sparkle * 0.85;",
        // fog to the warm horizon
        "  float f = smoothstep(fogNear, fogFar, vFogDepth);",
        "  gl_FragColor = vec4(mix(col, fogColor, f), 1.0);",
        "}",
      ].join("\n"),
    });

    water = new THREE.Mesh(geo, mat);
    water.rotation.x = -Math.PI / 2;
    scene.add(water);
  }

  /* ============================================================
     7 · canoe + paddler (the hero shot)
     ============================================================ */
  function buildCanoe() {
    canoe = new THREE.Group();
    hullGroup = new THREE.Group();
    canoe.add(hullGroup);

    hullGroup.add(buildHull());

    /* gunwale rim: thin dark wooden lip */
    var rimGeo = new THREE.TorusGeometry(1, 0.085, 6, 28);
    tint(rimGeo, COL.woodDark);
    var rim = new THREE.Mesh(rimGeo, propMat());
    rim.rotation.x = Math.PI / 2;
    rim.scale.set(1.1, 3.6, 1);
    rim.position.y = 1.24;
    hullGroup.add(rim);

    /* thwart (seat) + small bow deck */
    var thwart = new THREE.Mesh(tint(new THREE.BoxGeometry(1.7, 0.14, 0.7), COL.woodLight), propMat());
    thwart.position.set(0, 0.95, -0.4);
    hullGroup.add(thwart);
    var deck = new THREE.Mesh(tint(new THREE.BoxGeometry(1.1, 0.1, 1.4), COL.woodLight), propMat());
    deck.position.set(0, 1.1, 2.9);
    deck.rotation.x = -0.09;
    hullGroup.add(deck);

    /* tiny coral pennant on the bow */
    var flagPole = new THREE.Mesh(tint(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 5), COL.woodDark), propMat());
    flagPole.position.set(0, 1.7, 3.4);
    hullGroup.add(flagPole);
    var flagGeo = new THREE.BufferGeometry();
    flagGeo.setAttribute("position", new THREE.Float32BufferAttribute([
      0, 0, 0, 0.85, -0.16, 0, 0, -0.36, 0,
    ], 3));
    flagGeo.setAttribute("normal", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
    tint(flagGeo, COL.coral);
    var flag = new THREE.Mesh(flagGeo, flagMat());
    flag.position.set(0, 2.25, 3.4);
    hullGroup.add(flag);

    buildPaddler();
    buildPaddle();

    scene.add(canoe);

    /* v4: cream waterline lip — hides the seam where the water shader
       carves out the hull footprint. world-space, follows the waves. */
    var lipGeo = new THREE.TorusGeometry(1, 0.11, 5, 26);
    waterLip = new THREE.Mesh(lipGeo, new THREE.MeshBasicMaterial({
      color: COL.foam, transparent: true, opacity: 0.3, depthWrite: false,
    }));
    waterLip.rotation.x = -Math.PI / 2;
    // v6: hugs the true waterline of the sunken hull (a meniscus, not a hoop)
    waterLip.scale.set(0.78, 1.85, 1);
    scene.add(waterLip);
  }

  /* swept hull: stations along z, U-shaped cross section, rising sheer */
  function buildHull() {
    var NS = 11;            // stations along length
    var NC = 9;             // points across the U section
    var L = 7.6;            // length
    var W0 = 1.15;          // half beam
    var D = 1.05;           // depth
    var positions = [], colors = [], indices = [];
    _c1.setHex(COL.coral); _c2.setHex(COL.coralDark);

    for (var s = 0; s <= NS; s++) {
      var zt = s / NS;                       // 0..1 along length
      var z = (zt - 0.5) * L;
      var taper = Math.pow(Math.sin(zt * Math.PI), 0.62);      // pinched ends
      var w = Math.max(0.045, W0 * taper);
      var d = Math.max(0.14, D * Math.pow(Math.sin(zt * Math.PI), 0.8));
      var sheer = Math.pow(Math.abs(zt - 0.5) * 2, 3.2) * 0.72; // ends rise
      if (zt > 0.5) sheer *= 1.12;                              // bow a touch higher

      for (var c = 0; c <= NC; c++) {
        var ct = c / NC;                     // 0..1 across section
        var ang = ct * Math.PI;              // half circle: left rim → keel → right rim
        var x = Math.cos(ang) * w;
        var y = 1.18 + sheer - Math.sin(ang) * d;
        positions.push(x, y, z);
        // color: cream sheer strake near the rim, coral body shading to dark keel
        var keelK = Math.sin(ang);           // 0 rim → 1 keel
        var cc = keelK < 0.42 ? _cCream : _c1.clone().lerp(_c2, (keelK - 0.42) * 1.15);
        colors.push(cc.r, cc.g, cc.b);
      }
    }
    for (var i = 0; i < NS; i++) {
      for (var j = 0; j < NC; j++) {
        var a = i * (NC + 1) + j, b = a + NC + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    /* interior: same sweep, inset, wood with plank stripes */
    var inPositions = [], inColors = [], inIndices = [];
    for (s = 0; s <= NS; s++) {
      var zt2 = s / NS;
      var z2 = (zt2 - 0.5) * L * 0.96;
      var taper2 = Math.pow(Math.sin(zt2 * Math.PI), 0.62);
      var w2 = Math.max(0.03, (W0 - 0.12) * taper2);
      var d2 = Math.max(0.1, (D - 0.14) * Math.pow(Math.sin(zt2 * Math.PI), 0.8));
      var sheer2 = Math.pow(Math.abs(zt2 - 0.5) * 2, 3.2) * 0.72;
      for (c = 0; c <= NC; c++) {
        var ct2 = c / NC;
        var ang2 = ct2 * Math.PI;
        inPositions.push(Math.cos(ang2) * w2, 1.16 + sheer2 - Math.sin(ang2) * d2, z2);
        var plank = (c % 2 === 0) ? 0xd8925e : COL.woodLight;
        _c2.setHex(plank);
        inColors.push(_c2.r, _c2.g, _c2.b);
      }
    }
    for (i = 0; i < NS; i++) {
      for (j = 0; j < NC; j++) {
        a = i * (NC + 1) + j; b = a + NC + 1;
        inIndices.push(a, a + 1, b, b, a + 1, b + 1);   // reversed: visible from inside
      }
    }
    var inGeo = new THREE.BufferGeometry();
    inGeo.setAttribute("position", new THREE.Float32BufferAttribute(inPositions, 3));
    inGeo.setAttribute("color", new THREE.Float32BufferAttribute(inColors, 3));
    inGeo.setIndex(inIndices);
    inGeo.computeVertexNormals();

    var hull = new THREE.Group();
    hull.add(new THREE.Mesh(geo, toonMat(0xffffff, { vc: true, rim: 0.8, key: "hull" })));
    hull.add(new THREE.Mesh(inGeo, propMat()));
    return hull;
  }
  var _cCream = new THREE.Color(COL.cream);

  function buildPaddler() {
    paddler = new THREE.Group();

    /* round torso in a yellow raincoat */
    var body = new THREE.Mesh(tint(new THREE.SphereGeometry(0.72, 14, 12), COL.yellow, 0xffe07a, 1.2, 2.6), toonMat(0xffffff, { vc: true, rim: 0.7, key: "sailor" }));
    body.position.y = 1.75;
    body.scale.set(1, 1.15, 0.92);
    paddler.add(body);

    /* big cartoon head with a canvas-drawn face.
       v4: the face lives on the TRUE front (+z, away from the game
       camera) — jorge is seen from behind, so no floating grin. */
    headMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.62, 18, 14),
      new THREE.MeshToonMaterial({ map: makeFaceTexture(), gradientMap: gradTex() })
    );
    headMesh.position.y = 3.05;
    headMesh.rotation.y = Math.PI;   // face forward, back of the head to camera
    paddler.add(headMesh);

    /* v4: the mullet. short curtain of hair flipping out under the
       beanie at the nape (-z side = camera side). pure geometry so the
       silhouette reads at any distance. */
    var HAIR = 0x4a2a12, HAIR_TIP = 0x6b3f1c;
    var mulletParts = [];
    // nape patch hugging the lower back of the head, under the beanie
    var patch = new THREE.SphereGeometry(0.63, 12, 8, 0, Math.PI, Math.PI * 0.44, Math.PI * 0.34);
    patch.scale(0.94, 1, 1.04);
    tint(patch, HAIR, HAIR_TIP, 2.7, 3.2);
    var pm4 = new THREE.Matrix4().makeRotationY(Math.PI);   // swing patch to the back (-z)
    patch.applyMatrix4(pm4);
    placed(patch, 0, 3.06, 0, 0, 1);
    mulletParts.push(patch);
    // hanging strands with gaps between them; center one longest,
    // tips flick outward — party in the back, but a SHORT party
    var stLen = [0.3, 0.46, 0.58, 0.46, 0.3];
    for (var st = -2; st <= 2; st++) {
      var sl = stLen[st + 2];
      var strand = new THREE.BoxGeometry(0.16, sl, 0.11);
      strand.translate(0, -sl / 2, 0);
      var spos = strand.attributes.position;
      for (var sv3 = 0; sv3 < spos.count; sv3++) {
        var yy = spos.getY(sv3);
        var flick = Math.pow(Math.max(0, -yy / sl), 2.4) * 0.16;
        spos.setZ(sv3, spos.getZ(sv3) - flick);
      }
      tint(strand, HAIR, HAIR_TIP, -sl, 0);
      placed(strand, st * 0.2, 2.86, -0.46 + Math.abs(st) * 0.05, st * 0.14, 1);
      mulletParts.push(strand);
    }
    var mullet = new THREE.Mesh(mergeGeos(mulletParts), toonMat(0xffffff, { vc: true, rim: 0.5, key: "hair" }));
    paddler.add(mullet);

    /* blue beanie + coral pompom */
    var beanie = new THREE.Mesh(tint(new THREE.SphereGeometry(0.64, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), COL.blue), propMat());
    beanie.position.y = 3.22;
    paddler.add(beanie);
    var brim = new THREE.Mesh(tint(new THREE.TorusGeometry(0.55, 0.09, 6, 14), 0x2038b0), propMat());
    brim.rotation.x = Math.PI / 2;
    brim.position.y = 3.22;
    paddler.add(brim);
    var pom = new THREE.Mesh(tint(new THREE.IcosahedronGeometry(0.17, 1), COL.coral), propMat());
    pom.position.y = 3.85;
    paddler.add(pom);

    /* noodle arms: cylinders pivoted at the shoulders, solved to the paddle */
    armL = makeArm(-0.62);
    armR = makeArm(0.62);
    paddler.add(armL.group);
    paddler.add(armR.group);

    /* v5: little legs — navy fisherman trousers + ink wellies. hip-pivoted
       groups; in normal play they're folded forward inside the hull
       (invisible), and they only unfold when he stands, dives or climbs. */
    legL = makeLeg(-0.28);
    legR = makeLeg(0.28);
    paddler.add(legL.group);
    paddler.add(legR.group);

    /* v5: scuba goggles — a PERMANENT prop. they live on the forehead
       (above the beanie brim, subtle from the game camera) and get pulled
       down over the eyes for every dive. two coral-rimmed lenses + strap. */
    goggles = new THREE.Group();
    var gParts = [];
    for (var gl = -1; gl <= 1; gl += 2) {
      var ring = new THREE.TorusGeometry(0.155, 0.045, 6, 12);
      tint(ring, COL.coral);
      placed(ring, gl * 0.19, 0, 0, 0, 1);
      gParts.push(ring);
      var lens = new THREE.CircleGeometry(0.13, 10);
      tint(lens, 0xbfe3ea);
      placed(lens, gl * 0.19, 0, 0.01, 0, 1);
      gParts.push(lens);
    }
    var bridge = new THREE.BoxGeometry(0.1, 0.05, 0.05);
    tint(bridge, COL.coral);
    placed(bridge, 0, 0, 0, 0, 1);
    gParts.push(bridge);
    goggles.add(new THREE.Mesh(mergeGeos(gParts), propMat()));
    // strap: thin ink band hugging the head
    var strap = new THREE.Mesh(tint(new THREE.TorusGeometry(0.6, 0.035, 5, 16), COL.ink), propMat());
    strap.rotation.x = Math.PI / 2 - 0.28;
    strap.position.z = -0.12;
    goggles.add(strap);
    setGoggles(0);   // parked on the forehead
    paddler.add(goggles);

    paddler.position.z = -0.4;
    hullGroup.add(paddler);
  }

  function makeLeg(xSide) {
    var g = new THREE.Group();
    g.position.set(xSide, 1.18, 0.3);          // hip, at the seat edge
    var len = 0.85;
    var geo = new THREE.CylinderGeometry(0.15, 0.13, len, 7);
    geo.translate(0, -len / 2, 0);             // pivot at the hip
    tint(geo, 0x2340b8, 0x2f4dd0, -len, 0);    // navy trousers
    var mesh = new THREE.Mesh(geo, propMat());
    g.add(mesh);
    var boot = new THREE.Mesh(tint(new THREE.SphereGeometry(0.17, 8, 6), COL.ink), propMat());
    boot.scale.set(1, 0.75, 1.5);
    boot.position.set(0, -len, 0.08);
    g.add(boot);
    g.rotation.x = LEG_FOLD;                   // folded forward inside the hull
    return { group: g, len: len };
  }
  var LEG_FOLD = -1.15;  // kneeling: shins tucked back under the seat, out of shot

  /* goggles pose: k=0 forehead, k=1 over the eyes (face is at +z) */
  function setGoggles(k) {
    goggles.position.set(0, 3.42 - 0.4 * k, 0.34 + 0.26 * k);
    goggles.rotation.x = -0.5 + 0.5 * k;
  }

  function makeArm(xSide) {
    var g = new THREE.Group();
    g.position.set(xSide, 2.35, 0);
    var len = 1.0;
    // cream sleeves so the arms read against the yellow raincoat
    var geo = new THREE.CylinderGeometry(0.16, 0.13, len, 7);
    geo.translate(0, -len / 2, 0);          // pivot at the shoulder
    tint(geo, COL.cream);
    var mesh = new THREE.Mesh(geo, propMat());
    g.add(mesh);
    var mitt = new THREE.Mesh(tint(new THREE.SphereGeometry(0.17, 8, 6), COL.skin), propMat());
    mitt.position.y = -len;
    g.add(mitt);
    return { group: g, mesh: mesh, mitt: mitt, len: len };
  }

  function makeFaceTexture() {
    var cv = document.createElement("canvas");
    cv.width = 512; cv.height = 256;
    var ctx = cv.getContext("2d");
    ctx.fillStyle = "#e8b17e";                       // skin
    ctx.fillRect(0, 0, 512, 256);
    // the face lives around u=0.75 region; we rotate the head to face +z
    var cx = 384, cy = 120;
    ctx.fillStyle = "#14120f";
    // happy closed eyes: two arcs
    ctx.lineWidth = 7; ctx.strokeStyle = "#14120f"; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(cx - 38, cy, 14, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 38, cy, 14, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    // wide grin
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(cx, cy + 18, 26, Math.PI * 0.12, Math.PI * 0.88); ctx.stroke();
    // rosy cheeks
    ctx.fillStyle = "rgba(255, 90, 60, 0.4)";
    ctx.beginPath(); ctx.arc(cx - 58, cy + 22, 13, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 58, cy + 22, 13, 0, 7); ctx.fill();
    var tex = new THREE.CanvasTexture(cv);
    return tex;
  }

  function buildPaddle() {
    paddle = new THREE.Group();
    var shaft = new THREE.Mesh(tint(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 6), COL.wood), propMat());
    paddle.add(shaft);
    var bladeGeo = new THREE.SphereGeometry(0.5, 10, 8);
    bladeGeo.scale(0.16, 1.25, 0.62);
    var b1 = new THREE.Mesh(tint(bladeGeo.clone(), 0x5e3417, COL.woodDark, -0.6, 0.6), propMat());
    b1.position.y = -1.95;
    paddle.add(b1);
    var b2 = new THREE.Mesh(tint(bladeGeo, 0x5e3417, COL.woodDark, -0.6, 0.6), propMat());
    b2.position.y = 1.95;
    paddle.add(b2);
    paddle.position.set(0, 2.2, -0.2);
    paddle.rotation.z = Math.PI / 2.4;
    hullGroup.add(paddle);
  }

  /* solve the noodle arms to grip the paddle shaft — every frame */
  var _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _down = new THREE.Vector3(0, -1, 0);
  function solveArms() {
    solveArm(armL, -0.72);
    solveArm(armR, 0.72);
  }
  function solveArm(arm, gripY) {
    // grip point in world space → paddler space
    _v1.set(0, gripY, 0);
    paddle.localToWorld(_v1);
    arm.group.parent.worldToLocal(_v1);
    _v2.copy(_v1).sub(arm.group.position);
    var d = Math.max(0.35, _v2.length());
    arm.group.quaternion.setFromUnitVectors(_down, _v2.normalize());
    arm.mesh.scale.y = d / arm.len;
    arm.mitt.position.y = -d;
  }

  /* ============================================================
     8 · wake: particle pool + fading ribbon
     ============================================================ */
  function buildWake() {
    var n = tier === "low" ? 20 : tier === "mobile" ? 32 : 48;
    var geo = new THREE.PlaneGeometry(1.4, 1.4);
    var splashTex = makeGlowTexture();
    for (var i = 0; i < n; i++) {
      var mat = new THREE.MeshBasicMaterial({
        color: COL.foam, map: splashTex, transparent: true, opacity: 0, depthWrite: false,
      });
      var m = new THREE.Mesh(geo, mat);
      m.rotation.x = -Math.PI / 2;
      m.visible = false;
      m.userData = { life: 0, max: 1.4, s0: 1 };
      scene.add(m);
      wakePool.push(m);
    }
  }

  function spawnWake(x, z, scale, life, op) {
    var m = wakePool[wakeIdx];
    wakeIdx = (wakeIdx + 1) % wakePool.length;
    m.position.set(x, 0.25, z);
    m.rotation.z = Math.random() * Math.PI;
    m.userData.life = life;
    m.userData.max = life;
    m.userData.s0 = scale;
    m.userData.op = op;
    m.visible = true;
  }

  function stepWake(dt, t) {
    for (var i = 0; i < wakePool.length; i++) {
      var m = wakePool[i];
      if (!m.visible) continue;
      m.userData.life -= dt;
      if (m.userData.life <= 0) { m.visible = false; continue; }
      var k = 1 - m.userData.life / m.userData.max;
      var s = m.userData.s0 * (0.6 + k * 2.6);
      m.scale.set(s, s, 1);
      m.material.opacity = m.userData.op * (1 - k) * (1 - k);
      m.position.y = 0.25 + waveH(m.position.x, m.position.z, t) * 0.7;
    }
  }

  /* ribbon: a triangle strip that trails the canoe and melts away */
  var RIBBON_N = 36;          // trail points
  var RIBBON_LIFE = 3.0;      // seconds a point survives
  function buildRibbon() {
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array(RIBBON_N * 2 * 3);
    var alp = new Float32Array(RIBBON_N * 2);
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(alp, 1).setUsage(THREE.DynamicDrawUsage));
    var idx = [];
    for (var i = 0; i < RIBBON_N - 1; i++) {
      var a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    geo.setIndex(idx);
    var mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uColor: { value: new THREE.Color(COL.foam) } },
      vertexShader: [
        "attribute float aAlpha; varying float vA;",
        "void main(){ vA = aAlpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      ].join("\n"),
      fragmentShader: [
        "uniform vec3 uColor; varying float vA;",
        "void main(){ gl_FragColor = vec4(uColor, vA); }",
      ].join("\n"),
    });
    ribbon = new THREE.Mesh(geo, mat);
    ribbon.frustumCulled = false;
    scene.add(ribbon);
  }

  var lastTrailX = 0, lastTrailZ = 0;
  function stepRibbon(t) {
    // add a point when we've moved enough and are actually moving
    var dx = boat.x - lastTrailX, dz = boat.z - lastTrailZ;
    if (boat.speed > 2.5 && dx * dx + dz * dz > 0.8) {
      lastTrailX = boat.x; lastTrailZ = boat.z;
      trail.push({ x: boat.x - Math.sin(boat.heading) * 3.4, z: boat.z - Math.cos(boat.heading) * 3.4, h: boat.heading, t: t, k: Math.min(1, boat.speed / MAX_SPEED + 0.35) });
      if (trail.length > RIBBON_N) trail.shift();
    }
    // drop dead points
    while (trail.length && t - trail[0].t > RIBBON_LIFE) trail.shift();

    var pos = ribbon.geometry.attributes.position;
    var alp = ribbon.geometry.attributes.aAlpha;
    var n = trail.length;
    for (var i = 0; i < RIBBON_N; i++) {
      var p = i < n ? trail[i] : null;
      if (!p) {
        // collapse unused verts onto the last live point (degenerate, invisible)
        var last = n > 0 ? trail[n - 1] : { x: boat.x, z: boat.z, h: boat.heading, t: t, k: 0 };
        pos.setXYZ(i * 2, last.x, 0.2, last.z);
        pos.setXYZ(i * 2 + 1, last.x, 0.2, last.z);
        alp.setX(i * 2, 0); alp.setX(i * 2 + 1, 0);
        continue;
      }
      var age = (t - p.t) / RIBBON_LIFE;                  // 0 → 1
      var width = 0.45 + age * 2.4 + Math.sin(age * 7 + p.x) * 0.25 * age;
      var rx = Math.cos(p.h), rz = -Math.sin(p.h);
      var y = 0.22 + waveH(p.x, p.z, t) * 0.75;
      pos.setXYZ(i * 2, p.x + rx * width, y, p.z + rz * width);
      pos.setXYZ(i * 2 + 1, p.x - rx * width, y, p.z - rz * width);
      var a = (1 - age) * (1 - age) * 0.28 * p.k;
      alp.setX(i * 2, a); alp.setX(i * 2 + 1, a);
    }
    pos.needsUpdate = true;
    alp.needsUpdate = true;
  }

  /* ============================================================
     9 · terrain system: polar heightfields with color ramps
     ============================================================ */
  /* buildTerrain(heightFn, colorFn) → mesh
     heightFn(r01, x, z) — local coords, returns height
     colorFn(h, slope, x, z, out) — writes THREE.Color into out */
  function buildTerrain(heightFn, colorFn, flat) {
    var NR = tier === "low" ? 14 : 22;      // rings
    var NS = tier === "low" ? 24 : 40;      // segments around
    var positions = [], indices = [];

    // center vertex
    positions.push(0, heightFn(0, 0, 0), 0);
    // rings 1..NR
    for (var r = 1; r <= NR; r++) {
      var rr = (r / NR) * ISLAND_R;
      for (var s = 0; s < NS; s++) {
        var a = (s / NS) * Math.PI * 2;
        var x = Math.cos(a) * rr, z = Math.sin(a) * rr;
        positions.push(x, heightFn(r / NR, x, z), z);
      }
    }
    // skirt ring: same xz as ring NR, dropped underwater
    var skirtStart = 1 + (NR - 1) * NS;
    for (s = 0; s < NS; s++) {
      var a2 = (s / NS) * Math.PI * 2;
      positions.push(Math.cos(a2) * (ISLAND_R + 1.5), -4.5, Math.sin(a2) * (ISLAND_R + 1.5));
    }

    // fan around center
    for (s = 0; s < NS; s++) {
      indices.push(0, 1 + ((s + 1) % NS), 1 + s);
    }
    // quads between rings
    for (r = 0; r < NR - 1; r++) {
      var ra = 1 + r * NS, rb = 1 + (r + 1) * NS;
      for (s = 0; s < NS; s++) {
        var s1 = (s + 1) % NS;
        indices.push(ra + s, rb + s1, rb + s);
        indices.push(ra + s, ra + s1, rb + s1);
      }
    }
    // skirt quads
    var rs = 1 + NR * NS;
    for (s = 0; s < NS; s++) {
      var s2 = (s + 1) % NS;
      indices.push(skirtStart + s, rs + s2, rs + s);
      indices.push(skirtStart + s, skirtStart + s2, rs + s2);
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    // color pass (needs normals for slope)
    var pos = geo.attributes.position, nor = geo.attributes.normal;
    var colors = new Float32Array(pos.count * 3);
    var out = new THREE.Color();
    for (var i = 0; i < pos.count; i++) {
      var h = pos.getY(i);
      var slope = 1 - nor.getY(i);
      colorFn(h, slope, pos.getX(i), pos.getZ(i), out);
      colors[i * 3] = out.r; colors[i * 3 + 1] = out.g; colors[i * 3 + 2] = out.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    var mat = flat
      ? toonMat(0xffffff, { vc: true, rim: 0.9, flat: true, key: "terrainFlat" })
      : terrainMat();
    return new THREE.Mesh(geo, mat);
  }

  /* v6 · beachify — every island gets a continuous landing ring:
     a gentle slope that starts UNDER the water (no floating edges),
     a nearly flat sand band ~5 units wide, then the island's own
     terrain takes over. any point of the ring is a berth. */
  function beachify(hFn) {
    return function (r01, x, z) {
      var rr = r01 * ISLAND_R;
      var beachH = -2.8 +
        3.55 * smoothstep(30.5, 25.5, rr) +   // underwater slope up to the sand
        0.6 * smoothstep(25.5, 20, rr);       // near-flat sand band
      var w = smoothstep(19, 24.5, rr);       // 1 = pure beach, 0 = pure island
      return lerp(hFn(r01, x, z), beachH, w);
    };
  }

  function gauss(x, z, cx, cz, sigma) {
    var dx = x - cx, dz = z - cz;
    return Math.exp(-(dx * dx + dz * dz) / (2 * sigma * sigma));
  }
  function edgeMask(r01) { return smoothstep(1.02, 0.62, r01); }

  /* generic sandy ramp color fn factory */
  function rampFn(ramp, wetHex, slopeDarken) {
    var wet = new THREE.Color(wetHex);
    return function (h, slope, x, z, out) {
      rampColor(ramp, h, out);
      // wet band right at the waterline
      var wetK = 1 - smoothstep(0.35, 1.4, h);
      out.lerp(wet, wetK * 0.85);
      // steep faces darken (fake AO / crevices)
      out.multiplyScalar(1 - Math.min(0.32, slope * slopeDarken));
      // gentle noise mottling so big surfaces don't look airbrushed
      var m = 0.94 + fbm2(x * 0.35 + 7.7, z * 0.35, 2) * 0.12;
      out.multiplyScalar(m);
    };
  }

  /* ============================================================
     10 · vegetation + prop library (all merged / instanced)
     ============================================================ */

  /* blob tree: noisy canopy + trunk. returns merged geometry */
  function treeGeo(x, z, y, scale, canopyHex, canopyTopHex, trunkH) {
    trunkH = trunkH || 2.2;
    var parts = [];
    var trunk = new THREE.CylinderGeometry(0.22 * scale, 0.34 * scale, trunkH * scale, 6);
    tint(trunk, COL.woodDark);
    parts.push(placed(trunk, x, y + trunkH * scale * 0.5, z, 0, 1));

    var canopy = new THREE.IcosahedronGeometry(1.5 * scale, 1);
    var cp = canopy.attributes.position;
    for (var i = 0; i < cp.count; i++) {
      var px = cp.getX(i), py = cp.getY(i), pz = cp.getZ(i);
      var n = 0.78 + fbm2(px * 0.9 + x, pz * 0.9 + z, 2) * 0.5;
      cp.setXYZ(i, px * n, py * n * 0.88, pz * n);
    }
    canopy.computeVertexNormals();
    tint(canopy, canopyHex, canopyTopHex, -1.2 * scale, 1.3 * scale);
    parts.push(placed(canopy, x, y + (trunkH + 1.1) * scale, z, hash2(x, z) * 6, 1));
    return mergeGeos(parts);
  }

  /* a grass tuft: three crossed blades (bend in the wind shader) */
  function bladeGeo(hexLow, hexHigh) {
    hexLow = hexLow === undefined ? 0x2f9e55 : hexLow;
    hexHigh = hexHigh === undefined ? 0x8fe39a : hexHigh;
    var parts = [];
    for (var i = 0; i < 3; i++) {
      var g = new THREE.PlaneGeometry(0.26, 1.1 + i * 0.18, 1, 2);
      g.translate(0, (1.1 + i * 0.18) / 2, 0);
      tint(g, hexLow, hexHigh, 0, 1.3);
      parts.push(placed(g, (hash2(i, 4) - 0.5) * 0.3, 0, (hash2(i, 9) - 0.5) * 0.3, i * 1.05, 1));
    }
    return mergeGeos(parts);
  }

  /* pebbles scattered around an island's beach ring */
  function addShorePebbles(g, heightFn, hexLow, hexHigh, seed) {
    var pts = scatterOn(heightFn, tier === "low" ? 6 : 12, 0.6, 0.95, 0.6, 2.2, seed + 31);
    if (!pts.length) return;
    var geo = new THREE.DodecahedronGeometry(0.55, 0);
    geo.scale(1, 0.7, 1);
    tint(geo, hexLow, hexHigh, -0.4, 0.5);
    instancedOn(g, geo, pts, 0.6, 1.8, toonMat(0xffffff, { vc: true, flat: true, key: "pebble" }), seed + 7);
  }

  /* walk outward along a direction until the terrain dips underwater */
  function findShoreR(heightFn, angle) {
    for (var r = 10; r < ISLAND_R + 2; r += 0.75) {
      var x = Math.cos(angle) * r, z = Math.sin(angle) * r;
      if (heightFn(r / ISLAND_R, x, z) < 1.2) return r;
    }
    return ISLAND_R;
  }

  /* scatter instanced things on an island using its own heightFn */
  function scatterOn(heightFn, count, rMin, rMax, hMin, hMax, seed) {
    var pts = [], guard = 0;
    while (pts.length < count && guard < count * 14) {
      guard++;
      var u = hash2(seed + guard * 1.31, seed * 0.7 + guard);
      var v = hash2(guard * 2.17, seed + guard * 0.53);
      var a = u * Math.PI * 2;
      var rr = (rMin + (rMax - rMin) * Math.sqrt(v)) * ISLAND_R;
      var x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      var h = heightFn(rr / ISLAND_R, x, z);
      if (h < hMin || h > hMax) continue;
      // reject steep spots (finite difference)
      var e = 0.9;
      var sx = Math.abs(heightFn(rr / ISLAND_R, x + e, z) - h) / e;
      var sz = Math.abs(heightFn(rr / ISLAND_R, x, z + e) - h) / e;
      if (sx > 0.75 || sz > 0.75) continue;
      pts.push({ x: x, y: h, z: z });
    }
    return pts;
  }

  function instancedOn(group, geoOne, pts, sMin, sMax, mat, seed) {
    if (!pts.length) return null;
    var inst = new THREE.InstancedMesh(geoOne, mat || windMat(), pts.length);
    var m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    for (var i = 0; i < pts.length; i++) {
      var s = sMin + hash2(seed + i, i * 3.7) * (sMax - sMin);
      e.set(0, hash2(i, seed) * Math.PI * 2, 0);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(pts[i].x, pts[i].y - 0.12, pts[i].z), q, new THREE.Vector3(s, s, s));
      inst.setMatrixAt(i, m);
    }
    inst.instanceMatrix.needsUpdate = true;
    group.add(inst);
    return inst;
  }

  /* bunting: a sagging string of triangle flags between two points */
  function buntingGeo(p1, p2, nFlags, palette) {
    var parts = [];
    for (var i = 0; i < nFlags; i++) {
      var k = (i + 0.5) / nFlags;
      var x = lerp(p1.x, p2.x, k);
      var z = lerp(p1.z, p2.z, k);
      var y = lerp(p1.y, p2.y, k) - Math.sin(k * Math.PI) * 1.1;   // sag
      var g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute([
        -0.6, 0, 0, 0.6, 0, 0, 0, -1.15, 0,
      ], 3));
      g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
      tint(g, palette[i % palette.length]);
      var ry = Math.atan2(p2.x - p1.x, p2.z - p1.z) + Math.PI / 2;
      parts.push(placed(g, x, y, z, ry, 1));
    }
    return mergeGeos(parts);
  }

  function buntingString(p1, p2) {
    var pts = [];
    for (var i = 0; i <= 12; i++) {
      var k = i / 12;
      pts.push(new THREE.Vector3(
        lerp(p1.x, p2.x, k),
        lerp(p1.y, p2.y, k) - Math.sin(k * Math.PI) * 1.1,
        lerp(p1.z, p2.z, k)
      ));
    }
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    return new THREE.Line(geo, new THREE.LineBasicMaterial({ color: COL.ink }));
  }

  /* little wooden dock reaching into the water */
  function dockGeo(angle, startR, length) {
    var parts = [];
    var dirX = Math.cos(angle), dirZ = Math.sin(angle);
    var perpX = -dirZ, perpZ = dirX;
    var nP = Math.round(length / 1.35);
    for (var i = 0; i < nP; i++) {
      var r = startR + i * 1.35;
      var px = dirX * r, pz = dirZ * r;
      var plank = new THREE.BoxGeometry(3.4, 0.22, 1.18);
      tint(plank, i % 2 ? COL.woodDark : COL.wood);
      var ry = -angle + (hash2(i, angle) - 0.5) * 0.06;
      parts.push(placed(plank, px, 1.55, pz, ry + Math.PI / 2, 1));
      if (i % 2 === 0) {
        for (var sSign = -1; sSign <= 1; sSign += 2) {
          var post = new THREE.CylinderGeometry(0.17, 0.21, 3.4, 5);
          tint(post, COL.woodDark);
          parts.push(placed(post, px + perpX * 1.4 * sSign, 0.15, pz + perpZ * 1.4 * sSign, 0, 1));
        }
      }
    }
    // mooring bollard at the water end, leaning a little
    var er = startR + (nP - 1) * 1.35 + 0.8;
    var moor = new THREE.CylinderGeometry(0.24, 0.28, 2.4, 6);
    tint(moor, COL.woodDark);
    var mgeo = placed(moor, dirX * er + perpX * 1.2, 1.7, dirZ * er + perpZ * 1.2, 0, 1);
    mgeo.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.12));
    parts.push(mgeo);
    return mergeGeos(parts);
  }

  /* lantern: dark post + warm cube + additive glow sprite */
  function addLantern(group, x, y, z) {
    var parts = [];
    var post = new THREE.CylinderGeometry(0.09, 0.12, 2.6, 5);
    tint(post, COL.ink);
    parts.push(placed(post, x, y + 1.3, z, 0, 1));
    var box = new THREE.BoxGeometry(0.5, 0.62, 0.5);
    tint(box, COL.ink);
    parts.push(placed(box, x, y + 2.75, z, 0.5, 1));
    group.add(new THREE.Mesh(mergeGeos(parts), propMat()));

    var bulb = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.4, 0.34),
      new THREE.MeshBasicMaterial({ color: 0xffe9a8 })
    );
    bulb.position.set(x, y + 2.75, z);
    bulb.rotation.y = 0.5;
    group.add(bulb);

    var glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(), color: 0xffc36a, blending: THREE.AdditiveBlending,
      transparent: true, opacity: 0.55, depthWrite: false,
    }));
    glow.position.set(x, y + 2.75, z);
    glow.scale.set(4.2, 4.2, 1);
    group.add(glow);
  }

  /* ============================================================
     11 · islands — each one its own little world
     ============================================================ */
  function buildIslands(defs) {
    defs.forEach(function (def) {
      var g = new THREE.Group();
      g.position.set(def.pos[0], 0, def.pos[1]);

      var isl = { def: def, group: g, dockR: 46, keepR: 30, props: {} };
      themeIsland(isl);

      var board = makeTextBoard(def.name, COL.cream);
      board.position.y = isl.props.boardY || 26;
      g.add(board);
      isl.props.nameBoard = board;

      islands.push(isl);
      scene.add(g);
    });
  }

  function themeIsland(isl) {
    var g = isl.group, id = isl.def.id;
    var seed = isl.def.pos[0] * 0.13 + isl.def.pos[1] * 0.07;

    if (id === "capullos") {
      /* -- the garden: two soft green mounds, blooming buds, drifting petals -- */
      var hFn = beachify(function (r01, x, z) {
        var e = edgeMask(r01);
        var h = 1.6 +
          gauss(x, z, -6, -4, 10.5) * 11.5 +
          gauss(x, z, 9, 7, 7.5) * 7 +
          fbm2(x * 0.12 + seed, z * 0.12, 3) * 2.6;
        return h * e - (1 - e) * 3.5;
      });
      var ramp = [
        [0.4, COL.sand], [1.8, 0xe9d296], [3.4, 0x74cc82],
        [6.5, COL.green], [10.5, COL.greenDark],
      ];
      g.add(buildTerrain(hFn, rampFn(ramp, COL.sandWet, 0.9)));
      isl.props.heightFn = hFn;

      /* blooming buds (kept from v2, restyled: smooth petals, thicker stems) */
      isl.props.buds = [];
      for (var i = 0; i < 7; i++) {
        var a = (i / 7) * Math.PI * 2 + 0.4;
        var r = 11 + (i % 3) * 5;
        var bx = Math.cos(a) * r, bz = Math.sin(a) * r;
        var by = hFn(r / ISLAND_R, bx, bz);
        if (by < 1.5) by = 1.5;
        var bud = new THREE.Group();
        bud.position.set(bx, by - 0.3, bz);
        var hgt = 3.6 + (i % 4) * 1.5;
        var stem = new THREE.Mesh(tint(new THREE.CylinderGeometry(0.24, 0.42, hgt, 6), COL.greenDark, COL.green, 0, hgt), propMat());
        stem.position.y = hgt / 2;
        bud.add(stem);
        /* head: core + 5 petals merged into ONE mesh; blooming is animated
           by scaling the head (x/z out, y down) — cheap and reads perfectly */
        var headG = new THREE.Group();
        headG.position.y = hgt;
        var headParts = [];
        var core = tint(new THREE.IcosahedronGeometry(0.85, 1), COL.yellow);
        placed(core, 0, 0.8, 0, 0, 1);
        headParts.push(core);
        for (var p = 0; p < 5; p++) {
          var petal = new THREE.SphereGeometry(0.62, 8, 6);
          petal.scale(0.72, 1.65, 0.34);
          petal.translate(0, 1.15, 0);
          petal.applyMatrix4(new THREE.Matrix4().makeRotationX(0.35));   // baked outward tilt
          petal.applyMatrix4(new THREE.Matrix4().makeRotationY((p / 5) * Math.PI * 2));
          tint(petal, COL.coral, 0xff8a6a, 0.2, 2.6);
          headParts.push(petal);
        }
        headG.add(new THREE.Mesh(mergeGeos(headParts), propMat()));
        bud.add(headG);
        g.add(bud);
        isl.props.buds.push({ head: headG, open: 0, phase: i });
      }

      /* trees + grass + flowers */
      var trees = [];
      var treeSpots = scatterOn(hFn, 4, 0.25, 0.62, 3.5, 9, seed + 3);
      treeSpots.forEach(function (pt, ti) {
        trees.push(treeGeo(pt.x, pt.z, pt.y - 0.3, 0.9 + hash2(ti, seed) * 0.5, COL.green, COL.greenLight));
      });
      if (trees.length) g.add(new THREE.Mesh(mergeGeos(trees), propMat()));

      if (tier !== "low") {
        var grassPts = scatterOn(hFn, tier === "high" ? 170 : 80, 0.1, 0.8, 2.4, 10, seed + 9);
        instancedOn(g, bladeGeo(), grassPts, 0.9, 1.6, windMat(), seed);
        var flowerPts = scatterOn(hFn, tier === "high" ? 26 : 12, 0.15, 0.7, 2.4, 9, seed + 17);
        var fGeo = new THREE.SphereGeometry(0.3, 7, 6);
        fGeo.translate(0, 1.0, 0);
        tint(fGeo, COL.yellow);
        var fStem = new THREE.PlaneGeometry(0.09, 1.0, 1, 2);
        fStem.translate(0, 0.5, 0);
        tint(fStem, COL.greenDark);
        instancedOn(g, mergeGeos([fStem, fGeo]), flowerPts, 0.8, 1.3, windMat(), seed + 5);
      }

      /* dock as set dressing (v6: you land on the sand now) — swung
         off the spawn approach lane so a beaching canoe never parks
         inside its planks */
      var dockA = Math.atan2(SPAWN_Z - isl.def.pos[1], 0 - isl.def.pos[0]) + 1.05;
      var shoreR = findShoreR(hFn, dockA) - 2.5;
      g.add(new THREE.Mesh(dockGeo(dockA, shoreR, 14), propMat()));
      addLantern(g, Math.cos(dockA) * (shoreR + 13), 1.35, Math.sin(dockA) * (shoreR + 13));

      addShorePebbles(g, hFn, 0x9a9284, 0xcfc7b6, seed);

      /* v4 memorable moment: golden-hour fireflies drifting between the
         buds. one Points draw call, animated in the tick. */
      if (tier !== "low") {
        var FN = tier === "high" ? 42 : 24;
        var fpos = new Float32Array(FN * 3);
        var fmeta = [];
        for (var fi = 0; fi < FN; fi++) {
          var fa = hash2(fi, 1.7) * Math.PI * 2;
          var fr = 4 + hash2(fi, 3.1) * 16;
          fmeta.push({
            r: fr, a: fa,
            h: 2.5 + hash2(fi, 5.3) * 7,
            sp: 0.08 + hash2(fi, 7.7) * 0.22,
            ph: hash2(fi, 9.1) * 6.28,
          });
        }
        var fgeo = new THREE.BufferGeometry();
        fgeo.setAttribute("position", new THREE.BufferAttribute(fpos, 3).setUsage(THREE.DynamicDrawUsage));
        var fmat = new THREE.PointsMaterial({
          color: 0xfff3a0, size: 0.85, transparent: true, opacity: 0.9,
          blending: THREE.AdditiveBlending, depthWrite: false,
          map: makeGlowTexture(), sizeAttenuation: true,
        });
        var ffly = new THREE.Points(fgeo, fmat);
        ffly.frustumCulled = false;
        g.add(ffly);
        isl.props.fireflies = { points: ffly, meta: fmeta };
      }

      /* drifting petals in the air */
      if (tier === "high") {
        var petalGeoAir = new THREE.PlaneGeometry(0.7, 1.1);
        for (var pp = 0; pp < 10; pp++) {
          var pm = new THREE.Mesh(petalGeoAir, new THREE.MeshBasicMaterial({
            color: pp % 2 ? COL.coral : COL.yellow, transparent: true, opacity: 0.85, side: THREE.DoubleSide,
          }));
          pm.userData = { r: 14 + Math.random() * 14, h: 6 + Math.random() * 12, sp: 0.15 + Math.random() * 0.2, ph: Math.random() * 6.28, home: g.position };
          scene.add(pm);
          petals.push(pm);
        }
      }
      isl.props.boardY = 26;

    } else if (id === "liga-u-strategy") {
      /* -- v7: league night. construction is OVER — the island IS a
         full basketball court: flat pad carved into the terraced
         ochre plateau, parquet with painted lines, two hoops with
         wind-shader nets, wooden bleachers, a scoreboard, corner
         floodlights, and the bunting stays (game night now, not
         scaffolding). the giant hoop in the sea keeps being the
         landmark you read from spawn. -- */
      var hFn2 = beachify(function (r01, x, z) {
        var e = edgeMask(r01);
        var rr2 = r01 * ISLAND_R;
        var raw = 1.4 + gauss(x, z, 0, 0, 15.5) * 8.5 + fbm2(x * 0.14 + seed, z * 0.14, 2) * 0.8;
        var terraced = Math.floor(raw / 2.4) * 2.4;
        var h = lerp(raw, terraced + 0.9, 0.78) * e - (1 - e) * 3.5;
        /* the court pad: dead flat, wide enough for a FULL court */
        return lerp(h, 4.9, smoothstep(20.5, 16.5, rr2));
      });
      var ramp2 = [
        [0.4, COL.sand], [2.4, 0xdcb56e], [4.6, 0xd99a35],
        [7.8, 0xf0b83c], [11, 0xffcf58],
      ];
      g.add(buildTerrain(hFn2, rampFn(ramp2, COL.sandWet, 1.1), true));
      isl.props.heightFn = hFn2;

      var courtY = 4.9 + 0.34;
      var CL = 24.6, CW = 13.2;          // FULL court: length x width
      var courtG = new THREE.Group();
      /* broadside to the main approach: sailing in from spawn you
         read the whole court, hoop to hoop */
      var hpA = Math.atan2(0 - isl.def.pos[0], SPAWN_Z - isl.def.pos[1]);
      courtG.rotation.y = hpA;
      g.add(courtG);

      var cp = [];   // court carpentry, merged into ONE mesh
      var deckG = new THREE.BoxGeometry(CL + 3.2, 0.9, CW + 1.8);
      tint(deckG, COL.woodDark, COL.wood, -0.5, 0.5);
      placed(deckG, 0, courtY - 0.47, 0, 0, 1);
      cp.push(deckG);

      /* parquet + painted lines (one 512px canvas) */
      var courtTop = new THREE.Mesh(
        new THREE.PlaneGeometry(CL, CW),
        new THREE.MeshBasicMaterial({ map: makeCourtTexture() })
      );
      courtTop.rotation.x = -Math.PI / 2;
      courtTop.position.set(0, courtY + 0.02, 0);
      courtG.add(courtTop);

      /* two hoops, one per end, boards facing center court */
      var netParts = [];
      for (var hs = -1; hs <= 1; hs += 2) {
        var hx0 = hs * (CL / 2 + 0.9);
        var pole2 = new THREE.CylinderGeometry(0.17, 0.24, 5.0, 6);
        tint(pole2, COL.ink, 0x2c2825, -2.5, 2.5);
        placed(pole2, hx0, courtY + 2.3, 0, 0, 1);
        cp.push(pole2);
        var arm2 = new THREE.BoxGeometry(1.4, 0.15, 0.15);
        tint(arm2, COL.ink);
        placed(arm2, hx0 - hs * 0.65, courtY + 4.55, 0, 0, 1);
        cp.push(arm2);
        var board2 = new THREE.BoxGeometry(0.16, 2.1, 3.1);
        tint(board2, COL.cream, 0xfffdf6, -1, 1);
        placed(board2, hx0 - hs * 1.3, courtY + 4.6, 0, 0, 1);
        cp.push(board2);
        var sq2 = new THREE.BoxGeometry(0.2, 0.85, 1.15);
        tint(sq2, COL.ink);
        placed(sq2, hx0 - hs * 1.3, courtY + 4.25, 0, 0, 1);
        cp.push(sq2);
        var rim2 = new THREE.TorusGeometry(0.66, 0.1, 6, 14);
        rim2.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));
        tint(rim2, COL.coral);
        placed(rim2, hx0 - hs * 2.05, courtY + 4.0, 0, 0, 1);
        cp.push(rim2);
        var netG2 = new THREE.CylinderGeometry(0.62, 0.36, 1.05, 8, 2, true);
        netG2.translate(0, -0.55, 0);
        tint(netG2, 0xfffdf6, COL.cream, -1.1, 0);
        placed(netG2, hx0 - hs * 2.05, courtY + 4.0, 0, 0, 1);
        netParts.push(netG2);
      }
      courtG.add(new THREE.Mesh(mergeGeos(netParts), toonMat(0xffffff, { vc: true, wind: true, ds: true, key: "hoopnet" })));

      /* wooden bleachers on the far side (they back the tv shot) */
      for (var br2 = 0; br2 < 3; br2++) {
        var benchY = courtY + 0.55 + br2 * 0.78;
        var benchZ = -(CW / 2 + 2.4 + br2 * 1.35);
        var bench = new THREE.BoxGeometry(15, 0.32, 1.25);
        tint(bench, br2 % 2 ? COL.wood : COL.woodLight);
        placed(bench, 0, benchY, benchZ, 0, 1);
        cp.push(bench);
        for (var bl = -1; bl <= 1; bl++) {
          var legH = benchY - 0.14 - (courtY - 0.45);
          var legB = new THREE.BoxGeometry(0.28, legH, 0.95);
          tint(legB, COL.woodDark);
          placed(legB, bl * 6.8, benchY - 0.14 - legH / 2, benchZ, 0, 1);
          cp.push(legB);
        }
      }

      /* scoreboard beside the bleachers */
      var sbX = -10.5, sbZ = -(CW / 2 + 3.6);
      var sbPost = new THREE.CylinderGeometry(0.16, 0.22, 6.6, 6);
      tint(sbPost, COL.ink);
      placed(sbPost, sbX, courtY + 2.5, sbZ, 0, 1);
      cp.push(sbPost);
      var sbFrame = new THREE.BoxGeometry(4.9, 2.9, 0.4);
      tint(sbFrame, COL.ink);
      placed(sbFrame, sbX, courtY + 6.0, sbZ, 0, 1);
      cp.push(sbFrame);
      var sbFace = new THREE.Mesh(
        new THREE.PlaneGeometry(4.5, 2.5),
        new THREE.MeshBasicMaterial({ map: makeScoreTexture() })
      );
      sbFace.position.set(sbX, courtY + 6.0, sbZ + 0.22);
      courtG.add(sbFace);

      /* floodlights at the four corners — it's league night */
      var lampHeads = [];
      for (var fl = 0; fl < 4; fl++) {
        var flx = (fl % 2 ? 1 : -1) * (CL / 2 + 2.6);
        var flz = (fl < 2 ? 1 : -1) * (CW / 2 + 2.6);
        var flPost = new THREE.CylinderGeometry(0.13, 0.2, 9.4, 6);
        tint(flPost, COL.ink, 0x2c2825, -4.7, 4.7);
        placed(flPost, flx, courtY + 3.7, flz, 0, 1);
        cp.push(flPost);
        var headL = new THREE.BoxGeometry(1.0, 0.55, 0.7);
        tint(headL, 0xffe9a8);
        placed(headL, flx - (fl % 2 ? 1 : -1) * 0.4, courtY + 8.35, flz - (fl < 2 ? 1 : -1) * 0.3, 0, 1);
        lampHeads.push(headL);
        var glowF = new THREE.Sprite(new THREE.SpriteMaterial({
          map: makeGlowTexture(), color: 0xffc36a, blending: THREE.AdditiveBlending,
          transparent: true, opacity: 0.5, depthWrite: false,
        }));
        glowF.position.set(flx, courtY + 8.4, flz);
        glowF.scale.set(6, 6, 1);
        courtG.add(glowF);
      }
      courtG.add(new THREE.Mesh(mergeGeos(lampHeads), new THREE.MeshBasicMaterial({ vertexColors: true })));

      /* the friendly ball waits at center court */
      var ballG = new THREE.SphereGeometry(0.85, 12, 10);
      tint(ballG, 0xe86a28, 0xf08a48, -0.9, 0.9);
      placed(ballG, 2.6, courtY + 0.85, 1.4, 0, 1);
      cp.push(ballG);
      var seam1 = new THREE.TorusGeometry(0.86, 0.045, 5, 18);
      tint(seam1, COL.ink);
      placed(seam1, 2.6, courtY + 0.85, 1.4, 0.6, 1);
      cp.push(seam1);
      var seam2 = new THREE.TorusGeometry(0.86, 0.045, 5, 18);
      tint(seam2, COL.ink);
      seam2.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));
      placed(seam2, 2.6, courtY + 0.85, 1.4, 0, 1);
      cp.push(seam2);
      courtG.add(new THREE.Mesh(mergeGeos(cp), propMat()));

      /* bunting strung floodlight-to-floodlight down both sidelines */
      var buntY = courtY + 7.9;
      var bunt1 = buntingGeo({ x: -(CL / 2 + 2.6), y: buntY, z: CW / 2 + 2.6 }, { x: CL / 2 + 2.6, y: buntY, z: CW / 2 + 2.6 }, 11, [COL.yellow, COL.coral, COL.cream, COL.blue]);
      var bunt2 = buntingGeo({ x: -(CL / 2 + 2.6), y: buntY, z: -(CW / 2 + 2.6) }, { x: CL / 2 + 2.6, y: buntY, z: -(CW / 2 + 2.6) }, 11, [COL.blue, COL.cream, COL.coral, COL.yellow]);
      courtG.add(new THREE.Mesh(mergeGeos([bunt1, bunt2]), flagMat()));
      courtG.add(buntingString(new THREE.Vector3(-(CL / 2 + 2.6), buntY, CW / 2 + 2.6), new THREE.Vector3(CL / 2 + 2.6, buntY, CW / 2 + 2.6)));
      courtG.add(buntingString(new THREE.Vector3(-(CL / 2 + 2.6), buntY, -(CW / 2 + 2.6)), new THREE.Vector3(CL / 2 + 2.6, buntY, -(CW / 2 + 2.6))));

      /* THE floating hoop — standing in the sea on the approach lane,
         big enough to read from spawn. coral rim, cream board, net in
         the wind shader. this is the "a league lives here" sign. */
      var hoopG = new THREE.Group();
      var hpR = 36;
      hoopG.position.set(Math.sin(hpA) * hpR, 0, Math.cos(hpA) * hpR);
      hoopG.rotation.y = hpA;   // board faces the incoming canoe
      g.add(hoopG);
      var hoopParts = [];
      var poleG = new THREE.CylinderGeometry(0.3, 0.42, 14.5, 7);
      tint(poleG, COL.ink, 0x2c2825, 0, 12);
      placed(poleG, 0, 5.2, -0.6, 0, 1);
      hoopParts.push(poleG);
      // cross brace
      var braceG = new THREE.CylinderGeometry(0.14, 0.14, 2.4, 5);
      tint(braceG, COL.ink);
      var brM = new THREE.Matrix4().makeRotationX(0.9);
      braceG.applyMatrix4(brM);
      placed(braceG, 0, 10.6, 0.2, 0, 1);
      hoopParts.push(braceG);
      var boardG = new THREE.BoxGeometry(5.6, 3.7, 0.28);
      tint(boardG, COL.cream, 0xfffdf6, 9, 14);
      placed(boardG, 0, 11.6, 0.55, 0, 1);
      hoopParts.push(boardG);
      // ink target square on the board
      var sqG = new THREE.BoxGeometry(2.0, 1.5, 0.32);
      tint(sqG, COL.ink);
      placed(sqG, 0, 11.1, 0.57, 0, 1);
      hoopParts.push(sqG);
      hoopG.add(new THREE.Mesh(mergeGeos(hoopParts), propMat()));
      var rimT = new THREE.Mesh(tint(new THREE.TorusGeometry(1.15, 0.13, 6, 18), COL.coral), propMat());
      rimT.rotation.x = Math.PI / 2;
      rimT.position.set(0, 10.15, 1.9);
      hoopG.add(rimT);
      var netG = new THREE.CylinderGeometry(1.1, 0.6, 1.9, 9, 2, true);
      netG.translate(0, -0.95, 0);
      tint(netG, 0xfffdf6, COL.cream, 7, 10.5);
      var net = new THREE.Mesh(netG, toonMat(0xffffff, { vc: true, wind: true, ds: true, key: "hoopnet" }));
      net.position.set(0, 10.15, 1.9);
      hoopG.add(net);
      // the canoe shouldn't sail through the pole
      rocks.push({ x: isl.def.pos[0] + Math.sin(hpA) * hpR, z: isl.def.pos[1] + Math.cos(hpA) * hpR, r: 2.6 });

      /* dry ochre tufts + shore pebbles so the beach isn't bald —
         v7: scattered OFF the court pad (rMin past the deck) */
      if (tier !== "low") {
        var tuftPts = scatterOn(hFn2, tier === "high" ? 46 : 20, 0.64, 0.85, 2.2, 7, seed + 21);
        instancedOn(g, bladeGeo(0xb98a2e, 0xf0cf6a), tuftPts, 0.7, 1.3, windMat(), seed + 2);
      }
      addShorePebbles(g, hFn2, 0xa89264, 0xd9c491, seed);

      /* striped lane buoys bobbing around the island (kept from the
         works era — they mark the swim lanes on league night) */
      for (var wb = 0; wb < 4; wb++) {
        var ba = wb * 1.57 + 0.8;
        var bParts = [];
        var bb = tint(new THREE.CylinderGeometry(0.9, 1.1, 1.6, 8), COL.coral);
        placed(bb, 0, 0.9, 0, 0, 1);
        bParts.push(bb);
        var bt = tint(new THREE.CylinderGeometry(0.7, 0.9, 1.0, 8), COL.cream);
        placed(bt, 0, 2.1, 0, 0, 1);
        bParts.push(bt);
        var buoy = new THREE.Mesh(mergeGeos(bParts), propMat());
        var bx2 = isl.def.pos[0] + Math.cos(ba) * 36;
        var bz2 = isl.def.pos[1] + Math.sin(ba) * 36;
        buoy.position.set(bx2, 0, bz2);
        scene.add(buoy);
        buoys.push({ obj: buoy, x: bx2, z: bz2, amp: 0.9 });
      }
      isl.props.boardY = 23;

    } else if (id === "talens-pantone") {
      /* -- the gallery: grayscale mesa. only the pantone chips carry color. -- */
      var hFn3 = beachify(function (r01, x, z) {
        var e = edgeMask(r01);
        var raw = 1.5 + gauss(x, z, 0, -1, 11) * 9.5 + fbm2(x * 0.18 + seed, z * 0.18, 3) * 2.2;
        var strata = Math.floor(raw / 2.4) * 2.4;
        var h = lerp(raw, strata + 0.9, 0.6);
        return h * e - (1 - e) * 3.5;
      });
      /* cool greys, strongly overcorrected: the warm hemi/sun light was
         washing v3's greys into beige — push them darker + bluer so the
         island actually reads "black & white photo" against the chips */
      var ramp3 = [
        [0.4, 0x878ca6], [2.0, 0x6d7290], [4.0, 0x545974],
        [6.5, 0x3f435a], [10, 0x2b2e40],
      ];
      var terr3 = buildTerrain(hFn3, rampFn(ramp3, 0x555a72, 1.2), true);
      // own material: barely-there rim so the warm sun can't cook the
      // greys into beige — this island must stay a black & white photo
      terr3.material = toonMat(0xffffff, { vc: true, rim: 0.15, flat: true, key: "terrainGrey" });
      g.add(terr3);
      isl.props.heightFn = hFn3;

      /* grey cypress trees — a gallery garden with no color */
      var cyp = [];
      var cypSpots = scatterOn(hFn3, 5, 0.35, 0.72, 2.2, 6.5, seed + 4);
      cypSpots.forEach(function (pt, ci2) {
        var ch2 = 5.5 + hash2(ci2, 1) * 2.2;
        var cone = new THREE.ConeGeometry(1.15, ch2, 7);
        tint(cone, 0x44444b, 0x6e6e76, 0, ch2 * 0.9);
        cyp.push(placed(cone, pt.x, pt.y + ch2 / 2 + 0.7, pt.z, 0, 1));
        var tr = new THREE.CylinderGeometry(0.16, 0.2, 1.4, 5);
        tint(tr, 0x35353b);
        cyp.push(placed(tr, pt.x, pt.y + 0.5, pt.z, 0, 1));
      });
      if (cyp.length) g.add(new THREE.Mesh(mergeGeos(cyp), propMat()));

      /* the pantone chips on easels — the only color on the island */
      var chipCols = [COL.blue, 0xff7a1a, COL.yellow];
      isl.props.chips = [];
      for (var c3 = 0; c3 < 3; c3++) {
        var chip = new THREE.Group();
        var slabParts = [];
        var slab = new THREE.BoxGeometry(6.4, 6.6, 0.7);
        tint(slab, chipCols[c3]);
        slabParts.push(placed(slab, 0, 5.9, 0, 0, 1));
        var band = new THREE.BoxGeometry(6.4, 2.5, 0.74);
        tint(band, 0xfffdf6);
        slabParts.push(placed(band, 0, 1.35, 0, 0, 1));
        // easel legs
        for (var lg = -1; lg <= 1; lg += 2) {
          var leg = new THREE.CylinderGeometry(0.15, 0.18, 8.4, 5);
          tint(leg, 0x55504a);
          var lgeo = placed(leg, lg * 2.6, 3.4, -0.9, 0, 1);
          lgeo.applyMatrix4(new THREE.Matrix4().makeRotationX(0.18));
          slabParts.push(lgeo);
        }
        chip.add(new THREE.Mesh(mergeGeos(slabParts), propMat()));
        var ca = -0.85 + c3 * 0.85;
        var chx = Math.sin(ca) * 6.5, chz = Math.cos(ca) * 6.5 - 1;
        var chy = hFn3(Math.sqrt(chx * chx + chz * chz) / ISLAND_R, chx, chz);
        chip.position.set(chx, Math.max(chy, 1) - 0.7, chz);
        chip.rotation.y = -ca + (c3 - 1) * 0.12;
        g.add(chip);
        isl.props.chips.push(chip);
      }

      addShorePebbles(g, hFn3, 0x77777d, 0xacacb2, seed);

      /* v4 memorable moment: "the color orbit" — a tilted ring of paint
         chips circling the grey mesa like day/013's daydream planet.
         the only color in the sky, orbiting an island that refuses it. */
      var orbitParts = [];
      var orbitCols = [COL.blue, 0xff7a1a, COL.yellow, COL.coral, COL.green, 0x9c5bd9];
      var N_ORBIT = 26;
      for (var ob = 0; ob < N_ORBIT; ob++) {
        var oa = (ob / N_ORBIT) * Math.PI * 2;
        var orr = 15 + hash2(ob, 2) * 0.9;
        var chipG = new THREE.BoxGeometry(1.05 + hash2(ob, 5) * 0.45, 1.4 + hash2(ob, 8) * 0.55, 0.1);
        tint(chipG, orbitCols[ob % orbitCols.length]);
        placed(chipG, Math.cos(oa) * orr, (hash2(ob, 3) - 0.5) * 1.0, Math.sin(oa) * orr, -oa + (hash2(ob, 7) - 0.5) * 0.5, 1);
        orbitParts.push(chipG);
      }
      var orbit = new THREE.Mesh(mergeGeos(orbitParts), new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
      orbit.position.y = 15.5;
      orbit.rotation.z = 0.16;   // tilted, like a planet ring
      g.add(orbit);
      isl.props.orbit = orbit;

      /* the empty gallery frame on the summit: it frames the golden sea.
         color is art, not a barrier — walk up and the horizon IS the art */
      var GOLD = 0xa9741f, GOLD_LIT = 0xe3b95e;
      var frParts = [];
      var FW = 12, FH = 13, FT = 1.15;   // frame outer w/h, bar thickness
      var frBars = [
        [0, FH / 2 - FT / 2, FW, FT],    // top
        [0, -FH / 2 + FT / 2, FW, FT],   // bottom
        [-FW / 2 + FT / 2, 0, FT, FH],   // left
        [FW / 2 - FT / 2, 0, FT, FH],    // right
      ];
      frBars.forEach(function (b) {
        var bar = new THREE.BoxGeometry(b[2], b[3], 0.9);
        tint(bar, GOLD, GOLD_LIT, b[1] - 1, b[1] + 3);
        placed(bar, b[0], b[1], 0, 0, 1);
        frParts.push(bar);
      });
      // little plinth feet
      for (var ff = -1; ff <= 1; ff += 2) {
        var foot = new THREE.BoxGeometry(1.4, 1.2, 1.6);
        tint(foot, 0x55504a);
        placed(foot, ff * (FW / 2 - FT / 2), -FH / 2 - 0.5, 0, 0, 1);
        frParts.push(foot);
      }
      var frame = new THREE.Mesh(mergeGeos(frParts), toonMat(0xffffff, { vc: true, rim: 1.1, key: "goldframe" }));
      var frTopY = hFn3(2 / ISLAND_R, 0, -2);
      frame.position.set(0, Math.max(frTopY, 8) + FH / 2 + 0.9, -2);
      // face the open water toward spawn so you meet it head-on when sailing in
      frame.rotation.y = Math.atan2(0 - isl.def.pos[0], SPAWN_Z - isl.def.pos[1]);
      g.add(frame);

      /* paint splats on the grey ground — color leaking back in */
      var splatCols = [COL.blue, 0xff7a1a, COL.yellow];
      for (var sp2 = 0; sp2 < 3; sp2++) {
        var splatGeo = new THREE.CircleGeometry(2.0 + sp2 * 0.5, 9);
        var spp = splatGeo.attributes.position;
        for (var sv = 1; sv < spp.count; sv++) {
          var k2 = 0.75 + hash2(sv, sp2) * 0.55;
          spp.setXY(sv, spp.getX(sv) * k2, spp.getY(sv) * k2);
        }
        var splat = new THREE.Mesh(splatGeo, new THREE.MeshBasicMaterial({ color: splatCols[sp2] }));
        splat.rotation.x = -Math.PI / 2;
        var sa2 = sp2 * 2.1 + 0.6;
        var spx = Math.cos(sa2) * 19, spz = Math.sin(sa2) * 19;
        var spy = hFn3(19 / ISLAND_R, spx, spz);
        splat.position.set(spx, Math.max(spy, 0.6) + 0.12, spz);
        g.add(splat);
      }
      isl.props.boardY = 26;

    } else if (id === "ministerie") {
      /* -- the watchtower: jagged dark crag, obsidian spire, the eye -- */
      var hFn4 = beachify(function (r01, x, z) {
        var e = edgeMask(r01);
        var ridge = Math.abs(fbm2(x * 0.15 + seed, z * 0.15, 3) - 0.5) * 2;
        var h = 1.6 + (1 - ridge) * 5.5 + gauss(x, z, 0, 0, 8) * 8.5 +
                fbm2(x * 0.3, z * 0.3 + seed, 2) * 1.8;
        return h * e - (1 - e) * 3.5;
      });
      var ramp4 = [
        [0.4, 0x4a4463], [2.0, 0x3a3554], [4.5, 0x2d2946],
        [8, 0x221f38], [12, 0x18152a],
      ];
      g.add(buildTerrain(hFn4, rampFn(ramp4, 0x3f3a58, 0.7), true));
      isl.props.heightFn = hFn4;

      /* obsidian spire: lathe with a gentle concave curve */
      var profile = [];
      var spireH = 17;
      for (var pv2 = 0; pv2 <= 8; pv2++) {
        var kk = pv2 / 8;
        var rad = 7.2 * Math.pow(1 - kk, 1.45) + 0.55;
        profile.push(new THREE.Vector2(rad, kk * spireH));
      }
      var spireGeo = new THREE.LatheGeometry(profile, 9);
      tint(spireGeo, 0x1d1a28, 0x322e44, 0, spireH);
      var spire = new THREE.Mesh(spireGeo, toonMat(0xffffff, { vc: true, rim: 1.2, flat: true, key: "spire" }));
      spire.position.y = 9;
      g.add(spire);

      /* glowing red window slits on the spire */
      for (var wnd = 0; wnd < 3; wnd++) {
        var wgeo = new THREE.PlaneGeometry(0.6, 1.6);
        var wm = new THREE.Mesh(wgeo, new THREE.MeshBasicMaterial({ color: 0xff3a24 }));
        var wa = 0.8 + wnd * 1.9;
        var wr = 7.2 * Math.pow(1 - (0.35 + wnd * 0.14), 1.45) + 0.72;
        wm.position.set(Math.cos(wa) * wr, 9 + (0.35 + wnd * 0.14) * spireH, Math.sin(wa) * wr);
        wm.lookAt(Math.cos(wa) * 30, wm.position.y, Math.sin(wa) * 30);
        g.add(wm);
      }

      /* thorny rocks around the base */
      var thorns = [];
      for (var r2 = 0; r2 < 6; r2++) {
        var rk = new THREE.ConeGeometry(1.6 + hash2(r2, 3) * 1.4, 4 + hash2(r2, 7) * 4, 5);
        tint(rk, 0x232033, 0x3c3752, 0, 6);
        var ra = r2 * 1.05 + 0.4;
        var rx2 = Math.cos(ra) * (12 + hash2(r2, 1) * 5), rz2 = Math.sin(ra) * (12 + hash2(r2, 1) * 5);
        var rry = hFn4(Math.sqrt(rx2 * rx2 + rz2 * rz2) / ISLAND_R, rx2, rz2);
        var rgeo = placed(rk, rx2, Math.max(rry, 1) + 1.2, rz2, hash2(r2, 9) * 3, 1);
        rgeo.applyMatrix4(new THREE.Matrix4().makeRotationZ((hash2(r2, 11) - 0.5) * 0.35));
        thorns.push(rgeo);
      }
      g.add(new THREE.Mesh(mergeGeos(thorns), toonMat(0xffffff, { vc: true, rim: 0.8, flat: true, key: "thorn" })));

      addShorePebbles(g, hFn4, 0x2b2740, 0x4d4766, seed);

      /* the all-seeing eye — v4: it now floats inside "the surveillance
         monolith", a slowly counter-rotating faceted cage with a red
         neon energy coil (p5aholic day/028's dark crystal + neon,
         translated to toon). they are watching. */
      var eyeGroup = new THREE.Group();
      eyeGroup.position.set(0, 30.5, 0);
      var eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(3.0, 14, 12), new THREE.MeshBasicMaterial({ color: 0xfffdf6 }));
      eyeGroup.add(eyeWhite);
      var iris = new THREE.Mesh(new THREE.SphereGeometry(1.55, 12, 10), new THREE.MeshBasicMaterial({ color: 0x2b47d9 }));
      iris.position.z = 1.75;
      eyeGroup.add(iris);
      var pupil = new THREE.Mesh(new THREE.SphereGeometry(0.85, 10, 8), new THREE.MeshBasicMaterial({ color: 0x14120f }));
      pupil.position.z = 2.35;
      eyeGroup.add(pupil);
      g.add(eyeGroup);
      isl.props.eyeGroup = eyeGroup;
      isl.props.pupil = pupil;

      /* faceted wireframe cage around the eye */
      var cageGeo = new THREE.EdgesGeometry(new THREE.OctahedronGeometry(6.6, 1));
      var cage = new THREE.LineSegments(cageGeo, new THREE.LineBasicMaterial({
        color: 0x6d6488, transparent: true, opacity: 0.85,
      }));
      cage.position.y = 30.5;
      g.add(cage);
      isl.props.cage = cage;

      /* red neon energy coil pulsing inside the cage */
      var coil = new THREE.Mesh(
        new THREE.TorusKnotGeometry(4.3, 0.1, 72, 5, 2, 3),
        new THREE.MeshBasicMaterial({ color: 0xff3a24, transparent: true, opacity: 0.85 })
      );
      coil.position.y = 30.5;
      g.add(coil);
      isl.props.coil = coil;

      /* dim red halo behind the whole thing */
      var halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: makeGlowTexture(), color: 0xff3a24, blending: THREE.AdditiveBlending,
        transparent: true, opacity: 0.22, depthWrite: false,
      }));
      halo.position.y = 30.5;
      halo.scale.set(26, 26, 1);
      g.add(halo);

      /* sweeping searchlight cone */
      var beamGeo = new THREE.ConeGeometry(9, 30, 16, 1, true);
      var beamMat = new THREE.MeshBasicMaterial({
        color: 0xfff2c0, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false,
      });
      var beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(0, 30.5, 0);
      beam.geometry.translate(0, -15, 0);
      g.add(beam);
      searchlight = { beam: beam, isl: isl };

      /* blinking red beacon */
      var bpole = new THREE.Mesh(tint(new THREE.CylinderGeometry(0.18, 0.18, 5, 5), 0x1d1a28), propMat());
      bpole.position.set(9, 6.5, -7);
      g.add(bpole);
      var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.75, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2a1a }));
      lamp.position.set(9, 9.4, -7);
      g.add(lamp);
      beacon = lamp;
      isl.props.boardY = 41;
    }
  }

  /* v7: FULL-court parquet + painted lines, one 512px canvas.
     u runs along the court length (x), v across the width (z). */
  var _courtTex = null;
  function makeCourtTexture() {
    if (_courtTex) return _courtTex;
    var cv = document.createElement("canvas");
    cv.width = 512; cv.height = 288;
    var ctx = cv.getContext("2d");
    // parquet planks (running the length of the court)
    for (var p = 0; p < 12; p++) {
      ctx.fillStyle = p % 2 ? "#c57e4e" : "#b56f40";
      ctx.fillRect(0, p * 24, 512, 24);
    }
    ctx.strokeStyle = "rgba(20,18,15,0.16)";
    ctx.lineWidth = 2;
    for (p = 0; p <= 12; p++) {
      ctx.beginPath(); ctx.moveTo(0, p * 24); ctx.lineTo(512, p * 24); ctx.stroke();
    }
    // coral painted keys first (lines go on top)
    ctx.fillStyle = "rgba(255, 90, 60, 0.55)";
    ctx.fillRect(14, 144 - 38, 96, 76);
    ctx.fillRect(512 - 14 - 96, 144 - 38, 96, 76);
    // painted lines — cream
    ctx.strokeStyle = "#f6eedd";
    ctx.lineWidth = 5;
    ctx.strokeRect(14, 14, 484, 260);                        // boundary
    ctx.beginPath(); ctx.moveTo(256, 14); ctx.lineTo(256, 274); ctx.stroke();   // half-court line
    ctx.beginPath(); ctx.arc(256, 144, 42, 0, Math.PI * 2); ctx.stroke();       // center circle
    // keys + free-throw circles
    ctx.strokeRect(14, 144 - 38, 96, 76);
    ctx.strokeRect(512 - 14 - 96, 144 - 38, 96, 76);
    ctx.beginPath(); ctx.arc(110, 144, 38, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(402, 144, 38, Math.PI / 2, Math.PI * 1.5); ctx.stroke();
    // 3pt arcs (centered on each rim)
    ctx.beginPath(); ctx.arc(40, 144, 118, -Math.PI * 0.44, Math.PI * 0.44); ctx.stroke();
    ctx.beginPath(); ctx.arc(472, 144, 118, Math.PI * 0.56, Math.PI * 1.44); ctx.stroke();
    // center circle coral fill
    ctx.fillStyle = "rgba(255, 90, 60, 0.35)";
    ctx.beginPath(); ctx.arc(256, 144, 40, 0, Math.PI * 2); ctx.fill();
    _courtTex = new THREE.CanvasTexture(cv);
    return _courtTex;
  }

  /* v7: the scoreboard face — dark board, cream league name, coral
     score. one small canvas, drawn once. */
  var _scoreTex = null;
  function makeScoreTexture() {
    if (_scoreTex) return _scoreTex;
    var cv = document.createElement("canvas");
    cv.width = 256; cv.height = 144;
    var ctx = cv.getContext("2d");
    ctx.fillStyle = "#14120f";
    ctx.fillRect(0, 0, 256, 144);
    ctx.strokeStyle = "#f6eedd";
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, 244, 132);
    ctx.textAlign = "center";
    ctx.fillStyle = "#f6eedd";
    ctx.font = "700 30px 'Space Mono', monospace";
    ctx.fillText("liga u", 128, 44);
    ctx.fillStyle = "#ff5a3c";
    ctx.font = "700 44px 'Space Mono', monospace";
    ctx.fillText("22 – 21", 128, 96);
    ctx.fillStyle = "#ffd23f";
    ctx.font = "700 17px 'Space Mono', monospace";
    ctx.fillText("4th quarter", 128, 126);
    _scoreTex = new THREE.CanvasTexture(cv);
    return _scoreTex;
  }

  /* ---------- text boards ---------- */
  function makeTextBoard(text, bgColor) {
    var cv = document.createElement("canvas");
    cv.width = 512; cv.height = 80;      // procedural texture budget: ≤512px
    var ctx = cv.getContext("2d");
    ctx.font = "700 31px 'Space Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    var tw = Math.min(ctx.measureText(text.toLowerCase()).width, 460);
    var bx = 256 - tw / 2 - 18, bw = tw + 36;
    ctx.fillStyle = "#" + new THREE.Color(bgColor).getHexString();
    roundRect(ctx, bx, 7, bw, 66, 15);
    ctx.fill();
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = "#14120f";
    roundRect(ctx, bx, 7, bw, 66, 15);
    ctx.stroke();
    ctx.fillStyle = "#14120f";
    ctx.fillText(text.toLowerCase(), 256, 42, 460);
    var tex = new THREE.CanvasTexture(cv);
    var mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
    return new THREE.Mesh(new THREE.PlaneGeometry(19, 3), mat);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* ============================================================
     welcome buoy
     ============================================================ */
  var welcomeBoard;
  function buildWelcome() {
    welcomeBoard = makeTextBoard("hi, i'm jorge. go find my work →", COL.yellow);
    welcomeBoard.position.set(0, 7, BUOY_Z);
    scene.add(welcomeBoard);

    var buoy = new THREE.Group();
    var body = new THREE.Mesh(tint(new THREE.CylinderGeometry(1.2, 1.6, 2.6, 9), COL.coral, COL.coralDark, 0, 2.6), propMat());
    body.position.y = 1.4;
    buoy.add(body);
    var stripe = new THREE.Mesh(tint(new THREE.CylinderGeometry(1.32, 1.42, 0.5, 9), COL.cream), propMat());
    stripe.position.y = 1.6;
    buoy.add(stripe);
    var top = new THREE.Mesh(tint(new THREE.ConeGeometry(1.0, 1.4, 9), COL.coral), propMat());
    top.position.y = 3.3;
    buoy.add(top);
    buoy.position.set(0, 0, BUOY_Z);
    scene.add(buoy);
    buoys.push({ obj: buoy, x: 0, z: BUOY_Z, amp: 0.8 });
    // v6: the welcome buoy is solid — you bounce off it like off a rock
    rocks.push({ x: 0, z: BUOY_Z, r: 2.4 });
  }

  /* ============================================================
     v6 · the edges are a conversation, not a wall.
     three wooden sign-buoys mark the N/E/W limits. reaching one
     makes the captain pitch the fifth island and surfaces a mailto
     chip (handled in the hud). the south edge belongs to gijón and
     gets homesickness instead of marketing. buoys are SOLID.
     ============================================================ */
  var EDGE_BUOYS = [
    { x: 0, z: -(BOUND_R - 4), a: Math.PI },        // north
    { x: BOUND_R - 4, z: 0, a: -Math.PI / 2 },      // east
    { x: -(BOUND_R - 4), z: 0, a: Math.PI / 2 },    // west
  ];
  function buildEdgeBuoys() {
    var signTex = null;
    EDGE_BUOYS.forEach(function (eb) {
      var parts = [];
      var base = tint(new THREE.CylinderGeometry(1.1, 1.5, 2.2, 9), COL.coral, COL.coralDark, 0, 2.2);
      placed(base, 0, 1.1, 0, 0, 1);
      parts.push(base);
      var stripe = tint(new THREE.CylinderGeometry(1.22, 1.3, 0.5, 9), COL.cream);
      placed(stripe, 0, 1.35, 0, 0, 1);
      parts.push(stripe);
      var post = tint(new THREE.CylinderGeometry(0.16, 0.2, 5.4, 6), COL.woodDark);
      placed(post, 0, 4.2, 0, 0, 1);
      parts.push(post);
      // two planks, slightly askew — hand-nailed at sea
      var pl1 = tint(new THREE.BoxGeometry(3.6, 0.8, 0.18), COL.wood, COL.woodLight, 5, 6.6);
      placed(pl1, 0.2, 6.1, 0, 0, 1);
      pl1.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.06));
      parts.push(pl1);
      var pl2 = tint(new THREE.BoxGeometry(3.2, 0.75, 0.18), COL.wood, COL.woodLight, 4, 5.6);
      placed(pl2, -0.15, 5.15, 0, 0, 1);
      pl2.applyMatrix4(new THREE.Matrix4().makeRotationZ(-0.05));
      parts.push(pl2);
      var buoy = new THREE.Mesh(mergeGeos(parts), propMat());
      buoy.position.set(eb.x, 0, eb.z);
      // face the map center exactly (+z normal toward 0,0)
      var va = Math.atan2(-eb.x, -eb.z);
      buoy.rotation.y = va;
      scene.add(buoy);
      buoys.push({ obj: buoy, x: eb.x, z: eb.z, amp: 0.85 });
      rocks.push({ x: eb.x, z: eb.z, r: 2.2 });   // solid, like everything now
      // the sign reads from the water: one shared texture, billboarded not —
      // fixed, facing the map center like the planks
      var board = makeTextBoard("island #5 — plot for sale", COL.yellow);
      board.scale.setScalar(0.55);
      board.position.set(eb.x + Math.sin(va) * 0.4, 8.1, eb.z + Math.cos(va) * 0.4);
      board.rotation.y = va;                // text face toward the map
      scene.add(board);
      // little coral pennant up top
      var flag = new THREE.Mesh(tint(new THREE.ConeGeometry(0.34, 0.9, 4), COL.coral), propMat());
      flag.rotation.z = -Math.PI / 2;
      flag.position.set(eb.x, 7.1, eb.z);
      flag.rotation.y = eb.a;
      buoy.add(flag);
      flag.position.set(0.5, 7.1, 0);
    });
  }

  /* ============================================================
     v6 · gijón — home, in real color, closing the whole south.
     three merged meshes by depth (front / city / far+hills):
     · the sea ENDS at the beach: a continuous landmass (low green
       and ochre hills + a deep ground slab) seals the horizon from
       side to side — no water between or behind buildings, ever.
     · real color, not haze: cerro de santa catalina in grass green
       with chillida's elogio (light concrete) on the summit, san
       pedro in pale stone at its foot, san lorenzo's golden sand
       slipping under the water, the muro in light stone crowned by
       its CRISP WHITE balustrade, seafront facades in white/cream/
       terracotta/ocher with terracotta roofs.
     · the mauve haze survives only on the far layer (universidad
       laboral) — distance, not mood.
     · LETRONAS: juan jareño's giant red GIJÓN letters at the east
       end by the water (the elogio holds the west) — simple
       extruded box strokes, readable from the sea.
     scene fog does the rest: full color up close, fades to the warm
     horizon as you sail away. still outside BOUND_R, zero collision,
     3 draw calls total (was 1; budget allowed +3-4).
     ============================================================ */
  function buildGijonSkyline() {
    /* v7 "gijón es gijón" — the fundamental pass, built against the
       photo/scan captures in portfolio/ref-gijon/:
       a) CIMADEVILLA is a NEIGHBORHOOD: narrow irregular houses in
          tiers climbing the cerro (white/cream/ocher/terracotta/
          washed blue/bottle green, terracotta gables, dark baked
          windows), summit kept green for the elogio.
       b) PUERTO DEPORTIVO at the cerro's west foot: grey breakwater,
          calm dark water sheet, wooden pontoons, 10 little sailboats.
       c) ELOGIO with its REAL shape: an OPEN cantilevered C-ring
          lying flat on top (not a closed arch), overshooting two
          splayed legs with curved inner flares. pale concrete.
       d) LABORAL with its REAL silhouette: enormous horizontal
          cloister + corner pavilions + slate roofs, slender stepped
          clock tower with colonnade stage, elliptical dome beside.
       still 3 draw calls (merged by depth layer), zero collision,
       zero water behind or between the city. */
    var L1 = [], L2 = [], L3 = [];

    /* palettes — premixed for golden hour (materials are unlit) */
    var GRASS = 0x4f8a41, GRASS_LIT = 0x7ab35a;
    var CONC = 0xc9c2b0, CONC_LIT = 0xe9e3d3;          // elogio: pale concrete, NOT mauve
    var STONE = 0xcdbfa4, STONE_LIT = 0xe8dec6;        // muro + san pedro
    var BALUS = 0xfaf6ec;                              // THE white balustrade
    var SANDW = 0xd9b268, SANDD = 0xf0d68a;            // wet → dry sand
    var ROOF = 0xa85f3e;
    var RED = 0xd42b1e, RED_LIT = 0xef4a35;            // letronas steel red
    var HILL = 0x7d9a58, HILL_LIT = 0xa9b273;          // backdrop, faintly hazed
    var FAR = 0xb39c8f, FAR_TOP = 0xd2bfa9;            // laboral: hazed golden stone
    var SLATE = 0x77738c, SLATE_TOP = 0x908ba6;        // laboral slate roofs (hazed)
    var INKW = 0x3a332c;                               // baked dark windows

    /* -- L1 · cerro de santa catalina: the headland the city climbs -- */
    var CX = -80, CZ = 246;
    var hill = new THREE.SphereGeometry(1, 18, 12);
    hill.scale(38, 16, 28);
    tint(hill, GRASS, GRASS_LIT, -2, 14);
    L1.push(placed(hill, CX, -2.5, CZ, 0, 1));
    var shoulder = new THREE.SphereGeometry(1, 14, 10);
    shoulder.scale(24, 9, 20);
    tint(shoulder, GRASS, GRASS_LIT, -2, 7);
    L1.push(placed(shoulder, -48, -1.5, 238, 0, 1));

    /* cerro surface height at (x,z) — mirrors the two ellipsoids */
    function cerroH(x, z) {
      function ell(cx, cy, cz, sx, sy, sz) {
        var dx = (x - cx) / sx, dz = (z - cz) / sz;
        var k = 1 - dx * dx - dz * dz;
        return k > 0 ? cy + sy * Math.sqrt(k) : -99;
      }
      return Math.max(ell(CX, -2.5, CZ, 38, 16, 28), ell(-48, -1.5, 238, 24, 9, 20));
    }

    /* -- a) CIMADEVILLA: stacked houses in three climbing tiers around
          the seaward + harbor slopes. "almost none of them follows a
          straight line" — jittered angle, size, twist. -- */
    var FAC = [0xe9e2d0, 0xf3e6c3, 0xd8944e, 0xcf7f52, 0x9db4c0, 0x7a8f6a, 0xe4d7c2, 0xc96a45];
    var ROOFS = [0xa85f3e, 0xb96a45, 0x995437];
    var tiers = [[0.97, 16], [0.84, 13], [0.71, 10]];
    for (var trI = 0; trI < tiers.length; trI++) {
      var tf = tiers[trI][0], tn = tiers[trI][1];
      for (var hn = 0; hn < tn; hn++) {
        /* θ sweeps 158°→349°: harbor side → sea face → beach side */
        var th = Math.PI * (0.88 + (hn / (tn - 1)) * 1.06)
                 + (hash2(hn * 3.1, trI * 7.7) - 0.5) * 0.1;
        var ff = tf + (hash2(hn, trI * 13.3) - 0.5) * 0.05;
        var hx2 = CX + Math.cos(th) * 38 * ff;
        var hz2 = CZ + Math.sin(th) * 28 * ff;
        var ground = cerroH(hx2, hz2);
        if (ground < 0.4) ground = 0.4;
        var hw = 4.2 + hash2(hn * 1.7, trI) * 2.6;
        var hh2 = 3.8 + hash2(hn * 2.3, trI * 3) * 3.0;
        var hd = 3.6 + hash2(hn * 5.1, trI) * 1.8;
        var ry = Math.PI / 2 - th + (hash2(hn, trI * 31) - 0.5) * 0.24;
        var baseY = ground - 1.5;
        var house = new THREE.BoxGeometry(hw, hh2, hd);
        tint(house, FAC[(hn * 3 + trI) % FAC.length], 0xfff3dd, hh2 * 0.1, hh2 * 0.9);
        L1.push(placed(house, hx2, baseY + hh2 / 2, hz2, ry, 1));
        /* terracotta gable: a 4-sided pyramid stretched to the footprint */
        var roof2 = new THREE.CylinderGeometry(0.09, 1, 1.5, 4);
        roof2.rotateY(Math.PI / 4);
        roof2.scale((hw / 2 + 0.35) / 0.707, 1, (hd / 2 + 0.35) / 0.707);
        tint(roof2, ROOFS[(hn + trI) % 3], 0xc27a52, -0.75, 0.75);
        roof2.rotateY(ry);
        roof2.translate(hx2, baseY + hh2 + 0.7, hz2);
        L1.push(roof2);
        /* dark little windows on the outward face */
        var nw = 2 + Math.floor(hash2(hn * 7.3, trI) * 2.2);
        for (var wv = 0; wv < nw; wv++) {
          var win = new THREE.PlaneGeometry(0.62, 0.95);
          tint(win, INKW);
          var wx = nw > 1 ? (wv / (nw - 1) - 0.5) * (hw - 1.8) : 0;
          win.translate(wx, 0, hd / 2 + 0.07);
          win.rotateY(ry);
          win.translate(hx2, baseY + hh2 * 0.52, hz2);
          L1.push(win);
        }
      }
    }
    /* little dark cypresses between the houses (density from the refs) */
    for (var cy2 = 0; cy2 < 8; cy2++) {
      var ca3 = Math.PI * (0.95 + (cy2 / 8) * 0.95) + hash2(cy2, 5) * 0.12;
      var cf = 0.77 + hash2(cy2, 9) * 0.13;
      var cxp = CX + Math.cos(ca3) * 38 * cf, czp = CZ + Math.sin(ca3) * 28 * cf;
      var cone2 = new THREE.ConeGeometry(0.75, 3.2, 5);
      tint(cone2, 0x3f5a3a, 0x567a4e, -1.6, 1.6);
      L1.push(placed(cone2, cxp, cerroH(cxp, czp) + 0.9, czp, 0, 1));
    }

    /* -- c) ELOGIO del horizonte, the REAL shape: open flat C-ring
          on top (cantilevered past the legs), two splayed elliptical
          legs with inner flares. pale concrete on the green summit. -- */
    var EX = CX + 2, EZ = CZ - 4;
    var EY = cerroH(EX, EZ) - 0.3;
    /* the C-ring: flat, slim band, gap swung toward the sea so the
       cantilevered free ends read from the water (never a closed arch) */
    var E_ARC = Math.PI * 1.55;
    var ring = new THREE.TorusGeometry(7.4, 1.3, 8, 26, E_ARC);
    /* the free ends are capped — an open tube reads as a pipe/horn */
    var cap1 = new THREE.CircleGeometry(1.3, 10);
    cap1.rotateX(Math.PI / 2);                   // normal → -tangent at arc start
    cap1.translate(7.4, 0, 0);
    var cap2 = new THREE.CircleGeometry(1.3, 10);
    cap2.rotateX(-Math.PI / 2);
    cap2.rotateZ(E_ARC);                         // normal → +tangent at arc end
    cap2.translate(7.4 * Math.cos(E_ARC), 7.4 * Math.sin(E_ARC), 0);
    [ring, cap1, cap2].forEach(function (gg2) {
      gg2.rotateX(Math.PI / 2);        // lay the C flat
      gg2.scale(1, 1.5, 1);            // tube → concrete band
      gg2.rotateY(0.6);                // gap → just east of due north (sea side)
      tint(gg2, CONC, CONC_LIT, -2, 2);
      gg2.translate(EX, EY + 10.6, EZ);
      L1.push(gg2);
    });
    for (var el = -1; el <= 1; el += 2) {
      var leg = new THREE.CylinderGeometry(1.3, 1.7, 6.6, 10);
      leg.scale(1, 1, 1.55);            // slab-like elliptical section
      leg.rotateZ(el * 0.08);           // splay: wider stance at the base
      tint(leg, CONC, CONC_LIT, -3.3, 3.3);
      leg.translate(EX + el * 6.1, EY + 5.5, EZ);
      L1.push(leg);
      /* widening base — the curved inner cutout read from a distance */
      var base = new THREE.CylinderGeometry(1.7, 2.7, 2.9, 10);
      base.scale(1, 1, 1.55);
      tint(base, 0xb7b0a0, CONC, -1.4, 1.4);
      base.translate(EX + el * 6.45, EY + 1.4, EZ);
      L1.push(base);
    }

    /* -- b) PUERTO DEPORTIVO at the cerro's west foot: breakwater,
          calm dark water, pontoons, sailboats. the basin is fully
          enclosed — no sea slips behind the city. -- */
    var HX = -126, HZ = 231;
    var basin = new THREE.BoxGeometry(30, 0.5, 23);
    tint(basin, 0x1c3690, 0x2c4fc0, -0.25, 0.25);
    L1.push(placed(basin, HX, 0.35, HZ, 0, 1));
    var quayE = new THREE.BoxGeometry(7, 2.6, 25);
    tint(quayE, STONE, STONE_LIT, -1.3, 1.3);
    L1.push(placed(quayE, HX + 18, 0.7, HZ + 1, 0, 1));
    var quayS = new THREE.BoxGeometry(45, 2.6, 7);
    tint(quayS, STONE, STONE_LIT, -1.3, 1.3);
    L1.push(placed(quayS, HX + 2, 0.7, HZ + 14, 0, 1));
    var bwN = new THREE.BoxGeometry(38, 3.0, 4);
    tint(bwN, 0x8e8a80, 0xaaa69a, -1.5, 1.5);
    L1.push(placed(bwN, HX - 2, 0.9, HZ - 13.5, 0.06, 1));
    var bwW = new THREE.BoxGeometry(4, 3.0, 26);
    tint(bwW, 0x8e8a80, 0xaaa69a, -1.5, 1.5);
    L1.push(placed(bwW, HX - 16.5, 0.9, HZ - 1, 0, 1));
    for (var pt2 = 0; pt2 < 3; pt2++) {
      var px3 = HX - 9 + pt2 * 8.5;
      var pont = new THREE.BoxGeometry(1.7, 0.35, 12);
      tint(pont, COL.wood, COL.woodLight, -0.18, 0.18);
      L1.push(placed(pont, px3, 0.75, HZ + 4.5, 0, 1));
    }
    for (var bt2 = 0; bt2 < 10; bt2++) {
      var px4 = HX - 9 + (bt2 % 3) * 8.5 + (bt2 % 2 ? 2.4 : -2.4);
      var pz4 = HZ + 7.5 - Math.floor(bt2 / 3) * 4.2 + (hash2(bt2, 1) - 0.5) * 1.4;
      var hullB = new THREE.SphereGeometry(1, 8, 6);
      hullB.scale(0.85, 0.55, 2.1);
      tint(hullB, [0xfffdf6, 0xf6eedd, 0xff5a3c, 0x9db4c0, 0xe4d7c2][bt2 % 5], 0xfffdf6, 0, 0.6);
      var bry = (hash2(bt2, 3) - 0.5) * 0.5;
      L1.push(placed(hullB, px4, 0.72, pz4, bry, 1));
      var mast = new THREE.CylinderGeometry(0.06, 0.09, 3.4 + hash2(bt2, 7) * 1.2, 4);
      tint(mast, COL.woodDark);
      L1.push(placed(mast, px4, 2.5, pz4, 0, 1));
      if (bt2 % 3 !== 2) {
        /* little triangular sail, angled to catch the light (and the
           camera: rotations kept on the seaward half-turn) */
        var sh2 = 2.1 + hash2(bt2, 11) * 0.8;
        var sail = new THREE.BufferGeometry();
        sail.setAttribute("position", new THREE.Float32BufferAttribute([
          0, 0, 0, 0, sh2, 0, 1.25, 0.22, 0,
        ], 3));
        sail.setAttribute("normal", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
        tint(sail, 0xfffdf6);
        L1.push(placed(sail, px4 + 0.1, 1.6, pz4, -0.5 + hash2(bt2, 13) * 1.0 + Math.PI, 1));
      }
    }

    /* -- san pedro: pale stone church on its headland by the water -- */
    var SX = -38, SZ = 226;
    var head = new THREE.DodecahedronGeometry(7.5, 0);
    head.scale(1.5, 0.42, 1.1);
    tint(head, 0x8a7f6e, 0xa89a82, -2, 3);              // rocky base, darker
    L1.push(placed(head, SX + 1, 0.4, SZ + 1, 0.4, 1));
    var nave = new THREE.BoxGeometry(9.5, 4.6, 4.6);
    tint(nave, STONE, STONE_LIT, 2, 8);
    L1.push(placed(nave, SX + 3.5, 4.6, SZ, 0.05, 1));
    var gable = new THREE.CylinderGeometry(0.08, 3.3, 2.6, 4);
    tint(gable, 0xb5a488, 0xcbbb9d, 6, 9.5);            // stone roof, a step darker
    var gg = placed(gable, SX + 3.5, 8.2, SZ, Math.PI / 4, 1);
    gg.applyMatrix4(new THREE.Matrix4().makeTranslation(-(SX + 3.5), 0, -SZ));
    gg.applyMatrix4(new THREE.Matrix4().makeScale(2.1, 1, 1));
    gg.applyMatrix4(new THREE.Matrix4().makeTranslation(SX + 3.5, 0, SZ));
    L1.push(gg);
    var tower = new THREE.BoxGeometry(3.0, 9.5, 3.0);
    tint(tower, STONE, STONE_LIT, 2, 12);
    L1.push(placed(tower, SX - 2.6, 6.5, SZ, 0.05, 1));
    var belfry = new THREE.BoxGeometry(3.3, 1.7, 3.3);
    tint(belfry, STONE_LIT);
    L1.push(placed(belfry, SX - 2.6, 11.9, SZ, 0.05, 1));
    var spike = new THREE.CylinderGeometry(0.08, 2.2, 2.8, 4);
    tint(spike, 0xb5a488, 0xcbbb9d, 12, 15.5);
    L1.push(placed(spike, SX - 2.6, 14.1, SZ, Math.PI / 4, 1));

    /* -- playa de san lorenzo (v6.1): dry golden slab riding clearly
          above the calmed south shore + wet apron diving under. -- */
    var beach = new THREE.BoxGeometry(140, 2.4, 11);
    tint(beach, SANDD, 0xf6e2a0, 1.2, 2.6);
    L1.push(placed(beach, 40, 1.15, 231.5, 0, 1));
    /* v7: lifted + eased so the damped swell can never crest through
       the trough between wet apron and dry slab (was a blue sliver) */
    var apronW = new THREE.BoxGeometry(140, 1.6, 12);
    tint(apronW, SANDW, SANDD, -0.8, 1.2);
    var bg2 = placed(apronW, 40, 0.35, 221.5, 0, 1);
    bg2.applyMatrix4(new THREE.Matrix4().makeTranslation(-40, -0.35, -221.5));
    bg2.applyMatrix4(new THREE.Matrix4().makeRotationX(0.16));   // dives seaward
    bg2.applyMatrix4(new THREE.Matrix4().makeTranslation(40, 0.35, 221.5));
    L1.push(bg2);

    /* -- el muro: light stone wall + THE crisp white balustrade -- */
    var wall = new THREE.BoxGeometry(136, 2.8, 2.6);
    tint(wall, STONE, STONE_LIT, 1, 4);
    L1.push(placed(wall, 42, 2.4, 236.6, 0, 1));
    var rail = new THREE.BoxGeometry(136, 0.34, 0.66);
    tint(rail, BALUS);
    L1.push(placed(rail, 42, 4.38, 236.2, 0, 1));
    for (var ba2 = 0; ba2 < 64; ba2++) {
      var bx3 = 42 - 66.5 + ba2 * 2.1;
      var bal = new THREE.BoxGeometry(0.32, 0.88, 0.32);
      tint(bal, BALUS);
      L1.push(placed(bal, bx3, 3.58, 236.2, 0, 1));
    }
    for (var st2 = 0; st2 < 3; st2++) {                 // la escalerona notch
      var step = new THREE.BoxGeometry(3.4, 0.55, 1.6);
      tint(step, STONE_LIT);
      L1.push(placed(step, 18, 2.9 - st2 * 0.75, 234.4 - st2 * 1.1, 0, 1));
    }

    /* -- LETRONAS: red GIJÓN modules, east end, by the water --
       box-stroke letters on a low stone plinth. s=stroke. */
    var LTX = 62, LTZ = 222.5, LH = 4.6, LW = 2.7, LS = 0.85, LGAP = 1.1;
    var plinth = new THREE.BoxGeometry(5 * LW + 4 * LGAP + 3, 1.0, 4.2);
    tint(plinth, STONE, STONE_LIT, 0.6, 1.8);
    L1.push(placed(plinth, LTX + (5 * LW + 4 * LGAP) / 2 - LW / 2, 1.1, LTZ, 0, 1));
    var LY = 1.6;                                        // letters stand on the plinth
    /* we read the letters from the sea (looking south at their -z
       face), so the word is laid out MIRRORED in x — and so is
       every rotation. TOTW = 4 full letters + the narrow I + gaps. */
    var TOTW = 4 * LW + LS + 4 * LGAP;
    function stroke(lx, x, y, w, h, rz) {
      var b = new THREE.BoxGeometry(w, h, 0.55);
      tint(b, RED, RED_LIT, LY + LH * 0.35, LY + LH);
      var mx = 2 * LTX + TOTW - (lx + x) - w / 2;        // mirrored center
      var g = placed(b, mx, LY + y + h / 2, LTZ, 0, 1);
      if (rz) {
        rz = -rz;
        var cx2 = mx, cy2 = LY + y + h / 2;
        g.applyMatrix4(new THREE.Matrix4().makeTranslation(-cx2, -cy2, -LTZ));
        g.applyMatrix4(new THREE.Matrix4().makeRotationZ(rz));
        g.applyMatrix4(new THREE.Matrix4().makeTranslation(cx2, cy2, LTZ));
      }
      L1.push(g);
    }
    var lx0 = LTX;
    /* G */
    stroke(lx0, 0, LH - LS, LW, LS);            // top
    stroke(lx0, 0, 0, LS, LH);                  // left
    stroke(lx0, 0, 0, LW, LS);                  // bottom
    stroke(lx0, LW - LS, 0, LS, LH * 0.48);     // right lower
    stroke(lx0, LW * 0.45, LH * 0.38, LW * 0.55, LS);  // mid bar
    lx0 += LW + LGAP;
    /* I (narrow: advance less) */
    stroke(lx0, 0, 0, LS, LH);
    lx0 += LS + LGAP;
    /* J */
    stroke(lx0, 0, LH - LS, LW, LS);            // top
    stroke(lx0, LW - LS, 0, LS, LH);            // right stem
    stroke(lx0, 0, 0, LW - LS, LS);             // bottom hook
    stroke(lx0, 0, 0, LS, LH * 0.3);            // left stub
    lx0 += LW + LGAP;
    /* Ó */
    stroke(lx0, 0, LH - LS, LW, LS);
    stroke(lx0, 0, 0, LW, LS);
    stroke(lx0, 0, 0, LS, LH);
    stroke(lx0, LW - LS, 0, LS, LH);
    stroke(lx0, LW * 0.32, LH + 0.35, LW * 0.42, LS * 0.8, 0.18);  // accent
    lx0 += LW + LGAP;
    /* N */
    stroke(lx0, 0, 0, LS, LH);
    stroke(lx0, LW - LS, 0, LS, LH);
    stroke(lx0, LW / 2 - LS / 2, -0.25, LS, LH * 1.12, Math.atan2(LW - LS, LH));

    /* -- L2 · the seafront: a continuous row of real facades --
       white / cream / terracotta / ocher, terracotta roofs, dark
       baked windows (v7), no gaps, grounded on one deep base slab. */
    var FACADES = [0xe9e2d0, 0xcf7f52, 0xf3e6c3, 0xdfae62, 0xe4d7c2, 0xc96a45, 0xf0e3c0, 0xd8944e];
    var bx4 = -18;
    for (var bd = 0; bd < 16; bd++) {
      var bw = 6.5 + hash2(bd, 1) * 5.5;
      var bh = 6.5 + hash2(bd, 5) * 7.5 + (bd % 5 === 2 ? 3.5 : 0);
      var bdep = 7 + hash2(bd, 9) * 3;
      var fc = FACADES[bd % FACADES.length];
      var bry = (hash2(bd, 7) - 0.5) * 0.08;
      var bldg = new THREE.BoxGeometry(bw, bh, bdep);
      tint(bldg, fc, 0xfff3dd, bh * 0.55, bh + 3);      // sun-warmed tops
      var bz5 = 248 + hash2(bd, 3) * 5;
      L2.push(placed(bldg, bx4 + bw / 2, bh / 2 + 1.2, bz5, bry, 1));
      var roof = new THREE.BoxGeometry(bw + 0.5, 0.8, bdep + 0.5);
      tint(roof, ROOF, 0xc27a52, 0, 1);
      L2.push(placed(roof, bx4 + bw / 2, bh + 1.6, bz5, bry, 1));
      /* v7: dark windows on the sea face, rotated with the building */
      var rows = bh > 11 ? 3 : 2;
      var cols = Math.max(2, Math.floor(bw / 2.7));
      for (var wr = 0; wr < rows; wr++) {
        for (var wc = 0; wc < cols; wc++) {
          var wg = new THREE.PlaneGeometry(0.85, 1.3);
          tint(wg, INKW);
          wg.rotateY(Math.PI);        // face the sea (-z)
          wg.translate((wc - (cols - 1) / 2) * (bw / cols) * 0.82,
                       -bh / 2 + 2.4 + wr * 3.0,
                       -(bdep / 2 + 0.09));
          wg.rotateY(bry);
          wg.translate(bx4 + bw / 2, bh / 2 + 1.2, bz5);
          L2.push(wg);
        }
      }
      bx4 += bw + 0.4;                                   // touching: no sea gaps
    }
    var cityBase = new THREE.BoxGeometry(150, 3.6, 18);
    tint(cityBase, STONE, 0xd9cbb0, 0, 3.2);
    L2.push(placed(cityBase, 48, 1.3, 250, 0, 1));

    /* -- L3 · the land does NOT end: low green/ochre hills seal the
          whole southern horizon (skipping a window for the laboral),
          and a deep ground slab guarantees there is no water behind
          anything, from any camera. -- */
    for (var hh = 0; hh < 8; hh++) {
      var hx = -235 + hh * 67 + (hash2(hh, 2) - 0.5) * 22;
      if (Math.abs(hx - 112) < 58) continue;             // the laboral's window
      var hr = 42 + hash2(hh, 4) * 30;
      var hy = 9 + hash2(hh, 6) * 9;
      var bump = new THREE.SphereGeometry(1, 12, 8);
      bump.scale(hr, hy, 26 + hash2(hh, 8) * 12);
      var hc = hh % 2 ? HILL : 0x99a061;                 // green / dry ochre
      tint(bump, hc, HILL_LIT, -2, hy * 0.8);
      L3.push(placed(bump, hx, -1.5, 272 + hash2(hh, 5) * 14, (hash2(hh, 3) - 0.5) * 0.3, 1));
    }
    /* coastal headlands flanking the bay: the shoreline itself is
       continuous — west of the harbor and east of the letronas the
       sea meets low green coast, never slips behind the city. */
    var COAST = [[-185, 44, 8], [-232, 50, 9], [-278, 52, 8], [138, 38, 6], [188, 46, 8], [242, 50, 9]];
    for (var cc2 = 0; cc2 < COAST.length; cc2++) {
      var cbump = new THREE.SphereGeometry(1, 12, 8);
      cbump.scale(COAST[cc2][1], COAST[cc2][2], 24);
      tint(cbump, cc2 % 2 ? HILL : 0x6f8f52, HILL_LIT, -2, COAST[cc2][2] * 0.8);
      L3.push(placed(cbump, COAST[cc2][0], -1.2, 246, (hash2(cc2, 9) - 0.5) * 0.25, 1));
    }
    var ground = new THREE.BoxGeometry(540, 7, 90);
    tint(ground, HILL, HILL_LIT, -4, 3.5);
    L3.push(placed(ground, 0, -1.5, 300, 0, 1));
    // and a green apron connecting hills to the city/beach line
    var apron = new THREE.BoxGeometry(540, 4.5, 26);
    tint(apron, 0x86935a, HILL_LIT, -3, 2.2);
    L3.push(placed(apron, 0, -0.8, 262, 0, 1));

    /* -- d) universidad laboral: far southeast, hazed but with ITS
          OWN silhouette (checked against the aerial captures). -- */
    var LX = 112, LZ = 286;
    var lhill = new THREE.SphereGeometry(1, 12, 8);
    lhill.scale(34, 12, 20);
    tint(lhill, 0x9a8a71, 0xb5a284, -1, 9);
    L3.push(placed(lhill, LX, -0.5, LZ, 0, 1));
    var LB = 9;                                          // cloister base level
    var lbody = new THREE.BoxGeometry(46, 8, 15);        // the ENORMOUS block
    tint(lbody, FAR, FAR_TOP, -4, 4);
    L3.push(placed(lbody, LX, LB + 1, LZ, 0.06, 1));
    var lroof = new THREE.BoxGeometry(47.5, 1.3, 16);    // slate roof slab
    tint(lroof, SLATE, SLATE_TOP, -0.6, 0.6);
    L3.push(placed(lroof, LX, LB + 5.6, LZ, 0.06, 1));
    for (var pv = 0; pv < 4; pv++) {                     // corner pavilions
      var pvx = LX + (pv % 2 ? 1 : -1) * 21.5;
      var pvz = LZ + (pv < 2 ? 1 : -1) * 6.2;
      var pav = new THREE.BoxGeometry(5.4, 10.5, 5.4);
      tint(pav, FAR, FAR_TOP, -5, 5);
      L3.push(placed(pav, pvx, LB + 2.5, pvz, 0.06, 1));
      var pyr = new THREE.CylinderGeometry(0.1, 4.1, 2.6, 4);
      tint(pyr, SLATE, SLATE_TOP, -1.3, 1.3);
      L3.push(placed(pyr, pvx, LB + 8.9, pvz, 0.06 + Math.PI / 4, 1));
    }
    /* the clock tower: slender, stepped, colonnade stage on top */
    var TWX = LX + 8, TWZ = LZ - 2;
    var lshaft = new THREE.BoxGeometry(4.0, 24, 4.0);
    tint(lshaft, FAR, FAR_TOP, -12, 12);
    L3.push(placed(lshaft, TWX, LB + 12, TWZ, 0.06, 1));
    var lcol = new THREE.BoxGeometry(5.2, 3.6, 5.2);     // colonnade stage
    tint(lcol, FAR_TOP, 0xe6d4be, -1.8, 1.8);
    L3.push(placed(lcol, TWX, LB + 25.8, TWZ, 0.06, 1));
    var lup = new THREE.BoxGeometry(3.0, 2.6, 3.0);      // upper stage
    tint(lup, FAR_TOP, 0xe9d9c4, -1.3, 1.3);
    L3.push(placed(lup, TWX, LB + 28.9, TWZ, 0.06, 1));
    var lspire = new THREE.CylinderGeometry(0.1, 1.7, 3.0, 4);
    tint(lspire, SLATE, SLATE_TOP, -1.5, 1.5);
    L3.push(placed(lspire, TWX, LB + 31.7, TWZ, 0.5, 1));
    /* the elliptical church dome beside the tower */
    var drum = new THREE.CylinderGeometry(4.6, 4.6, 3.2, 12);
    drum.scale(1.25, 1, 1);
    tint(drum, FAR, FAR_TOP, -1.6, 1.6);
    L3.push(placed(drum, LX - 6, LB + 7.2, LZ - 3, 0, 1));
    var dome = new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    dome.scale(5.6, 4.6, 4.5);
    tint(dome, SLATE, SLATE_TOP, 0, 4.2);
    L3.push(placed(dome, LX - 6, LB + 8.8, LZ - 3, 0, 1));
    var lant = new THREE.CylinderGeometry(0.5, 0.7, 1.6, 6);
    tint(lant, FAR_TOP);
    L3.push(placed(lant, LX - 6, LB + 14.1, LZ - 3, 0, 1));

    scene.add(new THREE.Mesh(mergeGeos(L3), new THREE.MeshBasicMaterial({ vertexColors: true })));
    scene.add(new THREE.Mesh(mergeGeos(L2), new THREE.MeshBasicMaterial({ vertexColors: true })));
    scene.add(new THREE.Mesh(mergeGeos(L1), new THREE.MeshBasicMaterial({ vertexColors: true })));
  }

  /* ============================================================
     rocks — solid, and they know it
     ============================================================ */
  function buildRocks() {
    var n = tier === "low" ? 14 : 30;
    var geo = new THREE.DodecahedronGeometry(1, 0);
    // warm plum-grey so the rocks live in the same golden hour as the rest
    tint(geo, 0x4d4258, 0x9c8b7e, -0.6, 1.0);
    var inst = new THREE.InstancedMesh(geo, toonMat(0xffffff, { vc: true, rim: 0.6, flat: true, key: "searock" }), n);
    var m = new THREE.Matrix4();
    var q = new THREE.Quaternion();
    var e = new THREE.Euler();
    var placedN = 0, guard = 0;
    while (placedN < n && guard < 400) {
      guard++;
      var a = Math.random() * Math.PI * 2;
      var r = 50 + Math.random() * (BOUND_R - 60);
      var x = Math.cos(a) * r, z = Math.sin(a) * r;
      var ok = true;
      for (var i = 0; i < islands.length; i++) {
        var dx = x - islands[i].group.position.x, dz = z - islands[i].group.position.z;
        if (dx * dx + dz * dz < 45 * 45) { ok = false; break; }
      }
      if (Math.abs(x) < 25 && Math.abs(z - SPAWN_Z) < 30) ok = false;
      if (!ok) continue;
      e.set((Math.random() - 0.5) * 0.6, Math.random() * 3, (Math.random() - 0.5) * 0.6);
      q.setFromEuler(e);
      var s = 0.8 + Math.random() * 2.4;
      m.compose(new THREE.Vector3(x, 0.4, z), q, new THREE.Vector3(s, s * 0.8, s));
      inst.setMatrixAt(placedN, m);
      rocks.push({ x: x, z: z, r: s * 1.5 + 1.2 });
      placedN++;
    }
    inst.count = placedN;
    inst.instanceMatrix.needsUpdate = true;
    scene.add(inst);
  }

  /* ============================================================
     sky life: clouds, seagulls, fish + light motes
     ============================================================ */
  function buildClouds() {
    for (var i = 0; i < 7; i++) {
      var blobs = [];
      var nb = 3 + (i % 2);
      for (var b = 0; b < nb; b++) {
        var s = 3.5 + hash2(i, b) * 3;
        var blob = new THREE.IcosahedronGeometry(s, 1);
        tint(blob, 0xf6e7cf, 0xfffbef, -s, s * 0.7);   // warm-shadowed bottoms
        blobs.push(placed(blob, b * 4.5 - nb * 2, hash2(b, i) * 1.5, hash2(i * 3, b) * 2.5, 0, 1, 0.55));
      }
      var cl = new THREE.Mesh(mergeGeos(blobs), toonMat(0xffffff, { vc: true, key: "cloud" }));
      // keep clouds away from the sun's azimuth so they never slice the disc
      var sunAz = Math.atan2(-420, -180);   // atan2(z, x) of the sun position
      var a;
      do { a = Math.random() * Math.PI * 2; } while (Math.abs(normAngle(a - sunAz)) < 0.55);
      var r = 110 + Math.random() * 120;
      cl.position.set(Math.cos(a) * r, 54 + Math.random() * 18, Math.sin(a) * r);
      cl.userData.speed = 0.5 + Math.random();
      scene.add(cl);
      flyers.push({ obj: cl, cloud: true });
    }
  }

  function buildSeagulls() {
    for (var i = 0; i < 4; i++) {
      var bird = new THREE.Group();
      var bodyGeo = new THREE.SphereGeometry(0.4, 8, 6);
      bodyGeo.scale(0.8, 0.7, 1.5);
      var body = new THREE.Mesh(tint(bodyGeo, 0xfffdf6), propMat());
      bird.add(body);
      var wingG = new THREE.PlaneGeometry(2.0, 0.6, 2, 1);
      wingG.translate(1.0, 0, 0);
      tint(wingG, 0xfffdf6);
      var w1 = new THREE.Mesh(wingG, toonMat(0xffffff, { vc: true, ds: true, key: "wing" }));
      var w2 = new THREE.Mesh(wingG.clone(), toonMat(0xffffff, { vc: true, ds: true, key: "wing" }));
      w2.rotation.y = Math.PI;
      bird.add(w1); bird.add(w2);
      var beak = new THREE.Mesh(tint(new THREE.ConeGeometry(0.12, 0.4, 5), COL.yellow), propMat());
      beak.rotation.x = Math.PI / 2;
      beak.position.z = 0.7;
      bird.add(beak);
      bird.userData = { r: 30 + i * 14, h: 18 + i * 4, sp: 0.25 + i * 0.06, ph: i * 1.7, w1: w1, w2: w2 };
      scene.add(bird);
      flyers.push({ obj: bird, bird: true });
    }
  }

  /* v5: fish only leap in open water — spawn, landing AND arc midpoints are
     validated against islands (keepR+8), rocks (r+2, incl. the floating
     hoop's collider) and the world bound; re-rolled up to 8 attempts. */
  function fishSpotClear(x, z) {
    if (Math.sqrt(x * x + z * z) > BOUND_R - 6) return false;
    for (var i = 0; i < islands.length; i++) {
      var ix = x - islands[i].group.position.x, iz = z - islands[i].group.position.z;
      var ir = islands[i].keepR + 8;
      if (ix * ix + iz * iz < ir * ir) return false;
    }
    for (var j = 0; j < rocks.length; j++) {
      var rx = x - rocks[j].x, rz = z - rocks[j].z, rr = rocks[j].r + 2;
      if (rx * rx + rz * rz < rr * rr) return false;
    }
    return true;
  }

  /* v6: fish, not torpedoes. laterally compressed body (taller than
     wide), forked half-moon tail on its own pivot (it wags), dorsal
     fin, pectorals, eyes. body+fins merged = 1 mesh, tail = 1 mesh,
     so the budget stays at 2 draw calls per fish. */
  function buildFish() {
    var nf = tier === "high" ? 3 : 1;
    for (var i = 0; i < nf; i++) {
      var f = new THREE.Group();
      var col1 = i % 2 ? 0x9fb0ff : COL.coral;
      var col2 = i % 2 ? 0x8194f0 : COL.coralDark;

      var parts = [];
      // body: compressed teardrop — clearly taller than wide
      var bodyGeo = new THREE.SphereGeometry(0.55, 10, 8);
      bodyGeo.scale(0.36, 0.8, 1.5);
      tint(bodyGeo, 0xfdf6e6, col1, -0.38, 0.16);   // light belly, colored back
      parts.push(bodyGeo);
      // dorsal fin: thin swept-back blade standing proud of the spine
      var dorsal = new THREE.ConeGeometry(0.34, 0.85, 4);
      dorsal.scale(0.14, 1, 1);
      dorsal.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.75));
      tint(dorsal, col2);
      placed(dorsal, 0, 0.62, -0.2, 0, 1);
      parts.push(dorsal);
      // pectoral fins: two small blades angled down and out
      for (var pf = -1; pf <= 1; pf += 2) {
        var pec = new THREE.ConeGeometry(0.16, 0.42, 4);
        pec.scale(0.18, 1, 1);
        pec.applyMatrix4(new THREE.Matrix4().makeRotationZ(pf * 2.1));
        tint(pec, col2);
        placed(pec, pf * 0.24, -0.12, 0.22, 0, 1);
        parts.push(pec);
      }
      // eyes: ink beads on both cheeks
      for (var ef = -1; ef <= 1; ef += 2) {
        var eye = new THREE.SphereGeometry(0.07, 6, 5);
        tint(eye, COL.ink);
        placed(eye, ef * 0.19, 0.12, 0.58, 0, 1);
        parts.push(eye);
      }
      f.add(new THREE.Mesh(mergeGeos(parts), propMat()));

      // tail: forked half-moon, clearly separated from the body,
      // on its own pivot so it can wag mid-leap
      var tailG = new THREE.Group();
      tailG.position.z = -0.88;
      var tailParts = [];
      for (var tl = -1; tl <= 1; tl += 2) {
        var lobe = new THREE.ConeGeometry(0.2, 0.74, 4);
        lobe.scale(0.16, 1, 1);
        // lobes sweep back and split up/down: the crescent silhouette
        lobe.applyMatrix4(new THREE.Matrix4().makeRotationX(tl * 2.25));
        tint(lobe, col2, col1, -0.5, 0.5);
        placed(lobe, 0, tl * 0.18, -0.22, 0, 1);
        tailParts.push(lobe);
      }
      // peduncle: skinny bridge so the tail reads separate but attached
      var ped = new THREE.CylinderGeometry(0.07, 0.1, 0.34, 5);
      ped.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));
      tint(ped, col2);
      placed(ped, 0, 0, 0.1, 0, 1);
      tailParts.push(ped);
      tailG.add(new THREE.Mesh(mergeGeos(tailParts), propMat()));
      f.add(tailG);

      f.visible = false;
      scene.add(f);
      fishes.push({
        obj: f, tail: tailG, t: -2 - i * 3, dur: 1.3,
        x0: 0, z0: 0, dx: 0, dz: 0,
        bank: 0, scl: 1, ph: i * 2.1,
      });
    }
  }

  function buildMotes() {
    var N = 56;
    var pos = new Float32Array(N * 3);
    for (var i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = 0.8 + Math.random() * 7;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    var mat = new THREE.PointsMaterial({
      color: 0xffdf9e, size: 0.38, transparent: true, opacity: 0.32,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
      map: makeGlowTexture(),
    });
    motes = new THREE.Points(geo, mat);
    motes.frustumCulled = false;
    scene.add(motes);
  }

  /* ============================================================
     input
     ============================================================ */
  var keys = {};
  function bindInput(container) {
    document.addEventListener("keydown", function (e) {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].indexOf(e.key) >= 0) e.preventDefault();
      keys[e.key.toLowerCase()] = true;
      if (e.key === "Enter" && nearIsland && !document.querySelector(".case.open")) {
        dockAt(nearIsland);
      }
    });
    document.addEventListener("keyup", function (e) { keys[e.key.toLowerCase()] = false; });

    var el = renderer.domElement;
    var startX = 0, startY = 0;
    el.addEventListener("pointerdown", function (e) {
      input.touching = true;
      autopilot = null;
      startX = e.clientX; startY = e.clientY;
      input.tx = 0; input.ty = 0;
      el.setPointerCapture(e.pointerId);
      if (joyBase) {
        joyBase.hidden = false;
        joyBase.style.left = startX + "px";
        joyBase.style.top = startY + "px";
        joyNub.style.transform = "translate(-50%,-50%)";
      }
    });
    el.addEventListener("pointermove", function (e) {
      if (!input.touching) return;
      input.tx = clamp((e.clientX - startX) / 70, -1, 1);
      input.ty = clamp((e.clientY - startY) / 70, -1, 1);
      if (joyNub) {
        var nx = clamp(e.clientX - startX, -44, 44);
        var ny = clamp(e.clientY - startY, -44, 44);
        joyNub.style.transform = "translate(calc(-50% + " + nx + "px), calc(-50% + " + ny + "px))";
      }
    });
    function up() {
      input.touching = false; input.tx = 0; input.ty = 0;
      if (joyBase) joyBase.hidden = true;
    }
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  }

  function readInput() {
    var throttle = 0, turn = 0, manual = false;
    if (keys["arrowup"] || keys["w"]) { throttle = 1; manual = true; }
    if (keys["arrowdown"] || keys["s"]) { throttle = -0.4; manual = true; }
    if (keys["arrowleft"] || keys["a"]) { turn = 1; manual = true; }
    if (keys["arrowright"] || keys["d"]) { turn = -1; manual = true; }
    if (input.touching) {
      throttle = Math.max(throttle, Math.min(1, Math.max(0.35, -input.ty + 0.5)));
      turn = -input.tx;
      manual = true;
    }
    if (manual) autopilot = null;

    if (autopilot) {
      var dx = autopilot.group.position.x - boat.x;
      var dz = autopilot.group.position.z - boat.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      var err = normAngle(Math.atan2(dx, dz) - boat.heading);
      turn = clamp(err * 2.2, -1, 1);
      throttle = d < 70 ? 0.55 : 1;
      // v6: no prompt at the end — the captain rows straight onto the
      // beach and momentum + sand do the docking (startLand fires on
      // grounding). release the helm just before the sand grabs.
      if (d < ISLAND_R + 3) { autopilot = null; throttle = 0.5; }
    }

    input.throttle = throttle;
    input.turn = turn;
  }

  /* ============================================================
     hud: compass 2.0 + joystick + counter
     ============================================================ */
  var ctaBtn = null, hudEl = null;
  function bindHud() {
    hudEl = document.getElementById("hud");
    // the conversion buoy: a dock-style chip that opens a mail draft.
    // subject pre-filled — the fifth island starts as an email.
    ctaBtn = document.createElement("a");
    ctaBtn.id = "edge-cta";
    ctaBtn.className = "dock edge-cta";
    ctaBtn.href = "mailto:jantolin@acb.es?subject=" + encodeURIComponent("let's build island #5");
    ctaBtn.textContent = "build island #5 with me ✉";
    ctaBtn.hidden = true;
    document.getElementById("hud").appendChild(ctaBtn);

    dockBtn = document.getElementById("dock-btn");
    dockBtn.addEventListener("click", function () {
      if (nearIsland) dockAt(nearIsland);
    });

    var cap = document.createElement("div");
    cap.id = "island-toast";
    cap.innerHTML =
      "<div class='cap-avatar' aria-hidden='true'>" +
      "<svg viewBox='0 0 48 48' width='46' height='46'>" +
      "<circle cx='24' cy='24' r='23' fill='#f6eedd'/>" +
      "<circle cx='24' cy='27' r='11' fill='#e8b17e'/>" +
      "<path d='M10 22 Q24 8 38 22 L36 24 Q24 13 12 24 Z' fill='#2b47d9'/>" +
      "<rect x='11' y='21' width='26' height='4' rx='2' fill='#2b47d9'/>" +
      "<circle cx='19.5' cy='28' r='1.8' fill='#14120f'/>" +
      "<circle cx='28.5' cy='28' r='1.8' fill='#14120f'/>" +
      "<path d='M20 33 Q24 36 28 33' stroke='#14120f' stroke-width='1.6' fill='none' stroke-linecap='round'/>" +
      "</svg></div>" +
      "<div class='cap-bubble'><span class='cap-label'>the captain</span><p></p></div>";
    document.getElementById("hud").appendChild(cap);
    toastEl = cap;
    toastEl._msg = cap.querySelector("p");

    compassEl = document.getElementById("compass");
    compassEl.className = "compass";
    compassEl.setAttribute("aria-hidden", "false");

    compassRose = document.createElement("div");
    compassRose.className = "compass-rose";
    compassRose.innerHTML =
      "<span class='compass-n'>n</span>" +
      "<span class='compass-tick t-e'></span>" +
      "<span class='compass-tick t-s'></span>" +
      "<span class='compass-tick t-w'></span>";
    compassEl.appendChild(compassRose);

    var needle = document.createElement("div");
    needle.className = "compass-needle";
    needle.innerHTML =
      "<svg viewBox='0 0 24 34' width='17' height='24' aria-hidden='true'>" +
      "<path d='M12 1 C16 8 17 14 17 20 C17 27 15 32 12 33 C9 32 7 27 7 20 C7 14 8 8 12 1 Z' " +
      "fill='#ff5a3c' stroke='#f6eedd' stroke-width='2'/></svg>";
    compassEl.appendChild(needle);

    islands.forEach(function (isl) {
      var dot = document.createElement("button");
      dot.className = "compass-dot";
      dot.style.background = "#" + new THREE.Color(isl.def.color).getHexString();
      dot.setAttribute("aria-label", "sail to " + isl.def.name);
      dot.title = isl.def.name;
      dot.addEventListener("click", function (e) {
        e.stopPropagation();
        sailTo(isl);
      });
      compassEl.appendChild(dot);
      compassDots.push(dot);
    });

    counterEl = document.createElement("div");
    counterEl.className = "chip compass-counter";
    counterEl.textContent = "0/" + islands.length + " found";
    compassEl.appendChild(counterEl);

    joyBase = document.createElement("div");
    joyBase.className = "joy-base";
    joyBase.hidden = true;
    joyNub = document.createElement("div");
    joyNub.className = "joy-nub";
    joyBase.appendChild(joyNub);
    document.getElementById("hud").appendChild(joyBase);

    var hintEl = document.getElementById("hint");
    if (hintEl && (navigator.maxTouchPoints > 1 || "ontouchstart" in window)) {
      hintEl.textContent = "drag anywhere to row · or tap the compass to autosail";
    }
    setTimeout(function () {
      if (hintEl) hintEl.classList.add("fade");
    }, 9000);
  }

  var toastTimer = null;
  function toast(msg) {
    toastEl._msg.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 3000);
  }

  function sailTo(isl) {
    autopilot = isl;
    toast("setting sail to: " + isl.def.name + ". sit back, i'll row.");
  }

  /* v6: "dock" now means "beach the canoe". if the keel is already
     in this island's sand, the disembark plays right away; otherwise
     the captain autosails you onto the ring. */
  function dockAt(isl) {
    if (dive || board || land || launch || beached) return;
    if (groundedIsl === isl) startLand(isl);
    else sailTo(isl);
  }

  function updateCounter() {
    var n = Object.keys(visited).length;
    counterEl.textContent = n + "/" + islands.length + " found";
    if (n === islands.length) counterEl.textContent = "all found. hire this man.";
  }

  W.suggestNext = function () {
    var next = null, best = Infinity;
    islands.forEach(function (isl) {
      if (visited[isl.def.id]) return;
      var dx = isl.group.position.x - boat.x, dz = isl.group.position.z - boat.z;
      var d = dx * dx + dz * dz;
      if (d < best) { best = d; next = isl; }
    });
    if (next) toast("next stop: " + next.def.name + "? it's on the compass.");
    else toast("that's the full tour. now hire the man: jantolin@acb.es");
  };

  /* ============================================================
     tick
     ============================================================ */
  var camTarget = new THREE.Vector3(0, 2.5, 140);
  var camPos = new THREE.Vector3();
  var baseFov = 55;

  function tick() {
    var dt = Math.min(clock.getDelta(), 0.05);
    var t = clock.getElapsedTime();
    stepFrame(dt, t);
    renderer.render(scene, camera);
  }

  var sizeCheckN = 0;
  function stepFrame(dt, t) {
    // v8.1: self-heal the canvas size every ~2s — catches every ios case
    // where the viewport settled without firing any event we listen to
    if ((sizeCheckN = (sizeCheckN + 1) % 120) === 0) onResize();
    waterUniforms.uTime.value = t;
    for (var wsI = 0; wsI < windShaders.length; wsI++) {
      windShaders[wsI].uniforms.uTime.value = t;
    }

    if (!paused) {
      if (dive || board || land || launch) { input.throttle = 0; input.turn = 0; autopilot = null; }
      else readInput();
      stepBoat(dt, t);
      checkIslands();
      if (dive) stepDive(dt, t);
      if (board) stepBoard(dt, t);
      if (land) stepLand(dt, t);
      if (launch) stepLaunch(dt, t);
    }
    stepWake(dt, t);
    stepRibbon(t);
    animateWorld(dt, t);
    updateCamera(dt);
    updateCompass();
  }

  /* ---------- boat physics: thrust + drift + banking ---------- */
  function stepBoat(dt, t) {
    var fx = Math.sin(boat.heading), fz = Math.cos(boat.heading);

    var spdK = boat.speed / MAX_SPEED;
    boat.heading += input.turn * dt * (2.7 - 1.0 * spdK) * (input.throttle < 0 ? -0.7 : 1);

    var thrust = input.throttle * THRUST;
    boat.vx += fx * thrust * dt;
    boat.vz += fz * thrust * dt;

    var fwd = boat.vx * fx + boat.vz * fz;
    var lat = boat.vx * fz - boat.vz * fx;
    fwd *= Math.max(0, 1 - dt * 0.9);
    lat *= Math.max(0, 1 - dt * 3.2);
    boat.vx = fx * fwd + fz * lat;
    boat.vz = fz * fwd - fx * lat;
    boat.speed = Math.sqrt(boat.vx * boat.vx + boat.vz * boat.vz);
    if (boat.speed > MAX_SPEED) {
      boat.vx *= MAX_SPEED / boat.speed;
      boat.vz *= MAX_SPEED / boat.speed;
      boat.speed = MAX_SPEED;
    }

    boat.x += boat.vx * dt;
    boat.z += boat.vz * dt;

    var dist = Math.sqrt(boat.x * boat.x + boat.z * boat.z);
    if (dist > BOUND_R) {
      boat.x *= BOUND_R / dist;
      boat.z *= BOUND_R / dist;
      boat.vx *= 0.6; boat.vz *= 0.6;
      if (t - boundaryToastAt > 8) {
        boundaryToastAt = t;
        // which edge? south is home; the other three are an invitation
        var az = Math.atan2(boat.x, boat.z);
        if (Math.abs(az) < Math.PI / 4) {
          toast("south of here it's just gijón and my mother's cooking. neither fits in a portfolio.");
        } else if (Math.abs(az) > Math.PI * 0.75) {
          toast("north edge. the chart stops, the ideas don't — island #5 is unclaimed. want it?");
        } else if (az > 0) {
          toast("east of this buoy the map is blank on purpose. that's room for YOUR island.");
        } else {
          toast("the cartographer stopped rowing here. your brief could finish the map.");
        }
      }
    }
    // the mailto chip lives while you linger at a non-south edge
    if (ctaBtn) {
      var nearEdge = dist > BOUND_R - 10 && Math.abs(Math.atan2(boat.x, boat.z)) >= Math.PI / 4;
      var seqOn = dive || board || land || launch || beached;
      ctaBtn.hidden = !(nearEdge && !seqOn);
    }

    /* spotting home on the southern horizon (only once you sail toward it) */
    if (!gijonToasted && boat.z > 130 && fz > 0.5 && Math.abs(boat.x) < 110 && introT <= 0) {
      gijonToasted = true;
      toast("that's gijón. home. cimadevilla, the harbor, san lorenzo, the letronas. the map ends, the love doesn't.");
    }

    /* v6 · islands are beaches, not walls: the bow runs aground.
       sand friction bleeds speed on the underwater slope, the keel
       grounds on the flat band, and if you arrived pointing at the
       island, the disembark choreography takes over. */
    groundedIsl = null;
    var sandIsl = null, sandD = 1e9;
    for (var si = 0; si < islands.length; si++) {
      var sdx = boat.x - islands[si].group.position.x;
      var sdz = boat.z - islands[si].group.position.z;
      var sd = Math.sqrt(sdx * sdx + sdz * sdz);
      if (sd < sandD) { sandD = sd; sandIsl = islands[si]; }
    }
    boat.sandH = -9; boat.sandIsl = null; boat.sandD = sandD;
    if (sandIsl && sandD < ISLAND_R + 6 && sandIsl.props.heightFn) {
      var slx = boat.x - sandIsl.group.position.x;
      var slz = boat.z - sandIsl.group.position.z;
      var hK = sandIsl.props.heightFn(sandD / ISLAND_R, slx, slz);
      boat.sandH = hK; boat.sandIsl = sandIsl;
      if (hK > -1.4 && !launch) {
        var pen = smoothstep(-1.4, -0.2, hK);
        var fr = Math.max(0, 1 - dt * (1.5 + pen * 10));   // sand drag
        boat.vx *= fr; boat.vz *= fr;
      }
      if (hK > -0.45 && !launch) {
        // keel in the sand: inward motion dies, backing off is allowed
        var nX = slx / sandD, nZ = slz / sandD;            // outward normal
        var vIn = -(boat.vx * nX + boat.vz * nZ);
        if (vIn > 0) { boat.vx += nX * vIn; boat.vz += nZ * vIn; }
        groundedIsl = sandIsl;
        if (!land && !beached && !dive && !board) {
          var intoK = -(Math.sin(boat.heading) * nX + Math.cos(boat.heading) * nZ);
          // real arrivals carry way — a parked hull doesn't re-trigger
          // the walk (post-dive, post-escape). the dock button still
          // offers "hop ashore" for a canoe already sitting in the sand.
          if (intoK > 0.35 && boat.speed > 1.2) startLand(sandIsl);
        }
      }
    }
    for (var i = 0; i < rocks.length; i++) {
      pushOut(rocks[i].x, rocks[i].z, rocks[i].r + 1.6);
    }

    if (boat.speed > 4) {
      wakeTimer -= dt;
      if (wakeTimer <= 0) {
        wakeTimer = 0.09 - 0.04 * spdK;
        var sx = boat.x - fx * 3.6, sz = boat.z - fz * 3.6;
        spawnWake(sx + (Math.random() - 0.5), sz + (Math.random() - 0.5), 1 + spdK * 1.2, 1.2, 0.5);
      }
    }

    var h = waveH(boat.x, boat.z, t);
    // near shore the shader damps the swell — the hull must agree
    var shoreDamp = 1 - 0.55 * smoothstep(58, 26, boat.sandD || 999);
    h *= shoreDamp;
    var hAhead = waveH(boat.x + fx * 3, boat.z + fz * 3, t) * shoreDamp;
    var hSide = waveH(boat.x + fz * 2, boat.z - fx * 2, t) * shoreDamp;
    var floatY = HULL_Y + h;
    var groundK = 0;
    /* v6.1: the hull rests ON the sand — support is the HIGHEST
       terrain point under stern/keel/bow, so a rising slope lifts
       the canoe instead of swallowing the bow. */
    var sternH = -9, bowFwdH = -9;
    if (boat.sandIsl) {
      sternH = islHeightAt(boat.sandIsl, boat.x - fx * 2.7, boat.z - fz * 2.7);
      bowFwdH = islHeightAt(boat.sandIsl, boat.x + fx * 2.7, boat.z + fz * 2.7);
      var support = Math.max(boat.sandH, sternH, bowFwdH);
      if (support > -1.2) {
        var sitY = support - 0.11;                 // keel kisses the sand
        if (sitY > floatY) { groundK = Math.min(1, (sitY - floatY) / 0.35); floatY = sitY; }
      }
    }
    canoe.position.set(boat.x, floatY, boat.z);
    canoe.rotation.y = boat.heading;

    /* hull fix bookkeeping: carve the water + park the foam lip.
       v6: the discard ellipse center leans with the roll so the hole
       never peeks out from under a heeling hull. */
    var rollShift = clamp(boat.roll + boardLean, -0.6, 0.6) * 0.35; // toward the heeling rail
    var pitch = hullGroup.rotation.x;                     // <0 = bow digging in
    var noseK = Math.max(0, -pitch);
    var fwdShift = noseK * 5.0;                           // hole leans toward the bow
    var aHalf = 1.95 + noseK * 9.0 + spdK * 0.35;         // and stretches with the dig
    waterUniforms.uBoatEll.value.set(aHalf * aHalf, 0.62);
    waterUniforms.uBoat.value.set(
      boat.x + fz * rollShift + fx * fwdShift,
      -(boat.z - fx * rollShift + fz * fwdShift),
      boat.heading);
    if (waterLip) {
      waterLip.position.set(boat.x, 0.05 + h, boat.z);
      waterLip.rotation.z = -boat.heading;  // torus lies flat; z spins it in plan
      // meniscus at rest; underway the wake takes over and the hoop look goes
      waterLip.material.opacity = 0.4 * clamp(1 - spdK * 1.4, 0, 1);
    }

    var targetRoll = (input.turn * Math.min(1, spdK * 1.6) * -0.28 + (hSide - h) * 0.15) * (1 - groundK) + boardLean;
    boat.roll += (targetRoll - boat.roll) * Math.min(1, dt * 5);
    hullGroup.rotation.z = boat.roll;
    // grounded: the hull pitches tangent to the sand it sits on
    var bowLift = groundK > 0 ? clamp((bowFwdH - Math.max(sternH, -1.5)) * 0.17, 0, 0.3) : 0;
    hullGroup.rotation.x = (hAhead - h) * -0.12 * (1 - groundK) - spdK * 0.05 + bowLift;

    /* paddle + paddler animation: real strokes, leaning body, gripping arms.
       while diving or boarding, those sequences own the paddler — hands off. */
    if (dive || board || land || launch) return;
    /* v6.1 · the paddle tells the truth:
       · cadence scales with speed — sprinting means frantic strokes
       · steering locks the blade to the OUTSIDE of the turn: turning
         right = paddling on his left (port), and vice versa
       · reverse throttle = backwater stroke, leaning back */
    var fwdStroke = input.throttle > 0.05;
    var revStroke = input.throttle < -0.05;
    if (fwdStroke || revStroke) {
      paddlePh += dt * (revStroke ? 3.4 : 3.4 + spdK * 4.6 + Math.abs(input.turn) * 0.9);
      var side;
      if (input.turn > 0.3) side = 1;          // turning left → starboard blade
      else if (input.turn < -0.3) side = -1;   // turning right → port blade
      else side = Math.sin(paddlePh * 0.5) > 0 ? 1 : -1;
      var sw = Math.sin(paddlePh);
      paddle.rotation.z = Math.PI / 3.1 * side;               // steeper: blade reaches water
      paddle.rotation.x = (revStroke ? -sw : sw) * 0.5;       // reverse sweeps the other way
      paddle.position.y = 2.2 - Math.abs(sw) * 0.4;           // dig on the pull
      paddler.rotation.z = sw * 0.1 * side;
      paddler.rotation.x = revStroke
        ? -0.07 + Math.sin(paddlePh + 0.9) * 0.07             // leans back, pushing water
        : 0.08 + Math.sin(paddlePh + 0.9) * 0.1;              // leans into the stroke
      if (Math.abs(sw) > 0.93 && wakePool.length) {
        var px = boat.x + fz * 1.6 * side, pz = boat.z - fx * 1.6 * side;
        spawnWake(px, pz, 0.5, 0.7, 0.55);
      }
    } else {
      // resting pose: paddle laid across the gunwales
      paddle.rotation.x += (0 - paddle.rotation.x) * dt * 3;
      paddle.rotation.z += (Math.PI / 2 - paddle.rotation.z) * dt * 3;
      paddle.position.y += (2.0 - paddle.position.y) * dt * 3;
      paddler.rotation.z += (Math.sin(t * 1.2) * 0.04 - paddler.rotation.z) * dt * 3;
      paddler.rotation.x += (0 - paddler.rotation.x) * dt * 3;
    }
    solveArms();
  }

  function pushOut(cx, cz, r) {
    var dx = boat.x - cx, dz = boat.z - cz;
    var d = Math.sqrt(dx * dx + dz * dz);
    if (d < r && d > 0.01) {
      boat.x = cx + (dx / d) * r;
      boat.z = cz + (dz / d) * r;
      var dot = (boat.vx * dx + boat.vz * dz) / d;
      if (dot < 0) {
        boat.vx -= (dx / d) * dot;
        boat.vz -= (dz / d) * dot;
      }
      boat.vx *= 0.86;
      boat.vz *= 0.86;
    }
  }

  function checkIslands() {
    var prev = nearIsland;
    nearIsland = null;
    islands.forEach(function (isl) {
      var dx = boat.x - isl.group.position.x;
      var dz = boat.z - isl.group.position.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      isl.dist = d;
      if (d < isl.dockR) nearIsland = isl;
    });
    // no beach prompt while a sequence owns the paddler
    if (land || launch || beached || dive || board) {
      dockBtn.hidden = true;
      if (nearIsland) setHudTint(nearIsland.def.color);
      return;
    }
    if (nearIsland && nearIsland !== prev) {
      toast("land ho: " + nearIsland.def.name);
      setHudTint(nearIsland.def.color);
    } else if (!nearIsland && prev) {
      setHudTint(null);
    }
    if (nearIsland) {
      dockBtn.hidden = false;
      // v8: the ⏎ is a keyboard promise — don't make it to fingers
      var enterHint = (navigator.maxTouchPoints > 1 || "ontouchstart" in window) ? "" : " ⏎";
      dockBtn.textContent = (groundedIsl === nearIsland
        ? "hop ashore"
        : "beach at " + nearIsland.def.name) + enterHint;
    } else {
      dockBtn.hidden = true;
    }
    // v8.1: css hook (no :has — ios) so the hint yields to any bottom prompt
    if (hudEl) hudEl.classList.toggle("prompt-up", !dockBtn.hidden || !!(ctaBtn && !ctaBtn.hidden));
  }

  /* v4: the HUD borrows the island's color while you're in its waters.
     text color flips ink/cream by YIQ luminance so contrast stays AA. */
  function setHudTint(hex) {
    var rootStyle = document.documentElement.style;
    if (hex === null || hex === undefined) {
      rootStyle.removeProperty("--hud-tint");
      rootStyle.removeProperty("--hud-tint-text");
      return;
    }
    var r = (hex >> 16) & 255, gg = (hex >> 8) & 255, b = hex & 255;
    var yiq = (r * 299 + gg * 587 + b * 114) / 1000;
    rootStyle.setProperty("--hud-tint", "#" + new THREE.Color(hex).getHexString());
    rootStyle.setProperty("--hud-tint-text", yiq >= 140 ? "#14120f" : "#f6eedd");
    // darker variant for small tinted text sitting on cream (labels)
    var dk = new THREE.Color(hex);
    if (yiq >= 140) dk.multiplyScalar(0.52);
    rootStyle.setProperty("--hud-tint-deep", "#" + dk.getHexString());
  }

  /* ---------- world life ---------- */
  function animateWorld(dt, t) {
    flyers.forEach(function (s) {
      if (s.cloud) {
        s.obj.position.x += s.obj.userData.speed * dt;
        if (s.obj.position.x > 260) s.obj.position.x = -260;
      } else {
        var u = s.obj.userData;
        var a = t * u.sp + u.ph;
        s.obj.position.set(Math.cos(a) * u.r + boat.x * 0.25, u.h + Math.sin(t + u.ph) * 2, Math.sin(a) * u.r + boat.z * 0.25);
        s.obj.rotation.y = -a - Math.PI / 2;
        var flap = Math.sin(t * 7 + u.ph) * 0.5;
        u.w1.rotation.z = flap;
        u.w2.rotation.z = -flap;
      }
    });

    buoys.forEach(function (b) {
      b.obj.position.y = waveH(b.x, b.z, t) * (b.amp || 0.8);
      b.obj.rotation.z = Math.sin(t * 1.1 + b.x) * 0.07;
    });

    petals.forEach(function (p, i) {
      var u = p.userData;
      var a = t * u.sp + u.ph;
      p.position.set(
        u.home.x + Math.cos(a) * u.r,
        u.h + Math.sin(t * 0.7 + i) * 2.2,
        u.home.z + Math.sin(a) * u.r
      );
      p.rotation.set(t * 0.6 + i, a, Math.sin(t + i));
    });

    if (searchlight) {
      var beam = searchlight.beam;
      beam.rotation.z = Math.PI / 5.2;
      beam.rotation.y = t * 0.45;
      beam.material.opacity = 0.11 + Math.sin(t * 2.2) * 0.03;
    }
    if (beacon) {
      var blink = (Math.sin(t * 4.2) > 0.2) ? 1 : 0.15;
      beacon.material.color.setHex(blink === 1 ? 0xff2a1a : 0x5c1410);
      beacon.scale.setScalar(blink === 1 ? 1.15 : 0.9);
    }

    fishes.forEach(function (f) {
      f.t += dt;
      if (f.t > f.dur) {
        f.obj.visible = false;
        if (f.t > f.dur + 4 + Math.random() * 6 && boat.speed > 3) {
          for (var att = 0; att < 8; att++) {
            var ang = boat.heading + (Math.random() - 0.5) * 2.4;
            var d0 = 10 + Math.random() * 14;
            var sx = boat.x + Math.sin(ang) * d0;
            var sz = boat.z + Math.cos(ang) * d0;
            var la = Math.random() * Math.PI * 2;
            var ldx = Math.sin(la) * 7, ldz = Math.cos(la) * 7;
            if (!fishSpotClear(sx, sz)) continue;
            if (!fishSpotClear(sx + ldx * 0.33, sz + ldz * 0.33)) continue;
            if (!fishSpotClear(sx + ldx * 0.66, sz + ldz * 0.66)) continue;
            if (!fishSpotClear(sx + ldx, sz + ldz)) continue;
            f.x0 = sx; f.z0 = sz;
            f.dx = ldx; f.dz = ldz;
            f.t = 0;
            // v6: every leap is an individual — size + banking direction
            f.scl = 0.75 + hash2(sx, sz) * 0.55;
            f.bank = (hash2(sz, sx) - 0.5) * 0.9;
            f.obj.scale.setScalar(f.scl);
            f.obj.visible = true;
            spawnWake(f.x0, f.z0, 0.5, 0.6, 0.5);
            break;
          }
        }
        return;
      }
      var k = f.t / f.dur;
      var x = f.x0 + f.dx * k;
      var z = f.z0 + f.dz * k;
      var y = Math.sin(k * Math.PI) * 4.2;
      f.obj.position.set(x, y, z);
      f.obj.lookAt(x + f.dx, y + Math.cos(k * Math.PI) * 6, z + f.dz);
      // v6: banking into the arc + a subtle tail wag
      f.obj.rotateZ(Math.sin(k * Math.PI) * f.bank);
      if (f.tail) f.tail.rotation.y = Math.sin(t * 13 + f.ph) * 0.4 * (1 - k * 0.5);
      if (k > 0.94) spawnWake(x, z, 0.5, 0.6, 0.5);
    });

    /* light motes drift around the boat */
    if (motes) {
      motes.position.x += (boat.x - motes.position.x) * dt * 0.4;
      motes.position.z += (boat.z - motes.position.z) * dt * 0.4;
      motes.rotation.y = t * 0.02;
      motes.material.opacity = 0.35 + Math.sin(t * 0.7) * 0.12;
    }

    if (welcomeBoard) {
      var wd = Math.sqrt(boat.x * boat.x + (boat.z - BUOY_Z) * (boat.z - BUOY_Z));
      welcomeBoard.material.opacity = clamp((130 - wd) / 50, 0, 1);
      welcomeBoard.visible = welcomeBoard.material.opacity > 0.02;
      welcomeBoard.position.y = 7 + Math.sin(t * 0.9) * 0.4;
      welcomeBoard.lookAt(camera.position);
    }

    islands.forEach(function (isl) {
      var id = isl.def.id, pr = isl.props;

      if (pr.nameBoard) {
        pr.nameBoard.lookAt(camera.position);
        var dd = isl.dist !== undefined ? isl.dist : 999;
        pr.nameBoard.material.opacity = clamp((250 - dd) / 110, 0, 1);
        pr.nameBoard.visible = pr.nameBoard.material.opacity > 0.02;
        pr.nameBoard.position.y = (pr.boardY || 26) + Math.sin(t * 0.9 + isl.group.position.x) * 0.5;
      }

      if (id === "capullos") {
        if (pr.buds) {
          var targetOpen = isl.dist < 80 ? 1 : 0;
          pr.buds.forEach(function (b) {
            b.open += (targetOpen - b.open) * dt * (1.2 + b.phase * 0.15);
            var o = b.open;
            b.head.scale.set(1 + o * 1.05, 1 - o * 0.34, 1 + o * 1.05);
            b.head.rotation.y = o * 0.5 + b.phase;
          });
        }
        /* fireflies: lazy loops between the buds, twinkling */
        if (pr.fireflies && isl.dist < 160) {
          var fp = pr.fireflies.points.geometry.attributes.position;
          var fm = pr.fireflies.meta;
          for (var fj = 0; fj < fm.length; fj++) {
            var m2 = fm[fj];
            var ang2 = m2.a + t * m2.sp;
            fp.setXYZ(fj,
              Math.cos(ang2) * m2.r + Math.sin(t * 0.6 + m2.ph) * 1.4,
              m2.h + Math.sin(t * 0.9 + m2.ph * 2.0) * 1.6,
              Math.sin(ang2) * m2.r + Math.cos(t * 0.5 + m2.ph) * 1.4);
          }
          fp.needsUpdate = true;
          pr.fireflies.points.material.opacity = 0.55 + Math.sin(t * 2.1) * 0.35;
        }
      }

      if (id === "talens-pantone") {
        if (pr.chips) {
          pr.chips.forEach(function (c, ci) {
            c.rotation.z = Math.sin(t * 0.6 + ci * 1.3) * 0.02;
          });
        }
        if (pr.orbit) {
          pr.orbit.rotation.y = t * 0.22;
          pr.orbit.position.y = 15.5 + Math.sin(t * 0.5) * 0.7;
        }
      }

      if (id === "ministerie" && pr.eyeGroup) {
        var ex = boat.x - isl.group.position.x;
        var ez = boat.z - isl.group.position.z;
        var eyeTarget = Math.atan2(ex, ez);
        pr.eyeGroup.rotation.y += normAngle(eyeTarget - pr.eyeGroup.rotation.y) * Math.min(1, dt * 2.5);
        if (pr.cage) {
          pr.cage.rotation.y = t * 0.3;
          pr.cage.rotation.x = Math.sin(t * 0.23) * 0.18;
        }
        if (pr.coil) {
          pr.coil.rotation.y = -t * 0.55;
          pr.coil.rotation.z = t * 0.19;
          pr.coil.material.opacity = 0.6 + Math.sin(t * 2.7) * 0.3;
          var cs = 1 + Math.sin(t * 2.7) * 0.05;
          pr.coil.scale.setScalar(cs);
        }
      }
    });
  }

  /* ---------- camera: cinematic, speed-aware ---------- */
  /* v5: during the dive the camera leaves the boat rig, follows the
     diver's arc, and sinks below the surface after the splash — the
     underwater veil (main.js) catches the frame there. */
  var _diverPos = new THREE.Vector3();
  function updateDiveCamera(dt) {
    var fx = Math.sin(boat.heading), fz = Math.cos(boat.heading);
    var rx = fz, rz = -fx;
    var d = dive.t;
    if (paddler.visible) {
      paddler.getWorldPosition(_diverPos);
      _diverPos.y += 1.6;   // frame chest/head, not feet
    } else {
      // splash point, sinking with him
      _diverPos.set(boat.x + rx * 3.7, _diverPos.y - dt * 2.2, boat.z + rz * 3.7);
    }
    // dolly: ease in from the sailing rig toward a closer, lower seat
    var inK = smoothstep(0, 1.1, d);
    var back = 19 - 7 * inK;
    var height = 10.5 - 4.6 * inK;
    // after the splash, sink under the surface (veil covers the crossing)
    var sinkK = dive.splashed ? smoothstep(0.3, 1.0, d - dive.splashAt) : 0;
    var want = _v1.set(
      boat.x - fx * back + rx * 1.5,
      height * (1 - sinkK) + sinkK * -2.6,
      boat.z - fz * back + rz * 1.5
    );
    camPos.lerp(want, Math.min(1, dt * 3.2));
    camera.position.copy(camPos);
    camTarget.lerp(_v2.set(_diverPos.x, Math.max(_diverPos.y, sinkK > 0 ? -1.6 : -0.4), _diverPos.z), Math.min(1, dt * 4.5));
    camera.lookAt(camTarget);
  }

  /* board camera: breaks the surface with us, sits low and close for the
     climb, then eases back to the sailing rig as he settles */
  function updateBoardCamera(dt) {
    var fx = Math.sin(boat.heading), fz = Math.cos(boat.heading);
    var rx = fz, rz = -fx;
    var b = board.t;
    var upK = smoothstep(0, 0.6, b);
    var outK = smoothstep(B_LEAP, B_END, b);
    var want = _v1.set(
      boat.x - fx * lerp(7.5, 19, outK) + rx * lerp(6.5, 0, outK),
      lerp(lerp(-2.6, 3.8, upK), 10.5, outK),
      boat.z - fz * lerp(7.5, 19, outK) + rz * lerp(6.5, 0, outK)
    );
    camPos.lerp(want, Math.min(1, dt * 3.6));
    camera.position.copy(camPos);
    paddler.getWorldPosition(_diverPos);
    camTarget.lerp(_v2.set(
      lerp(_diverPos.x, boat.x + fx * 11, outK),
      lerp(_diverPos.y + 1.3, 2.5, outK),
      lerp(_diverPos.z, boat.z + fz * 11, outK)
    ), Math.min(1, dt * 4.2));
    camera.lookAt(camTarget);
  }

  /* v6 · the beaching is a composed shot, one per island: each
     frame keeps the paddler in the foreground and the island's
     memorable moment (buds / crane+hoop / gold frame / the eye)
     in the top of the composition. hud tint does the palette. */
  var LAND_CAMS = {
    "capullos":        { side: 8,   back: 15, h: 5,   heroY: 9,  mix: 0.42 },
    "liga-u-strategy": { side: -12, back: 19, h: 6.5, heroY: 7, mix: 0.6 },
    "talens-pantone":  { side: 9,   back: 16, h: 6,   heroY: 16, mix: 0.5 },
    "ministerie":      { side: 6,   back: 13, h: 3.4, heroY: 25, mix: 0.55 },
  };
  function updateLandCamera(dt) {
    var C = LAND_CAMS[land.isl.def.id] || LAND_CAMS["capullos"];
    var rX = land.dirZ, rZ = -land.dirX;   // right of the approach
    var want = _v1.set(
      boat.x - land.dirX * C.back + rX * C.side,
      C.h,
      boat.z - land.dirZ * C.back + rZ * C.side
    );
    camPos.lerp(want, Math.min(1, dt * 2.6));
    camera.position.copy(camPos);
    paddler.getWorldPosition(_diverPos);
    var hx = land.isl.group.position.x, hz = land.isl.group.position.z;
    camTarget.lerp(_v2.set(
      lerp(_diverPos.x, hx, C.mix),
      lerp(_diverPos.y + 1.4, C.heroY, C.mix),
      lerp(_diverPos.z, hz, C.mix)
    ), Math.min(1, dt * 3.4));
    camera.lookAt(camTarget);
  }

  function updateCamera(dt) {
    if (dive) { updateDiveCamera(dt); return; }
    if (board) { updateBoardCamera(dt); return; }
    if (land) { updateLandCamera(dt); return; }
    var spdK = boat.speed / MAX_SPEED;
    var fx = Math.sin(boat.heading), fz = Math.cos(boat.heading);
    var rx = fz, rz = -fx;

    /* v4: when you get close to an island the camera eases back and
       tilts up, so crowns (the eye, the frame, the hoop) stay in shot */
    var nd = 999;
    for (var ni = 0; ni < islands.length; ni++) {
      if (islands[ni].dist !== undefined && islands[ni].dist < nd) nd = islands[ni].dist;
    }
    var nearK = 1 - smoothstep(46, 95, nd);

    var back = 19 + spdK * 5 + nearK * 4;
    var height = 10.5 + spdK * 2.5 + nearK * 2.2;
    var side = input.turn * -2.2 * spdK;

    var want = new THREE.Vector3(
      boat.x - fx * back + rx * side,
      height,
      boat.z - fz * back + rz * side
    );

    if (introT > 0) {
      introT -= dt;
      var k = Math.min(1, dt * (0.8 + (3.6 - introT) * 0.35));
      camPos.copy(camera.position).lerp(want, k * 0.55);
    } else {
      camPos.lerp(want, Math.min(1, dt * 2.6));
    }
    camera.position.copy(camPos);

    camTarget.lerp(new THREE.Vector3(boat.x + fx * 11, 2.5 + nearK * 6.5, boat.z + fz * 11), Math.min(1, dt * 3.2));
    camera.lookAt(camTarget);

    var wantFov = baseFov + spdK * 7;
    if (Math.abs(camera.fov - wantFov) > 0.05) {
      camera.fov += (wantFov - camera.fov) * Math.min(1, dt * 3);
      camera.updateProjectionMatrix();
    }
  }

  /* ---------- compass ---------- */
  function updateCompass() {
    var relN = Math.PI - boat.heading;
    compassRose.style.transform = "rotate(" + (-relN) + "rad)";
    islands.forEach(function (isl, i) {
      var dx = isl.group.position.x - boat.x;
      var dz = isl.group.position.z - boat.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      var rel = Math.atan2(dx, dz) - boat.heading;
      var r = 15 + Math.min(1, d / 420) * 29;
      var x = -Math.sin(rel) * r;
      var y = -Math.cos(rel) * r;
      var dot = compassDots[i];
      dot.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
      dot.classList.toggle("visited", !!visited[isl.def.id]);
      dot.classList.toggle("targeted", autopilot === isl);
    });
  }

  /* v8.1 · sizing that survives ios safari. after a reload (esp. pull-to-
     refresh) ios can hand us a stale innerWidth/innerHeight and settle the
     real viewport later WITHOUT a resize event — the canvas was left
     smaller than the screen (dark html background showing right + bottom).
     the truth is the #stage box itself (fixed, inset:0 → tracks the
     dynamic viewport), so we measure it, listen to every signal ios does
     emit, and self-heal periodically from the frame loop. */
  var lastW = 0, lastH = 0;
  function onResize() {
    var w = (stageEl && stageEl.clientWidth) || window.innerWidth;
    var h = (stageEl && stageEl.clientHeight) || window.innerHeight;
    if (!w || !h) return;                       // stage display:none (menu mode)
    if (w === lastW && h === lastH) return;
    lastW = w; lastH = h;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
})();
