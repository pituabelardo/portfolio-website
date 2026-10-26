# AGENTS.md — field guide for models working on this site

you landed on jorge antolín's 3d portfolio: a static site (no build step) where
you row a toon canoe across a golden-hour sea, discover five islands, and each
island opens a case study (liga u first — see §8.8 for the content rules;
island 03 is the ai video shelf — §8.9). the html menu "lives under the sea" — you dive off
the canoe to reach it (`WORLD.diveOut`) and climb back aboard to leave
(`WORLD.boardIn`). read this file WHOLE before touching anything, then read
`js/world.js` whole too (its header comment is the art direction bible).

## 0 · ground rules (break these and jorge will find you)

- three.js **r128 UMD from cdnjs**, lazy-loaded by `js/main.js`. no bundler, no
  build step, no npm. all quality lives in shading/geometry, not in a newer three.
- the SEO/content layer in `index.html` is untouchable except `aria-hidden`
  decorative nodes. it is simultaneously the dry-land mode, the no-webgl
  fallback and what crawlers read. (v9.1) when its words or JSON-LD do have to
  change, §8.11 (seo, entity data, honesty) is the rulebook.
- all copy lowercase, in english, gamberro-but-professional.
- mobile budget (hard): **<150 draw calls, <150k tris, textures ≤512px, no
  post-processing**, ≥25fps in software rendering at 390×844. the budget is
  shared across the WHOLE scene, not per island.
- escape is instant everywhere. `prefers-reduced-motion` skips every animation,
  including any you add. nothing levitates, nothing clips, feet never sink,
  the canoe never buries.
- never commit secrets. never stage anything outside `website/`. jorge's
  prompt-history files (`PROMPT-FABLE5*.md`) are gitignored on purpose.
- README.md keeps its content-insertion points (a) youtube videos, (b) liga u
  case content, (c) social links. don't orphan them.
- (v8.6) capullos ships TWO language cuts (`CAPULLOS_VIDEOS` in config.js:
  english + español). main.js builds one iframe plus a `.lang-chip` per cut;
  the `.video-placeholder` in index.html is now the real no-js/crawler
  fallback (plain youtube links), and the JSON-LD `CreativeWork` carries a
  `VideoObject` per cut. change a video id and all three must move together.

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
   add a `CreativeWork` node to the JSON-LD graph. (v8.7+) the sitemap lists
  only the root — `#fragments` are ignored by google, so don't add one.
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
3. if the island has solid off-shore props (none today — liga u's giant sea
   hoop was removed in v9), push a
   collider into `rocks[] = {x, z, r}` in world coordinates.
4. add its `LAND_CAMS` entry and screenshot the beaching from two angles.
5. add the `<article>` case block and JSON-LD node (step 4/5 of §1).
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
  `isl.props` handles you stored at build time (see (v9) capullos' `gang`/
  `fireflies`, liga u's `lights`, talens' `jump`, ministerie's `watch`/
  `eyeGroup`, ai direction's `screen`/`beam`).
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
  the shared `TOUCH_DEV` const). (v8.5) the chips reflect the clamp:
  `+` is disabled at the floor (spawn framing IS the max close-up) and
  `−` at the ceiling — `setZoomT` owns that bookkeeping, and the chip
  click handler carries the same paused/choreography guard as the wheel.
- **return to the frame**: pan eases back to the canoe whenever the boat is
  driven (manual input or autopilot — `input.manual` is set by readInput);
  zoom PERSISTS while sailing (navigating from the chart is the point) and
  every choreography (dive/board/land/launch/beached) resets zoom+pan
  instantly at the top of `updateCamera`. dive/board/land have composed
  cams; (v8.5) `beached` HOLDS the land cam's final postcard under the open
  case (arrival → hold), and `launch` releases it by easing back into the
  chase cam. pan is clamped to PAN_MAX and the look-point never leaves
  BOUND_R. gestures are inert while `paused` or any choreography runs
  (guarded in the handlers too). reduced motion snaps the easing instead
  of animating it.
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
  destination, `W.getState().mode` reports it. (v8.5) `W.setPaused(true)`
  CANCELS any running dive/board/land/launch (pausing mid-choreography can
  only mean the sea was escaped — a case never opens while one runs); only
  `beached` survives a pause, because beached+paused IS the open-case state.
  a new state must either be cancelled there too or justify why it survives.
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
  https://jorge.eus (v9.2, registered at dinahosting 25 oct 2026; the old
  https://portfolio-website-nu-ebon-47.vercel.app 301s to it). index.html,
  sitemap and robots point at jorge.eus (§8.11 — `jorgeantolin.com` is NOT his).
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

