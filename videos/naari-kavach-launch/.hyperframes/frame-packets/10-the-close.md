# Frame packet: 10-the-close

## Project inputs

- Project: D:\naari-kavach\videos\naari-kavach-launch
- Design tokens: D:\naari-kavach\videos\naari-kavach-launch\frame.md
- RULES_DIR: C:\Users\Harsh Bavaskar\.claude\skills\hyperframes-animation\rules

## Assigned storyboard block

## Frame 10 — The close

- scene: The slogan, the evening's tally (1 question asked, 0 taps to answer), the logo, and 112 large. The band becomes the credit "Naari Kavach by ONYX"
- headline_en: It watches the roads, never the people.
- voiceover: "Naari Kavach. It watches the roads, never the people. Free, with no sign-up. In an emergency, dial one one two."
- duration: 8.098s
- transition_in: zoom-through
- status: built
- src: compositions/frames/10-the-close.html
- type: cta
- persuasion: Value stacking
- beat: peace of mind
- blueprint: logo-assemble-lockup (Adapt)
- focal: assets/brand-lockup-night.svg
- roles: brand-lockup-night = cutout (the official lockup, right centre, about 30% of the frame width)
- sfx: none
- asset_candidates: assets/brand-lockup-night.svg — the official horizontal logo lockup for dark grounds

narrativeRole: names the principle, gives the one number to remember, and leaves the helpline on screen.
keyMessage: it watches the roads, never the people. Dial 112.

Adapt: keep the signature of the lockup completing as the name is spoken; change the cleared stage to a clean night end card with the slogan beside it.
Scene 1 (0.0–1.6s): a plain night ground. On "Naari Kavach.", the lockup fades up at the right centre with a small scale settle.
Scene 2 (1.6–4.4s): on "It watches the roads, never the people.", that line fades up on the left in two lines, large, and a thin saffron hairline draws beneath it (`svg-path-draw`).
Scene 3 (4.4–6.0s): on "Free, with no sign-up.", that line fades in under the lockup, and on the left the two tallies count in (`counting-dynamic-scale`): "1" with "question asked tonight", and "0" with "taps to answer it", the 0 in green.
Scene 4 (6.0–end): on "dial one one two", "In an emergency, dial" and a large white "112" fade up under the lockup, and the band's text cross-fades to "Naari Kavach by ONYX", centred. Hold everything still for the last three seconds. This is the final frame: the whole composition fades to the night ground over the last 0.6 seconds.

## Selected blueprint: logo-assemble-lockup

# logo-assemble-lockup — Logo Assemble → Lockup

**intent**: A brand mark / wordmark comes to exist on screen and resolves into a centered logo lockup — built from parts (elements assemble or orbit in, letters cascade, an outline draws on, or a camera pushes through negative space), spring-BLOOMED whole from zero on a cleared stage, MORPHED in one unbroken chain out of the preceding phrase / glyph, absorbed from a kinetic streak, or already assembled and settling as decorations clear — optionally extended into a final URL / CTA / end card.

**roles served**

- Product_Intro (from product-intro-logo-system-assemble): A wordless, premium brand STING — an abstract system of elements pulses / grows / orbits and assembles around a FIXED central logo, carried by one cinematic camera tilt; no copy, no UI.
- CTA (from cta-camera-push-lockup): The logo build is a LEAD-IN to the final ask — a 3D mark assembles + wordmark cascades, then a fast camera PUSH-THROUGH the mark's negative space streaks giant CTA letters past the lens and resolves on a `[url]` / `[CTA verb]` lockup.
- CTA (from cta-button-wordmark-build): The "draws-its-own-outline → wordmark-builds-letter-by-letter" sub-shape — a `[CTA button]` pill strokes its own glowing border, a diagonal-band WIPE flips the frame, and the `[wordmark]` types in beside a slash to land the lockup. Camera static.
- Brand_Outro (from brand-outro-assemble-logo-lockup): The closing mark — a formation of `[feature pills / UI elements]` CLEARS the stage off all four edges, then on the empty frame the `[logo mark]` draws itself on stroke-by-stroke and the `[wordmark]` reveals to complete the lockup, then fades out.
- Product_Intro (from brand-reveal-assemble-zoom): a context-then-focus reveal — a companion tagline TYPES out to set context, the hero mark pops in beside it, then the companion exits as the layout recenters and the camera pushes IN to a held close-up on the mark (wide composition narrowing to a tight focus).
- Product_Intro (from logo-parts-lockup-assembly): the literal parts build — `[icon parts]` (a glowing dot traces a circle, semi-circles scale up and overlap, strokes rotate in) converge into the `[brand icon]` center-frame on a flat / gradient field, the `[wordmark]` joins (± a `[badge pill]` pops onto the lockup), then a payoff beat: a stepped bottom `[subtitle rail]`, a big `[count-up stat]` over a faint asset grid, or the lockup clears and a `[product UI window]` scales in. Static frame, all element-level.
- CTA (from text-clears-mark-blooms-lockup): the text-clear BLOOM — centered `[serif tagline]` beats (word-by-word staggered fades) hold, then CLEAR themselves to a blank frame; the `[brand mark]` spring-blooms from ZERO at dead center, slides left as the `[wordmark]` reveals to its right, and the balanced lockup holds (near-)still. Constant warm flat bg, static frame.
- Brand_Outro (from phrase-morphs-into-lockup): the MORPH chain — a centered `[phrase]` mutates in place, then collapses / swaps into an `[intermediate glyph]` whose line panels fan-and-flip around a central pivot with visible motion blur (page-flip feel) and interlock into the `[geometric mark]`, which slides apart into the lockup. One unbroken chain of transformation, never a cut-and-replace assembly; the finished lockup holds dead static for the final ~40–50% of runtime.
- Brand_Outro (from lead-text-then-mark-assembles): the parts-arrive build — a `[hand-off line]` holds and departs, then the mark is BUILT from arriving parts (`[icon]` drops in, letters slide in one by one, terminal punctuation lands, a confetti burst pops and instantly shrinks) OR a `[pixel stack]` streaks into full-width multicolor stripes whose tail retracts and is ABSORBED into the pixel mark — finishing as a lockup or a full end card (`[icon tile]` + `[title]` + `[URL pill]` + store badges) held static.
- Brand_Outro (from `settled-lockup-reveal`): the null-assembly boundary — the `[lockup]` is on stage from frame one; `[satellite shapes]` drift outward and fade, an accent underline sweeps beneath the wordmark, and the `[tagline]` wipes in to complete it. Settle-and-reveal: no predecessor beat, no morph, no relay.

