# AGENTS.md — field guide for models working on this site

you landed on jorge antolín's 3d portfolio: a static site (no build step) where
you row a toon canoe across a golden-hour sea, discover four islands, and each
island opens a case study. the html menu "lives under the sea" — you dive off
the canoe to reach it (`WORLD.diveOut`) and climb back aboard to leave
(`WORLD.boardIn`). read this file WHOLE before touching anything, then read
`js/world.js` whole too (its header comment is the art direction bible).

## 0 · ground rules (break these and jorge will find you)

- three.js **r128 UMD from cdnjs**, lazy-loaded by `js/main.js`. no bundler, no
  build step, no npm. all quality lives in shading/geometry, not in a newer three.
- the SEO/content layer in `index.html` is untouchable except `aria-hidden`
  decorative nodes. it is simultaneously the dry-land mode, the no-webgl
  fallback and what crawlers read.
- all copy lowercase, in english, gamberro-but-professional.
- mobile budget (hard): **<150 draw calls, <150k tris, textures ≤512px, no
  post-processing**, ≥25fps in software rendering at 390×844. the budget is
  shared across the WHOLE scene, not per island.
- escape is instant everywhere. `prefers-reduced-motion` skips every animation,
  including any you add. nothing levitates, nothing clips, feet never sink,
  the canoe never buries.
- never commit secrets. never stage anything outside `website/`. jorge's
  prompt-history files (`PROMPT-FABLE5*.md`) are gitignored on purpose.
- README.md keeps its content-insertion points (a) youtube id, (b) liga u
  case content, (c) social links. don't orphan them.

## 1 · anatomy of an island

an island exists in FIVE places that must stay in sync:

1. **`js/config.js` → `ISLANDS[]`** — `{ id, name, pos: [x, z], color }`. the
   `id` doubles as the DOM id of its case article. everything downstream reads
   positions from here: the water shader's foam rings (`uIsl`, built in
   `buildWater`), rock-scatter exclusion (`buildRocks`), autopilot, compass
   dots, `fishSpotClear`.
2. **`js/world.js` → `themeIsland(isl)`** — the island's dedicated build branch
   (`if (id === "your-id")`). each defines a `heightFn` via `beachify()` (this
   is what makes the shore landable — the canoe beaches on any point of the
   sand ring), a terrain color ramp for `buildTerrain(hFn, rampFn(...))`, its
   props, and `isl.props.boardY` for the floating name board.
3. **`js/world.js` → `LAND_CAMS`** — the composed camera for the beaching
   choreography: `{ side, back, h, heroY, mix }` keyed by island id. frame the
   paddler in the foreground and the island's memorable moment up top.
4. **`index.html` → `<article id="your-id" class="case" data-num="05"
   style="--dot:#hexcolor">`** — the case overlay. copy the structure of
   `#liga-u-strategy` for placeholder cases (`.case-slot` stripes, the
   CASE_PLACEHOLDERS convention) or `#talens-pantone` for real content. also
   add a `CreativeWork` node to the JSON-LD graph and a url to `sitemap.xml`.
5. **`README.md`** — if the case ships with placeholders, add/extend an
   insertion note in the style of points (a)(b)(c) so jorge knows where the
   real content goes later.