## 8.7 · v8.7 red-team notes (read before touching deploy/a11y)

- origin in index/sitemap/robots is the VERCEL url until jorge attaches a
  domain of his own (v9.1: `jorgeantolin.com` belongs to someone else — parked
  at ionos since feb 2025; see §8.11). swap with one search-and-replace when
  the domain lands.
- `vercel.json` now carries a CSP. allowed: self, cdnjs (three), google fonts,
  youtube-nocookie (frames), i.ytimg.com (thumbs). a new third-party host needs
  a CSP entry or it silently fails. three.js is pinned with SRI in main.js
  (`THREE_SRI`) — if you change the three version, recompute the sha384.
- (v8.7.1) AGENTS.md / README.md / any *.md are excluded from the deployment
  by `.vercelignore` — the vercel.json rewrite alone did NOT work in prod (a
  file that exists wins over a rewrite; /AGENTS.md served 200). the rewrite
  stays as a second belt. they are still in
  the (public) repo.
- the youtube embed is a facade (`.yt-facade`): the iframe only exists after a
  click. `pauseCaseVideos` handles both states.
- local testing gotcha: js/css are cached a day, and `?v=` does NOT change while
  you edit — hard-reload via `fetch(url,{cache:"reload"})` or bump BUILD.
- cases are `role="dialog"` only while floating over the sea; focus goes to the
  close button and returns on close; tab is trapped (main.js).
- `setPaused(true)` now STOPS the render loop unless beached; `setPaused(false)`
  restarts it. anything that needs frames while paused must be beached-gated.
- (v8.7.2) compass autopilot: `autopilotWaypoint` steers around other
  islands (ISLAND_R + 9) and every `rocks[]` collider off the target's beach
  (tangent waypoint, relaxed out of neighbours, side-swap watchdog after 1.2s
  stuck). it no longer releases the helm at ISLAND_R + 3, and under autopilot
  only the TARGET's sand starts `startLand`. before this, 3 of 4 islands
  failed from spawn (liga u stalled in the sand; talens/ministerie docked on
  capullos/liga u). regression test = the 16-route matrix (spawn + off each
  island → every other island) — all must open the target's case.
- ambient animation rides `tw` (frozen under prefers-reduced-motion); the hull
  uses the same time through `tWave`, so the boat never bobs on frozen water.

## 8.8 · v8.8 notes — liga u is the axis

- **honesty rule (content) — rewritten in v9.1, see §8.11**: only liga u
  (island 01, the main case), capullos (island 02, a liga u campaign) and ai
  direction (island 03) are professional work. talens x pantone and
  ministerie are CONCEPT CAMPAIGNS written to fictional briefs, never
  commissioned. every surface says so — without the word "student": case tag
  ("concept campaign · never commissioned"), a `.case-honest` line, case-meta
  "for: a fictional brief" + "concept work", JSON-LD (`genre: concept work`),
  hero lede ("two islands of concept work, labelled as such") and the
  captain's "land ho" (config `ISLANDS[].tag: "concept campaign"`). never
  write copy implying they were clients — proud, not apologetic.
- `ISLANDS[]` order is importance (liga u first). the world only reads `pos`:
  terrain seeds, dock/hoop/frame orientation all derive from position, so
  reordering moves nothing. swapping POSITIONS is a different story — (v9)
  the off-shore hoop that made it dangerous is gone, but every island now
  orients its hero toward the spawn and talens' fence is placed against the
  routes in (§8.10). re-verify §1 + the 25-route matrix before trying.