**duration**: ~4.4–11.0s (Brand_Outro ~4.4–7.3s · brand-reveal ~5s · CTA text-clear bloom 6.0–8.9s · Product_Intro ~7s orbit sting, 7.0–9.8s parts-assembly · CTA push/build 5.4–11.0s)

**shot structure** (one consolidated time-coded template; `[slots]` are product-agnostic)

- Scene 1 — clear / ignite (0.0–~1.0s): the stage is prepared for the mark to build into.
  - _Variant — Product_Intro_: opens on a clean `[light bg]` with faint concentric guide rings under a flat top-down view; rings PULSE and expand from center; mid-beat the bg crossfades `[light]→[dark gradient: hero→secondary]`, tiny seed dots appear along the rings, and the central `[logo mark]`'s glow IGNITES (mark is present from t=0, fixed, front-facing).
  - _Variant — CTA push_: on a `[bg gradient]`, the `[logo mark]` is settling in object space (a 3D mark with thin wireframe edge-guides + a faint bracket motif behind center); a very slow continuous camera push-in may already be creeping.
  - _Variant — CTA button-build_: on a `[dark grid bg]`, a rounded `[CTA button "label"]` pill rises / scales into center (a prior headline clearing off the top); its thin border DRAWS ON as an animated glowing outline STROKE, with a small `[accent]` comet / spark icon at its left edge.
  - _Variant — Brand_Outro_: a PRE-ARRANGED formation of `[feature pills / element grid]` (each `[icon]`+`[label]`) DISPERSES — elements slide outward from their laid-out positions and fly off all four frame edges (edge-clearing drift, NOT a center-origin burst), emptying the frame onto a clean `[bg]`.
  - _Variant — Product_Intro parts-assembly_ (from logo-parts-lockup-assembly): optional text hook — a centered "`[Meet product]`" line wipes away right→left — or straight into the build; on a flat / gradient `[bg]`, the first `[icon parts]` arrive: a glowing dot traces a clockwise circle, a gradient semi-circle scales up inside it, or the mark scales-up-with-rotate into center.
  - _Variant — CTA text-clear bloom_ (from text-clears-mark-blooms-lockup): a centered `[serif tagline / question]` (± an outlined `[badge pill]`) finishes a left→right word-staggered reveal in the first ~0.5–1s (each word passing light-grey→dark) and HOLDS; optional rolling word-by-word swap to a second `[availability line]`. Then the CLEAR: text exits — shrink-toward-center + fade, or word-by-word left-first fade-out — leaving a blank frame for a beat.
  - _Variant — Brand_Outro morph-chain_ (from phrase-morphs-into-lockup): a centered `[phrase]` completes or mutates in place (a vertical slot-machine word swap — one word exits up as its replacement rises from below, rest of the line fixed — or a word-by-word landing) and holds. Nothing clears: the phrase IS the raw material for the mark.
  - _Variant — Brand_Outro parts-arrive_ (from lead-text-then-mark-assembles): a centered `[hand-off line: tagline / "Brought to you by"]` holds on a flat canvas, then exits — slides straight down off-frame with fade, or fades away behind the incoming flourish.
  - _Variant — Brand_Outro settled-reveal_ (from settled-lockup-reveal): the `[lockup]` is already centered at t=0; `[satellite shapes]` drift slowly outward around it — an INVERTED clear: the decorations leave, the mark stays.

