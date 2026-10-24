/* world.js — the sea, the canoe, the five islands. v3 "painted gold"
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
   ============================================================
   ART DIRECTION (v9) — every island gets ai direction's recipe
   ============================================================
   one hero with a silhouette you read from the spawn, its own light in
   ONE unlit vertex-color mesh (+ a glow or two), clean ground with merged
   props, and a moment that happens when you sail within ~90 (frozen
   under reduced motion). ≤14 draw calls per island. shading untouched:
   still toonMat + the 4-step ramp (jorge rejected ink, gouache, clay).
     · liga u: "the pavilion". the court now lives under a big barrel
       roof on ten columns — cream with yellow ribs, glazed lunettes at
       both arched ends, a skylight on the ridge and "liga u" on top.
       stands with a crowd, a center-hung scoreboard. sail in: the lights
       come on and the crowd does the wave. the giant sea hoop is GONE
       (jorge: "no me gusta nada la canasta en el agua").
     · capullos: "the gang". capullo = bud AND little punk. the boss is
       a giant bud with a fuchsia petal mohawk and shades; six small
       punks with angry brows; a tagged garden wall; bulbs up the hill.
       sail in: every head turns to stare at you and the boss pops gum.
     · talens x pantone: "the two halves" (supersedes "the grey
       gallery"): a chain-link fence with a barbed coil splits the island
       into color and joy vs grey misery. sail in: the swatch fan opens
       and swatches jump the fence onto the grey side.
     · ministerie: "the watcher": a faceted obsidian shard with red
       slits, the eye in a solid lens bezel, a scan ring, a searchlight,
       a ring of cctv cameras. sail in: they all lock onto the canoe.
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
  var ctxLostTimer = 0;
  var tWave = 0;   // v8.7: the time the WATER lives on (frozen under reduced motion); hull + shader share it
  var tier = "high";
  var onDockCb = null;
  var introT = 0;

  /* v8.5: ONE touch-device answer for the whole module (was recomputed
     per-frame in checkIslands and re-derived in bindHud) */
  var TOUCH_DEV = navigator.maxTouchPoints > 1 || "ontouchstart" in window;
  var input = { throttle: 0, turn: 0, touching: false, tx: 0, ty: 0, manual: false };
  /* v8.4 · one-finger rowing "arms" after a short window (time or travel) so
     planting two fingers for a pinch never rows and never cancels autosail */
  var rowT0 = 0, rowMoved = 0;
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
              (opts.wind ? 1 : 0) + (opts.flat ? 1 : 0) + (opts.ds ? 1 : 0) + (opts.wave ? 1 : 0);
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
    var wave = !!opts.wave;
    if (wave) mat.userData.uWave = { value: 0 };
    if (rim > 0 || wind || wave) {
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
        /* v9 · "the wave": a stadium crowd rises in a travelling crest.
           each figure is ~0.9 wide along local x, so snap x to its seat */
        if (wave) {
          shader.uniforms.uWave = mat.userData.uWave;
          shader.vertexShader = shader.vertexShader
            .replace("#include <common>", "#include <common>\nuniform float uTime;\nuniform float uWave;")
            .replace("#include <begin_vertex>", [
              "#include <begin_vertex>",
              "float fxw = floor(position.x / 0.9 + 0.5) * 0.9;",
              "float wv = pow(max(0.0, sin(uTime * 2.4 - fxw * 0.35)), 8.0);",
              "transformed.y += wv * 0.6 * uWave;",
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
        if (wind || wave) windShaders.push(shader);
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
    if (renderer) return Promise.resolve();   // v8.7: a second init must never build a second world
    tier = opts.tier || "high";
    onDockCb = opts.onDock || function () {};
    var container = opts.container;
    stageEl = container;

    renderer = new THREE.WebGLRenderer({
      antialias: tier !== "low",
      powerPreference: "default",   // v8.7: "high-performance" woke the discrete gpu on dual-gpu macbooks for a toon scene
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
    fogN0 = scene.fog.near; fogF0 = scene.fog.far;   // v8.4: chart-view scales these

    baseFov = fovForAspect(w0 / h0);
    camera = new THREE.PerspectiveCamera(baseFov, w0 / h0, 0.5, 900);
    var reducedMotion = rmQ && rmQ.matches;   // v8.5: one cached MediaQueryList (rmQ), always live
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
    /* v8.7: the old stop()/start() pair reset clock.elapsedTime to 0 on every
       tab return (three r128 start() zeroes it), so the wake ribbon's point
       ages went hugely negative — a giant cream smear after alt-tabbing, and
       every t-based timer jumped. rAF already sleeps in hidden tabs and dt is
       capped at 0.05, so nothing needs stopping. held keys are dropped
       though: keyup never arrives for a key released in another window. */
    document.addEventListener("visibilitychange", function () { keys = {}; });
    window.addEventListener("blur", function () { keys = {}; });

    /* v8.7: webgl context loss. three r128 swallows it silently, which on iOS
       (backgrounded tab) leaves a dead canvas. give it a few seconds to come
       back, then tell main.js so dry land can take over. */
    renderer.domElement.addEventListener("webglcontextlost", function (e) {
      e.preventDefault();
      clearTimeout(ctxLostTimer);
      ctxLostTimer = setTimeout(function () { if (opts.onLost) opts.onLost(); }, 3500);
    });
    renderer.domElement.addEventListener("webglcontextrestored", function () { clearTimeout(ctxLostTimer); });

    renderer.setAnimationLoop(tick);
    return Promise.resolve();
  };

  W.setPaused = function (p) {
    paused = p;
    /* v8.5 · pausing mid-choreography can only mean the sea was escaped
       (mode switch) — a case never opens while one runs. cancel instead of
       freezing an orphaned sequence: pose reset is invisible (the stage is
       hidden in content mode) and "instant escape" stays true at world
       level too. beached is NOT cancelled — beached+pause IS the open-case
       contract. */
    if (p && (dive || board || land || launch)) {
      dive = null; board = null; land = null; launch = null;
      boardLean = 0;
      resetPaddlerPose();
    }
    /* the case pauses the world while we're beached; only when it has
       actually been open (p:true seen) does unpausing mean "case
       closed" — then the light relaunch plays itself. this dodges
       main.js's closeCase-inside-openCase unpause blip. */
    if (p && beached && beached.parked) beached.caseOpened = true;
    if (!p && beached && beached.parked && beached.caseOpened) startLaunch();
    /* v8.7: in dry-land mode #stage is display:none, yet the loop kept running
       a full 60fps render for nobody. stop it while paused (an open case keeps
       it alive — beached+paused is the ios self-heal contract in AGENTS.md)
       and restart cleanly, with a fresh dt, on resume. */
    if (renderer) {
      if (p && !beached) renderer.setAnimationLoop(null);
      else if (!p) { clock.getDelta(); onResize(); renderer.setAnimationLoop(tick); }
    }
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
    var reduced = rmQ && rmQ.matches;   // v8.5: one cached MediaQueryList (rmQ), always live
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
    var reduced = rmQ && rmQ.matches;   // v8.5: one cached MediaQueryList (rmQ), always live
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
    var reduced = rmQ && rmQ.matches;   // v8.5: one cached MediaQueryList (rmQ), always live
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
    var reduced = rmQ && rmQ.matches;   // v8.5: one cached MediaQueryList (rmQ), always live
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
      zoom: Math.round(camUser.zoom * 100) / 100,
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

    /* v8.8: one foam ring / swell damp per island in config — the shader
       array is sized by a #define from defs.length (it was hard-wired to 4,
       so a 5th island got no foam AND the hull desynced: stepBoat's shoreDamp
       already loops every island). GLSL ES 1.0 needs a constant loop bound,
       hence the define instead of a uniform count. */
    var isl = [];
    var nIsl = Math.max(1, defs.length);
    for (var i = 0; i < nIsl; i++) {
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
      defines: { NUM_ISL: nIsl },
      vertexShader: [
        "uniform float uTime;",
        "uniform vec2 uIsl[NUM_ISL];",
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
        "  for (int i = 0; i < NUM_ISL; i++) { dmin = min(dmin, distance(pos.xy, uIsl[i])); }",
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
      m.position.y = 0.25 + waveH(m.position.x, m.position.z, tWave) * 0.7;
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
      var y = 0.22 + waveH(p.x, p.z, tWave) * 0.75;
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

  /* v9 · a barrel-vault roof: top + underside + trims, local y=0 at the
     springing line, spanning z ∈ [-H, H] and x ∈ [-L/2, L/2] */
  function vaultGeo(L, H, rise, th, segs, hexEdge, hexTop, hexUnder, hexTrim, opts) {
    var yAt = function (i) { var k = -1 + 2 * i / segs; return rise * (1 - k * k); };
    var zAt = function (i) { return -H + 2 * H * i / segs; };
    var mk = function (pos, idx) {
      var gg = new THREE.BufferGeometry();
      gg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      gg.setIndex(idx);
      gg.computeVertexNormals();
      return gg;
    };
    var top = [], under = [], ends = [], ti = [], ui = [], ei = [];
    for (var i = 0; i <= segs; i++) {
      top.push(-L / 2, yAt(i) + th, zAt(i), L / 2, yAt(i) + th, zAt(i));
      under.push(-L / 2, yAt(i), zAt(i), L / 2, yAt(i), zAt(i));
      if (i < segs) {
        var a = i * 2, b = a + 1, c = a + 2, d = a + 3;
        ti.push(a, c, b, b, c, d);
        ui.push(a, b, c, b, d, c);
      }
    }
    /* arched end trims (x = ±L/2), each its own strip */
    for (var sx = -1; sx <= 1; sx += 2) {
      var o = ends.length / 3;
      for (var j = 0; j <= segs; j++) ends.push(sx * L / 2, yAt(j), zAt(j), sx * L / 2, yAt(j) + th, zAt(j));
      for (j = 0; j < segs; j++) {
        var u0 = o + j * 2, t0 = u0 + 1, u1 = u0 + 2, t1 = u0 + 3;
        if (sx < 0) ei.push(u0, u1, t0, t0, u1, t1);
        else ei.push(u0, t0, u1, u1, t0, t1);
      }
    }
    /* side trims along the eaves (z = ±H) */
    var sides = [-L / 2, 0, -H, L / 2, 0, -H, -L / 2, th, -H, L / 2, th, -H,
                 -L / 2, 0, H, L / 2, 0, H, -L / 2, th, H, L / 2, th, H];
    var gTop = tint(mk(top, ti), hexEdge, hexTop, th, rise * 0.8 + th);
    var extra = [];
    /* raised ribs across the roof, every ribStep along x */
    if (opts && opts.ribs) {
      for (var rx = -L / 2 + opts.ribStep / 2; rx < L / 2; rx += opts.ribStep) {
        var rp = [], ri = [];
        for (var q = 0; q <= segs; q++) rp.push(rx - 0.22, yAt(q) + th + 0.13, zAt(q), rx + 0.22, yAt(q) + th + 0.13, zAt(q));
        for (q = 0; q < segs; q++) { var qa = q * 2; ri.push(qa, qa + 2, qa + 1, qa + 1, qa + 2, qa + 3); }
        extra.push(tint(mk(rp, ri), opts.ribs));
      }
    }
    var gUnder = tint(mk(under, ui), hexUnder);
    var gEnds = tint(mk(ends, ei), hexTrim);
    var gSides = tint(mk(sides, [0, 2, 1, 1, 2, 3, 4, 5, 6, 5, 7, 6]), hexTrim);
    return mergeGeos([gTop, gUnder, gEnds, gSides].concat(extra));
  }

  /* v9 · four textured faces of a box (±x, ±z), one geometry with uvs */
  function boxFacesGeo(w, h, d) {
    var pos = [], uv = [], nor = [], idx = [];
    for (var f = 0; f < 4; f++) {
      var pl = new THREE.PlaneGeometry(f % 2 ? d : w, h);
      pl.translate(0, 0, (f % 2 ? w : d) / 2);
      pl.applyMatrix4(new THREE.Matrix4().makeRotationY(f * Math.PI / 2));
      var o = pos.length / 3;
      for (var i = 0; i < 4; i++) {
        pos.push(pl.attributes.position.getX(i), pl.attributes.position.getY(i), pl.attributes.position.getZ(i));
        nor.push(pl.attributes.normal.getX(i), pl.attributes.normal.getY(i), pl.attributes.normal.getZ(i));
        uv.push(pl.attributes.uv.getX(i), pl.attributes.uv.getY(i));
      }
      for (var k = 0; k < pl.index.count; k++) idx.push(pl.index.array[k] + o);
      pl.dispose();
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    return geo;
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

      /* v9 · "capullos" are flower buds AND little punks, so the garden is a
         gang. the boss: one giant bud on the big mound with a fuchsia petal
         mohawk and shades, blowing gum. around him, six small punks with
         angry brows (one InstancedMesh). a garden wall with the tag, and a
         string of bulbs climbing from the beach. when you sail in, every
         head turns to stare at the canoe and the boss pops a bubble. */
      var spA = Math.atan2(0 - isl.def.pos[0], SPAWN_Z - isl.def.pos[1]);   // toward the spawn
      var CR = [0xff2f8a, 0xff6fb0];   // the mohawk fuchsia
      var stat = [];   // stems, wall, posts, string, trees → ONE toon mesh
      var bulbs = [];  // the lit bulbs → ONE unlit mesh

      /* the boss: a tall curved stem up the main mound */
      var bossX = -6, bossZ = -4, bossY0 = hFn(Math.sqrt(bossX * bossX + bossZ * bossZ) / ISLAND_R, bossX, bossZ) - 0.4;
      var STEM = 9;
      var stemCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(bossX, bossY0, bossZ),
        new THREE.Vector3(bossX - 0.6, bossY0 + STEM * 0.4, bossZ - 0.3),
        new THREE.Vector3(bossX + 0.4, bossY0 + STEM * 0.75, bossZ + 0.2),
        new THREE.Vector3(bossX, bossY0 + STEM, bossZ),
      ]);
      var bStem = new THREE.TubeGeometry(stemCurve, 12, 0.55, 7, false);
      stat.push(tint(bStem, COL.greenDark, COL.green, bossY0, bossY0 + STEM));
      for (var lf = 0; lf < 2; lf++) {
        var leaf = new THREE.SphereGeometry(1, 8, 6);
        leaf.scale(0.7, 0.18, 2.1);
        leaf.translate(0, 0, 1.9);
        leaf.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.45));
        tint(leaf, COL.greenDark, COL.greenLight, -0.3, 0.6);
        stat.push(placed(leaf, bossX, bossY0 + 2.6 + lf * 2.2, bossZ, spA + 1.4 + lf * 2.9, 1));
      }

      /* the boss's head: bud + wrapping petals + sepals + mohawk + shades.
         local +z is his face; the group turns to look at you */
      var bossHead = new THREE.Group();
      bossHead.position.set(bossX, bossY0 + STEM + 0.4, bossZ);
      bossHead.rotation.y = spA;
      var bh = [];
      var bud = new THREE.SphereGeometry(2.6, 14, 12);
      bud.scale(1, 1.3, 1);
      bud.translate(0, 3.1, 0);
      bh.push(tint(bud, COL.coralDark, 0xff7a5c, 0.5, 6.4));
      for (var wp = 0; wp < 5; wp++) {
        var wrap = new THREE.SphereGeometry(1.4, 9, 7);
        wrap.scale(1.05, 1.95, 0.42);
        wrap.translate(0, 2.4, 2.05);
        wrap.applyMatrix4(new THREE.Matrix4().makeRotationY(wp / 5 * Math.PI * 2 + Math.PI / 5));
        bh.push(tint(wrap, COL.coral, 0xff8a6a, 0.6, 4.8));
      }
      for (var sp = 0; sp < 5; sp++) {
        var sep = new THREE.ConeGeometry(0.75, 2.2, 4);
        sep.translate(0, 1.1, 0);
        sep.applyMatrix4(new THREE.Matrix4().makeRotationX(0.75));
        sep.translate(0, 0.2, 1.1);
        sep.applyMatrix4(new THREE.Matrix4().makeRotationY(sp / 5 * Math.PI * 2));
        bh.push(tint(sep, COL.greenDark, COL.green, 0, 1.6));
      }
      for (var mh2 = 0; mh2 < 7; mh2++) {
        var ma = -1.05 + mh2 * 0.35;                    // front → back over the crown
        var spike = new THREE.ConeGeometry(0.62, 2.1 + Math.sin(mh2 / 6 * Math.PI) * 1.3, 4);
        spike.scale(1, 1, 0.4);
        spike.translate(0, 1.0, 0);
        spike.applyMatrix4(new THREE.Matrix4().makeRotationX(ma));
        spike.translate(0, 3.1 + Math.cos(ma) * 3.2, Math.sin(ma) * 2.5);
        bh.push(tint(spike, CR[0], CR[1], 3.6, 8.5));
      }
      for (var gl3 = -1; gl3 <= 1; gl3 += 2) {
        var lens = new THREE.BoxGeometry(1.25, 0.72, 0.3);
        bh.push(placed(tint(lens, COL.ink, 0x3a3644, -0.4, 0.4), gl3 * 0.78, 3.75, 2.47, gl3 * 0.18, 1));
        var temple = new THREE.BoxGeometry(0.12, 0.12, 1.9);
        bh.push(placed(tint(temple, COL.ink), gl3 * 1.55, 3.85, 1.5, gl3 * 0.35, 1));
      }
      var bridge = new THREE.BoxGeometry(0.5, 0.12, 0.12);
      bh.push(placed(tint(bridge, COL.ink), 0, 3.9, 2.58, 0, 1));
      bossHead.add(new THREE.Mesh(mergeGeos(bh), propMat()));
      /* the gum bubble grows out of his mouth (origin at the lips) */
      var gumG = new THREE.SphereGeometry(1, 14, 10);
      gumG.translate(0, 0, 1);
      var gum = new THREE.Mesh(gumG, toonMat(0xff9ccf, { rim: 0.6, key: "gum" }));
      gum.position.set(0.35, 2.55, 2.5);
      gum.scale.setScalar(0.01);
      bossHead.add(gum);
      g.add(bossHead);

      /* the small punks: one bud-with-a-face geometry, six instances */
      var pk = [];
      var pBud = new THREE.SphereGeometry(1.1, 10, 8);
      pBud.scale(1, 1.25, 1);
      pBud.translate(0, 1.3, 0);
      pk.push(tint(pBud, COL.coralDark, 0xff8a6a, 0.3, 2.6));
      for (var ps = 0; ps < 4; ps++) {
        var pSep = new THREE.ConeGeometry(0.42, 1.1, 4);
        pSep.translate(0, 0.55, 0);
        pSep.applyMatrix4(new THREE.Matrix4().makeRotationX(0.7));
        pSep.translate(0, 0.1, 0.45);
        pSep.applyMatrix4(new THREE.Matrix4().makeRotationY(ps / 4 * Math.PI * 2 + 0.4));
        pk.push(tint(pSep, COL.greenDark, COL.green, 0, 0.8));
      }
      for (var pe = -1; pe <= 1; pe += 2) {
        var eye = new THREE.SphereGeometry(0.2, 6, 5);
        pk.push(placed(tint(eye, COL.ink), pe * 0.4, 1.55, 1.0, 0, 1));
        var brow = new THREE.BoxGeometry(0.6, 0.17, 0.16);
        brow.applyMatrix4(new THREE.Matrix4().makeRotationZ(pe * 0.45));
        pk.push(placed(tint(brow, COL.ink), pe * 0.42, 1.95, 1.0, 0, 1));
      }
      for (var pm2 = 0; pm2 < 3; pm2++) {
        var pSpike = new THREE.ConeGeometry(0.3, 0.9 + (pm2 === 1 ? 0.4 : 0), 4);
        pSpike.scale(1, 1, 0.45);
        pSpike.translate(0, 2.75, -0.45 + pm2 * 0.45);
        pk.push(tint(pSpike, CR[0], CR[1], 2.4, 3.4));
      }
      var punkGeo = mergeGeos(pk);
      var punks = [];
      var pSpots = [[5, 9], [10, 2], [-13, 6], [2, -12], [-1, 3], [-15, -8]];
      pSpots.forEach(function (sp2, pi) {
        var px = sp2[0], pz = sp2[1];
        var py = Math.max(hFn(Math.sqrt(px * px + pz * pz) / ISLAND_R, px, pz), 1.4) - 0.3;
        var ph = 2.4 + hash2(pi, 2.2) * 2.6;
        var pStem = new THREE.CylinderGeometry(0.2, 0.32, ph, 6);
        stat.push(placed(tint(pStem, COL.greenDark, COL.green, -ph / 2, ph / 2), px, py + ph / 2, pz, 0, 1));
        punks.push({ x: px, y: py + ph - 0.15, z: pz, s: 1.0 + hash2(pi, 7.1) * 0.6, yaw: spA + (hash2(pi, 4) - 0.5) * 1.2, k: 3 + hash2(pi, 9) * 5, ph: pi * 1.7 });
      });
      var punkMesh = new THREE.InstancedMesh(punkGeo, propMat(), punks.length);
      g.add(punkMesh);

      /* the garden wall on the spawn side, tagged */
      var wR = 15.5, wA = spA + 0.45;
      var wx = Math.sin(wA) * wR, wz = Math.cos(wA) * wR;
      var wy = Math.max(hFn(wR / ISLAND_R, wx, wz), 1.2);
      var wall = new THREE.BoxGeometry(9.5, 2.6, 0.7);
      tint(wall, 0xb9b0a0, 0xd8d0c0, -1.3, 1.3);
      stat.push(placed(wall, wx, wy + 0.9, wz, wA, 1));
      var cap3 = new THREE.BoxGeometry(9.9, 0.3, 0.95);
      tint(cap3, 0x9a9284);
      stat.push(placed(cap3, wx, wy + 2.35, wz, wA, 1));
      var tag = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.3), new THREE.MeshBasicMaterial({ map: makeTagTexture(), transparent: true }));
      tag.position.set(wx + Math.sin(wA) * 0.37, wy + 1.0, wz + Math.cos(wA) * 0.37);
      tag.rotation.y = wA;
      g.add(tag);

      /* a string of bulbs climbing from the beach to the boss */
      var bA = spA - 0.95;
      var b0x = Math.sin(bA) * 21, b0z = Math.cos(bA) * 21;
      var NP = 6, prev = null;
      var bulbCols = [0xfff1cf, 0xffd23f, 0xff9ccf];
      for (var bp = 0; bp < NP; bp++) {
        var bk = bp / (NP - 1);
        var px2 = lerp(b0x, bossX + 1.5, bk), pz2 = lerp(b0z, bossZ + 1.5, bk);
        var py2 = Math.max(hFn(Math.sqrt(px2 * px2 + pz2 * pz2) / ISLAND_R, px2, pz2), 1.2) - 0.2;
        var post = new THREE.CylinderGeometry(0.08, 0.11, 3.0, 5);
        stat.push(placed(tint(post, COL.woodDark), px2, py2 + 1.5, pz2, 0, 1));
        var top = new THREE.Vector3(px2, py2 + 3.0, pz2);
        if (prev) {
          for (var sg = 0; sg < 5; sg++) {
            var k0 = sg / 5, k1 = (sg + 1) / 5;
            var a0 = prev.clone().lerp(top, k0); a0.y -= Math.sin(k0 * Math.PI) * 0.7;
            var a1 = prev.clone().lerp(top, k1); a1.y -= Math.sin(k1 * Math.PI) * 0.7;
            var segL = a0.distanceTo(a1);
            var wire = new THREE.CylinderGeometry(0.035, 0.035, segL, 3);
            wire.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));
            wire.lookAt(a1.clone().sub(a0));
            wire.translate((a0.x + a1.x) / 2, (a0.y + a1.y) / 2, (a0.z + a1.z) / 2);
            stat.push(tint(wire, COL.ink));
            if (sg > 0) {
              var bulb = new THREE.SphereGeometry(0.2, 6, 5);
              bulb.translate(a0.x, a0.y - 0.22, a0.z);
              bulbs.push(tint(bulb, bulbCols[(bp * 5 + sg) % 3]));
            }
          }
        }
        prev = top;
      }

      /* two trees so the gang has some shade */
      var treeSpots = scatterOn(hFn, 2, 0.4, 0.62, 3.5, 8, seed + 3);
      treeSpots.forEach(function (pt, ti) {
        stat.push(treeGeo(pt.x, pt.z, pt.y - 0.3, 0.9 + hash2(ti, seed) * 0.4, COL.green, COL.greenLight));
      });
      g.add(new THREE.Mesh(mergeGeos(stat), propMat()));
      g.add(new THREE.Mesh(mergeGeos(bulbs), new THREE.MeshBasicMaterial({ vertexColors: true })));

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

      /* the pop: petal confetti out of the bubble (one Points call) */
      var BN = 26, bpos = new Float32Array(BN * 3), bcol = new Float32Array(BN * 3), bvel = [];
      var popCols = [new THREE.Color(0xff9ccf), new THREE.Color(COL.coral), new THREE.Color(0xfff3a0), new THREE.Color(0xff2f8a)];
      for (var bi2 = 0; bi2 < BN; bi2++) {
        var th2 = hash2(bi2, 3.3) * Math.PI * 2, ph2 = hash2(bi2, 8.1) * 1.2 - 0.2;
        var spd = 4 + hash2(bi2, 5.5) * 5;
        bvel.push(new THREE.Vector3(Math.cos(th2) * Math.cos(ph2) * spd, Math.sin(ph2) * spd + 3, Math.sin(th2) * Math.cos(ph2) * spd));
        var pc = popCols[bi2 % popCols.length];
        bcol[bi2 * 3] = pc.r; bcol[bi2 * 3 + 1] = pc.g; bcol[bi2 * 3 + 2] = pc.b;
      }
      var popGeo = new THREE.BufferGeometry();
      popGeo.setAttribute("position", new THREE.BufferAttribute(bpos, 3).setUsage(THREE.DynamicDrawUsage));
      popGeo.setAttribute("color", new THREE.BufferAttribute(bcol, 3));
      var pop = new THREE.Points(popGeo, new THREE.PointsMaterial({
        size: 0.9, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, sizeAttenuation: true,
      }));
      pop.frustumCulled = false;
      pop.visible = false;
      g.add(pop);

      isl.props.gang = {
        boss: bossHead, bossYaw: spA, gum: gum, punks: punks, mesh: punkMesh, homeYaw: spA,
        pop: pop, vel: bvel, origin: new THREE.Vector3(), cyc: 0,
      };
      updatePunks(isl.props.gang, null, 0, 0);

      /* dock as set dressing (v6: you land on the sand now) — swung
         off the spawn approach lane so a beaching canoe never parks
         inside its planks */
      var dockA = Math.atan2(SPAWN_Z - isl.def.pos[1], 0 - isl.def.pos[0]) + 1.05;
      var shoreR = findShoreR(hFn, dockA) - 2.5;
      g.add(new THREE.Mesh(dockGeo(dockA, shoreR, 14), propMat()));
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
      isl.props.boardY = 33;

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
         read the whole pavilion, hoop to hoop (local +z faces the spawn) */
      var hpA = Math.atan2(0 - isl.def.pos[0], SPAWN_Z - isl.def.pos[1]);
      courtG.rotation.y = hpA;
      g.add(courtG);

      var cp = [];    // pavilion carpentry → ONE toon mesh
      var lit2 = [];  // everything that glows → ONE unlit mesh
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

      /* v9 · the pavilion. open sides, ten columns, one big yellow barrel
         roof with a skylight along the ridge and the league's name on top —
         that roof is the landmark you read from the spawn now (the giant
         sea hoop is gone). */
      var RS = courtY + 8.2, RISE = 4.4, RH = 12.6, RL = 31, RT = 0.55;
      var roofY = function (z) { var k = z / RH; return RS + RISE * (1 - k * k); };
      cp.push(placed(vaultGeo(RL, RH, RISE, RT, 14, 0xd9cdb6, 0xf6eedd, 0xb56f40, COL.ink, { ribs: COL.yellow, ribStep: 3.1 }), 0, RS, 0, 0, 1));
      /* the arched ends are glazed lunettes: ink mullions, warm glass */
      for (var ex = -1; ex <= 1; ex += 2) {
        var lun = [], lunI = [], lx0 = ex * (RL / 2 - 0.6);
        lun.push(lx0, RS, 0);
        for (var li = 0; li <= 14; li++) {
          var lzz = -RH + 2 * RH * li / 14, lk = lzz / RH;
          lun.push(lx0, RS + RISE * (1 - lk * lk), lzz);
          if (li < 14) lunI.push(0, li + 1, li + 2);
        }
        var lunG = new THREE.BufferGeometry();
        lunG.setAttribute("position", new THREE.Float32BufferAttribute(lun, 3));
        lunG.setIndex(lunI);
        lunG.computeVertexNormals();
        lit2.push(tint(lunG, 0xffcf8a, 0xfff0cc, RS, RS + RISE));
        for (var mz = -9; mz <= 9; mz += 3) {
          var mh = roofY(mz) - RS;
          var mul = new THREE.BoxGeometry(0.25, mh, 0.25);
          tint(mul, COL.ink);
          cp.push(placed(mul, lx0 + ex * 0.08, RS + mh / 2, mz, 0, 1));
        }
        var tr2 = new THREE.BoxGeometry(0.25, 0.25, RH * 1.7);
        tint(tr2, COL.ink);
        cp.push(placed(tr2, lx0 + ex * 0.08, RS + RISE * 0.45, 0, 0, 1));
        var sill = new THREE.BoxGeometry(0.4, 0.4, RH * 2);
        tint(sill, COL.ink);
        cp.push(placed(sill, lx0 + ex * 0.08, RS, 0, 0, 1));
      }
      for (var cs2 = -1; cs2 <= 1; cs2 += 2) {
        for (var cx2 = -12; cx2 <= 12; cx2 += 6) {
          var colH = roofY(11 * cs2) - (courtY - 0.9);
          var col = new THREE.CylinderGeometry(0.42, 0.55, colH, 8);
          tint(col, 0x2c2825, 0x4a4238, -colH / 2, colH / 2);
          cp.push(placed(col, cx2, courtY - 0.9 + colH / 2, 11 * cs2, 0, 1));
        }
        var eave = new THREE.BoxGeometry(RL - 2, 0.5, 0.55);
        tint(eave, COL.ink);
        cp.push(placed(eave, 0, roofY(11 * cs2) + 0.1, 11 * cs2, 0, 1));
        /* the warm light strip under each eave */
        var strip = new THREE.BoxGeometry(RL - 1.5, 0.2, 0.2);
        tint(strip, 0xffe2b0);
        lit2.push(placed(strip, 0, RS - 0.12, (RH - 0.35) * cs2, 0, 1));
      }
      /* skylight along the ridge + the lamp rows hanging under the roof */
      var sky = new THREE.BoxGeometry(RL - 3, 0.14, 1.1);
      tint(sky, 0xfff3c4);
      lit2.push(placed(sky, 0, RS + RISE + RT + 0.04, 0, 0, 1));
      for (var lz = -1; lz <= 1; lz += 2) {
        for (var lx = -12; lx <= 12; lx += 4) {
          var lmp = new THREE.BoxGeometry(1.0, 0.28, 0.6);
          tint(lmp, 0xfff1cf);
          lit2.push(placed(lmp, lx, roofY(5.5) - 0.32, 5.5 * lz, 0, 1));
        }
      }

      /* the league's name on the ridge, facing the spawn */
      var signY = RS + RISE + RT + 1.75;
      var signBack = new THREE.BoxGeometry(10.2, 2.9, 0.3);
      tint(signBack, COL.ink);
      cp.push(placed(signBack, 0, signY, -0.1, 0, 1));
      for (var sgl = -1; sgl <= 1; sgl += 2) {
        var sleg2 = new THREE.BoxGeometry(0.22, 1.3, 0.22);
        tint(sleg2, COL.ink);
        cp.push(placed(sleg2, sgl * 3.6, RS + RISE + RT + 0.2, -0.1, 0, 1));
      }
      var sign = new THREE.Mesh(new THREE.PlaneGeometry(9.8, 2.5), new THREE.MeshBasicMaterial({ map: makeLeagueSignTexture() }));
      sign.position.set(0, signY, 0.07);
      courtG.add(sign);

      /* stands: a tall one behind the court (it backs the tv shot), a low
         one on the spawn side so it never hides the game */
      var crowd = [];
      var shirt = [COL.yellow, COL.coral, COL.blue, COL.cream, COL.yellow, 0x2b2b33];
      var skinT = [0xe8b17e, 0xc98d5c, 0x8d5a3a, 0xf1c9a0];
      [[-1, 5], [1, 2]].forEach(function (sd) {
        for (var row = 0; row < sd[1]; row++) {
          var stepH = 0.62 * (row + 1);
          var stz = sd[0] * (8.1 + row * 0.95);
          var step = new THREE.BoxGeometry(23, stepH, 0.95);
          tint(step, row % 2 ? 0xbfae88 : 0xd2c39f);
          cp.push(placed(step, 0, courtY - 0.45 + stepH / 2, stz, 0, 1));
          for (var fx = -10.35; fx <= 10.4; fx += 0.9) {
            if (hash2(fx * 3.1 + row, sd[0] + row * 7) < 0.22) continue;
            var fy = courtY - 0.45 + stepH;
            var body = new THREE.BoxGeometry(0.5, 0.62, 0.4);
            tint(body, shirt[Math.floor(hash2(fx, row + sd[0] * 3) * shirt.length)]);
            crowd.push(placed(body, fx, fy + 0.31, stz, 0, 1));
            var head = new THREE.BoxGeometry(0.34, 0.34, 0.34);
            tint(head, skinT[Math.floor(hash2(row * 5 + sd[0], fx) * skinT.length)]);
            crowd.push(placed(head, fx, fy + 0.8, stz, 0, 1));
          }
        }
      });
      /* the crowd is its own mesh: it does the wave when you sail in */
      var crowdMesh = new THREE.Mesh(mergeGeos(crowd), toonMat(0xffffff, { vc: true, rim: 0.35, wave: true, key: "crowd" }));
      courtG.add(crowdMesh);

      /* the center-hung scoreboard: ink cube, four faces, hanging from the roof */
      var sbY = courtY + 8.9;
      var sbBox = new THREE.BoxGeometry(3.7, 2.3, 3.7);
      tint(sbBox, COL.ink);
      cp.push(placed(sbBox, 0, sbY, 0, 0, 1));
      var cable = new THREE.CylinderGeometry(0.06, 0.06, roofY(0) - sbY - 1.1, 4);
      tint(cable, COL.ink);
      cp.push(placed(cable, 0, (roofY(0) + sbY + 1.1) / 2, 0, 0, 1));
      var sbFace = new THREE.Mesh(boxFacesGeo(3.72, 1.95, 3.72), new THREE.MeshBasicMaterial({ map: makeScoreTexture() }));
      sbFace.position.set(0, sbY, 0);
      courtG.add(sbFace);

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
      var litMat2 = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
      courtG.add(new THREE.Mesh(mergeGeos(lit2), litMat2));

      /* game-night bunting hanging from both eaves */
      var buntY = RS - 0.35;
      var bunt1 = buntingGeo({ x: -RL / 2 + 1, y: buntY, z: RH - 0.6 }, { x: RL / 2 - 1, y: buntY, z: RH - 0.6 }, 13, [COL.yellow, COL.coral, COL.cream, COL.blue]);
      var bunt2 = buntingGeo({ x: -RL / 2 + 1, y: buntY, z: -(RH - 0.6) }, { x: RL / 2 - 1, y: buntY, z: -(RH - 0.6) }, 13, [COL.blue, COL.cream, COL.coral, COL.yellow]);
      courtG.add(new THREE.Mesh(mergeGeos([bunt1, bunt2]), flagMat()));

      /* the light spilling out from under the roof */
      var glows2 = [];
      for (var gl2 = -1; gl2 <= 1; gl2 += 2) {
        var glw = new THREE.Sprite(new THREE.SpriteMaterial({
          map: makeGlowTexture(), color: 0xffd58a, blending: THREE.AdditiveBlending,
          transparent: true, opacity: 0.15, depthWrite: false,
        }));
        glw.position.set(gl2 * 7.5, roofY(0) - 2.2, 0);
        glw.scale.set(12, 7, 1);
        courtG.add(glw);
        glows2.push(glw);
      }

      /* dry ochre tufts + shore pebbles so the beach isn't bald —
         v7: scattered OFF the court pad (rMin past the deck) */
      if (tier !== "low") {
        var tuftPts = scatterOn(hFn2, tier === "high" ? 46 : 20, 0.64, 0.85, 2.2, 7, seed + 21);
        instancedOn(g, bladeGeo(0xb98a2e, 0xf0cf6a), tuftPts, 0.7, 1.3, windMat(), seed + 2);
      }
      addShorePebbles(g, hFn2, 0xa89264, 0xd9c491, seed);

      /* the lights come on as you sail in (animateWorld); they start dim */
      isl.props.lights = { mat: litMat2, glows: glows2, score: sbFace.material, wave: crowdMesh.material.userData.uWave };
      isl.props.power = 0.3;
      litMat2.color.setScalar(0.3);
      sbFace.material.color.setScalar(0.3);
      isl.props.boardY = 27;

    } else if (id === "talens-pantone") {
      /* -- v9 · "color is art. not a barrier." a wire fence splits the
         island in two: one half is color and joy (grass, flowers,
         bunting, the swatch fan), the other is grey misery (dead trees,
         puddles, rubble). sail in and the fan opens, and swatches of
         color start jumping the fence to land on the grey side. -- */
      var hFn3 = beachify(function (r01, x, z) {
        var e = edgeMask(r01);
        var raw = 1.5 + gauss(x, z, 0, -1, 11) * 6.5 + fbm2(x * 0.18 + seed, z * 0.18, 3) * 1.6;
        var strata = Math.floor(raw / 2.4) * 2.4;
        var h = lerp(raw, strata + 0.9, 0.45);
        return h * e - (1 - e) * 3.5;
      });
      /* the fence runs toward the spawn, so sailing in you read both
         halves side by side with the wire in the middle. it stops 11u
         short of the center on the spawn side: every route in arrives
         from that quadrant, and a beaching paddler (who walks to r≈17)
         never meets the wire */
      var tSpA = Math.atan2(0 - isl.def.pos[0], SPAWN_Z - isl.def.pos[1]);
      var fA = tSpA + 0.12;
      var fX = Math.sin(fA), fZ = Math.cos(fA);       // along the fence
      var nX = fZ, nZ = -fX;                          // across it: + = color side (away from the spawn)
      var sideOf = function (x, z) { return x * nX + z * nZ; };
      var rampJoy = [
        [0.4, COL.sand], [1.8, 0xe9d296], [3.2, 0x8fe39a],
        [6, COL.green], [10, 0x2f9e55],
      ];
      var rampGrey = [
        [0.4, 0x878ca6], [2.0, 0x6d7290], [4.0, 0x545974],
        [6.5, 0x3f435a], [10, 0x2b2e40],
      ];
      var joyFn = rampFn(rampJoy, COL.sandWet, 0.9), greyFn = rampFn(rampGrey, 0x555a72, 1.2);
      var _cg = new THREE.Color();
      var terr3 = buildTerrain(hFn3, function (h, slope, x, z, out) {
        joyFn(h, slope, x, z, out);
        greyFn(h, slope, x, z, _cg);
        out.lerp(_cg, smoothstep(0.8, -0.8, sideOf(x, z)));
      }, true);
      // barely-there rim so the warm sun can't cook the grey half into beige
      terr3.material = toonMat(0xffffff, { vc: true, rim: 0.15, flat: true, key: "terrainGrey" });
      g.add(terr3);
      isl.props.heightFn = hFn3;
      var gy = function (x, z) { return Math.max(hFn3(Math.sqrt(x * x + z * z) / ISLAND_R, x, z), 0.6); };
      var at = function (a, s) { return [fX * a + nX * s, fZ * a + nZ * s]; };   // fence coords → island xz

      var solid = [];   // posts, wire, trees, rubble, stand → ONE toon mesh
      /* the fence: posts, a chain-link strip that follows the ground, and
         a concertina coil of barbed wire along the top */
      var FA0 = -22, FA1 = 11, FST = (FA1 - FA0) / 10, FH = 4.6, posts = [];
      for (var fa2 = FA0; fa2 <= FA1 + 0.01; fa2 += FST) {
        var fp2 = at(fa2, 0), fy2 = gy(fp2[0], fp2[1]);
        posts.push({ a: fa2, y: fy2 });
        var fpost = new THREE.CylinderGeometry(0.11, 0.14, FH + 1.6, 5);
        solid.push(placed(tint(fpost, 0x3a3d48, 0x5a5e6c, -FH / 2, FH / 2), fp2[0], fy2 + (FH + 1.6) / 2 - 1.2, fp2[1], 0, 1));
      }
      var topAt = function (a) {
        var k = clamp((a - FA0) / FST, 0, posts.length - 1.001), i0 = Math.floor(k);
        return lerp(posts[i0].y, posts[i0 + 1].y, k - i0) + FH;
      };
      var mPos = [], mUv = [], mIdx = [];
      for (var mi = 0; mi < posts.length; mi++) {
        var mp = at(posts[mi].a, 0);
        mPos.push(mp[0], posts[mi].y - 1.0, mp[1], mp[0], posts[mi].y + FH - 0.1, mp[1]);
        mUv.push((posts[mi].a - FA0) / 1.6, 0, (posts[mi].a - FA0) / 1.6, (FH + 0.9) / 1.6);
        if (mi < posts.length - 1) { var m0 = mi * 2; mIdx.push(m0, m0 + 2, m0 + 1, m0 + 1, m0 + 2, m0 + 3); }
      }
      var meshGeo = new THREE.BufferGeometry();
      meshGeo.setAttribute("position", new THREE.Float32BufferAttribute(mPos, 3));
      meshGeo.setAttribute("uv", new THREE.Float32BufferAttribute(mUv, 2));
      meshGeo.setIndex(mIdx);
      g.add(new THREE.Mesh(meshGeo, new THREE.MeshBasicMaterial({
        map: makeChainLinkTexture(), color: 0x3a3d48, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide,
      })));
      var coil = new THREE.Curve();
      coil.getPoint = function (u, target) {
        var a = lerp(FA0, FA1, u), ang = u * 52 * Math.PI * 2;
        var p = at(a, Math.cos(ang) * 0.5);
        return (target || new THREE.Vector3()).set(p[0], topAt(a) + 0.55 + Math.sin(ang) * 0.5, p[1]);
      };
      solid.push(tint(new THREE.TubeGeometry(coil, 420, 0.05, 3, false), 0x6b6f7c));
      var rail = new THREE.Curve();
      rail.getPoint = function (u, target) { var a = lerp(FA0, FA1, u), p = at(a, 0); return (target || new THREE.Vector3()).set(p[0], topAt(a) - 0.05, p[1]); };
      solid.push(tint(new THREE.TubeGeometry(rail, 40, 0.07, 4, false), 0x3a3d48));

      /* misery: dead trees, rubble, a couple of puddles */
      [[-7, -9, 1.1], [6, -13, 0.9], [-14, -6, 0.8]].forEach(function (dt2, di) {
        var dp = at(dt2[0], dt2[1]), dy = gy(dp[0], dp[1]) - 0.2, sc = dt2[2];
        var trunk = new THREE.CylinderGeometry(0.16 * sc, 0.32 * sc, 4.6 * sc, 5);
        solid.push(placed(tint(trunk, 0x45464f, 0x5d5f6a, -2, 2), dp[0], dy + 2.3 * sc, dp[1], 0, 1));
        for (var br3 = 0; br3 < 3; br3++) {
          var brl = (1.6 + hash2(di, br3) * 1.2) * sc;
          var branch = new THREE.CylinderGeometry(0.05 * sc, 0.12 * sc, brl, 4);
          branch.translate(0, brl / 2, 0);
          branch.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.7 + hash2(br3, di) * 0.5));
          branch.applyMatrix4(new THREE.Matrix4().makeRotationY(br3 * 2.1 + di));
          solid.push(placed(tint(branch, 0x45464f, 0x60626d, 0, brl), dp[0], dy + (2.2 + br3 * 0.9) * sc, dp[1], 0, 1));
        }
      });
      for (var rb3 = 0; rb3 < 7; rb3++) {
        var rp3 = at((hash2(rb3, 1.3) - 0.5) * 30, -3 - hash2(rb3, 2.9) * 14);
        var rub = new THREE.DodecahedronGeometry(0.5 + hash2(rb3, 4.1) * 0.7, 0);
        rub.scale(1, 0.6, 1);
        solid.push(placed(tint(rub, 0x5a5d68, 0x80838f, -0.4, 0.4), rp3[0], gy(rp3[0], rp3[1]) + 0.1, rp3[1], rb3, 1));
      }
      [[2, -7, 2.4], [-11, -12, 1.8]].forEach(function (pd) {
        var pp = at(pd[0], pd[1]);
        var pud = new THREE.CylinderGeometry(pd[2], pd[2], 0.06, 10);
        pud.scale(1, 1, 0.6);
        solid.push(placed(tint(pud, 0x3a3e52), pp[0], gy(pp[0], pp[1]) + 0.08, pp[1], fA, 1));
      });

      /* joy: two round trees and a string of flags between two poles */
      [[-9, 10], [9, 13]].forEach(function (tp, ti2) {
        var tq = at(tp[0], tp[1]);
        solid.push(treeGeo(tq[0], tq[1], gy(tq[0], tq[1]) - 0.3, 1.0 + ti2 * 0.2, COL.green, COL.greenLight));
      });
      var bP1 = at(-15, 6), bP2 = at(1, 15);
      [bP1, bP2].forEach(function (bp3) {
        var bpost = new THREE.CylinderGeometry(0.1, 0.13, 5.2, 5);
        solid.push(placed(tint(bpost, COL.woodDark), bp3[0], gy(bp3[0], bp3[1]) + 2.4, bp3[1], 0, 1));
      });
      var bfl = buntingGeo(
        { x: bP1[0], y: gy(bP1[0], bP1[1]) + 4.9, z: bP1[1] },
        { x: bP2[0], y: gy(bP2[0], bP2[1]) + 4.9, z: bP2[1] },
        12, [COL.coral, COL.yellow, COL.blue, COL.green, 0xff7a1a, 0x9c5bd9]);
      g.add(new THREE.Mesh(bfl, flagMat()));

      /* the swatch fan on the color side: 7 blades on one pivot, ONE
         unlit mesh. the vertex shader fans them by blade index × uOpen */
      /* swatch-guide colors in no spectral order (a fanned spectrum reads
         as a rainbow flag, not a color guide) */
      var fanCols = [COL.coral, COL.blue, COL.yellow, 0x1fa38a, 0xff7ab8, 0xff7a1a, 0x7b4fd6];
      var blades = [], FBL = 9.4;
      for (var bi3 = 0; bi3 < 7; bi3++) {
        /* three tints per blade, deep at the tip → pale toward the label */
        var chipH = (FBL - 2.4) / 3;
        for (var tn = 0; tn < 3; tn++) {
          var chipG2 = new THREE.BoxGeometry(2.1, chipH - 0.08, 0.12);
          var tc = new THREE.Color(fanCols[bi3]).lerp(new THREE.Color(0xffffff), (2 - tn) * 0.28);
          blades.push(placed(tint(chipG2, tc.getHex()), 0, 3.0 + chipH * (tn + 0.5), bi3 * 0.13, 0, 1));
        }
        var label = new THREE.BoxGeometry(2.1, 2.4, 0.12);
        blades.push(placed(tint(label, 0xfffdf6), 0, 1.8, bi3 * 0.13, 0, 1));
      }
      var fanGeo = mergeGeos(blades);
      var vpb = fanGeo.attributes.position.count / 7, bIdxA = new Float32Array(fanGeo.attributes.position.count);
      for (var vb = 0; vb < bIdxA.length; vb++) bIdxA[vb] = Math.floor(vb / vpb) - 3;
      fanGeo.setAttribute("aBlade", new THREE.BufferAttribute(bIdxA, 1));
      var fanMat = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide });
      var uOpen = { value: 0.12 };
      fanMat.onBeforeCompile = function (shader) {
        shader.uniforms.uOpen = uOpen;
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", "#include <common>\nattribute float aBlade;\nuniform float uOpen;")
          .replace("#include <begin_vertex>", [
            "#include <begin_vertex>",
            "float fan = -aBlade * 0.34 * uOpen;",
            "transformed.xy = mat2(cos(fan), sin(fan), -sin(fan), cos(fan)) * transformed.xy;",
          ].join("\n"));
      };
      fanMat.customProgramCacheKey = function () { return "swatchfan"; };
      var fanP = at(-2, 7.5), fanY = gy(fanP[0], fanP[1]) + 1.2;
      var fan = new THREE.Mesh(fanGeo, fanMat);
      fan.position.set(fanP[0], fanY, fanP[1]);
      fan.rotation.y = tSpA;
      g.add(fan);
      var fStand = new THREE.CylinderGeometry(0.22, 0.36, 2.0, 6);
      solid.push(placed(tint(fStand, 0x55504a), fanP[0], fanY - 0.9, fanP[1], 0, 1));
      var bolt = new THREE.CylinderGeometry(0.35, 0.35, 1.4, 8);
      bolt.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));
      solid.push(placed(tint(bolt, 0x55504a), fanP[0] + Math.sin(tSpA) * 0.4, fanY + 0.6, fanP[1] + Math.cos(tSpA) * 0.4, tSpA, 1));
      g.add(new THREE.Mesh(mergeGeos(solid), propMat()));

      /* flowers + grass on the joy side only */
      if (tier !== "low") {
        var joyPts = scatterOn(hFn3, tier === "high" ? 110 : 60, 0.1, 0.82, 1.6, 12, seed + 9).filter(function (p) { return sideOf(p.x, p.z) > 1.4; });
        instancedOn(g, bladeGeo(), joyPts, 0.9, 1.5, windMat(), seed);
        var flPts = scatterOn(hFn3, tier === "high" ? 60 : 34, 0.1, 0.8, 1.6, 12, seed + 17).filter(function (p) { return sideOf(p.x, p.z) > 1.6; });
        var tuft = [];
        [COL.coral, COL.yellow, 0x9c5bd9].forEach(function (fc2, fi2) {
          var head2 = new THREE.SphereGeometry(0.3, 7, 6);
          head2.translate((fi2 - 1) * 0.35, 0.9 + fi2 * 0.15, (fi2 % 2) * 0.3);
          tuft.push(tint(head2, fc2));
          var st2 = new THREE.PlaneGeometry(0.08, 0.95 + fi2 * 0.15, 1, 2);
          st2.translate((fi2 - 1) * 0.35, (0.95 + fi2 * 0.15) / 2, (fi2 % 2) * 0.3);
          tuft.push(tint(st2, COL.greenDark));
        });
        instancedOn(g, mergeGeos(tuft), flPts, 0.9, 1.4, windMat(), seed + 5);
      }

      /* the swatches that jump the fence: one instanced, unlit quad each.
         they start on the joy side, arc over the wire and land flat on
         the grey side, where they stay as splats of color */
      var NJ = 10, jumps = [];
      var jGeo = new THREE.BoxGeometry(1.15, 0.08, 1.5);
      var jMesh = new THREE.InstancedMesh(jGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }), NJ);
      for (var jj = 0; jj < NJ; jj++) {
        var ja = -18 + jj / (NJ - 1) * 26;
        var s0 = at(ja + (hash2(jj, 1) - 0.5) * 3, 3 + hash2(jj, 2) * 5);
        var s1 = at(ja + (hash2(jj, 3) - 0.5) * 5, -3.5 - hash2(jj, 4) * 9);
        jumps.push({
          x0: s0[0], y0: gy(s0[0], s0[1]) + 0.1, z0: s0[1],
          x1: s1[0], y1: gy(s1[0], s1[1]) + 0.1, z1: s1[1],
          peak: topAt(ja) + 2.5, ph: hash2(jj, 5) * 6, spin: hash2(jj, 6) * 6,
        });
        jMesh.setColorAt(jj, new THREE.Color(fanCols[jj % fanCols.length]));
      }
      jMesh.instanceColor.needsUpdate = true;
      g.add(jMesh);
      isl.props.jump = { list: jumps, mesh: jMesh, open: uOpen, cyc: 0 };
      updateJumps(isl.props.jump, "start");

      addShorePebbles(g, hFn3, 0x77777d, 0xacacb2, seed);
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

      /* v9 · "the watcher". a faceted obsidian shard with red slit windows,
         the eye on top in a solid lens bezel (no more wire cage), a red
         scan ring that rides up and down the shard, a searchlight that
         sweeps the sea, and a ring of cctv cameras on poles. sail within
         90 and every camera snaps to the canoe, the light finds you.
         un-usual suspects. -- */
      var mSpA = Math.atan2(0 - isl.def.pos[0], SPAWN_Z - isl.def.pos[1]);
      var dark = [];   // shard + thorns + camera poles → ONE toon mesh
      var red = [];    // slit windows → ONE unlit mesh
      var SP0 = 8.6, SPH = 21;
      var spR = function (y) { var kk = clamp((y - SP0) / SPH, 0, 1); return 6.6 * Math.pow(1 - kk, 1.25) + 0.45; };
      var profile = [];
      for (var pv2 = 0; pv2 <= 7; pv2++) {
        var kk2 = pv2 / 7;
        profile.push(new THREE.Vector2(spR(SP0 + kk2 * SPH), kk2 * SPH));
      }
      var spireGeo = new THREE.LatheGeometry(profile, 6).toNonIndexed();
      spireGeo.computeVertexNormals();   // faceted: every face keeps its own normal
      tint(spireGeo, 0x1a1724, 0x3a3550, 0, SPH);
      dark.push(placed(spireGeo, 0, SP0, 0, 0.26, 1));
      /* two smaller shards leaning out of the base: a crystal cluster */
      [[-1, 0.9, 0.62, 2.0], [1, -0.7, 0.5, 3.6]].forEach(function (sd2) {
        var sub = new THREE.LatheGeometry(profile.map(function (v) { return new THREE.Vector2(v.x * sd2[2], v.y * sd2[2]); }), 5).toNonIndexed();
        sub.computeVertexNormals();
        tint(sub, 0x1a1724, 0x3a3550, 0, SPH * sd2[2]);
        sub.applyMatrix4(new THREE.Matrix4().makeRotationZ(sd2[0] * 0.38));
        sub.applyMatrix4(new THREE.Matrix4().makeRotationY(sd2[3]));
        sub.translate(Math.sin(sd2[3]) * 3.2 * sd2[1], SP0 - 1.5, Math.cos(sd2[3]) * 3.2 * sd2[1]);
        dark.push(sub);
      });
      /* slit windows: two or three per face, at staggered heights */
      for (var fc = 0; fc < 6; fc++) {
        var fa = 0.26 + (fc + 0.5) / 6 * Math.PI * 2;
        for (var sl2 = 0; sl2 < 3; sl2++) {
          if ((fc + sl2) % 3 === 2) continue;
          var sy = SP0 + 3.5 + sl2 * 4.6 + (fc % 2) * 1.6;
          var sr = spR(sy) * Math.cos(Math.PI / 6) + 0.04;
          var slitG = new THREE.BoxGeometry(0.5, 2.4 - sl2 * 0.45, 0.12);
          tint(slitG, 0xff3a24, 0xff8a5c, -1, 1);
          red.push(placed(slitG, Math.sin(fa) * sr, sy, Math.cos(fa) * sr, fa, 1));
        }
      }

      /* thorny rocks around the base */
      for (var r2 = 0; r2 < 6; r2++) {
        var rk = new THREE.ConeGeometry(1.6 + hash2(r2, 3) * 1.4, 4 + hash2(r2, 7) * 4, 5);
        tint(rk, 0x232033, 0x3c3752, 0, 6);
        var ra = r2 * 1.05 + 0.4;
        var rx2 = Math.cos(ra) * (12 + hash2(r2, 1) * 5), rz2 = Math.sin(ra) * (12 + hash2(r2, 1) * 5);
        var rry = hFn4(Math.sqrt(rx2 * rx2 + rz2 * rz2) / ISLAND_R, rx2, rz2);
        var rgeo = placed(rk, rx2, Math.max(rry, 1) + 1.2, rz2, hash2(r2, 9) * 3, 1);
        rgeo.applyMatrix4(new THREE.Matrix4().makeRotationZ((hash2(r2, 11) - 0.5) * 0.35));
        dark.push(rgeo);
      }

      /* cctv: poles in the dark mesh, heads in one InstancedMesh */
      var cams = [];
      for (var cm = 0; cm < 7; cm++) {
        var ca2 = mSpA + 0.3 + cm / 7 * Math.PI * 2;
        var cr2 = 15.5 + hash2(cm, 4.4) * 2;
        var cx3 = Math.sin(ca2) * cr2, cz3 = Math.cos(ca2) * cr2;
        var cy3 = Math.max(hFn4(cr2 / ISLAND_R, cx3, cz3), 1) - 0.3;
        var poleH = 4.2 + hash2(cm, 2) * 1.6;
        var cPole = new THREE.CylinderGeometry(0.12, 0.16, poleH, 5);
        dark.push(placed(tint(cPole, 0x1d1a28, 0x3a3550, -poleH / 2, poleH / 2), cx3, cy3 + poleH / 2, cz3, 0, 1));
        var arm3 = new THREE.BoxGeometry(0.14, 0.14, 0.8);
        dark.push(placed(tint(arm3, 0x1d1a28), cx3, cy3 + poleH, cz3, ca2, 1));
        cams.push({ x: cx3, y: cy3 + poleH + 0.25, z: cz3, yaw: ca2, pitch: -0.15, home: ca2, k: 4 + hash2(cm, 6) * 6 });
      }
      var cg = [];
      var cBody = new THREE.BoxGeometry(0.9, 0.85, 1.9);
      cg.push(placed(tint(cBody, 0xcfcbd8, 0xf2f0f6, -0.4, 0.4), 0, 0, 0.35, 0, 1));
      var cHood = new THREE.BoxGeometry(1.1, 0.14, 2.3);
      cg.push(placed(tint(cHood, 0x2c2838), 0, 0.5, 0.45, 0, 1));
      var cLens = new THREE.CylinderGeometry(0.34, 0.38, 0.3, 8);
      cLens.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));
      cg.push(placed(tint(cLens, 0x14120f), 0, 0, 1.38, 0, 1));
      var cLed = new THREE.BoxGeometry(0.16, 0.16, 0.1);
      cg.push(placed(tint(cLed, 0xff2a1a), 0.3, 0.26, 1.32, 0, 1));
      var camMesh = new THREE.InstancedMesh(mergeGeos(cg), propMat(), cams.length);
      g.add(camMesh);

      g.add(new THREE.Mesh(mergeGeos(dark), toonMat(0xffffff, { vc: true, rim: 1.0, flat: true, key: "spire" })));
      g.add(new THREE.Mesh(mergeGeos(red), new THREE.MeshBasicMaterial({ vertexColors: true })));

      /* the scan ring: one red ring that rides the shard (animateWorld
         rescales it to the shard's radius at its height) */
      var scanG = new THREE.TorusGeometry(1, 0.06, 4, 6);
      scanG.rotateX(Math.PI / 2);
      scanG.rotateY(-(Math.PI / 6 - 0.26));   // hexagon corners on the shard's edges
      var scan = new THREE.Mesh(scanG, new THREE.MeshBasicMaterial({ color: 0xff3a24, transparent: true, opacity: 0.9 }));
      g.add(scan);

      addShorePebbles(g, hFn4, 0x2b2740, 0x4d4766, seed);

      /* the eye: sclera + iris + pupil + a red inner ring in ONE unlit
         mesh, inside a solid lens bezel on a yoke. the whole group turns */
      var EYE_Y = SP0 + SPH + 3.4;
      var eyeGroup = new THREE.Group();
      eyeGroup.position.set(0, EYE_Y, 0);
      var ey = [];
      ey.push(tint(new THREE.SphereGeometry(3.0, 16, 12), 0xfffdf6));
      var irisG = new THREE.SphereGeometry(1.55, 14, 10);
      irisG.scale(1, 1, 0.5);
      ey.push(placed(tint(irisG, 0x2b47d9, 0x5b72f0, -1.5, 1.5), 0, 0, 2.62, 0, 1));
      var pupG = new THREE.SphereGeometry(0.8, 12, 8);
      pupG.scale(1, 1, 0.45);
      ey.push(placed(tint(pupG, 0x14120f), 0, 0, 3.08, 0, 1));
      var inner = new THREE.TorusGeometry(2.75, 0.09, 4, 28);
      ey.push(placed(tint(inner, 0xff3a24), 0, 0, 1.25, 0, 1));
      eyeGroup.add(new THREE.Mesh(mergeGeos(ey), new THREE.MeshBasicMaterial({ vertexColors: true })));
      var bz = [];
      var bezel = new THREE.TorusGeometry(3.15, 0.62, 6, 24);
      bz.push(placed(tint(bezel, 0x1d1a28, 0x3a3550, -3, 3), 0, 0, 0.9, 0, 1));
      for (var bl2 = 0; bl2 < 8; bl2++) {
        var notch = new THREE.BoxGeometry(0.5, 0.9, 0.5);
        notch.translate(0, 3.15, 0);
        notch.applyMatrix4(new THREE.Matrix4().makeRotationZ(bl2 / 8 * Math.PI * 2));
        bz.push(placed(tint(notch, 0x4d4766), 0, 0, 1.4, 0, 1));
      }
      for (var yk = -1; yk <= 1; yk += 2) {
        var yArm = new THREE.BoxGeometry(0.45, 4.4, 0.7);
        bz.push(placed(tint(yArm, 0x1d1a28, 0x3a3550, -2, 2), yk * 3.75, -1.6, 0, 0, 1));
      }
      var yBase = new THREE.BoxGeometry(8.0, 0.5, 0.9);
      bz.push(placed(tint(yBase, 0x1d1a28), 0, -3.8, 0, 0, 1));
      var yPin = new THREE.CylinderGeometry(0.5, 0.7, 1.2, 6);
      bz.push(placed(tint(yPin, 0x1d1a28), 0, -4.4, 0, 0, 1));
      eyeGroup.add(new THREE.Mesh(mergeGeos(bz), toonMat(0xffffff, { vc: true, rim: 1.0, flat: true, key: "spire" })));
      eyeGroup.rotation.y = mSpA;
      g.add(eyeGroup);
      isl.props.eyeGroup = eyeGroup;

      /* dim red halo behind the eye */
      var halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: makeGlowTexture(), color: 0xff3a24, blending: THREE.AdditiveBlending,
        transparent: true, opacity: 0.22, depthWrite: false,
      }));
      halo.position.y = EYE_Y;
      halo.scale.set(20, 20, 1);
      g.add(halo);

      /* the searchlight: a cone out of the eye, alpha from the beam
         texture's core column (source strong → far end gone) */
      var SLH = 10;
      var slGeo = new THREE.CylinderGeometry(2.8, 0.5, SLH, 12, 1, true);
      slGeo.translate(0, SLH / 2, 0);
      var slUv = slGeo.attributes.uv;
      for (var su = 0; su < slUv.count; su++) slUv.setX(su, 0.25);
      var slight = new THREE.Mesh(slGeo, new THREE.MeshBasicMaterial({
        map: makeBeamTexture(), color: 0xfff2c0, transparent: true, opacity: 0.5,
        depthWrite: false, side: THREE.DoubleSide,
      }));
      slight.position.set(0, EYE_Y, 0);
      g.add(slight);

      isl.props.watch = {
        cams: cams, camMesh: camMesh, scan: scan, spR: spR, y0: SP0 + 2, y1: SP0 + SPH - 3,
        light: slight, lightH: SLH, eyeY: EYE_Y, home: mSpA, aim: new THREE.Vector3(), on: 0,
      };
      updateCams(isl.props.watch);
      aimLight(isl.props.watch, isl.props.watch.aim.set(Math.sin(mSpA + 0.9) * 40, 0, Math.cos(mSpA + 0.9) * 40));
      scan.position.y = SP0 + SPH * 0.45;
      scan.scale.setScalar(spR(scan.position.y) + 0.15);
      isl.props.boardY = 44;

    } else if (id === "ai-direction") {
      /* -- v8.9: ai direction — the one island where it's already night.
         a low-poly stadium after dark, a vertical beam of light punching
         out of its roof (the triple-double reel's cover, translated to
         toon, never copied) and a 9:16 screen on the plaza wearing the
         reel's poster. NO video in the 3d: the poster is one ≤512px
         canvas, the beam one alpha-gradient mesh. 9 draw calls with the
         name board: terrain, stadium, lights, screen, beam, 2 glows,
         pebbles. everything stays inside the plaza → no rocks[] entry. -- */
      var hFn5 = beachify(function (r01, x, z) {
        var e = edgeMask(r01);
        var rr5 = r01 * ISLAND_R;
        var h = (1.5 + gauss(x, z, 0, 0, 14) * 3.6 + fbm2(x * 0.16 + seed, z * 0.16, 2) * 1.1) * e - (1 - e) * 3.5;
        /* the plaza: one dead-flat concrete pad the stadium stands on */
        return lerp(h, 3.4, smoothstep(19, 15.5, rr5));
      });
      /* night concrete: violet-grey asphalt, darker than the golden sea
         around it, but lifted enough that the toon ramp never goes muddy */
      var ramp5 = [
        [0.4, COL.sand], [1.6, 0x9c8f86], [2.5, 0x4a4458],
        [3.3, 0x332e43], [5, 0x2a2638],
      ];
      g.add(buildTerrain(hFn5, rampFn(ramp5, COL.sandWet, 1.0), true));
      isl.props.heightFn = hFn5;

      var plazaY = 3.4;
      /* broadside to the spawn approach, like liga u's court: local +z
         faces the incoming canoe */
      var stA = Math.atan2(0 - isl.def.pos[0], SPAWN_Z - isl.def.pos[1]);
      var stG = new THREE.Group();
      stG.rotation.y = stA;
      g.add(stG);

      var SX = 10.5, SZK = 0.78, SH = 6.6, SCZ = -3.5;   // facade radius, depth squash, height, center z
      var rAt = function (y) { return lerp(10.8, 10.2, y / SH); };   // facade tapers a touch
      var st = [];     // stadium shell + plaza props → ONE toon mesh
      var lit = [];    // everything that glows → ONE unlit mesh

      var podium = new THREE.CylinderGeometry(12, 12.6, 0.9, 24);
      tint(podium, 0x4b4560, 0x5d5674, -0.45, 0.45);
      podium.scale(1, 1, 0.8);
      st.push(placed(podium, 0, plazaY + 0.25, SCZ, 0, 1));

      var shell = new THREE.CylinderGeometry(rAt(SH), rAt(0), SH, 24);
      tint(shell, 0x1f1c2a, 0x3a344c, -SH / 2, SH / 2);
      shell.scale(1, 1, SZK);
      st.push(placed(shell, 0, plazaY + 0.7 + SH / 2, SCZ, 0, 1));

      var lip = new THREE.TorusGeometry(rAt(SH) + 0.1, 0.45, 4, 24);
      lip.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));
      tint(lip, 0x4d4763);
      lip.scale(1, 1, SZK);
      st.push(placed(lip, 0, plazaY + 0.7 + SH, SCZ, 0, 1));

      /* facade ribs: the vertical fins that make it read "stadium" */
      for (var rb5 = 0; rb5 < 24; rb5++) {
        var ra5 = (rb5 / 24) * Math.PI * 2 + 0.13;
        var rr6 = rAt(SH / 2) + 0.05;
        var nx5 = Math.cos(ra5) / rr6, nz5 = Math.sin(ra5) / (rr6 * SZK);
        var rib = new THREE.BoxGeometry(0.34, SH - 0.2, 0.5);
        tint(rib, 0x2c2839, 0x4a4460, -SH / 2, SH / 2);
        st.push(placed(rib, Math.cos(ra5) * rr6, plazaY + 0.7 + SH / 2, SCZ + Math.sin(ra5) * rr6 * SZK, Math.atan2(nx5, nz5), 1));
      }

      /* window bands: two rings of warm light behind the fins */
      [[2.1, 0xffa64a], [4.5, 0xffc77a]].forEach(function (bd) {
        var band = new THREE.CylinderGeometry(rAt(bd[0]) + 0.12, rAt(bd[0]) + 0.12, 0.26, 24, 1, true);
        tint(band, bd[1]);
        band.scale(1, 1, SZK);
        lit.push(placed(band, 0, plazaY + 0.7 + bd[0], SCZ, 0, 1));
      });
      /* THE slit: the glowing vertical doorway from the cover */
      var slitZ = SCZ + rAt(3.2) * SZK;
      var slit = new THREE.BoxGeometry(0.7, 4.4, 0.4);
      tint(slit, 0xffb25a, 0xffe2b0, -2.2, 2.2);
      lit.push(placed(slit, 1.8, plazaY + 0.7 + 2.6, slitZ, 0, 1));
      /* entrance strip + the beam's source in the roof */
      var door = new THREE.BoxGeometry(5.2, 0.3, 0.3);
      tint(door, 0xffd28a);
      lit.push(placed(door, -2.6, plazaY + 0.95, slitZ + 0.15, 0, 1));
      var oculus = new THREE.TorusGeometry(1.7, 0.2, 4, 16);
      oculus.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));
      tint(oculus, 0xfff1cf);
      lit.push(placed(oculus, 0, plazaY + 0.75 + SH, SCZ, 0, 1));
      var source = new THREE.CylinderGeometry(1.2, 1.3, 0.35, 12);
      tint(source, 0xfffaf0);
      lit.push(placed(source, 0, plazaY + 0.8 + SH, SCZ, 0, 1));

      /* plaza lamps: posts in the toon mesh, heads in the lit one */
      for (var lp = 0; lp < 4; lp++) {
        var lpx = -13 + lp * 2.4, lpz = 5.5 + lp * 2.0;
        if (lp > 1) { lpx = 6.5 + (lp - 2) * 3.2; lpz = 9.8 - (lp - 2) * 1.6; }
        var lpost = new THREE.CylinderGeometry(0.1, 0.14, 3.4, 5);
        tint(lpost, COL.ink);
        st.push(placed(lpost, lpx, plazaY + 1.7, lpz, 0, 1));
        var lhead = new THREE.BoxGeometry(0.42, 0.5, 0.42);
        tint(lhead, 0xffe2b0);
        lit.push(placed(lhead, lpx, plazaY + 3.55, lpz, 0.5, 1));
      }

      /* the 9:16 screen: frame + legs (toon), poster face (unlit canvas).
         it stands left-front of the stadium, angled at the approach */
      var scX = -8.6, scZ = 8.4, scRy = 0.42;
      var SW = 6.3, SHh = 11.2, scY = plazaY + 3.0 + SHh / 2;
      var scParts = [];
      var sframe = new THREE.BoxGeometry(SW + 0.7, SHh + 0.7, 0.5);
      tint(sframe, 0x17151f, 0x2c2839, -SHh / 2, SHh / 2);
      scParts.push(placed(sframe, 0, scY, 0, 0, 1));
      for (var sl = -1; sl <= 1; sl += 2) {
        var sleg = new THREE.BoxGeometry(0.45, 3.4, 0.45);
        tint(sleg, COL.ink);
        scParts.push(placed(sleg, sl * (SW / 2 - 0.6), plazaY + 1.5, -0.1, 0, 1));
      }
      var scM = new THREE.Matrix4().makeRotationY(scRy).setPosition(scX, 0, scZ);
      scParts.forEach(function (p) { p.applyMatrix4(scM); st.push(p); });
      var screen = new THREE.Mesh(
        new THREE.PlaneGeometry(SW, SHh),
        new THREE.MeshBasicMaterial({ map: makeReelPosterTexture() })
      );
      screen.position.set(scX + Math.sin(scRy) * 0.27, scY, scZ + Math.cos(scRy) * 0.27);
      screen.rotation.y = scRy;
      stG.add(screen);

      stG.add(new THREE.Mesh(mergeGeos(st), propMat()));
      stG.add(new THREE.Mesh(mergeGeos(lit), new THREE.MeshBasicMaterial({ vertexColors: true })));

      /* the beam: a bright core inside a soft halo, both open cylinders in
         ONE geometry. alpha comes from a 2-column gradient texture (core
         column strong, halo column faint) because r128 vertex colors carry
         no alpha. fog:false — it's the landmark you read from far away. */
      var BEAM_H = 150, beamY0 = plazaY + 0.9 + SH;
      var bCore = new THREE.CylinderGeometry(1.35, 0.95, BEAM_H, 10, 1, true);
      var bHalo = new THREE.CylinderGeometry(4.6, 2.3, BEAM_H, 12, 1, true);
      var beamGeo = new THREE.BufferGeometry();
      var bPos = [], bUv = [], bIdx = [], bOff = 0;
      [[bCore, 0.25], [bHalo, 0.75]].forEach(function (pair) {
        var bg = pair[0], bp = bg.attributes.position, bu = bg.attributes.uv;
        for (var bi = 0; bi < bp.count; bi++) {
          bPos.push(bp.getX(bi), bp.getY(bi) + BEAM_H / 2, bp.getZ(bi));
          bUv.push(pair[1], bu.getY(bi));
        }
        for (var bj = 0; bj < bg.index.count; bj++) bIdx.push(bg.index.array[bj] + bOff);
        bOff += bp.count;
        bg.dispose();
      });
      beamGeo.setAttribute("position", new THREE.Float32BufferAttribute(bPos, 3));
      beamGeo.setAttribute("uv", new THREE.Float32BufferAttribute(bUv, 2));
      beamGeo.setIndex(bIdx);
      var beam5 = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({
        map: makeBeamTexture(), color: 0xfff4dc, transparent: true,
        depthWrite: false, fog: false, side: THREE.DoubleSide,
      }));
      beam5.position.set(0, beamY0, SCZ);
      stG.add(beam5);
      isl.props.beam = beam5;

      /* two glows: where the beam leaves the roof, and the slit */
      var bGlow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: makeGlowTexture(), color: 0xfff0d0, blending: THREE.AdditiveBlending,
        transparent: true, opacity: 0.75, depthWrite: false,
      }));
      bGlow.position.set(0, beamY0 + 0.6, SCZ);
      bGlow.scale.set(11, 11, 1);
      stG.add(bGlow);
      isl.props.beamGlow = bGlow;
      var sGlow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: makeGlowTexture(), color: 0xff9a3c, blending: THREE.AdditiveBlending,
        transparent: true, opacity: 0.6, depthWrite: false,
      }));
      sGlow.position.set(1.8, plazaY + 3.3, slitZ + 0.6);
      sGlow.scale.set(5.5, 7.5, 1);
      stG.add(sGlow);

      addShorePebbles(g, hFn5, 0x5a5468, 0x9890a6, seed);

      /* the screen powers on as you sail in (animateWorld) — it starts dim */
      isl.props.screen = screen;
      isl.props.power = 0.35;
      screen.material.color.setScalar(0.35);
      isl.props.boardY = 24;
    }
  }

  /* v9 · capullos: write the small punks' instance matrices from their yaws */
  var _pm = new THREE.Matrix4(), _pq = new THREE.Quaternion(), _pe = new THREE.Euler(), _pv = new THREE.Vector3(), _ps = new THREE.Vector3();
  function updatePunks(G) {
    for (var i = 0; i < G.punks.length; i++) {
      var p = G.punks[i];
      _pe.set(0, p.yaw, 0);
      _pq.setFromEuler(_pe);
      _pm.compose(_pv.set(p.x, p.y, p.z), _pq, _ps.set(p.s, p.s, p.s));
      G.mesh.setMatrixAt(i, _pm);
    }
    G.mesh.instanceMatrix.needsUpdate = true;
  }

  /* v9 · talens: the swatches that jump the fence. mode "start" = all
     waiting on the joy side, "land" = all lying on the grey side, a
     number = the flight clock (1.6s arc, then 3.4s on the grey ground) */
  var _jq = new THREE.Quaternion(), _je = new THREE.Euler();
  function updateJumps(J, mode) {
    for (var i = 0; i < J.list.length; i++) {
      var j = J.list[i], u = 1, x, y, z;
      if (mode === "start") u = 0;
      else if (typeof mode === "number") u = Math.min(1, ((mode + j.ph) % 5) / 1.6);
      x = lerp(j.x0, j.x1, u); z = lerp(j.z0, j.z1, u);
      var base = lerp(j.y0, j.y1, u);
      y = base + (j.peak - Math.max(j.y0, j.y1)) * 4 * u * (1 - u) + (u > 0 && u < 1 ? 0.6 : 0);
      var fly = u > 0 && u < 1;
      _je.set(fly ? u * 9 : 0, j.spin + (fly ? u * 4 : 0), fly ? u * 3 : 0);
      _jq.setFromEuler(_je);
      _pm.compose(_pv.set(x, y, z), _jq, _ps.set(1, 1, 1));
      J.mesh.setMatrixAt(i, _pm);
    }
    J.mesh.instanceMatrix.needsUpdate = true;
  }

  /* v9 · chain-link for talens' fence: a 64px diamond, tiled along the strip */
  var _linkTex = null;
  function makeChainLinkTexture() {
    if (_linkTex) return _linkTex;
    var cv = document.createElement("canvas");
    cv.width = 64; cv.height = 64;
    var ctx = cv.getContext("2d");
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 32); ctx.lineTo(32, 0); ctx.lineTo(64, 32); ctx.lineTo(32, 64); ctx.closePath();
    ctx.stroke();
    _linkTex = new THREE.CanvasTexture(cv);
    _linkTex.wrapS = _linkTex.wrapT = THREE.RepeatWrapping;
    return _linkTex;
  }

  /* v9 · ministerie: cctv head matrices from yaw/pitch, and the
     searchlight cone stretched from the eye to a point on the water */
  var _ce = new THREE.Euler(0, 0, 0, "YXZ"), _up = new THREE.Vector3(0, 1, 0), _ld = new THREE.Vector3(), _v3 = new THREE.Vector3();
  function updateCams(W2) {
    for (var i = 0; i < W2.cams.length; i++) {
      var c = W2.cams[i];
      _ce.set(c.pitch, c.yaw, 0, "YXZ");
      _pq.setFromEuler(_ce);
      _pm.compose(_pv.set(c.x, c.y, c.z), _pq, _ps.set(1, 1, 1));
      W2.camMesh.setMatrixAt(i, _pm);
    }
    W2.camMesh.instanceMatrix.needsUpdate = true;
  }
  function aimLight(W2, p) {
    _ld.set(p.x, p.y - W2.eyeY, p.z);
    var len = _ld.length() || 1;
    W2.light.quaternion.setFromUnitVectors(_up, _ld.multiplyScalar(1 / len));
    W2.light.scale.set(1, len / W2.lightH, 1);
  }

  /* v9 · the tag on capullos' garden wall: fuchsia spray with an ink
     outline and drips. 512×128, transparent; redrawn once anton lands */
  var _tagTex = null;
  function makeTagTexture() {
    if (_tagTex) return _tagTex;
    var cv = document.createElement("canvas");
    cv.width = 512; cv.height = 128;
    var draw = function () {
      var ctx = cv.getContext("2d");
      ctx.clearRect(0, 0, 512, 128);
      ctx.save();
      ctx.translate(256, 70);
      ctx.rotate(-0.05);
      ctx.transform(1, 0, -0.18, 1, 0, 0);
      ctx.font = "400 84px Anton, Impact, 'Arial Narrow', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      ctx.lineWidth = 12;
      ctx.strokeStyle = "#14120f";
      ctx.strokeText("capullos", 0, 0);
      ctx.fillStyle = "#ff2f8a";
      ctx.fillText("capullos", 0, 0);
      ctx.restore();
      ctx.strokeStyle = "#ff2f8a";
      ctx.lineCap = "round";
      ctx.lineWidth = 5;
      [[118, 98, 116], [205, 100, 124], [300, 97, 112], [372, 96, 121]].forEach(function (d) {
        ctx.beginPath(); ctx.moveTo(d[0], d[1]); ctx.lineTo(d[0], d[2]); ctx.stroke();
      });
      ctx.fillStyle = "#ffd23f";
      ctx.beginPath();
      for (var k = 0; k < 10; k++) {
        var r = k % 2 ? 7 : 16, a = k / 10 * Math.PI * 2 - Math.PI / 2;
        ctx.lineTo(462 + Math.cos(a) * r, 30 + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      if (_tagTex) _tagTex.needsUpdate = true;
    };
    draw();
    _tagTex = new THREE.CanvasTexture(cv);
    if (document.fonts && document.fonts.load) document.fonts.load("400 84px Anton").then(draw, function () {});
    return _tagTex;
  }

  /* v8.9 · the beam's alpha: column 1 (u<.5) = the core, column 2 = the
     halo. bottom opaque → top transparent (CylinderGeometry v runs 0 at
     the base to 1 at the top; the canvas is flipped, so draw top-down). */
  var _beamTex = null;
  function makeBeamTexture() {
    if (_beamTex) return _beamTex;
    var cv = document.createElement("canvas");
    cv.width = 2; cv.height = 128;
    var ctx = cv.getContext("2d");
    var cols = [0.62, 0.17];
    for (var c = 0; c < 2; c++) {
      var gr = ctx.createLinearGradient(0, 0, 0, 128);
      gr.addColorStop(0, "rgba(255,255,255,0)");
      gr.addColorStop(0.55, "rgba(255,255,255," + (cols[c] * 0.35).toFixed(3) + ")");
      gr.addColorStop(0.97, "rgba(255,255,255," + cols[c] + ")");
      gr.addColorStop(1, "rgba(255,255,255," + (cols[c] * 0.6).toFixed(3) + ")");
      ctx.fillStyle = gr;
      ctx.fillRect(c, 0, 1, 128);
    }
    _beamTex = new THREE.CanvasTexture(cv);
    _beamTex.magFilter = THREE.LinearFilter;
    _beamTex.minFilter = THREE.LinearFilter;
    _beamTex.generateMipmaps = false;
    return _beamTex;
  }

  /* v8.9 · the reel's poster on the plaza screen: drawn, not copied — the
     real cover only goes public with jorge's ok. 288×512 (9:16, ≤512px).
     anton may land after the world is built, so it redraws once it does. */
  var _reelTex = null;
  function makeReelPosterTexture() {
    if (_reelTex) return _reelTex;
    var cv = document.createElement("canvas");
    cv.width = 288; cv.height = 512;
    var draw = function () {
      var ctx = cv.getContext("2d");
      var bg = ctx.createLinearGradient(0, 0, 0, 512);
      bg.addColorStop(0, "#0b0a14"); bg.addColorStop(0.62, "#1b1631"); bg.addColorStop(1, "#2b1f2f");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 288, 512);
      // the beam, rising out of the stadium
      var bm = ctx.createLinearGradient(0, 0, 0, 392);
      bm.addColorStop(0, "rgba(255,244,220,0)"); bm.addColorStop(1, "rgba(255,244,220,0.95)");
      ctx.fillStyle = "rgba(255,244,220,0.10)";
      ctx.fillRect(190, 0, 30, 392);
      ctx.fillStyle = bm;
      ctx.fillRect(201, 0, 8, 392);
      // stadium silhouette with window rows and the slit
      ctx.fillStyle = "#14121d";
      roundRect(ctx, 20, 380, 248, 92, 30);
      ctx.fill();
      ctx.fillStyle = "#ffa64a";
      for (var wy = 396; wy < 460; wy += 15) {
        for (var wx = 36; wx < 252; wx += 9) {
          if (hash2(wx, wy) > 0.32) ctx.fillRect(wx, wy, 5, 2);
        }
      }
      ctx.fillStyle = "#ffcf8a";
      ctx.fillRect(172, 404, 7, 44);
      // headline (the reel's cover line, in the site's language)
      ctx.fillStyle = "#f6eedd";
      ctx.textBaseline = "alphabetic";
      ctx.font = "400 50px Anton, Impact, 'Arial Narrow', sans-serif";
      ["nobody has", "done a", "triple-double", "in liga u."].forEach(function (ln, i) {
        ctx.fillText(ln, 20, 132 + i * 54, 248);
      });
      // labels + a fake playhead: it's a reel, not a still
      ctx.font = "700 13px 'Space Mono', monospace";
      ctx.fillStyle = "#ffc77a";
      ctx.fillText("ai video direction", 20, 38);
      ctx.fillStyle = "rgba(246,238,221,0.7)";
      ctx.fillText("@liga_u22 · reel 9:16", 20, 500);
      ctx.fillStyle = "rgba(246,238,221,0.25)";
      ctx.fillRect(20, 482, 248, 3);
      ctx.fillStyle = "#ff5a3c";
      ctx.fillRect(20, 482, 92, 3);
      if (_reelTex) _reelTex.needsUpdate = true;
    };
    draw();
    _reelTex = new THREE.CanvasTexture(cv);
    if (document.fonts && document.fonts.load) {
      Promise.all([
        document.fonts.load("400 50px Anton"),
        document.fonts.load("700 13px 'Space Mono'"),
      ]).then(draw, function () {});
    }
    return _reelTex;
  }

  /* v9 · the league's name on the pavilion roof: ink board, yellow anton.
     512×128; redrawn once anton lands, like the reel poster. */
  var _signTex = null;
  function makeLeagueSignTexture() {
    if (_signTex) return _signTex;
    var cv = document.createElement("canvas");
    cv.width = 512; cv.height = 128;
    var draw = function () {
      var ctx = cv.getContext("2d");
      ctx.fillStyle = "#14120f";
      ctx.fillRect(0, 0, 512, 128);
      ctx.strokeStyle = "#ffd23f";
      ctx.lineWidth = 5;
      roundRect(ctx, 10, 10, 492, 108, 14);
      ctx.stroke();
      ctx.fillStyle = "#ffd23f";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "400 86px Anton, Impact, 'Arial Narrow', sans-serif";
      ctx.fillText("liga u", 256, 68, 440);
      ctx.fillStyle = "#ff5a3c";
      ctx.beginPath(); ctx.arc(52, 64, 9, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(460, 64, 9, 0, Math.PI * 2); ctx.fill();
      if (_signTex) _signTex.needsUpdate = true;
    };
    draw();
    _signTex = new THREE.CanvasTexture(cv);
    if (document.fonts && document.fonts.load) document.fonts.load("400 86px Anton").then(draw, function () {});
    return _signTex;
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
     makes the captain pitch the sixth island and surfaces a mailto
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
      var board = makeTextBoard("island #6 — plot for sale", COL.yellow);
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
      /* v8.7: the sea only owns the keyboard while it is on screen. before, the
         arrows/space were swallowed page-wide (no scrolling the menu or a
         case), Enter docked even from a focused link, and cmd/ctrl chords left
         keys "held" forever. */
      if (paused || e.metaKey || e.ctrlKey || e.altKey) return;
      var key = e.key || "";
      var tg = e.target;
      var interactive = tg && tg.closest && tg.closest("a, button, input, textarea, select, [contenteditable], .case");
      if (tg && tg.closest && tg.closest("input, textarea, select, [contenteditable]")) return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(key) >= 0) e.preventDefault();
      keys[key.toLowerCase()] = true;
      /* rowing keys work even with a hud button focused (you just clicked
         "enter the sea"); Enter belongs to the focused control, if any */
      if (key === "Enter" && !interactive && !e.repeat && nearIsland && !document.querySelector(".case.open")) {
        dockAt(nearIsland);
      }
    });
    document.addEventListener("keyup", function (e) { keys[(e.key || "").toLowerCase()] = false; });

    var el = renderer.domElement;
    var startX = 0, startY = 0;
    /* v8.4 · multitouch, unambiguous by construction: pointers are tracked
       by id. ONE finger rows (readInput arms it after ~130ms or 8px so a
       two-finger plant never rows). TWO fingers NEVER row: they pinch
       (zoom OUT only — default framing is the max close-up) and pan the
       chart. a finger left over from a pinch does not row until lifted
       and pressed again. autosail survives camera gestures. */
    var pts = new Map(), rowId = null, pinch = null;
    function stopRow() {
      rowId = null;
      input.touching = false; input.tx = 0; input.ty = 0;
      if (joyBase) joyBase.hidden = true;
    }
    function pinchGeom() {
      var it = pts.values(), a = it.next().value, b = it.next().value;
      var dx = b.x - a.x, dy = b.y - a.y;
      return { d: Math.max(24, Math.sqrt(dx * dx + dy * dy)),
               cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
    }
    function stepPinch(pn) {
      var g = pinchGeom();
      setZoomT(pn.zoom0 * pn.d0 / g.d);   // fingers together → dolly out
      // two-finger drag pans the look-point, grab-the-map feel, exact at
      // the target's depth: world units per screen px from fov + distance
      var hpx = (stageEl && stageEl.clientHeight) || window.innerHeight;
      var camD = camera.position.distanceTo(camTarget);
      var kk = 2 * Math.tan(camera.fov * 0.5 * D2R) * camD / Math.max(1, hpx);
      var dx = g.cx - pn.cx, dy = g.cy - pn.cy;
      pn.cx = g.cx; pn.cy = g.cy;
      var fx = Math.sin(boat.heading), fz = Math.cos(boat.heading);
      camUser.panX += (-dx * fz + dy * fx) * kk;
      camUser.panZ += (dx * fx + dy * fz) * kk;
      clampPan();
    }
    el.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
      if (pts.size === 1) {
        rowId = e.pointerId;
        input.touching = true;
        rowT0 = performance.now(); rowMoved = 0;
        startX = e.clientX; startY = e.clientY;
        input.tx = 0; input.ty = 0;
        if (joyBase) {
          joyBase.hidden = false;
          joyBase.style.left = startX + "px";
          joyBase.style.top = startY + "px";
          joyNub.style.transform = "translate(-50%,-50%)";
        }
      } else if (pts.size === 2) {
        stopRow();
        var g = pinchGeom();
        pinch = { d0: g.d, cx: g.cx, cy: g.cy, zoom0: camUser.zoomT };
      } else {
        pinch = null;   // 3+ fingers: nobody rows, nobody zooms
      }
    });
    el.addEventListener("pointermove", function (e) {
      var p = pts.get(e.pointerId);
      if (p) { p.x = e.clientX; p.y = e.clientY; }
      if (pinch && pts.size === 2) {
        if (!(paused || dive || board || land || launch || beached)) stepPinch(pinch);
        return;
      }
      if (!input.touching || e.pointerId !== rowId) return;
      input.tx = clamp((e.clientX - startX) / 70, -1, 1);
      input.ty = clamp((e.clientY - startY) / 70, -1, 1);
      var mdx = e.clientX - startX, mdy = e.clientY - startY;
      rowMoved = Math.max(rowMoved, Math.sqrt(mdx * mdx + mdy * mdy));
      if (joyNub) {
        var nx = clamp(mdx, -44, 44);
        var ny = clamp(mdy, -44, 44);
        joyNub.style.transform = "translate(calc(-50% + " + nx + "px), calc(-50% + " + ny + "px))";
      }
    });
    function up(e) {
      pts.delete(e.pointerId);
      if (pinch && pts.size < 2) pinch = null;
      if (e.pointerId === rowId || pts.size === 0) stopRow();
    }
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    /* v8.4 · desktop: wheel/trackpad dollies the chart, same floor (no
       zoom-in past the default framing) and same ceiling as the pinch */
    el.addEventListener("wheel", function (e) {
      e.preventDefault();
      if (paused || dive || board || land || launch || beached) return;
      setZoomT(camUser.zoomT * Math.exp(e.deltaY * 0.0016));
    }, { passive: false });
  }

  function readInput(rdt) {
    var throttle = 0, turn = 0, manual = false;
    if (keys["arrowup"] || keys["w"]) { throttle = 1; manual = true; }
    if (keys["arrowdown"] || keys["s"]) { throttle = -0.4; manual = true; }
    if (keys["arrowleft"] || keys["a"]) { turn = 1; manual = true; }
    if (keys["arrowright"] || keys["d"]) { turn = -1; manual = true; }
    // v8.4: armed after 130ms or 8px of travel — a two-finger plant (pinch)
    // never rows through its first frames and never kills the autosail
    if (input.touching && (rowMoved > 8 || performance.now() - rowT0 > 130)) {
      throttle = Math.max(throttle, Math.min(1, Math.max(0.35, -input.ty + 0.5)));
      turn = -input.tx;
      manual = true;
    }
    if (manual) autopilot = null;
    input.manual = manual;

    if (autopilot) {
      var dx = autopilot.group.position.x - boat.x;
      var dz = autopilot.group.position.z - boat.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      /* v8.7.2: steer for a waypoint that rounds whatever sits between us
         and the target (other islands, liga u's hoop, buoys, rocks) — the
         straight line used to run aground on the wrong island. */
      var wp = autopilotWaypoint(autopilot, rdt);
      var err = normAngle(Math.atan2(wp.x - boat.x, wp.z - boat.z) - boat.heading);
      turn = clamp(err * 2.2, -1, 1);
      throttle = d < 70 ? 0.55 : 1;
      // v8.7.2: no early release. the captain keeps rowing until the keel
      // grounds on the TARGET's sand and stepBoat starts the disembark
      // (releasing at ISLAND_R + 3 let the sand drag stop the canoe short
      // of grounding — liga u never docked from the compass).
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
    // subject pre-filled — the sixth island starts as an email.
    ctaBtn = document.createElement("a");
    ctaBtn.id = "edge-cta";
    ctaBtn.className = "dock edge-cta";
    ctaBtn.href = "mailto:jorgeantolinarribas@gmail.com?subject=" + encodeURIComponent("let's build island #6");
    ctaBtn.textContent = "build island #6 with me ✉";
    ctaBtn.hidden = true;
    document.getElementById("hud").appendChild(ctaBtn);

    dockBtn = document.getElementById("dock-btn");
    dockBtn.addEventListener("click", function () {
      if (nearIsland) dockAt(nearIsland);
    });

    var cap = document.createElement("div");
    cap.id = "island-toast";
    cap.setAttribute("role", "status");          // v8.7: screen readers hear the captain too
    cap.setAttribute("aria-live", "polite");
    cap.setAttribute("aria-atomic", "true");
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
      "<span class='compass-n' aria-hidden='true'>n</span>" +
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

    /* v8.4 · chart zoom for non-touch pointers: two discreet chips,
       bottom-left (the compass owns bottom-right). wheel does the same;
       on touch the pinch owns it and the chips stay out of the frame. */
    if (!TOUCH_DEV) {
      var zc = document.createElement("div");
      zc.id = "zoom-ctl";
      var mkZoom = function (label, aria, k) {
        var b = document.createElement("button");
        b.className = "chip btn zoom-btn";
        b.textContent = label;
        b.setAttribute("aria-label", aria);
        b.title = aria;
        b.addEventListener("click", function () {
          // §3.5 contract: gestures are inert while paused or choreographed
          if (paused || dive || board || land || launch || beached) return;
          setZoomT(camUser.zoomT * k);
        });
        zc.appendChild(b);
        return b;
      };
      zoomInBtn = mkZoom("+", "zoom back in", 1 / 1.5);
      zoomOutBtn = mkZoom("−", "zoom out to the chart", 1.5);
      zoomInBtn.disabled = true;   // spawn framing IS the max close-up
      document.getElementById("hud").appendChild(zc);
    }

    var hintEl = document.getElementById("hint");
    if (hintEl && TOUCH_DEV) {
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

  /* v8.7.2 · autopilot routing. obstacles = every other island's sand
     (ISLAND_R + 9) and every solid collider in rocks[] that isn't on the
     target's own beach. find the nearest one whose circle crosses the line
     boat → target and aim at its tangent side (the side the boat already
     leans toward), recomputed every frame so the route bends smoothly. */
  var _wp = { x: 0, z: 0 };
  var _apObs = [];
  var apStuckT = 0, apFlip = 0;      // stuck watchdog: try the other tangent side
  function autopilotWaypoint(target, dt) {
    var tx = target.group.position.x, tz = target.group.position.z;
    var sx = tx - boat.x, sz = tz - boat.z;
    var len = Math.sqrt(sx * sx + sz * sz) || 1;
    var ux = sx / len, uz = sz / len;
    _apObs.length = 0;
    for (var i = 0; i < islands.length; i++) {
      if (islands[i] === target) continue;
      _apObs.push(islands[i].group.position.x, islands[i].group.position.z, ISLAND_R + 9);
    }
    for (var k = 0; k < rocks.length; k++) {
      var rk = rocks[k];
      var dtx = rk.x - tx, dtz = rk.z - tz;
      if (dtx * dtx + dtz * dtz < (ISLAND_R + 2) * (ISLAND_R + 2)) continue;   // the target's own beach props
      _apObs.push(rk.x, rk.z, rk.r + 4.5);
    }
    // nearest obstacle whose circle crosses the line boat → target's beach
    var best = -1, bestT = Infinity, bpx = 0, bpz = 0, boff = 0;
    for (var o = 0; o < _apObs.length; o += 3) {
      var cx = _apObs[o], cz = _apObs[o + 1], r = _apObs[o + 2];
      var t = (cx - boat.x) * ux + (cz - boat.z) * uz;
      if (t <= -r * 0.5 || t >= len - ISLAND_R) continue;   // well behind us, or past the beach
      var px = boat.x + ux * Math.max(t, 0) - cx, pz = boat.z + uz * Math.max(t, 0) - cz;
      var off = Math.sqrt(px * px + pz * pz);
      if (off < r && t < bestT) { bestT = t; best = o; bpx = px; bpz = pz; boff = off; }
    }
    // stuck watchdog: rowing but going nowhere for 1.2s → swap sides
    if (boat.speed < 0.8) apStuckT += dt; else apStuckT = Math.max(0, apStuckT - dt * 2);
    if (apStuckT > 1.2) { apStuckT = 0; apFlip = apFlip ? 0 : 1; }
    if (best < 0) { _wp.x = tx; _wp.z = tz; return _wp; }
    // tangent side: away from the obstacle's center (dead-center → port side)
    var nx, nz;
    if (boff > 0.01) { nx = bpx / boff; nz = bpz / boff; } else { nx = -uz; nz = ux; }
    if (apFlip) { nx = -nx; nz = -nz; }
    var R = _apObs[best + 2] + 3;
    _wp.x = _apObs[best] + nx * R;
    _wp.z = _apObs[best + 1] + nz * R;
    // relax: a waypoint inside a neighbouring obstacle gets pushed out of it
    for (var pass = 0; pass < 3; pass++) {
      for (var q = 0; q < _apObs.length; q += 3) {
        var qx = _wp.x - _apObs[q], qz = _wp.z - _apObs[q + 1], qr = _apObs[q + 2] + 2;
        var qd = Math.sqrt(qx * qx + qz * qz);
        if (qd < qr && qd > 0.01) { _wp.x = _apObs[q] + qx / qd * qr; _wp.z = _apObs[q + 1] + qz / qd * qr; }
      }
    }
    return _wp;
  }

  function sailTo(isl) {
    /* v8.5: a choreography owns the boat — a compass tap mid-sequence used
       to toast "setting sail" while stepFrame vetoed the autopilot every frame */
    if (dive || board || land || launch || beached) return;
    autopilot = isl;
    apStuckT = 0; apFlip = 0;
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
    else toast("that's the full tour. now hire the man: jorgeantolinarribas@gmail.com");
  };

  /* ============================================================
     tick
     ============================================================ */
  var camTarget = new THREE.Vector3(0, 2.5, 140);
  var camPos = new THREE.Vector3();
  /* v8.4 · user chart-view: pinch (touch) / wheel + corner chips (desktop)
     dolly the sailing rig OUT — never in: the default framing IS the max
     close-up (low-poly assets don't survive closer). zoom is a dolly (not
     fov — fov stays aspect/speed-driven) whose ceiling roughly matches the
     aerial intro, so the zoomed-out look is already art-directed. two-finger
     drag pans the look-point; rowing/autosail eases the pan back to the
     canoe, and every choreography (dive/board/land/launch/beached) reclaims
     the composed framing instantly. fog is pushed out proportionally so the
     chart stays readable without losing the golden haze. */
  var camUser = { zoom: 1, zoomT: 1, panX: 0, panZ: 0 };
  var ZOOM_MAX = 4.2;     // budget-capped: re-measure §6 if you raise it
  var PAN_MAX = 130;      // world units of look-point offset from the canoe
  var fogN0 = 110, fogF0 = 255;
  var rmQ = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  var zoomInBtn = null, zoomOutBtn = null;   // v8.5: chips reflect the clamp
  function setZoomT(z) {
    camUser.zoomT = clamp(z, 1, ZOOM_MAX);
    if (zoomInBtn) {
      zoomInBtn.disabled = camUser.zoomT <= 1.001;
      zoomOutBtn.disabled = camUser.zoomT >= ZOOM_MAX - 0.001;
    }
  }
  W.setZoom = setZoomT;   // harness/debug hook
  function clampPan() {
    var pl = Math.sqrt(camUser.panX * camUser.panX + camUser.panZ * camUser.panZ);
    if (pl > PAN_MAX) { var s = PAN_MAX / pl; camUser.panX *= s; camUser.panZ *= s; }
    // the look-point never leaves the chart
    var tx = boat.x + camUser.panX, tz = boat.z + camUser.panZ;
    var td = Math.sqrt(tx * tx + tz * tz);
    if (td > BOUND_R) {
      var s2 = BOUND_R / td;
      camUser.panX = tx * s2 - boat.x;
      camUser.panZ = tz * s2 - boat.z;
    }
  }
  /* v8.2 · aspect-aware framing. 55° vertical fov was tuned for phones and
     laptops; at extreme aspects it breaks both ways: ultrawide (21:9/32:9)
     blows the horizontal fov past 100° (fisheye edges), and skinny-tall
     windows squeeze it under 20° (the canoe fills the whole width). we keep
     55° in the comfortable band and clamp the HORIZONTAL fov to [26°, 96°]
     outside it, solving the vertical fov per aspect. baseFov is re-derived
     on every resize; updateCamera eases camera.fov toward it as always. */
  var baseFov = 55;
  var D2R = Math.PI / 180;
  function fovForAspect(a) {
    var h = 2 * Math.atan(Math.tan(55 * 0.5 * D2R) * a) / D2R;
    if (h > 96) return 2 * Math.atan(Math.tan(48 * D2R) / a) / D2R;
    if (h < 26) return 2 * Math.atan(Math.tan(13 * D2R) / a) / D2R;
    return 55;
  }

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
    /* v8.7: ambient life (waves, wind, gulls, fish, orbits…) rides tw, which
       stands still under prefers-reduced-motion. real t stays for timers. */
    var tw = (rmQ && rmQ.matches) ? 0 : t;
    tWave = tw;
    waterUniforms.uTime.value = tw;
    for (var wsI = 0; wsI < windShaders.length; wsI++) {
      windShaders[wsI].uniforms.uTime.value = tw;
    }

    if (!paused) {
      if (dive || board || land || launch) { input.throttle = 0; input.turn = 0; autopilot = null; }
      else readInput(dt);
      stepBoat(dt, t);
      checkIslands();
      if (dive) stepDive(dt, t);
      if (board) stepBoard(dt, t);
      if (land) stepLand(dt, t);
      if (launch) stepLaunch(dt, t);
    }
    stepWake(dt, t);
    stepRibbon(t);
    animateWorld(dt, tw);
    updateCamera(dt);
    if (!paused) updateCompass();   // v8.7: nobody sees the compass while paused
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
          toast("north edge. the chart stops, the ideas don't — island #6 is unclaimed. want it?");
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
          // v8.7.2: under autopilot only the TARGET's sand may take the
          // canoe ashore (any heading into it, any speed — the captain is
          // still rowing); passing another island's shallows never docks.
          if (autopilot) { if (autopilot === sandIsl && intoK > 0) startLand(sandIsl); }
          else if (intoK > 0.35 && boat.speed > 1.2) startLand(sandIsl);
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

    var h = waveH(boat.x, boat.z, tWave);
    // near shore the shader damps the swell — the hull must agree
    var shoreDamp = 1 - 0.55 * smoothstep(58, 26, boat.sandD || 999);
    h *= shoreDamp;
    var hAhead = waveH(boat.x + fx * 3, boat.z + fz * 3, tWave) * shoreDamp;
    var hSide = waveH(boat.x + fz * 2, boat.z - fx * 2, tWave) * shoreDamp;
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
      toast("land ho: " + nearIsland.def.name + (nearIsland.def.tag ? " — " + nearIsland.def.tag : ""));
      setHudTint(nearIsland.def.color);
    } else if (!nearIsland && prev) {
      setHudTint(null);
    }
    if (nearIsland) {
      dockBtn.hidden = false;
      // v8: the ⏎ is a keyboard promise — don't make it to fingers
      var dockLabel = (groundedIsl === nearIsland
        ? "hop ashore"
        : "beach at " + nearIsland.def.name);
      if (dockBtn._label !== dockLabel) {      // v8.7: only touch the dom when it changes
        dockBtn._label = dockLabel;
        dockBtn.textContent = dockLabel;
        if (!TOUCH_DEV) {
          var glyph = document.createElement("span");
          glyph.setAttribute("aria-hidden", "true");
          glyph.textContent = " ⏎";
          dockBtn.appendChild(glyph);
        }
      }
    } else {
      dockBtn.hidden = true;
    }
    // v8.1: css hook (no :has — ios) so the hint yields to any bottom prompt
    if (hudEl) hudEl.classList.toggle("prompt-up", !dockBtn.hidden || !!(ctaBtn && !ctaBtn.hidden));
  }

  /* v4: the HUD borrows the island's color while you're in its waters.
     text color flips ink/cream by YIQ luminance so contrast stays AA. */
  var tintKey = "";
  function relLum(r, g, b) {
    var f = function (c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  }
  function setHudTint(hex) {
    var key = hex === null || hex === undefined ? "none" : String(hex);
    if (key === tintKey) return;       // v8.7: choreographies called this every frame (3 root-var writes = doc-wide restyle)
    tintKey = key;
    var rootStyle = document.documentElement.style;
    if (hex === null || hex === undefined) {
      rootStyle.removeProperty("--hud-tint");
      rootStyle.removeProperty("--hud-tint-text");
      rootStyle.removeProperty("--hud-tint-deep");
      return;
    }
    var r = (hex >> 16) & 255, gg = (hex >> 8) & 255, b = hex & 255;
    /* v8.7: ink-vs-cream by real WCAG contrast (the old yiq>=140 rule picked
       cream on coral at 2.6:1). the "deep" variant for small labels on cream is
       darkened until it clears 4.5:1 against cream. */
    var L = relLum(r, gg, b);
    var inkL = relLum(20, 18, 15), creamL = relLum(246, 238, 221);
    var cInk = (L + 0.05) / (inkL + 0.05), cCream = (creamL + 0.05) / (L + 0.05);
    rootStyle.setProperty("--hud-tint", "#" + new THREE.Color(hex).getHexString());
    rootStyle.setProperty("--hud-tint-text", cInk >= cCream ? "#14120f" : "#f6eedd");
    var dr = r, dg = gg, db = b, guard = 0;
    while ((creamL + 0.05) / (relLum(dr, dg, db) + 0.05) < 4.5 && guard++ < 40) {
      dr *= 0.93; dg *= 0.93; db *= 0.93;
    }
    var hx = function (v) { var h = Math.round(v).toString(16); return h.length < 2 ? "0" + h : h; };
    rootStyle.setProperty("--hud-tint-deep", "#" + hx(dr) + hx(dg) + hx(db));
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
      b.obj.position.y = waveH(b.x, b.z, tWave) * (b.amp || 0.8);
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

      /* v9 · capullos, the gang: far away they loaf about; within 85 every
         head turns to stare at the canoe (each at its own speed) and the
         boss blows a gum bubble that pops into petal confetti. reduced
         motion: they face the spawn, the bubble just sits there. */
      if (id === "capullos" && pr.gang) {
        var GG = pr.gang;
        if (rmQ && rmQ.matches) {
          if (!GG.still) {
            GG.still = true;
            GG.punks.forEach(function (p) { p.yaw = GG.homeYaw; });
            updatePunks(GG);
            GG.boss.rotation.y = GG.homeYaw;
            GG.gum.scale.setScalar(0.8);
            GG.pop.visible = false;
          }
        } else if (isl.dist < 200) {
          GG.still = false;
          var nearC = isl.dist < 85;
          var lbx = boat.x - isl.group.position.x, lbz = boat.z - isl.group.position.z;
          GG.punks.forEach(function (p) {
            var tgP = nearC ? Math.atan2(lbx - p.x, lbz - p.z) : GG.homeYaw + Math.sin(t * 0.4 + p.ph) * 0.5;
            p.yaw += normAngle(tgP - p.yaw) * Math.min(1, dt * (nearC ? p.k : 1));
          });
          updatePunks(GG);
          var bb = GG.boss.position;
          var tgB = nearC ? Math.atan2(lbx - bb.x, lbz - bb.z) : GG.homeYaw + Math.sin(t * 0.25) * 0.3;
          GG.boss.rotation.y += normAngle(tgB - GG.boss.rotation.y) * Math.min(1, dt * 1.6);
          if (nearC) {
            GG.cyc += dt;
            var cy = GG.cyc % 6.5, gs = 0.01;
            if (cy < 2.6) gs = 0.15 + Math.pow(cy / 2.6, 1.5) * 1.45;
            else if (cy < 3.0) gs = 1.6 + Math.sin(t * 30) * 0.04;
            else if (!GG.popped) {
              GG.popped = true;
              GG.gum.getWorldPosition(GG.origin);
              GG.origin.sub(isl.group.position);
              GG.origin.x += Math.sin(GG.boss.rotation.y) * 1.6;
              GG.origin.z += Math.cos(GG.boss.rotation.y) * 1.6;
              GG.popT = 0;
              GG.pop.visible = true;
            }
            if (cy < 3.0) GG.popped = false;
            GG.gum.scale.set(gs * (1 + Math.sin(t * 7) * 0.03), gs, gs);
          } else {
            GG.cyc = 0;
            GG.gum.scale.setScalar(Math.max(0.01, GG.gum.scale.x - dt));
          }
          if (GG.popT !== undefined && GG.popT !== null) {
            GG.popT += dt;
            var pp3 = GG.pop.geometry.attributes.position, T = GG.popT;
            for (var pi3 = 0; pi3 < GG.vel.length; pi3++) {
              var vv = GG.vel[pi3];
              pp3.setXYZ(pi3, GG.origin.x + vv.x * T, GG.origin.y + vv.y * T - 4.5 * T * T, GG.origin.z + vv.z * T);
            }
            pp3.needsUpdate = true;
            GG.pop.material.opacity = Math.max(0, 1 - T / 1.5);
            if (T > 1.5) { GG.popT = null; GG.pop.visible = false; }
          }
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

      /* v9 · liga u: the pavilion lights come on as you sail in (a short
         flicker, then steady) and the crowd does the wave. reduced motion:
         lights simply on, nobody stands up. */
      if (id === "liga-u-strategy" && pr.lights) {
        var LG = pr.lights;
        if (rmQ && rmQ.matches) {
          if (pr.power !== 1) { pr.power = 1; LG.mat.color.setScalar(1); LG.score.color.setScalar(1); }
          LG.wave.value = 0;
        } else if (isl.dist < 200) {
          var onL = isl.dist < 100 ? 1 : 0.3;
          pr.power += (onL - pr.power) * Math.min(1, dt * 1.2);
          var flL = (pr.power > 0.4 && pr.power < 0.8) ? 0.75 + 0.25 * (Math.sin(t * 41) > 0 ? 1 : 0) : 1;
          LG.mat.color.setScalar(pr.power * flL);
          LG.score.color.setScalar(pr.power);
          LG.glows.forEach(function (gw) { gw.material.opacity = 0.5 * pr.power; });
          LG.wave.value += ((isl.dist < 90 ? 1 : 0) - LG.wave.value) * Math.min(1, dt * 0.8);
        }
      }

      /* v9 · talens: within 90 the swatch fan opens and the swatches start
         jumping the fence into the grey half. reduced motion: fan open,
         the swatches already lying on the grey side. */
      if (id === "talens-pantone" && pr.jump) {
        var JP = pr.jump;
        if (rmQ && rmQ.matches) {
          if (!JP.still) { JP.still = true; JP.open.value = 1; updateJumps(JP, "land"); }
        } else if (isl.dist < 200) {
          JP.still = false;
          var nearT = isl.dist < 90;
          JP.open.value += ((nearT ? 1 : 0.12) - JP.open.value) * Math.min(1, dt * 1.6);
          if (nearT) { JP.cyc += dt; updateJumps(JP, JP.cyc); }
          else if (JP.cyc !== 0) { JP.cyc = 0; updateJumps(JP, "start"); }
        }
      }

      /* v9 · ministerie, the watcher: the eye always follows you; within 90
         every camera snaps onto the canoe (each at its own speed), the
         searchlight leaves its sweep to find you and the scan ring speeds
         up. reduced motion: everything faces the spawn and holds still. */
      if (id === "ministerie" && pr.watch) {
        var WT = pr.watch;
        if (rmQ && rmQ.matches) {
          if (!WT.still) {
            WT.still = true;
            WT.cams.forEach(function (c) { c.yaw = c.home; c.pitch = -0.15; });
            updateCams(WT);
            pr.eyeGroup.rotation.y = WT.home;
            aimLight(WT, WT.aim.set(Math.sin(WT.home + 0.9) * 40, 0, Math.cos(WT.home + 0.9) * 40));
          }
        } else if (isl.dist < 220) {
          WT.still = false;
          var nearM = isl.dist < 90;
          WT.on += ((nearM ? 1 : 0) - WT.on) * Math.min(1, dt * 1.5);
          var lmx = boat.x - isl.group.position.x, lmz = boat.z - isl.group.position.z;
          pr.eyeGroup.rotation.y += normAngle(Math.atan2(lmx, lmz) - pr.eyeGroup.rotation.y) * Math.min(1, dt * 2.5);
          WT.cams.forEach(function (c) {
            var dxc = lmx - c.x, dzc = lmz - c.z;
            var tgY = nearM ? Math.atan2(dxc, dzc) : c.home + Math.sin(t * 0.5 + c.k) * 0.6;
            var tgP = nearM ? -Math.atan2(c.y - 0.5, Math.sqrt(dxc * dxc + dzc * dzc)) : -0.15;
            var kc = Math.min(1, dt * (nearM ? c.k : 1.2));
            c.yaw += normAngle(tgY - c.yaw) * kc;
            c.pitch += (tgP - c.pitch) * kc;
          });
          updateCams(WT);
          var sy2 = lerp(WT.y0, WT.y1, 0.5 + 0.5 * Math.sin(t * lerp(0.5, 1.6, WT.on)));
          WT.scan.position.y = sy2;
          WT.scan.scale.setScalar(WT.spR(sy2) + 0.15);
          WT.scan.material.opacity = 0.4 + 0.55 * WT.on;
          var sw = t * 0.45;
          _v3.set(nearM ? lmx : Math.sin(sw) * 42, 0, nearM ? lmz : Math.cos(sw) * 42);
          aimLight(WT, WT.aim.lerp(_v3, Math.min(1, dt * 2.5)));
          WT.light.material.opacity = 0.24 + 0.16 * WT.on;
        }
      }

      /* v8.9 · ai direction: the screen powers on as you sail in (a short
         flicker, then steady) and the beam breathes. reduced motion: the
         screen is simply on and nothing moves. */
      if (id === "ai-direction" && pr.screen) {
        if (rmQ && rmQ.matches) {
          if (pr.power !== 1) { pr.power = 1; pr.screen.material.color.setScalar(1); }
        } else if (isl.dist < 200) {
          var onT = isl.dist < 95 ? 1 : 0.35;
          pr.power += (onT - pr.power) * Math.min(1, dt * 1.4);
          var flick = (pr.power > 0.4 && pr.power < 0.75) ? 0.82 + 0.18 * (Math.sin(t * 47) > 0 ? 1 : 0) : 1;
          pr.screen.material.color.setScalar(pr.power * flick);
          if (pr.beam) {
            var br = 1 + Math.sin(t * 1.3) * 0.07;
            pr.beam.scale.set(br, 1, br);
            pr.beamGlow.material.opacity = 0.62 + Math.sin(t * 1.3) * 0.13;
          }
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
     memorable moment (v9: the boss bud / the pavilion roof / the
     swatch fan over the fence / the eye) in the top of the
     composition. hud tint does the palette. */
  var LAND_CAMS = {
    "capullos":        { side: 8,   back: 16, h: 5,   heroY: 15, mix: 0.45 },
    "liga-u-strategy": { side: -12, back: 20, h: 6.5, heroY: 12, mix: 0.6 },
    "talens-pantone":  { side: 9,   back: 17, h: 6,   heroY: 14, mix: 0.5 },
    "ministerie":      { side: 6,   back: 14, h: 3.4, heroY: 27, mix: 0.55 },
    "ai-direction":    { side: -9,  back: 17, h: 5,   heroY: 13, mix: 0.5 },
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
    /* v8.4 · every choreography reclaims the composed framing: their cams
       ignore zoom/pan, and sailing resumes at the default close-up */
    if (dive || board || land || launch || beached) {
      camUser.zoom = camUser.zoomT = 1; camUser.panX = 0; camUser.panZ = 0;
    }
    if (scene.fog) {
      var fogK = 1 + 0.7 * (camUser.zoom - 1) / (ZOOM_MAX - 1);
      scene.fog.near = fogN0 * fogK;
      scene.fog.far = fogF0 * fogK;
    }
    if (dive) { updateDiveCamera(dt); return; }
    if (board) { updateBoardCamera(dt); return; }
    if (land) { updateLandCamera(dt); return; }
    /* v8.5 · beached = HOLD. the land cam composed a postcard; keep it
       framed under the open case instead of drifting back to the chase
       cam. the release is the launch: the chase cam eases in from the
       held shot as the canoe slides off — arrival, hold, release. */
    if (beached) return;
    var spdK = boat.speed / MAX_SPEED;
    var fx = Math.sin(boat.heading), fz = Math.cos(boat.heading);
    var rx = fz, rz = -fx;

    // ease the dolly; rowing/autosail recenters the pan on the canoe
    var zEase = (rmQ && rmQ.matches) ? 1 : Math.min(1, dt * 3.2);
    camUser.zoom += (camUser.zoomT - camUser.zoom) * zEase;
    if (input.manual || autopilot) {
      var pEase = (rmQ && rmQ.matches) ? 1 : Math.min(1, dt * 2.4);
      camUser.panX -= camUser.panX * pEase;
      camUser.panZ -= camUser.panZ * pEase;
    }
    var uz = camUser.zoom;

    /* v4: when you get close to an island the camera eases back and
       tilts up, so crowns (the eye, the frame, the hoop) stay in shot */
    var nd = 999;
    for (var ni = 0; ni < islands.length; ni++) {
      if (islands[ni].dist !== undefined && islands[ni].dist < nd) nd = islands[ni].dist;
    }
    var nearK = 1 - smoothstep(46, 95, nd);

    var back = (19 + spdK * 5 + nearK * 4) * uz;
    var height = (10.5 + spdK * 2.5 + nearK * 2.2) * Math.pow(uz, 1.35);
    var side = input.turn * -2.2 * spdK;

    var want = new THREE.Vector3(
      boat.x + camUser.panX - fx * back + rx * side,
      height,
      boat.z + camUser.panZ - fz * back + rz * side
    );

    if (introT > 0) {
      introT -= dt;
      var k = Math.min(1, dt * (0.8 + (3.6 - introT) * 0.35));
      camPos.copy(camera.position).lerp(want, k * 0.55);
    } else {
      camPos.lerp(want, Math.min(1, dt * 2.6));
    }
    camera.position.copy(camPos);

    camTarget.lerp(new THREE.Vector3(boat.x + camUser.panX + fx * 11, 2.5 + nearK * 6.5, boat.z + camUser.panZ + fz * 11), Math.min(1, dt * 3.2));
    camera.lookAt(camTarget);

    var wantFov = baseFov + spdK * 7;
    if (Math.abs(camera.fov - wantFov) > 0.05) {
      camera.fov += (wantFov - camera.fov) * Math.min(1, dt * 3);
      camera.updateProjectionMatrix();
    }
  }

  /* ---------- compass ---------- */
  var _cpx = [], _cpy = [], _cMaxR = 46;   // _cMaxR: dial radius minus a dot radius, re-measured on resize
  function updateCompass() {
    var relN = Math.PI - boat.heading;
    compassRose.style.transform = "rotate(" + (-relN) + "rad)";
    var n = islands.length, i, j;
    for (i = 0; i < n; i++) {
      var isl = islands[i];
      var dx = isl.group.position.x - boat.x;
      var dz = isl.group.position.z - boat.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      var rel = Math.atan2(dx, dz) - boat.heading;
      // v8.7: sqrt spreads the near field, where the four dots used to pile up
      var r = (17 + Math.sqrt(Math.min(1, d / 300)) * 29) * (_cMaxR / 46);
      _cpx[i] = -Math.sin(rel) * r;
      _cpy[i] = -Math.cos(rel) * r;
    }
    /* v8.7: the dots are 24px buttons (wcag 2.2 target size) on a 118px dial —
       relax overlaps so neighbours never sit on top of each other. the dial is
       a rough bearing aid, so a few px of displacement is honest enough. */
    for (var pass = 0; pass < 4; pass++) {
      for (i = 0; i < n; i++) {
        for (j = i + 1; j < n; j++) {
          var ox = _cpx[j] - _cpx[i], oy = _cpy[j] - _cpy[i];
          var od = Math.sqrt(ox * ox + oy * oy);
          if (od >= 27) continue;
          if (od < 0.01) { ox = 1; oy = 0; od = 1; }
          var push = (27 - od) / 2 / od;
          _cpx[i] -= ox * push; _cpy[i] -= oy * push;
          _cpx[j] += ox * push; _cpy[j] += oy * push;
        }
      }
      for (i = 0; i < n; i++) {
        var rr = Math.sqrt(_cpx[i] * _cpx[i] + _cpy[i] * _cpy[i]);
        if (rr > _cMaxR) { _cpx[i] *= _cMaxR / rr; _cpy[i] *= _cMaxR / rr; }
      }
    }
    for (i = 0; i < n; i++) {
      var dot = compassDots[i];
      dot.style.transform = "translate(" + _cpx[i].toFixed(1) + "px," + _cpy[i].toFixed(1) + "px)";
      dot.classList.toggle("visited", !!visited[islands[i].def.id]);
      dot.classList.toggle("targeted", autopilot === islands[i]);
    }
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
    var w = stageEl ? stageEl.clientWidth : window.innerWidth;
    var h = stageEl ? stageEl.clientHeight : window.innerHeight;
    if (!w || !h) return; // stage display:none (menu mode) — v8.7: the old `|| innerWidth` made this unreachable
    if (w === lastW && h === lastH) return;
    lastW = w; lastH = h;
    if (compassEl && compassEl.offsetWidth) _cMaxR = compassEl.offsetWidth / 2 - 12;
    camera.aspect = w / h;
    // v8.2: re-derive the framing for the new proportions, applied
    // immediately (choreography cameras don't touch fov) and then eased
    // by updateCamera during normal sailing
    baseFov = fovForAspect(camera.aspect);
    camera.fov = baseFov;   // a resize is already a jump — snap, then ease
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
})();