- the liga u case ships draft holes as `<template class="case-draft">` —
  inert and unindexed; `?draft=1` renders them (main.js). never turn a hole
  into visible placeholder copy on the public page, and never invent numbers.
- the water shader is no longer hard-wired to 4 islands: `uIsl` is sized by
  `#define NUM_ISL` from `defs.length` (GLSL ES 1.0 needs a constant loop
  bound). `stepBoat`'s `shoreDamp` already looped every island, so a 5th
  island now gets foam rings AND stays in hull/physics sync.

## 8.9 · v8.9 notes — island 03, ai direction (the ai video shelf)

- **what it is**: the fifth island, `id: "ai-direction"` at **(150, 45)**,
  color `0xa66bff` (ink text on it is 5.5:1 — the first violet, 0x9c5bd9,
  failed AA both ways). (v8.9.1) jorge's name for it: board, compass and
  "land ho" read **"ai video & art direction"** — no `tag`, the name says
  it all; the case keeps the short h2 "ai direction". third in `ISLANDS[]` (after capullos, before the
  student concepts) and case **island 03**; talens moved to 04, ministerie
  to 05 (`data-num` + tags).
- **placement, verified**: 92.0 from liga u (the tightest pair in the
  archipelago — their 46u dock zones touch exactly at the midpoint), 147
  from ministerie, 182 from capullos; r = 156.6 (≤165); z = 45; the spawn →
  capullos lane and the welcome buoy are untouched; nowhere near the gijón
  side. the east sale-buoy (191, 0) sits ~61 from its center, outside
  dockR. rocks keep their 45u exclusion automatically (`buildRocks` loops
  `islands`).