- Scene 2 — assemble the mark (~1.0–~Ys): the mark builds itself from parts.
  - _Variant — Product_Intro_: seed dots SCALE UP into flat `[accent]` shapes arranged on the rings; concentric bands ripple outward (tunneling feel) and the shapes begin to ORBIT / drift around the still-fixed center.
  - _Variant — CTA push_: the `[wordmark]` CASCADES out from behind the mark (letters left→right with overshoot) into the full `[brand lockup]`; the 3D mark may assemble in beats (a terminal detaches + pops as a spring dot, a part hinges-open-and-snaps-shut elastic). Optional beat: a `[cursor]` arcs in and "clicks" the wordmark, OR a frosted-glass pill holding an intermediate `[CTA line]` springs in while layered mark shells fan to the edges.
  - _Variant — CTA button-build_: a graphic WIPE flips the frame to `[contrast bg]` — a thin `[accent]` diagonal line sweeps in, swells into a full-frame diagonal BAND, then collapses to a small `[accent]` slash.
  - _Variant — Brand_Outro_: on the now-clear frame, the `[logo mark]` DRAWS ON via stroke (built arc-by-arc / segment-by-segment).
  - _Variant — Product_Intro parts-assembly_: the overlapping parts COMPLETE the `[brand icon]` (a second circle overlaps to close the orb; strokes interlock); the `[wordmark]` slides out from behind the icon or in from its right; a small `[badge pill]` pops onto the lockup.
  - _Variant — CTA text-clear bloom_: on the blank frame the `[brand mark]` scales up from ZERO at dead center with a snappy spring ease (slight overshoot, hint of rotation as it grows) — the whole mark at once, no parts.
  - _Variant — Brand_Outro morph-chain_: the phrase collapses / wipes horizontally into the mark, OR is instantly swapped at the same center for a line-art `[intermediate icon]` whose strokes split into panels that fan-and-flip around a central pivot with visible motion blur, interlock-settling into the `[geometric mark]`. Never a cut to the finished logo — the transformation must stay unbroken.
  - _Variant — Brand_Outro parts-arrive_: the mark is BUILT from arriving parts — the `[icon]` drops in from above, letters slide in one by one, terminal punctuation lands, a tiny confetti burst pops and instantly shrinks — OR a colored `[pixel stack]` pops in at a text edge, shoots horizontally stretching into full-width multicolor stripes, then the stripe tail retracts and is ABSORBED into the `[pixel mark]` (mask retraction).
  - _Variant — Brand_Outro settled-reveal_: an accent underline sweeps left→right beneath the `[wordmark]` — the only "build" this variant performs.

- Scene 3 — resolve to lockup (~Ys–end): the lockup completes and holds (Product_Intro / Brand_Outro) or is flown into / extended to a CTA (CTA variants).
  - _Variant — Product_Intro (the ONE camera move)_: the whole system smoothly TILTS from flat top-down into an angled isometric perspective (ease-in-out) with a slight zoom-out — flat shapes become luminous 3D forms, bands become glowing orbit lines, while the central `[logo mark]` does NOT tilt (stays 2D, front-facing, fixed). Camera eases to a stop; elements keep continuous orbit/drift (inner faster than outer); the mark holds its steady glow. Final settled frame.
  - _Variant — CTA push (the signature)_: a single fast CAMERA PUSH-THROUGH the mark's negative space / through the glass pill — heavy horizontal motion-blur, giant `[CTA]` letters streaking past the lens (cursor drops out). Resolves to the final lockup on a saturated `[bg]`: a `[url badge]` / `[CTA line]` revealed by a left→right WIPE carrying an `[accent]` leading edge (or a clean fade), with solid mark-shapes parallax-sliding in behind. Settles to a dead-static hold (slow zoom-out / settle).
  - _Variant — CTA button-build_: the `[wordmark]` BUILDS letter-by-letter to the right of the slash, landing on the final "`[slash] [WORDMARK]`" lockup centered on the new bg. Slow settle to static.
  - _Variant — Brand_Outro_: the `[wordmark]` reveals beside the drawn mark (slide / fade) to complete the `[lockup]`; the lockup holds, then fades to `[black / bg]`.
  - _Variant — Product_Intro parts-assembly (the payoff beat)_: the finished lockup holds while a bottom `[subtitle box]` steps through `[tagline fragments]` (swap-in-place); or a big `[count-up stat]` line lands over a faint background asset grid; or the lockup scales-down / fades and a `[product UI window]` scales up on the flat bg (its panel content may swap once). The build hands off to product proof.
  - _Variant — CTA text-clear bloom_: the mark slides a short distance LEFT while the `[wordmark]` reveals to its right (letter-by-letter / slide-out wipe with visible partial states); the balanced "`[mark] + [wordmark]`" lockup centers and holds, one member continuing an almost imperceptible slow scale-up through the hold.
  - _Variant — Brand_Outro morph-chain_: the mark slides left as the `[wordmark]` is pulled out rightward trailing a motion-blur streak, the pair decelerating into the centered lockup (± a `[sub-line]` fades in below). The hold is LONG — dead static for the final ~40–50% of runtime.
  - _Variant — Brand_Outro parts-arrive_: the lockup rests centered and holds; or the full end card completes — a rounded-square `[icon tile]` scales up behind the mark, the `[title]` fades in word-by-word, and a bottom row (`[URL pill]` + `[store badges]`) fades / slides up — then holds static.
  - _Variant — Brand_Outro settled-reveal_: the `[tagline]` reveals left→right below the wordmark; the satellites finish drifting out and fade; the lockup holds centered (at most a very slow global zoom-out, no pan).

