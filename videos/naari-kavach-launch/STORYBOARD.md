---
format: 1920x1080
duration: 90s
message: "Naari Kavach protects a woman through her whole evening without asking anything of her"
arc: Story-led PAS (the message from home → why they worry → Meera's walk in real time, 9:40 to 10:20 pm → what tomorrow can be → close)
audience: Hackathon judges first (Seva First Innovation Challenge 2026), the public second
mode: collaborative
music: gentle Indian classical underscore, santoor and bansuri flute, soft tabla, hopeful and dignified
style: Immersive product demo advertisement at night. The real app screen fills the frame and the camera moves inside it; text is a small overlay. Public-service touches kept: the helpline band, a Hindi line on five frames, the slogan and 112 at the close. No tricolour strip. Never a government emblem or name.
story: One dramatised evening. Meera leaves work in Mumbai at 9:40 pm; her mother (Aai) texts "where are you?". The walk is the real Owale to Gaimukh route from the app (38 min, hardest part 840 m about 27 min in). She is never shown: she is a chat bubble and a dot on a line.
---

## Video direction

- stage: the real app, full-bleed. Each screen frame uses one or two real 2x captures as a 1920x1200 layer that the camera moves inside. Nothing is a slide: no screenshot parked beside a text block, no bezel, no card grid.
- palette system: from frame.md. Night ground; white text on flat navy plates; saffron only as a thin accent (a hairline, a highlight outline, the helpline numbers); green only on the one reassuring answer line; red only inside the real captures.
- persistent chrome: the slim navy helpline band along the bottom of every frame, unchanged across every seam; on the last frame its text becomes "Naari Kavach by ONYX".
- overlays: a small time label at the top left on frames 4, 5, 6 and 8 ("9:42 pm · before she leaves"), white on a navy plate. One headline plate per frame, low on the side away from the action, with the English line and, on frames 1, 4, 5, 7 and 9 only, the Hindi line beneath. Words exactly as in headline_en and sub_hi.
- her dot: the app's own location dot, moved along the real road using assets/route-path.json (81 points, CSS pixels of the 1440x900 view). She is never drawn as a person.
- motion grammar + reveal model: slow and deliberate on a long-tail power3 ease. The camera pushes in on what the voice is naming and eases to the next region when the voice moves on; overlays fade in with a rise of a few pixels on their spoken cue, never before. Nothing bounces, pops or loops. During a hold the frame is still.
- rhythm / held frames: Frame 6 is the held climax: when her dot stops, nothing moves for over a second before the real question appears. Frame 1 opens quietly. Frame 10 holds its end card for the last three seconds. Frames 4 and 7 carry the most camera movement; frames 3 and 5 are short.
- captions: none. The helpline band occupies that area.
- negative list: no slide layouts, no bezels or device mockups, no redrawn interface. No tricolour strip, flag, State Emblem, Ashoka Chakra, ministry, scheme or police logo, and no "Government of" wording. No person, face or figure other than the logo mark. No pills, decorative icons, emoji, gradients, shadows, glows or blur. No bounce, spring pop, overshoot, wiggle or fast zoom. Neither motion failure: not a slideshow (everything on screen at once, then frozen) and not a screensaver (things drifting independently).

## Frame 1 — The message

- scene: 9:40 pm. One incoming chat message from Aai on a paper ground: "Where are you? When will you be home?"
- headline_en: Every evening, from every home, the same question.
- sub_hi: हर शाम, हर घर से यही सवाल।
- voiceover: "Every evening, in homes across this city, someone sends the same message. Where are you? When will you be home?"
- duration: 6.87s
- transition_in: cut
- status: animated
- src: compositions/frames/01-the-message.html
- type: hook
- persuasion: Pain validation
- beat: tension
- blueprint: typewriter-reveal (Adapt)
- focal: the chat message from Aai
- roles: hd-map-night = background (full-bleed, dimmed to about 35%)
- sfx: none
- asset_candidates: assets/hd-map-night.png — the night risk map of Owale with the empty route form, used full-bleed and dimmed as the city behind the chat

narrativeRole: opens on a moment every Indian family knows, before any number or product.
keyMessage: someone at home is waiting, every evening.

Adapt: keep the signature of a message arriving live in someone's own words; change the typed prompt to a received chat message on a real-looking chat screen.
Scene 1 (0.0–1.0s): the night map fills the frame, dimmed, drifting in on a very slow push; the helpline band is present. Nothing else.
Scene 2 (1.0–4.0s): as the voice says the first sentence, the headline plate fades up low on the right: "Every evening, from every home, the same question." with its Hindi line beneath.
Scene 3 (4.0–6.9s): as the voice reads the two questions, a tall dark chat screen (header "Aai", about 620 px wide and most of the frame height) fades up left of centre and one incoming bubble arrives in it, its text appearing word by word (`discrete-text-sequence`): "Where are you? When will you be home?" with the time stamp 9:40 pm.
Scene 4 (6.9–end): hold, still.

## Frame 2 — Why they worry

- scene: The message stays small in the corner while 26% counts up, then a much smaller 2%
- headline_en: The worry has a reason.
- voiceover: "The worry has a reason. In Maharashtra, one woman in four reports physical or sexual violence. Only two in a hundred of them go to the police."
- duration: 9.064s
- transition_in: crossfade
- status: animated
- src: compositions/frames/02-why-they-worry.html
- type: pain_point
- persuasion: Statistical proof
- beat: tension
- blueprint: dataviz-countup (Adapt)
- focal: the numeral 26%
- roles: hd-map-night = background (full-bleed, dimmed to about 25%, the same slow push continuing)
- sfx: none
- asset_candidates: assets/hd-map-night.png — the night risk map, full-bleed and dimmed, continuing from Frame 1

narrativeRole: the awareness fact, placed where it explains the feeling in Frame 1.
keyMessage: the fear is justified, and almost nobody gets help. Source on screen: NFHS-5, women aged 18 to 49, Maharashtra (26% and 2%).

Adapt: keep the signature count-up spoken by the voice; change the ring and chart to plain large numerals over the night city.
Scene 1 (0.0–2.2s): the dim night map still fills the frame. On "The worry has a reason." that line fades up at the upper left, directly on the map (no plate), large.
Scene 2 (2.2–6.4s): on "one woman in four", "26%" counts up from 0 in very large white numerals at the left (`counting-dynamic-scale`), a thin saffron hairline draws beneath it (`svg-path-draw`), and "of women in Maharashtra report physical or sexual violence" fades in under the rule. The numeral dominates, about 45% of the frame height.
Scene 3 (6.4–9.0s): on "only two in a hundred", "2%" counts up at the right, clearly smaller, with "of them go to the police"; the source line "NFHS-5, women aged 18 to 49" fades in small at the bottom left above the band.
Scene 4 (9.0–end): hold, still.

## Frame 3 — Tonight, Meera

- scene: Meera's reply bubble "Just leaving, Aai.", then the Naari Kavach mark assembles beside the promise
- headline_en: Tonight, Meera does not walk alone.
- voiceover: "Tonight, Meera walks home with Naari Kavach. It will ask nothing of her."
- duration: 4.702s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/03-tonight-meera.html
- type: product_intro
- persuasion: Future pacing
- beat: relief
- blueprint: logo-assemble-lockup (Adapt)
- focal: assets/brand-mark-night.svg
- roles: brand-mark-night = cutout (the mark, left of the headline) · hd-map-night = background (full-bleed, dimmed to about 25%)
- sfx: none
- asset_candidates: assets/brand-mark-night.svg — the official logo mark for dark grounds; assets/hd-map-night.png — the night map, full-bleed and dimmed behind

narrativeRole: introduces the person and the product together, and lands the film's whole message by the third beat. Carries the small note "A dramatised evening. The figures are real."
keyMessage: protection that asks nothing of her.

Adapt: keep the signature of the mark resolving as the name is spoken; change the centred lockup to the mark with the promise beside it, after her reply.
Scene 1 (0.0–1.6s): over the dim night map, the dark chat screen at the right shows Meera's outgoing bubble arriving: "Just leaving, Aai." with time stamp 9:41 pm and read ticks.
Scene 2 (1.6–3.6s): on "Naari Kavach", the mark resolves at the left centre (a slow fade with a small scale settle) and "Tonight, Meera does not walk alone." fades up beside it, large.
Scene 3 (3.6–end): on "It will ask nothing of her.", the line "Naari Kavach will ask nothing of her." fades in under the headline; the small note "A dramatised evening. The figures are real." fades in at the bottom left above the band. Hold.

## Frame 4 — 9:42 pm, before she leaves

- scene: The real Routes screen: her walk ranked by risk, with the hardest part named and timed
- headline_en: Know the road before you leave.
- sub_hi: निकलने से पहले रास्ता जान लो।
- voiceover: "Before she leaves, it ranks her routes by risk, not just time, and names the hardest part: eight hundred and forty metres, twenty-seven minutes in. Where the map is unsure, it says so."
- duration: 11.285s
- transition_in: crossfade
- status: animated
- src: compositions/frames/04-before-she-leaves.html
- type: feature_showcase
- persuasion: Show-don't-tell proof
- beat: clarity
- blueprint: device-surface-showcase (Adapt)
- focal: assets/hd-route.png
- roles: hd-route = background (full-bleed, sharp, the world the camera moves in) · hd-route-journey = supporting (the same layer, cross-faded in when the panel "scrolls")
- sfx: none
- asset_candidates: assets/hd-route.png — the real Routes screen at night with her walk found and the route drawn on the map; assets/hd-route-journey.png — the same view with the panel scrolled to "Hardest part: 840 m, about 27 min in"

narrativeRole: plants the "hardest part" that pays off in Frame 6, and shows the map being honest about what it does not know.
keyMessage: she knows the walk before she takes it.

Adapt: keep the signature of the real interface as the hero whose view advances through a flow; change the device frame to the screen itself filling the frame, with the camera doing the advancing.
Scene 1 (0.0–2.5s): the real Routes screen fills the frame, whole and sharp. The time label "9:42 pm · before she leaves" fades in at the top left. Nothing else is added.
Scene 2 (2.5–6.0s): on "ranks her routes by risk", the camera pushes in slowly on the route card in the left panel (x 40 to 412, y 343 to 445) (`coordinate-target-zoom`) until "38 min, 2.8 km, High risk, 800 m risky" is large; a thin saffron outline draws around the card.
Scene 3 (6.0–9.8s): on "names the hardest part", the layer cross-fades to the scrolled capture and the camera eases down to the row "Hardest part: 840 m, about 27 min in" (x 56 to 396, y 513 to 572); the saffron outline moves to that row. The headline plate fades up low on the right: "Know the road before you leave." with its Hindi line.
Scene 4 (9.8–end): on "where the map is unsure", the camera eases across and out to the map, settling on its upper part where the cells north of the route are visibly fainter (around x 640 to 1100, y 60 to 300). Hold there.

## Frame 5 — 9:50 pm, on the way

- scene: The real Trip shield screen, calm: "Watching quietly. Nothing to do." A thin line shows the evening from 9:40 to 10:20 with her dot on it
- headline_en: Phone in the bag. Eyes on the road.
- sub_hi: फ़ोन बैग में, ध्यान रास्ते पर।
- voiceover: "The phone goes into her bag. No check-ins. No timers."
- duration: 3.997s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/05-on-the-way.html
- type: feature_showcase
- persuasion: Friction reduction
- beat: ease
- blueprint: device-surface-showcase (Adapt)
- focal: assets/hd-trip.png
- roles: hd-trip = background (full-bleed, sharp)
- sfx: none
- handoff_out: full-bleed map view: the capture layer at scale 1.0 of the 1920-wide layer, x 0, y -60; her dot on the route at point 12 of route-path.json, opacity 1, moving along the route at about 4 points per second
- asset_candidates: assets/hd-trip.png — the real Trip shield screen at night: "To Gaimukh", "Arrive by 10:19 pm", the ring, "Watching quietly. Nothing to do."

narrativeRole: the quiet middle of the walk. Sets up the contrast with the next beat.
keyMessage: nothing is asked of her.

Adapt: keep the real screen as the hero; change the held device to a camera move from the panel out to the map where she is walking.
Scene 1 (0.0–1.8s): the real Trip screen fills the frame, pushed in on the left panel so the ring "38 min to arrive" and "Watching quietly. Nothing to do." are large (`coordinate-target-zoom`). The time label "9:50 pm · on the way" is at the top left.
Scene 2 (1.8–end): on "No check-ins. No timers.", the camera eases out and right to the whole screen, and her dot appears at the start of the route (point 0 of route-path.json, near Owale) and begins moving along the real road. The headline plate fades up low on the left over the lower part of the panel: "Phone in the bag. Eyes on the road." with its Hindi line. The dot reaches point 12 as the frame ends.

## Frame 6 — 10:09 pm, the hardest part

- scene: Her dot reaches the marked 840 m stretch on the line and stops. One question appears: "Are you okay?" Then the dot moves on and the question closes itself
- headline_en: She stopped. It asked, just once.
- voiceover: "At nine past ten she reaches that stretch, and stops. It waits. Then it asks, once: are you okay? She walks on. That is her answer."
- duration: 9.848s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/06-the-hardest-part.html
- type: benefit_highlight
- persuasion: Show-don't-tell proof
- beat: tension → relief
- blueprint: kinetic-type-beats (Adapt)
- focal: her dot on the hardest part of the route
- roles: hd-route-journey = background (full-bleed, the camera pushed in on the upper left of the map near Gaimukh) · hd-prompt = cutout (only the dialog box, x 460 to 980, y 293 to 605, lifted from this capture)
- sfx: none
- handoff_in: full-bleed map view: the capture layer at scale 1.0 of the 1920-wide layer, x 0, y -60; her dot on the route at point 12 of route-path.json, opacity 1, moving along the route at about 4 points per second
- asset_candidates: assets/hd-route-journey.png — the night map with her route and the panel showing the hardest part; assets/hd-prompt.png — the real "Are you okay?" dialog

narrativeRole: the climax. The one moment of real tension in the film, and the product's main difference shown instead of described.
keyMessage: it asks once, and walking on is the answer. No tap.

Adapt: keep the signature of short statements landing one at a time; change them to events on the real map, with her dot carrying the tension.
Scene 1 (0.0–3.2s): the real map fills the frame and the camera pushes in slowly toward the last stretch of the route near Gaimukh (`coordinate-target-zoom`, around x 640 to 1000, y 260 to 560). Her dot moves along the road from point 12, quickly at first then slowing, and a thin saffron line draws along the route from point 57 to point 80 to mark the hardest part. The time label reads "10:09 pm · the hardest part". As the voice says "and stops", the dot eases to a halt at point 60.
Scene 2 (3.2–4.6s): "It waits." A deliberate hold: nothing on screen moves.
Scene 3 (4.6–7.2s): on "it asks, once", the frame dims slightly and the real dialog box fades up, centred and large: "Are you okay? You have stopped on a quiet stretch. Walk on or tap below." The headline plate fades up low on the left: "She stopped. It asked, just once."
Scene 4 (7.2–end): on "She walks on", the dialog fades away untouched, the dim lifts, and the dot moves on along the road toward Gaimukh. The green answer line "She walks on. That is her answer." fades in on the plate. Hold.

## Frame 7 — If she had needed help

- scene: Three ways to call for help arrive one by one, ending on the real SOS screen with "Call 112"
- headline_en: If she needs help, it is one gesture away.
- sub_hi: ज़रूरत पड़े, तो मदद एक इशारे पर।
- voiceover: "Had she needed help: one tap makes it watch closely. Three presses on her earphone start SOS. One hold, and one one two is a tap away."
- duration: 9.509s
- transition_in: crossfade
- status: animated
- src: compositions/frames/07-if-she-had-needed-help.html
- type: feature_showcase
- persuasion: Rule of three
- beat: control
- blueprint: grid-card-assemble (Adapt)
- focal: assets/hd-sos-active.png
- roles: hd-sos-countdown = background (full-bleed, first) · hd-sos-active = background (full-bleed, cross-faded in second)
- sfx: none
- asset_candidates: assets/hd-sos-countdown.png — the real SOS countdown sheet; assets/hd-sos-active.png — the real SOS sheet with "Call 112"

narrativeRole: the road not taken tonight. Shows the safety net without turning the story dark.
keyMessage: one tap, three presses, or one hold.

Adapt: keep the signature of three capabilities arriving one per spoken cue; change the card grid to three short labels over the real SOS screens as they happen.
Scene 1 (0.0–1.6s): on "Had she needed help", the real countdown sheet fills the frame. The headline plate fades up low on the left: "If she needs help, it is one gesture away." with its Hindi line.
Scene 2 (1.6–4.2s): on "one tap", a short label fades in at the right, white on a navy plate: "One tap. It watches closely."
Scene 3 (4.2–7.0s): on "three presses", a second label fades in beneath the first: "Three presses on the earphone. SOS starts." The camera begins a slow push toward the centre of the sheet.
Scene 4 (7.0–end): on "one hold", the layer cross-fades to the live SOS sheet and the camera settles on the red "Call 112" button (`coordinate-target-zoom`); the third label fades in: "One hold. 112 is a tap away." Hold. The red in this capture is the only red in the film.

## Frame 8 — 10:20 pm, home

- scene: Meera's message to Aai: "Reached home." Beside it, the sealed trail that stayed locked all evening, now deleted
- headline_en: Reached home.
- voiceover: "Ten twenty. Home. Her route stayed locked on her own phone. It would have opened only if she had not arrived. Now it is deleted."
- duration: 9.195s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/08-home.html
- type: benefit_highlight
- persuasion: Risk reversal
- beat: peace of mind
- blueprint: titlecard-reveal (Adapt)
- focal: the chat message "Reached home."
- roles: hd-route = background (full-bleed, first, pushed in on the map) · hd-map-clear = background (the same layer, cross-faded in when her route is deleted)
- sfx: none
- asset_candidates: assets/hd-route.png — the night map with her finished route; assets/hd-map-clear.png — the identical map view with her route cleared

narrativeRole: resolves the opening message. Answers "what if the phone is gone" without anyone following her.
keyMessage: she is home; nobody tracked her; her route existed only in case she did not arrive.

Adapt: keep the signature of a near-still card followed by the proof; change the proof to her route disappearing from the real map.
Scene 1 (0.0–1.4s): the real map fills the frame with her whole route drawn; her dot sits at the end of the road at Gaimukh (point 80). The time label reads "10:20 pm · home".
Scene 2 (1.4–3.0s): on "Home.", the dark chat screen fades up at the left and Meera's outgoing bubble arrives, large: "Reached home." with time stamp 10:20 pm and read ticks.
Scene 3 (3.0–7.6s): on "Her route stayed locked on her own phone", the headline plate fades up low on the right with that sentence; a thin saffron outline draws along her route on the map (route-path.json, points 0 to 80) (`svg-path-draw`) to show what was kept.
Scene 4 (7.6–end): on "Now it is deleted", the outline fades and the map layer cross-fades to the cleared capture, so her route is gone from the real screen. The green answer line "She arrived, so it is deleted." fades in on the plate. Hold.

## Frame 9 — Tomorrow

- scene: "Know your rights" with the real guide on the left, and on the right the letter that asks the ward to fix that dark stretch
- headline_en: Know your rights.
- sub_hi: अपने अधिकार जानिए।
- voiceover: "And tomorrow, it can tell her her rights in plain words, and write the letter that gets that streetlight fixed."
- duration: 6.478s
- transition_in: crossfade
- status: animated
- src: compositions/frames/09-tomorrow.html
- type: benefit_highlight
- persuasion: Feature-to-benefit translation
- beat: confidence
- blueprint: comparison-split (Adapt)
- focal: assets/hd-help-guide.png
- roles: hd-help-guide = background (full-bleed, sharp, the camera pushed in on the left panel)
- sfx: none
- asset_candidates: assets/hd-help-guide.png — the real Help screen with the guide "If something happened" open

narrativeRole: the awareness beat about rights, and the turn from warning her about a street to getting it fixed. Letter title: "Dark lane? The complaint is ready." with the Hindi line "गली अँधेरी है? शिकायत तैयार है।" beneath.
keyMessage: she knows her rights, and the city gets a letter.

Adapt: keep the signature of two capabilities of equal weight; change the static split to the camera reading the real guide, then a real letter arriving over the map.
Scene 1 (0.0–2.6s): on "tell her her rights", the real Help screen fills the frame, pushed in on the left panel so the guide is large, and the view drifts down slowly (`viewport-change`) from "Get medical care" to "Report at any police station". The headline plate fades up at the right over the map: "Know your rights." with its Hindi line.
Scene 2 (2.6–end): on "write the letter", a single white letter sheet (the one light surface in the film: paper white with dark text, 12 px radius) rises into the right half over the map: the title "Dark lane? The complaint is ready." with its Hindi line, then its lines appear one after another (`discrete-text-sequence`): "To the Assistant Commissioner," "Subject: Request to fix unsafe public spots in the ward", "1. Streetlights are missing or not working.", "2. The stretch is deserted and has no lighting." Hold once the last line is in.

## Frame 10 — The close

- scene: The slogan, the evening's tally (1 question asked, 0 taps to answer), the logo, and 112 large. The band becomes the credit "Naari Kavach by ONYX"
- headline_en: It watches the roads, never the people.
- voiceover: "Naari Kavach. It watches the roads, never the people. Free, with no sign-up. In an emergency, dial one one two."
- duration: 8.098s
- transition_in: zoom-through
- status: animated
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