- **the moment**: a low-poly stadium after dark with a vertical light beam
  out of its roof (the triple-double reel's cover, translated to toon, not
  copied) + a 9:16 screen on the plaza wearing a canvas-drawn poster of the
  reel (288×512, redrawn once anton loads). **no video in the 3d, and the
  real cover is NOT used** — it's jorge's to clear. the stadium faces the
  spawn approach (`stA`, same rule as liga u's court).
- **draw calls (island alone = 9, ≤10 budget)**: terrain · stadium shell +
  ribs + podium + screen frame/legs + lamp posts (one `propMat` mesh) · every
  emissive bit — window bands, the slit, the oculus, lamp heads (one
  `MeshBasicMaterial` vertex-color mesh) · screen face · beam · 2 glow
  sprites · shore pebbles · the name board. the beam is two open cylinders in
  ONE geometry; alpha comes from a 2×128 gradient texture whose two columns
  (core strong / halo faint) are picked by forcing the uv.x of each cylinder
  — r128 vertex colors carry no alpha. `fog: false` on purpose: it's the
  landmark you read from far away (liga u's sea hoop, removed in v9, was
  the other one; talens' swatch fan is fog-free too).
- **animation** (`animateWorld`): the screen "powers on" when you're within
  95 (dim 0.35 → 1 with a short flicker on the way up) and the beam breathes.
  distance-gated (<200), and under `prefers-reduced-motion` the screen is
  simply on and nothing moves. no off-shore props → no `rocks[]` entry.
- **budget (tier mobile, 390×844, swiftshader, calls / tris)**: spawn
  70 / 36k (unchanged: the island isn't in the portrait frame) · gijón
  44 / 30k · next to the island from the spawn side, from liga u and from
  the north 52 / 27-33k · beached on it 51 / 27k · chart zoom 4.2 over the
  origin 61 / 27k, over the island 54 / 29k, over the spawn **92 / 41k**
  (worst) — all well inside 150 / 150k. the island alone: 9 objects.
- **content rule**: the case is a shelf (`.ai-pieces` → one `.ai-piece` per
  reel, newest first). public = only what the post proves (what, for whom,
  caption, format). master/duration/tools/process/metrics/credits/
  **permissions** are `case-draft` templates. permissions are mandatory: the
  acb's ok, and if a piece generates real players' likeness with ai, their
  consent or image rights — no permission on file, no publish. the poster in
  the case is css-drawn, not the cover. JSON-LD carries a `VideoObject` per
  piece with real data only (no `thumbnailUrl` until a cover is public).
- **csp**: unchanged — there is no embed (no mp4 yet: poster + link to the
  post). self-hosted mp4s already pass `media-src 'self'`; an instagram embed
  would need `https://www.instagram.com` in `frame-src` (+ `script-src` for
  `embed.js`). README (e) has the recipe.
- the edge sale-buoys now sell **island #6** (board, mailto subject, chip,
  north toast).
- route matrix is now 25 routes (spawn + off each of 5 islands → every
  other island). "off-ai-direction" starts 52u toward the SPAWN, not toward
  the origin — toward the origin lands inside liga u's dock zone.

## 8.10 · v9 notes — the four original islands rebuilt to ai direction's level

jorge loved island 03 and asked for the other four to be "tan chulas". the
recipe (header comment of world.js, "ART DIRECTION (v9)"): one hero with a
silhouette you read from the spawn, its own light in ONE unlit vertex-color
mesh, clean ground with merged props, and a moment within ~90 that freezes
under reduced motion. shading untouched (toonMat + 4-step ramp). positions
untouched. directions approved by jorge on 24 oct 2026, with his notes.

- **liga u — the pavilion.** the full court lives under a barrel roof
  (`vaultGeo`: cream top, yellow raised ribs, wood underside, ink trims) on
  ten columns, glazed lunettes at both arched ends, a skylight on the ridge,
  the "liga u" sign on top (`makeLeagueSignTexture`, anton, 512×128). a tall
  stand behind the court, a low one on the spawn side, a crowd (its own mesh,
  `toonMat({wave:true})` — a vertex-only travelling crest driven by
  `uWave`), a center-hung 4-face scoreboard (`boxFacesGeo`). **the giant sea
  hoop is gone** (jorge: "no me gusta nada la canasta en el agua"), with its
  `rocks[]` collider and the 4 lane buoys. moment: lights power on (<100)
  and the crowd does the wave (<90). 14 objects.
- **capullos — the gang** ("dale una vuelta, que tenga gracia" + "un toque
  punk"). capullo = bud AND little punk: the boss is a giant bud on the
  main mound (curved `TubeGeometry` stem) with a fuchsia petal mohawk and
  shades; six small punks with angry brows are ONE `InstancedMesh`
  (`updatePunks`); a garden wall tagged "capullos" (`makeTagTexture`); a
  string of bulbs up the hill (lit mesh). moment (<85): every head turns
  to stare at the canoe, each at its own speed, and the boss blows a gum
  bubble that pops into confetti (one `Points`). reduced motion: they face
  the spawn, the bubble just sits there. fireflies kept. 13 objects.
- **talens x pantone — the two halves** (supersedes "only the chips have
  color"; jorge: one half color and joy, the other misery, a wire fence in
  between — he pointed at the poster of a series about immigration; ask
  him for the name before re-composing). the terrain colorFn blends a joy
  ramp and the old grey ramp across the fence line; chain-link strip
  (`makeChainLinkTexture`, alphaTest) + concertina coil (helix
  `TubeGeometry`). the swatch fan (7 blades × 3 tints, one unlit mesh, fog
  off) opens via a vertex shader (`aBlade` × `uOpen`); swatches jump the
  fence onto the grey side (`updateJumps`, instanced + `setColorAt`).
  **placement rule**: the fence runs toward the spawn (side-by-side read)
  but stops 11u short of the center on that side — every route arrives
  from the east-northeast and a beaching paddler walks to r≈17, so no canoe
  or paddler ever meets the wire. fan colors are deliberately NOT in
  spectral order (a fanned spectrum reads as a rainbow flag). 10 objects.
- **ministerie — the watcher.** a 6-sided faceted obsidian shard
  (`toNonIndexed` lathe) + two leaning shards, red slit windows (lit mesh),
  a hexagonal red scan ring that rescales to the shard at its height, the
  eye as ONE unlit mesh inside a solid lens bezel on a yoke (no more wire
  cage / torus knot / flat cone / beacon), a searchlight cone using the
  beam texture's core column (`aimLight`), seven cctv cameras on poles
  (one `InstancedMesh`, `updateCams`). moment (<90): every camera snaps to
  the canoe, the light leaves its sweep to find you, the scan speeds up.
  reduced motion: everything holds still facing the spawn (the eye too —
  it used to follow you even under reduced motion). 10 objects.
- `LAND_CAMS` re-tuned so each hero sits in the top of the postcard:
  capullos heroY 15, liga u 12, talens 14, ministerie 27.
- **budget (tier mobile, 390×844, swiftshader, calls / tris)**: spawn
  73 / 42k · gijón 50 / 36k · 60u off each island toward the spawn: liga u
  75 / 47k, capullos 72 / 48k, talens 53 / 37k, ministerie 55 / 35k, ai
  57 / 34k · chart zoom 4.2 there: 53-74 / 34-48k, over the origin 60 /
  34k, over the spawn **78 / 49k (worst; was 92 / 41k)** · beached 58-70 /
  42-50k. objects per island: liga u 14, capullos 13, talens 10,
  ministerie 10, ai 9 (were 19+4 buoys, 25, 12, 16). calls went down,
  tris went up ~9k (crowd, roof, coil) — far inside 150 / 150k.
- route matrix (25 routes, compass autopilot): **25/25**. talens'
  beachings all land ≥0.45 rad off the fence line (spawn → (-113,-25),
  the rest on the east side). touch flow (compass → beach → case → close
  → sail) green at 390×844 (liga u), 375×667 (capullos), 844×390
  (talens), 412×915 (ministerie). reduced motion verified static on all
  four.

## 8.11 · v9.1 notes — seo, entity data and the honesty rule (approved by jorge, 25 oct 2026)

the site's job in search: when someone types "jorge antolín", or asks google's
ai mode / chatgpt / perplexity "who runs liga u's communication / strategy /
community", jorge's name and this page come back. read this before touching
the head, the JSON-LD, the hero, the about section or any case tag.

- **never "student"**. no surface calls jorge a student or dates his
  education: no years, no "homework", no school as `sourceOrganization` of a
  work. education lives only as `alumniOf` (upv/ehu + hogeschool utrecht, no
  dates) and the about line "i specialized in brand design at hogeschool
  utrecht". the work speaks, not the cv timeline.
- **concept work, never a client**. talens and ministerie are "concept
  campaign" / "concept work" written to a fictional brief and "never
  commissioned" (§8.8). don't swap that for anything that hints a real client.
- **the title, said honestly**. his job title is **head of content &
  communication, liga u** (linkedin: "responsable de contenidos y
  comunicación liga u"; the press: "responsable de comunicación de liga u en
  acb", reason why, 29 jul 2026). (v9.4, jorge's ok after the jury exam —
  three different titles across cv/site/linkedin read as inflation) ONE
  title everywhere: h1, `<title>`, og, manifest, the brand pill and the cv
  all say "head of content & communication". "creative director & brand
  strategist" survives only as craft (`hasOccupation`, the about's "by
  trade"). never inflate (not "head of brand", not "director of").
- **where he is**: based in madrid (acb), raised in gijón — the site says
  both ("grew up by the sea in gijón", "based in madrid, raised in gijón");
  JSON-LD `homeLocation` is madrid. keep cv, site and linkedin in sync.
- **query vocabulary lives in visible text**: the about paragraph names the
  spanish job names people search ("responsable de comunicación",
  "responsable de contenidos", "community manager de la liga u") and the
  Person `description` repeats "responsable de comunicación y contenidos de
  la liga u". keep both if you rewrite either.
- **no personal plans on the page.** no copy, meta, schema or comment about
  availability or what jorge wants next. the site shows the work; it never
  asks.
- **entity data (JSON-LD `@graph`)**: `ProfilePage` (`#profile`, mainEntity →
  `#jorge`, `dateModified` = the day you change it), `WebSite`,
  `SportsOrganization` liga u, `Organization` acb, `Person` `#jorge`, one
  `CreativeWork` per case. the Person is in proper case ("Jorge Antolín") on
  purpose — visible copy stays lowercase, entity data matches how the name is
  written everywhere else. `alternateName` carries the full name and both
  no-tilde spellings. `subjectOf` lists press that NAMES him (only real,
  linkable articles; add new ones there and in the about's `.press` line).
  `sameAs` = profiles that are verifiably his (today: linkedin only; jorge
  will send more). `image` is still the og illustration — swap for a real
  headshot when jorge sends one.
- **what doesn't move without a reason**: the `https://jorge.eus` origin in
  canonical/og/sitemap/robots, `meta description` (written for
  "jorge antolín" + "liga u" + "comunicación"), the h1. bump `dateModified`
  and `sitemap.xml` `lastmod` whenever the page's text changes.
- **domain**: `jorge.eus` (v9.2), registered at dinahosting on 25 oct 2026;
  dns lives in dinahosting's panel and points at vercel. `jorgeantolin.com`
  is registered to someone else (ionos, since 13 feb 2025). the vercel.app
  host 301s to jorge.eus (vercel → domains). pending on jorge's side: add the
  domain property in search console and submit the sitemap. in emails/cv write
  it as `https://jorge.eus` — .eus is unfamiliar and some clients won't
  autolink the bare name.
- **contact for search/ai answers (v9.3)**: hello@jorge.eus is stated three
  ways so google's ai mode and other answer engines can quote it: a plain
  sentence in #about ("to contact jorge antolín … email hello@jorge.eus"),
  the Person `email` + `contactPoint` in JSON-LD, and `/llms.txt`. change all
  three together.
- **checks after any change here**: JSON-LD parses (`python3 -c json.loads`
  on the block), `grep -i "student\|homework\|graduat"` over index.html and
  js/ returns nothing public, and the live page answers 200 to googlebot,
  gptbot, perplexitybot and claudebot user agents (vercel firewall/bot
  settings must never block them).

## 8.12 · v9.4 notes — the cv and the contact panel (26 oct 2026)

- **the cv** is two pdfs, `/cv/jorge-antolin-cv-en.pdf` and `-es.pdf`, built
  from `cv-src/` (`cv.{en,es}.html` + `cv.css`, static ttfs in `cv-src/fonts`
  — variable fonts print as type 3, worse for ats) by `cv-src/build.sh`
  (headless chrome → print to pdf, no network). `cv-src/` never ships
  (`.vercelignore`). **not under `/assets/`**: that path is cached immutable
  for a year and the cv will change; `/cv/` gets vercel's default revalidation.
- concept "bitácora" (logbook), approved by jorge: page 1 = the cv (route of
  legs with coordinates, a 3-stat strip drawn to scale by area — capullos is a
  unit chart: 328 dots × €100 + an area-true coral speck for the €11), page 2 =
  one centred call to action to jorge.eus (+ qr and the linked capullos
  case film, en/es cut per language). the avatar is a render of the
  site's own low-poly paddler (`cv-src/avatar.jpg`), not the flat svg.
- **every figure is jorge's, sourced** (season 2025-26 panels + the public
  ligau.com note); he ok'd the internal ones (85M ig+tiktok views, er 3.69% vs
  rival iq's 1.3% for sports teams). never add a number he hasn't given. the
  cv dates education-free on purpose (same "never student" spirit as §8.11),
  but does carry experience dates (ats needs them).
- ats rules for any edit: real text, dom order = reading order, standard
  section names, month-year dates. after building, `pdftotext` both files and
  read them, and LOOK at every page (pdftoppm) — page 1 is full to the mm.
- **the contact panel**: the topbar pill ("jorge antolín" + a coral "say hi",
  "hi" ≤420px; the role text hides ≤1040px to make room) opens `#contact-panel`,
  built in `js/main.js` from `cfg.CONTACT` (`js/config.js`: email, phone,
  linkedin, cv links). it is created BEFORE the webgl capability gate, so it
  works in the sea, on dry land and with no webgl. same dialog contract as the
  cases: role=dialog + aria-modal, focus to the close button and back to the
  pill, tab trapped, escape closes — via a capture-phase listener, so escape
  never also leaves the sea. in the sea it pauses the world only if it was
  running (and restarts only what it paused); on ios `#stage` hides while it's
  up (the v8.3 compositing lesson). no-js fallback: the pill links to #about.
- (v9.4) **jury exam**: 8 recruiter personas reviewed cv + site (report in
  jorge's folder, not the repo). acted on: sourced league claim (Eurohoops
  2026-27 ranks Liga Endesa europe's no. 1 domestic league — never "second
  after the nba", no source says that), the acb block runs "jun 2025 –
  present" with "joined the acb communication department in jun 2025" and
  the head title "since sep 2025" — the words intern/prácticas never appear
  (jorge's call),
  cities instead of coordinates, a reporting line + stakeholders bullet, a
  plain one-column ats version (`cv-src/ats.{en,es}.html` →
  `/cv/*-plain.pdf`, for job portals), one title everywhere, and the
  dry-land reveal fix below.
- **dry-land reveal (v9.4)**: `.case/.about` start at opacity 0 and get
  `.inview` from an IntersectionObserver. a fast fling or a #hash jump could
  carry a case across the viewport between two samples and leave it
  invisible; main.js now also reveals anything scrolled past, plus a
  passive rAF scroll sweep. note for harnesses: full-page screenshots don't
  scroll, so they still show the unrevealed cases as empty water — that is
  the capture, not the site.
- contact data lives in three places + the panel: about/JSON-LD/llms.txt (§8.11)
  and `cfg.CONTACT`. the phone (+34 684 64 10 01) is public by jorge's choice.

## 9 · known deltas

- (v7) the elogio is a low-poly approximation: the legs' curved inner cutouts
  are suggested with widened bases, not the real concave arc.
- (v7) the muro's arcades and the náutico plaza don't exist; the muro is
  slab + balustrade.
- (v8.3) at ultrawide desktop (2560×1080, tier high) worst-case panorama views
  framing the whole archipelago measure ~153-156 draw calls — over the 150
  ceiling, but that budget is defined for tier mobile @390×844 (worst there:
  ~105 calls / 59k tris). pre-existing since v8.2.x, not a regression; trim
  here first if desktop perf ever becomes a complaint. (v8.5) plain desktop
  1280×800 at SPAWN also measures ~152-154 — same tier-high story (clouds,
  seagulls, fish, motes are high-tier extras), same disposition.
- (v8.5) main.js and dryland.js snapshot `prefers-reduced-motion` once at
  load (their `reducedMotion`/`reduced` vars), while world.js reads the
  cached live MediaQueryList (`rmQ`) per call — flipping the OS setting
  mid-session updates world choreographies but not the dive/board veil
  decision until reload. deliberate: the veil decision is per-visit, and a
  mid-session flip is rare enough not to earn listener plumbing.
- (v8.4) same story at mobile LANDSCAPE (844×390, tier mobile): worst-case
  sweeps measure ~153 calls at zoom 1 (pre-existing — the 96° h-fov clamp
  frames a panorama) and ~154 at zoom 4.2, i.e. the chart view adds ~1 call
  to an already-over-ceiling orientation. the canonical budget viewport
  (390×844) stays comfortably inside at every zoom (worst ~100/61k).
- (v8 → v9.1) production url is the auto-assigned vercel domain, and
  canonical/og/sitemap point at it, until jorge buys and attaches his own
  domain — not jorgeantolin.com, which belongs to someone else (§8.11).