**motion vocabulary**: ring pulse / expand; background crossfade (light→dark); glow ignite; seed-dot scale-up; continuous orbit / drift (inner faster than outer); single 3D perspective tilt (flat→isometric) + slight zoom-out around a fixed 2D anchor; 3D logo assemble (part detach + spring dot, clapperboard hinge / snap, shell fan-out); wordmark cascade with overshoot (letters left→right); button pill rise / scale-in; animated stroke-outline DRAW + glow (button border AND logo mark); comet / spark accent; diagonal-band wipe (sweep → swell → collapse-to-slash); letter-by-letter wordmark build; pre-formed grid DISPERSE off all four edges; logo-mark stroke-draw (sequential arcs / segments); fast CAMERA PUSH-THROUGH with motion-blur (CTA spine); continuous slow push-in / push-out; cursor arc-in + click; parallax shape slide-in; left→right URL/badge wipe with glowing leading edge; static / fade-out end-lockup hold; optional idle breathe on the held mark; glowing-dot circular path trace; part-overlap icon completion (semi-circles scale up + overlap); scale-up-with-rotate mark entrance; wordmark slide-out-from-behind-icon; badge pill pop onto the lockup; stepped subtitle swap-in-place (bottom rail); count-up stat tick over a faint asset grid; lockup shrink / fade → UI-window scale-up payoff; word-by-word staggered fade-through-grey (in, and left-first out); rolling word-by-word line swap; shrink-toward-center + fade clearing exit; whole-mark spring BLOOM from zero (overshoot + slight rotation); near-imperceptible continuous scale-up through the hold; vertical slot-machine word swap; horizontal phrase collapse / wipe into the mark; instant same-center text→icon swap; line-panel fan-and-flip morph around a central pivot with motion blur (page-flip feel); interlock-settle into the geometric mark; wordmark pull-out trailing a motion-blur streak; lead-line slide-down-off-bottom exit; icon drop-in from above; sequential per-letter slide-in + terminal punctuation landing; confetti burst pop-then-instant-shrink; pixel-stack pop at a text edge; horizontal streak-stretch into full-width stripes; stripe-tail retraction absorbed into the mark (mask retraction); rounded-tile scale-up enclosing the mark; bottom metadata row fade / slide-up (URL pill + store badges); satellite shapes outward drift + fade; left→right underline sweep; left→right tagline wipe-in.

**rule mapping** (per motion verb → `rules/<id>.md`)