placement rules (hard-won in v7 — don't rediscover them):
- ≥90 units separation between island centers.
- keep every island inside r=165 from origin (BOUND_R 195 − keepR 30).
- **no island at z > 150** — that water belongs to the gijón skyline.
- the welcome buoy (0, 126) is SOLID; keep it off the straight line from the
  spawn (0, 160) to the nearest island.
- from the spawn, no island may occlude the gijón skyline to the south.
- key constants: `ISLAND_R=30`, `dockR=46`, `BOUND_R=195`, `SPAWN_Z=160`,
  `MAX_SPEED=29`, `HULL_Y=-0.5`.

## 2 · recipe: add a new island

1. add the entry to `config.js` (respect the placement rules above).
2. write the `themeIsland` branch: `heightFn = beachify(...)` + color ramp +
   props. use the shared library: `toonMat`, `tint`, `mergeGeos`, `placed`,
   `scatterOn`/`instancedOn`, `treeGeo`, `bladeGeo`, `dockGeo`, `addLantern`,
   `makeTextBoard`. MERGE geometry aggressively — one mesh per material family,
   instancing for repeats. set `isl.props.heightFn` (collision/beaching needs it).
3. if the island has solid off-shore props (like liga u's giant hoop), push a
   collider into `rocks[] = {x, z, r}` in world coordinates.
4. add its `LAND_CAMS` entry and screenshot the beaching from two angles.
5. add the `<article>` case block, JSON-LD node, sitemap url (step 4/5 of §1).
6. budget check: read `WORLD._renderer.info.render` (`calls`, `triangles`)
   at spawn, next to the new island, and looking at gijón, in tier `mobile`
   (390×844). the <150/<150k ceiling is for the WHOLE scene — if you're over,
   trim the new island first, then negotiate with the rest.
7. run the verification harness ritual (§6): screenshots at spawn, approach,
   beach, case open, escape; then the touch flow on mobile viewports.
8. animate its moment inside `animateWorld(dt, t)` (see §3).

## 3 · recipe: add a new animation to an existing island

- the render loop is `tick()` → `stepFrame(dt, t)` → `renderer.render`. all
  per-frame world life lives in `animateWorld(dt, t)`, which iterates
  `islands` and switches on `isl.def.id`. put your animation there, driven by
  `isl.props` handles you stored at build time (see capullos' `buds`/
  `fireflies`, talens' `orbit`/`chips`, ministerie's `eyeGroup`/`cage`/`coil`).
- gate by distance (`isl.dist < 160`) so far islands cost nothing, and by tier
  (`tier !== "low"`) for anything with particles.
- **reduced motion**: check
  `window.matchMedia("(prefers-reduced-motion: reduce)").matches` and skip
  YOUR animation too — not just the existing ones. static is fine; motion is not.
- draw calls: do NOT add a mesh per animated thing. merge into existing
  per-depth-layer meshes (gijón's L1/L2/L3 pattern) when static, use one
  `THREE.Points` for particle families (capullos' fireflies are 1 call), one
  `InstancedMesh` for repeated geometry, and animate via scale/rotation of a
  group (buds bloom by scaling one merged head mesh) rather than per-part meshes.
- wind sway is free: build with `windMat()` or `toonMat(..., {wind:true})`
  and the shared `uTime` uniform moves it (`windShaders` array).
- if you need per-frame shader time, push the shader into `windShaders` from
  an `onBeforeCompile` — never add a second clock.

## 3.5 · the chart view (v8.4) — user camera zoom/pan

sailing gained a user-controlled camera layer, all in world.js (`camUser`,
`ZOOM_MAX=4.2`, `PAN_MAX=130`, the gesture code in `bindInput`, application
in `updateCamera`'s sail branch). the contract:

- **zoom is a dolly, never fov** (fov stays aspect/speed-driven), and it only
  goes OUT: the default framing IS the max close-up — low-poly assets don't
  survive closer, so zoom-in past 1 is structurally impossible (`setZoomT`
  clamps to [1, ZOOM_MAX]). the ceiling roughly matches the aerial intro, so
  the zoomed-out look is already art-directed. fog near/far scale up with
  zoom (`fogN0/fogF0 × up-to-1.7`) so the chart stays readable in the haze.
- **touch**: pointers tracked by id in `bindInput`. ONE finger rows; a lone
  touch only "arms" as rowing after 130ms or 8px of travel (`rowT0`/
  `rowMoved` checked in `readInput`) so planting two fingers never rows and
  never cancels the compass autosail. TWO fingers NEVER row: pinch zooms,
  two-finger drag pans (grab-the-map, scaled from fov+cam distance so it is
  exact at the look-point's depth). a finger left over from a pinch is dead
  until lifted and re-pressed. 3+ fingers do nothing.
- **desktop**: wheel/trackpad on the canvas (preventDefault'd), plus two
  `.zoom-btn` chips (`#zoom-ctl`, bottom-left, non-touch devices only —
  guarded by the same maxTouchPoints check as the hint copy).
- **return to the frame**: pan eases back to the canoe whenever the boat is
  driven (manual input or autopilot — `input.manual` is set by readInput);
  zoom PERSISTS while sailing (navigating from the chart is the point) and
  every choreography (dive/board/land/launch/beached) resets zoom+pan
  instantly at the top of `updateCamera` — their composed cams ignore it and
  sailing resumes at the default close-up. pan is clamped to PAN_MAX and the
  look-point never leaves BOUND_R. gestures are inert while `paused` or any
  choreography runs (guarded in the handlers too). reduced motion snaps the
  easing instead of animating it.
- `getState()` reports `zoom` (the `?debug=1` overlay prints it for free).
  `W.setZoom(z)` exists for the harness.
- budget (v8.4, tier mobile): worst case at zoom 4.2 @390×844 is ~100 calls
  / 61k tris — inside 150/150k. raise ZOOM_MAX only with a fresh §6 sweep.

## 4 · design (not built): a portal to a second sea

jorge wants a future option: something like a black hole in the water that
leads to a SEPARATE scene showcasing personal projects. design intent, so a
future pass can build it in one go:

- **state**: add `portal` (and its return leg) alongside the existing
  `dive/board/land/launch/beached` state pattern in world.js. all of those are
  module vars + `stepX(dt,t)` functions dispatched from `stepFrame`; the new
  state must obey the same contract: escape-instant at any frame, clean mutual
  cancellation with every other state, reduced-motion skips straight to the
  destination, `W.getState().mode` reports it.
- **trigger**: a solid interactive object in open water — same pattern as the
  edge sale-buoys: a mesh + `rocks[]` collider + proximity check in
  `stepBoat`. sailing into its influence radius starts the portal choreography
  (think: the water darkens, the canoe spirals in, veil takes the frame).
- **the second scene**: its own lazy-loaded module (e.g. `js/void-world.js`),
  loaded only on first entry (mirror how main.js lazy-loads world.js). it owns
  its own scene + camera and takes over `renderer.setAnimationLoop`. only one
  scene renders at a time, so its perf budget is independent — but measure and
  document it exactly like the main sea (renderer.info, mobile tier, 390×844).
- **the way back**: mirror `diveOut`/`boardIn`'s shape — an exit choreography,
  a veil handoff (`#sea-veil` can be reused or cloned), and a symmetric
  re-entry that spawns the canoe back at the portal with outward velocity.
- **the html layer is unaffected**: `#depth-bg`, the cases and the SEO DOM
  don't know the second sea exists. this is a second 3d scene, not a new page.
- **routing decision (make it consciously when building)**: if the personal
  projects need shareable urls, give the portal a hash route (`#void`) handled
  like the existing deep links in main.js (hash present → skip auto-sea), and
  add it to sitemap.xml. if it's a pure easter egg, no route — and say so here.

## 5 · backend policy (supabase et al.)

**there is deliberately no backend.** the site has zero forms, zero auth, zero
persistence; the only "write" is a `mailto:` chip. we explicitly decided NOT to
provision supabase (or any backend) speculatively — not even for the second
sea, which is another static scene. if a future feature genuinely needs one
(contact form, view counter), then: anon/publishable key only in client code,
RLS on every table, service-role keys never anywhere in this repo, and one
paragraph here explaining what it's for and how to extend it.

## 6 · verification harness (do not rediscover this)

lives at `outputs/harness/` in the working session (recreate from this recipe
if missing — it is NOT committed to the repo):

- own http server serving `website/` + `playwright-core` (a copy lives at
  `/tmp/pwtest/node_modules` in the cowork sandbox); headless shell via
  `PLAYWRIGHT_BROWSERS_PATH=$HOME/pw-browsers npx playwright-core install
  chromium-headless-shell`; launch args `--no-sandbox
  --enable-unsafe-swiftshader --use-gl=angle --use-angle=swiftshader`.
- abort ALL external requests except three.js (google fonts hang screenshots);
  cache three r128 locally and serve via `route.fulfill`.
- swiftshader screenshots cost 4-6s and rAF does not free-run: drive frames
  with a temporary `W.__lab` hook (setAnimationLoop(null) +
  `step(n, dt){ stepFrame(dt, t+=dt); render once }` + cam/boat/keys helpers).
  DELETE the hook after the pass and `node --check js/world.js`.
- main.js setTimeout transition chains can't be verified by wall-clock in
  headless — verify by classes/structure; they run fine in real chrome.
- bash calls die at ~45s: `timeout 40` and split runs (~3 screenshots per run).
- `boat.speed` is derived: force `vx/vz`, never `speed`, and only while
  `getState().mode === "sail"`. `WORLD.teleport(x, z, heading)` exists.
- wait for `window.WORLD && WORLD.getState` + `loader.hidden`; suppress
  title/controls cards with `dataset.shown = "1"`.
- **touch testing (v8)**: mouse events prove NOTHING about the joystick. use a
  context with `hasTouch: true, isMobile: true, viewport: {...}` and drive
  `page.touchscreen` / dispatched TouchEvents. minimum matrix: 375×667,
  390×844, 412×915, plus one landscape. the full flow (spawn → dive → menu →
  board → island → dock → case → close → next island → edge cta) must complete
  with touch alone.
- **production smoke test**: point the same harness at the live vercel url to
  catch cdn/caching/absolute-path issues that never show locally.
- **headless pointermove quirk (v8.4)**: without free-running BeginFrames,
  chromium holds the LATEST touchMove-derived pointermove in a queue and only
  delivers it when the next input event arrives — single moves after a pause
  look "lost". echo every CDP touchMove with a 0.4px-jittered duplicate and
  the real one always lands. real chrome never needs this. multitouch itself
  works great via `Input.dispatchTouchEvent` with two touchPoints.
- **known artifact**: in swiftshader screenshots, the fixed case overlay (and
  sometimes the menu cards) can render semi-transparent over the 3d canvas.
  verified opaque in real chrome (v8) — do NOT "fix" it, and do not remove
  `body.mode-content #content { transform: translateZ(0) }` which handles the
  related real compositing quirk.

## 7 · skills policy (standing instruction, not history)

before starting any extension pass in a cowork/claude-code session: check the
available skills and plugins for anything relevant (browser/screenshot
verification, 3d pipelines, image optimization, deployment) BEFORE improvising
from scratch. and when a recipe here proves reusable — the verification
harness in §6 is the prime candidate — package it as a real saved skill with
the `skill-creator` skill instead of re-deriving it every session. if you
create such a skill, note its name here so the next model finds it.

## 8 · deploy

- repo: `github.com/pituabelardo/portfolio-website` (public). repo root IS the
  `website/` folder — the parent `portfolio/` dir is jorge's working folder
  full of client assets that must never enter git history.
- hosting: vercel project `portfolio-website` (team "38-0's projects"),
  auto-deploys `main` on push. production:
  https://portfolio-website-nu-ebon-47.vercel.app (until jorge attaches
  jorgeantolin.com — index.html/sitemap/robots already point at the final
  domain on purpose).
- `vercel.json` sets cache headers only (immutable assets, 1-day js/css). no
  rewrites: single page, hash-based deep links.
- **cache busting (v8.2.1, load-bearing)**: js/css are cached for a day on
  devices, so every deploy that touches them MUST bump the `?v=` stamps in
  index.html AND the matching `BUILD` constant in js/main.js (world.js is
  loaded as `js/world.js?v=BUILD`). skipping this ships your fix to the
  server but not to anyone's phone — this exact miss masked the ios case
  bug for two deploys.
- **remote debugging**: any page + `?debug=1` shows a live overlay (build,
  viewport, state machine, nearest island, case paint state, js errors).
  ask for a screenshot of it before guessing at device-only bugs.
- after any deploy: cold smoke test the LIVE url (title, robots, sitemap,
  og image, one js file's cache header) — see §6 last bullet.

## 8.5 · ios safari field lessons (v8.1 — real-device bugs headless never saw)

- **(v8.3) ios can refuse to composite html over the webgl canvas even with a
  perfect CSSOM** (case card: display:block, op:1, vis:visible, z:70, rect in
  viewport — still not painted; chrome never reproduces). the fix is to remove
  the webgl layer from the equation: `body.mode-sea.case-open #stage
  { visibility: hidden }` scoped to ios via `@supports (-webkit-touch-callout:
  none)` (visibility, NOT display — keeps clientWidth alive for the resize
  self-heal, which runs even while paused). belt-and-braces: in case-open,
  `#content` is position:fixed / z-index:65 / isolation:isolate (NO transform —
  it would become the containing block of the fixed card). the `?debug=1`
  overlay now prints `#stage` computed z/vis/transform/will-change and
  `elementFromPoint` at the card center — screenshot answers any recurrence.
- **(v8.3) loader-first boot**: `#loader` ships visible in the initial html
  (never mounted/unhidden from js after first paint — that's how the menu
  flash happened). main.js hides it synchronously when the destination is the
  content view (deep link / low tier / no webgl), or fades it (`#loader.out`)
  after world-ready. noscript kills it via the `<noscript>` style block. any
  new boot path MUST hide the loader or the site stays black.
- **never use `:has()` in this stylesheet.** ios safari failed to invalidate
  `#content:has(.case.open)` for a class change inside the display:none
  subtree — cases opened logically (hud hid, world paused) but never painted.
  the fix pattern: toggle a body/parent class from js (`body.case-open`,
  `#hud.prompt-up`) and select on that.
- **never size the renderer from `window.inner*` alone.** after reload
  (pull-to-refresh especially) ios hands out stale dimensions and settles
  the viewport later, sometimes without a resize event → canvas smaller than
  screen, html background stripes right/bottom. current scheme: measure the
  `#stage` box, listen to resize + orientationchange + visualViewport.resize,
  delayed re-checks after init, and a self-heal in stepFrame every 120 frames.
  keep all of it.
- **`-webkit-text-size-adjust: 100%` on html is load-bearing** — ios text
  autosizing inflated the captain's bubble ~2.5x.
- **framing is aspect-driven (v8.2)**: `fovForAspect()` in world.js keeps the
  55° vertical fov in the comfortable band and clamps the HORIZONTAL fov to
  [26°, 96°] on skinny-tall / ultrawide windows, re-derived in `onResize`.
  never hardcode a fov or assume portrait/16:9; if you add camera moves,
  read `baseFov`, don't write 55. verified matrix: 320×568 → 5120×1440
  (32:9), 400×1200 (1:3), hot-resize mid-flow with a case open.
- **abs-pos + `left:50%` caps shrink-to-fit width at HALF the containing
  block.** any centered overlay with real text needs `width: max-content`
  (+ max-width) or phones will stack it 1-2 words per line. desktop never
  shows this (half a laptop > the max-width cap).
- verify on a real iphone (or at least real webkit) after any change to
  overlays, viewport sizing or input — chromium touch emulation proved all
  three of these bugs invisible.

## 9 · known deltas

- (v7) the elogio is a low-poly approximation: the legs' curved inner cutouts
  are suggested with widened bases, not the real concave arc.
- (v7) the muro's arcades and the náutico plaza don't exist; the muro is
  slab + balustrade.
- (v8.3) at ultrawide desktop (2560×1080, tier high) worst-case panorama views
  framing the whole archipelago measure ~153-156 draw calls — over the 150
  ceiling, but that budget is defined for tier mobile @390×844 (worst there:
  ~105 calls / 59k tris). pre-existing since v8.2.x, not a regression; trim
  here first if desktop perf ever becomes a complaint.
- (v8.4) same story at mobile LANDSCAPE (844×390, tier mobile): worst-case
  sweeps measure ~153 calls at zoom 1 (pre-existing — the 96° h-fov clamp
  frames a panorama) and ~154 at zoom 4.2, i.e. the chart view adds ~1 call
  to an already-over-ceiling orientation. the canonical budget viewport
  (390×844) stays comfortably inside at every zoom (worst ~100/61k).
- (v8) production url is the auto-assigned vercel domain until jorge buys and
  attaches jorgeantolin.com; canonical/og/sitemap urls intentionally already
  point at jorgeantolin.com and will be correct the moment the domain lands.