- ring pulse / expand from center → `center-outward-expansion` (radiate from a shared center; reuse the 0→1 progress driver)
- background crossfade (light→dark gradient) → plain opacity/background tween via `gsap-effects` (no dedicated rule needed)
- glow ignite on the mark → `asr-keyword-glow` (envelope-driven glow on the brand element)
- seed-dot scale-up into shapes → `spring-pop-entrance` (scale-in pop; alt `scale-swap-transition` if dots morph into shapes)
- continuous orbit / drift around fixed center → `orbit-3d-entry` (flip-in then continuous elliptical orbit; center label = the fixed mark)
- single 3D perspective tilt (flat→isometric) + slight zoom-out → `multi-phase-camera` (scripted scale phases on a scene-wrapping camera, for the zoom-out) — see camera modifier; the FLAT→ISOMETRIC plane tilt of the whole stage is a CSS-3D perspective move (`techniques.md` CSS-3D, animating the stage's `rotateX`) — no exact camera rule for the plane-tilt, approximate via CSS-3D (closest reference is `orbit-3d-entry`'s "Tilted orbit plane" variation animated over time)
- fixed 2D anchor logo amid moving universe → no motion rule needed (static anchor; intentional — it's the absence of motion, the universe moves around it)
- 3D logo assemble — part detach + spring dot → `spring-pop-entrance` (spring pop, `back.out` overshoot)
- 3D logo assemble — hinge open / snap (clapperboard) → `hacker-flip-3d` (the 3D-rotate axis) + `techniques.md` CSS-3D (the elastic open-and-snap-shut hinge is an adaptation of the 3D-rotate)
- 3D logo assemble — shell fan-out to edges → `center-outward-expansion` (run outward from the mark center)
- wordmark cascade with overshoot (letters left→right) → recipe `gsap-effects` (per-element staggered slide) + `spring-pop-entrance` (the `back.out` overshoot per letter)
- button pill rise / scale-in → `spring-pop-entrance` (scale-in; alt `scale-swap-transition`)
- animated stroke-outline draw + glow (button border) → `svg-path-draw` (stroke-dashoffset draw) + `asr-keyword-glow` (the glow on the drawn stroke)
- comet / spark accent on button → `asr-keyword-glow` (small glow accent); motion path via `techniques.md` GSAP MotionPathPlugin (#9)
- diagonal-band wipe (sweep → swell → collapse-to-slash) → `techniques.md` clip-path reveal (#12, animate a `polygon(...)` diagonal across the frame; the swell-then-collapse-to-slash is the same clip-path reveal driven through grow→shrink keyframes)
- letter-by-letter wordmark build → `discrete-text-sequence` (smooth-slice / per-state build); recipe `gsap-effects` (typewriter / appending words)
- pre-formed grid disperse off all four edges → not a rule gap: a formation flying off-frame is an EXIT, and the pipeline forbids mid-video exits — the harness transition IS the exit (only the final frame may exit the stage). Treat this as transition-handled / final-frame-only rather than an in-scene motion rule. (If staged in-scene as a reveal-the-mark clear, it reuses `center-outward-expansion` run OUTWARD — center→target machinery interpolating formation→offscreen targets, out-easing.)
- logo-mark stroke-draw (sequential arcs / segments) → `svg-path-draw` (the canonical multi-segment stagger draw)
- wordmark slide / fade reveal beside drawn mark → `svg-path-draw` (its "brand-line fades in after stroke" tail) ; slide via `spring-pop-entrance`
- fast camera push-through with motion-blur → `multi-phase-camera` (a hard push phase) — see camera modifier; the heavy motion-blur streak itself → `motion-blur-streak` (directional velocity blur on the fast push-through)
- continuous slow push-in / push-out → `multi-phase-camera` (phase scale + drift)
- cursor arc-in + click on the wordmark → `cursor-click-ripple` (move → click → ripple); arc path via `techniques.md` MotionPathPlugin (#9)
- parallax shape slide-in behind lockup → `depth-scatter-assemble` (parallax depth slide-in of shapes at differing depths; pair with `3d-text-depth-layers` for the depth ordering)
- left→right URL / badge wipe with glowing leading edge → `techniques.md` clip-path reveal (#12, animate `inset()` left→right); the glowing leading edge → `asr-keyword-glow`
- static / fade-out end-lockup hold → no motion rule needed (terminal hold / opacity fade; intentional)
- idle breathe on held mark (optional) → `sine-wave-loop` (post-settle breathing)
- glowing-dot circular path trace → `svg-path-draw` (the traced circle draws on) + `techniques.md` MotionPathPlugin (#9) for the leading dot riding the path tip
- part-overlap icon completion / semi-circle scale-up → `spring-pop-entrance` (per-part scale-in; place parts at their final overlap positions from setup — the overlap IS the completed mark)
- scale-up-with-rotate mark entrance → `spring-pop-entrance` (add a rotation from-value to the pop)
- wordmark slide-out-from-behind-icon → recipe `gsap-effects` (x-slide) under a clip / overflow mask via `techniques.md` clip-path reveal (#12); z-order the icon above the sliding text
- badge pill pop onto the lockup → `spring-pop-entrance`
- stepped subtitle swap-in-place (bottom rail) → `discrete-text-sequence` (whole-state replacement at time thresholds); derive the windows via `dynamic-content-sequencing`
- count-up stat tick over a faint asset grid → `counting-dynamic-scale`; the faint grid is a plain opacity fade (no rule needed)
- lockup shrink / fade → UI-window payoff → `scale-swap-transition` (exit cluster shrinks + fades at center; window pops in with `back.out`)
- word-by-word staggered fade-through-grey (in / left-first out) → recipe `gsap-effects` (per-word staggered opacity + color tween). Deliberately a quiet FADE register — do NOT substitute `waterfall-entry` here; its binary-arrival doctrine is the wrong voice for this serif beat
- rolling word-by-word line swap → two overlapping `gsap-effects` word staggers at the same timeline position (old line out left-first, new line in left→right)
- shrink-toward-center + fade clearing exit → `scale-swap-transition` (its exit half; the entrance half is the bloom)
- whole-mark spring BLOOM from zero → `spring-pop-entrance` (single hero, `back.out` overshoot, slight rotation from-value)
- near-imperceptible continuous scale-up through the hold → no motion rule needed (one long linear micro-tween on the held lockup; intentional life-in-the-hold)
- vertical slot-machine word swap → `vertical-spring-ticker` (masked column, stepped tween — one word slot cycles, rest of the line fixed)
- horizontal phrase collapse / wipe into the mark → `scale-swap-transition` (same-center morph) with the collapse via `techniques.md` clip-path reveal (#12)
- instant same-center text→icon swap → no motion rule needed (`tl.set` hard swap; intentional — the chain's continuity lives in the NEXT beat's morph)
- line-panel fan-and-flip morph (page-flip, motion-blurred) → `hacker-flip-3d` (the per-panel 3D rotation axis) + `motion-blur-streak` (the blur) + `techniques.md` CSS-3D; true stroke-interpolation glyph morphs live in `hyperframes-keyframes` (SVG morph) — reach there if panels can't sell it
- interlock-settle into the geometric mark → `center-outward-expansion` machinery run INWARD (per-panel transform offsets tween to 0 in lockstep with one driver)
- wordmark pull-out trailing a motion-blur streak → `motion-blur-streak` (echo / ghost trail collapsing into the lead) on the x-slide
- lead-line slide-down-off-bottom exit → in-scene clearing beat; same doctrine as the grid-disperse row above (offscreen target + out-easing; prefer the harness transition when the exit IS the scene boundary)
- icon drop-in from above → `spring-pop-entrance` (y-offset from-value, overshoot on landing)
- sequential per-letter slide-in + terminal punctuation landing → `waterfall-entry` (staggered arrival cascade on a lateral axis; the punctuation is the cascade's final, heaviest beat)
- confetti burst pop-then-instant-shrink → `press-release-spring` ("release burst" variation) for a small deterministic burst; a true multi-particle confetti field → `particle-burst`
- pixel-stack pop at a text edge → `spring-pop-entrance` (tight stagger down the stack)
- horizontal streak-stretch into full-width stripes → plain `scaleX` stretch via `gsap-effects` (transform-origin at the stack) + `motion-blur-streak` for the streak read
- stripe-tail retraction absorbed into the mark → `techniques.md` clip-path reveal (#12) run in REVERSE (animated `inset()` retraction reading as mask absorption into the mark)
- rounded-tile scale-up enclosing the mark → `spring-pop-entrance` (scale-in BEHIND the mark; z-order only, mark never moves)
- bottom metadata row fade / slide-up → `spring-pop-entrance` (staggered group, ≤500ms cap)
- satellite shapes outward drift + fade → `center-outward-expansion` run OUTWARD (drift targets past frame edge) + opacity tail; if the drift must idle first, seed it with `sine-wave-loop`
- left→right underline sweep → `css-marker-patterns` (highlight sweep re-skinned as an underline) or `stat-bars-and-fills` progress-fill `scaleX`
- left→right tagline wipe-in → the existing "left→right URL / badge wipe" row applies unchanged (clip-path `inset()`)

**camera modifier** (the push / tilt)

- **CTA push-through** (the CTA spine): a scripted hard zoom phase on a scene-wrapping camera → `multi-phase-camera` ("Steady push" / "Bookend pull" pattern; push phase = the climax). When the mark is OFF-center and the camera must fly through a specific point of negative space, combine with `coordinate-target-zoom` (outer scales, inner counter-translates so the target negative-space point lands at viewport center as scale ramps; measure the offset at setup). The signature heavy horizontal MOTION-BLUR on the streak → `motion-blur-streak` (directional velocity blur on the push); realize with a CSS `filter: blur()` / duplicated-streak layer on the camera during the push window.
- **Product_Intro tilt** (the one cinematic move): the flat→isometric perspective tilt + slight zoom-out is a single scripted camera beat → `multi-phase-camera` (scale phase + the "Targeted zoom into off-center element" / drift machinery) for the zoom-out. `multi-phase-camera` is scale+translate+drift only, so the perspective-PLANE rotateX (flat top-down → angled isometric) of the whole stage is the CSS-3D move noted above — approximate via `techniques.md` CSS-3D, animating the stage's `rotateX` (closest reference is `orbit-3d-entry`'s "Tilted orbit plane" variation animated over time).
- **Static-frame variants**: the parts-assembly, text-clear bloom, morph-chain, parts-arrive, and settled-reveal variants are all COMPLETELY static-frame (element-level motion only; settled-reveal tolerates at most a very slow global zoom-out). The camera modifier applies only to the CTA push and the Product_Intro tilt.

## Selected motion rule: counting-dynamic-scale

---
name: counting-dynamic-scale
description: Counter animation where the value counts up while transform scale grows to its final size, creating escalating visual weight without per-frame text reflow.
metadata:
  tags: counter, counting, scale, transform, number, dynamic, emphasis
---

# Counting with Dynamic Scale

A number counts from A → B while its transform scale grows to the final size — escalating visual weight ("this is impressive") without tweening `font-size` or forcing text layout on every frame. The final font size is static CSS; only the transform changes.

## How It Works

Two synchronized tweens at the SAME timeline position with the SAME ease: (1) a proxy value rendered as text via `onUpdate` (`Math.round(...).toLocaleString()`), (2) the counter's transform `scale: START_SCALE → 1`, where `START_SCALE = START_SIZE / END_SIZE`. A suffix (`%`, `×`, `+`) slides in AFTER the count lands — the number gets its own beat — and a label fades in early.

## Recipe

```html
<!-- inside a standard scene clip (hyperframes-core) -->
<div class="counter-wrap">
  <span class="counter" id="counter">0</span><span class="counter-suffix">{suffix}</span>
</div>
<div class="counter-label">{label}</div>
```

```css
.counter-wrap {
  display: flex;
  align-items: baseline;
  justify-content: center;
  width: {counterContainerWidth}; /* fixed width — no layout shift as digit count changes */
}
.counter {
  font-variant-numeric: tabular-nums; /* MANDATORY — digits keep equal width */
  display: inline-block;
  font-size: {endSize}; /* final size is static; GSAP animates scale, not font-size */
  transform-origin: center center;
}
.counter-suffix {
  opacity: 0;
  transform: translateY(20px);
}
```

```js
const counter = document.getElementById("counter");
const state = { value: 0 };
const START_SCALE = START_SIZE / END_SIZE;

// Count value — onUpdate changes text only
tl.to(
  state,
  {
    value: TARGET_VALUE,
    duration: COUNT_DUR,
    ease: COUNT_EASE,
    onUpdate: () => {
      counter.textContent = Math.round(state.value).toLocaleString();
    },
  },
  0,
);

// Visual growth — compositor transform sharing the count's timing + ease
tl.fromTo(counter, { scale: START_SCALE }, { scale: 1, duration: COUNT_DUR, ease: COUNT_EASE }, 0);

// Suffix slides in AFTER the count completes
tl.to(
  ".counter-suffix",
  { opacity: 1, y: 0, duration: SUFFIX_DUR, ease: `back.out(${SUFFIX_BOUNCE_FACTOR})` },
  COUNT_DUR,
);

// Label fades in early
tl.from(".counter-label", { opacity: 0, y: 12, duration: LABEL_DUR, ease: "power2.out" }, LABEL_AT);
```

## Variations

- **Direct `innerText` tween (no proxy)** — GSAP can tween `innerText` directly for a number-only counter; keep the proxy form when you need locale formatting or suffix logic. The scale tween stays separate either way:

```js
tl.to(
  counter,
  { innerText: TARGET_VALUE, duration: COUNT_DUR, ease: COUNT_EASE, snap: { innerText: 1 } },
  0,
);
```

- **3D depth entry** — add a `tl.from(".counter", { z: -300, ... }, 0)` push-in; requires `perspective` on `.counter-wrap` and `transform-style: preserve-3d` on the counter.
- **Multi-stat coordinated reveal** — 3 stats counting in parallel share the SAME ease, duration, and start position so they finish together (a chord, not an arpeggio). Each stat usually also needs a paired graphic (bar / ring / stars) — don't stop at the number; see [stat-bars-and-fills.md](stat-bars-and-fills.md).

## Values

| token                 | range                                       | notes                                                                         |
| --------------------- | ------------------------------------------- | ----------------------------------------------------------------------------- |
| TARGET_VALUE          | 2–3 digits ideal                            | 4+ digits needs a wider container; must fit at END_SIZE without clipping      |
| START_SIZE / END_SIZE | START ≈ 40–60% of END                       | design inputs used once for START_SCALE; never tween either                   |
| COUNT_DUR             | 1.2–2.5s                                    | below ~0.8s reads as a flash — the eye must read the digits scrolling past    |
| COUNT_EASE            | `power2.out` / `power3.out` ⭐ / `expo.out` | shared by value + scale; more `.out` = more dramatic deceleration at the peak |
| SUFFIX_DUR            | 0.3–0.6s                                    | fires at `COUNT_DUR`, never during the count                                  |
| SUFFIX_BOUNCE_FACTOR  | 1.4–2.0                                     | overshoot is fine on the suffix (it's punctuation, not data)                  |
| LABEL_AT / LABEL_DUR  | AT < COUNT_DUR/2; 0.4–0.7s                  | label arrives before the count peaks                                          |

## Critical Constraints

- **`tabular-nums` mandatory** + fixed-width container as belt-and-suspenders — without them digit-count transitions (9 → 10 → 100) jitter as glyph widths change.
- **Never set `fontSize` in `onUpdate`** — final type size is static CSS; only the transform changes per frame. Keep `onUpdate` O(1): set text only, no style writes or DOM creation.
- **`Math.round`, not `Math.floor`** — halfway through the final integer should already display the final value.
- **Avoid `back.out` / `elastic.out` on the counter itself** — overshoot makes the number look unstable (it's data, not decoration). Grow in place, don't bounce.
- **Label is BIG TEXT, not a page-style caption** — a tiny paragraph under a hero-size number reads as visual noise in video. Display-size, uppercase, tracked: the label is part of the headline.

## See also

`stat-bars-and-fills` (the paired graphic — give it the same ease/duration so number and fill land as one beat) · `svg-path-draw` (icons drawing in around the number) · `center-outward-expansion` (icons bursting outward at the count peak).

## Selected motion rule: svg-path-draw

---
name: svg-path-draw
description: Animate SVG paths drawing progressively using stroke-dasharray and stroke-dashoffset.
metadata:
  tags: svg, stroke, draw, path, reveal, icon, vector
---

# SVG Path Draw

Reveals an SVG shape by animating its stroke as if a pen were tracing it. Two stroke properties together: **`stroke-dasharray = <pathLength>`** makes the entire path one dash; **`stroke-dashoffset`** starts at the path length (dash shifted fully out of view → invisible) and tweens to `0` (fully drawn). The length comes from the DOM API `path.getTotalLength()` — measured, never guessed.

Works on anything with a stroke: `<path>`, `<circle>`, `<rect>`, `<line>`, `<polyline>`, `<polygon>`, `<ellipse>`.

## Recipe

```html
<!-- inside a standard scene clip -->
<svg class="logo-mark" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <path id="bar-left" d="M 60 40 L 60 160" />
  <path id="bar-right" d="M 140 40 L 140 160" />
  <path id="bar-mid" d="M 60 100 L 140 100" />
</svg>
```

```css
.logo-mark path {
  fill: none; /* outline-only draw — a fill would appear immediately and ruin the reveal */
  stroke: {accentColor};
  stroke-width: 12;
  stroke-linecap: round; /* softer endpoints */
  stroke-linejoin: round;
}
```

```js
// Setup: measure each path and set its dash pattern. Real measured geometry, not a magic number.
document.querySelectorAll(".logo-mark path").forEach((p) => {
  const len = p.getTotalLength();
  p.style.strokeDasharray = `${len}`;
  p.style.strokeDashoffset = `${len}`;
});

// Stagger draws so the eye reads continuous motion — each segment starts at
// ~70-80% of the previous segment's duration, before it finishes.
tl.to(
  "#bar-left",
  { strokeDashoffset: 0, duration: SEGMENT_DRAW_DUR, ease: "power2.out" },
  SEG_1_START,
);
tl.to(
  "#bar-right",
  { strokeDashoffset: 0, duration: SEGMENT_DRAW_DUR, ease: "power2.out" },
  SEG_2_START,
);
tl.to(
  "#bar-mid",
  { strokeDashoffset: 0, duration: FINAL_SEGMENT_DUR, ease: "power2.out" },
  SEG_3_START,
);

// Companion wordmark fades in only after the last stroke settles.
tl.to(
  ".brand-line",
  { opacity: 1, duration: BRAND_FADE_DUR, ease: "power1.out" },
  BRAND_FADE_START,
);
```

## Variations

- **Ring starting at 12 o'clock** — `<circle>` / `<rect>` strokes start at 3 o'clock by default; rotate the element `-90deg` so a progress ring draws from the top:

```html
<circle
  cx="100"
  cy="100"
  r="60"
  id="ring"
  style="transform-origin: 100px 100px; transform: rotate(-90deg)"
/>
```

- **Linear (constant-speed) draw** — `ease: "none"` for a steady-rate "real pen" trace.
- **Draw then fill** — for filled shapes, tween `fillOpacity: 0 → 1` AFTER the stroke completes (requires `fill-opacity: 0` initially and a real `fill` in CSS):

```js
tl.to(
  "#path",
  { strokeDashoffset: 0, duration: SEGMENT_DRAW_DUR, ease: "power2.out" },
  SEG_1_START,
);
tl.to(
  "#path",
  { fillOpacity: 1, duration: FILL_FADE_DUR, ease: "power1.out" },
  SEG_1_START + SEGMENT_DRAW_DUR,
);
```

## Values

| token             | range                                   | notes                                                                                              |
| ----------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------- |
| SEGMENT_DRAW_DUR  | 0.3–0.8s                                | fast snap vs deliberate pen trace; >~1s feels sluggish for a logo reveal                           |
| FINAL_SEGMENT_DUR | 60–80% of SEGMENT_DRAW_DUR              | proportional to segment length — a short connector at full duration reads slower than its siblings |
| SEG_N_START       | previous start + 70–80% of its duration | reads as continuous motion, not N isolated animations                                              |
| SEG_1_START       | 0–0.4s                                  | a small ~0.2s lead-in lets the viewer settle before motion                                         |
| BRAND_FADE_START  | ≥ last stroke end (+ ~0.2s beat)        | earlier and the wordmark competes with the draw                                                    |
| BRAND_FADE_DUR    | 0.3–0.8s                                | snap (urgent) vs glide (premium)                                                                   |

Ease families are discrete choices: **stroke draws** use `power2.out` (a hand lifting at end of stroke) or `none` for constant speed — never `back.out` / `elastic.out` (pens don't bounce). **Fades** use `power1.out`.

## Critical Constraints

- **`fill: none`** for outline-only draws — otherwise the fill appears immediately.
- **Dasharray/dashoffset = the measured `getTotalLength()`**, set at setup; requires the SVG in the DOM (inline SVG is fine; a loaded `<image>` SVG is not).
- **Complex paths**: if `getTotalLength()` looks wrong, overestimate slightly (`len * 1.05`) — too large is invisible at animation start; too small clips the end.
- **Stagger multi-path draws at ~70–80%** of the previous segment's duration.
- **A drawn line must land on something.** When the path is a connector (rail, beam, underline, callout) rather than a shape, both endpoints must sit on real elements and the draw must do a job — reveal, route, validate, or emphasize. A stroke that only decorates empty space reads as filler; attach it or cut it.

## See also

`svg-icon-enrichment` (internal parts animate after the outline draws) · `counting-dynamic-scale` (stroke draws an icon while a number counts up) · `hacker-flip-3d` (logo draws, wordmark decodes beneath).
