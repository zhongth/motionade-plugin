# Reference reconstruction

Use when the user supplies a rendered film or passage to rebuild natively. The reference is the constraint: its composition, copy, scale, event order, motion character, and timing, including its pauses and cuts. Retime, restyle, or improve only when the user asks; that is adaptation. Scale the procedure to the source. A short passage needs a cut check, an event model, and one comparison loop; a whole film can add shared components, parallel authors, and assembly.

## Fix the clocks and the cut map first

- Read the source's exact frame rate, frame count, and audio duration. Choose a native frame rate so that native frame n shows source frame n. When the source runs at a fractional rate near an integer (29.97), author at the integer rate and retime the soundtrack to it; placing cuts by seconds instead drifts whole frames across a long film.
- Extract frames by index (decode and select frame n). An fps filter resamples and shifts events.
- Build a cut map of hard cuts, blank or static frames, dissolves, and pushes. Detectors miss pushes and dissolves, so check contact sheets too. Confirm every boundary on the incoming shot's first frame and the outgoing shot's last frame; a boundary one frame late leaves a duplicated frame at the join.
- Map native Scenes onto the cut map. Mark each join as static (cut, blank, or held frame) or live (something moves across it). A live join needs matched position and motion phase on both sides.

## Read the film as a plausible authored document

Before building a sequence, write its event model with these parts:

1. Source span and local clock: scene frame = source frame − scene start.
2. Entities and groups, and what each owner carries: a camera rig, a window with its content, a cursor attached to the window it operates.
3. Events at exact frames: appears, becomes readable, changes state, is clicked, leaves; typing start and end; camera onset and landing; colour settles.
4. Property phases: which properties move together, which run on their own clocks, and each movement's character (fast-in/soft-out, linear editorial jump, overshoot or none).
5. Observations kept separate from inferred mechanisms, plus open questions.

Sample every frame around the events you time and around the last visible movement before each cut; a coarse sheet suffices elsewhere. Fit a few editable keys and curves to the measured track instead of tracing per-frame poses, then compare. For a camera move, measure the screen position and size of two anchored features per frame to recover pan and zoom; drive one owner rig, and give coupled zoom and pan one shared curve.

Timings from a director or an earlier reading are hypotheses. Whoever builds a shot re-measures its events; errors of several frames and misread mechanisms, such as a pop read as a fade, are common.

Measure colours in settled and in-between frames rather than naming them. Colour interpolation runs in HSLA, so a saturated-to-dark settle usually needs a hue-matched endpoint or a measured intermediate key ([Native authoring](authoring.md#engine-notes)). Measure text through the production layout before placing it. A Text takes only a family the server lists in `fonts`, and nothing adds another yet: when the reference's typeface is not listed, choose the nearest listed family, fit its size and tracking to the reference widths, and tell the person, before you build, which family stands in.

## Resolve high-risk representation early

Before the full build, prototype the hardest behavior with the live capabilities: materials and blur, morphs, masks, dense geometry against the batch budget, fonts and glyph coverage, camera, photographs. Record whether the native version preserves the source's appearance and motion. An approximation that changes the focal subject, its scale, or its behavior is a fidelity gap to report, not accepted scope, unless the user accepts it. Record every substitution, such as a typeface, a simplified UI, or a raster.

Use native objects for UI, text, icons, charts, logos, and layout. Use a raster only for photographic content, cropped cleanly from its largest unoccluded appearance, and note the source frame.

## Fit recurring components before shots

When components recur (a brand mark, a product window, chips, cursors, a type treatment), build each once from geometry measured at its largest and clearest appearances, and verify it against those frames. Document it for whoever uses it: canonical size, anchors, parameters for the states the film animates, returned ids, measured placements, and known gaps. Build at a canonical size and let callers scale an owner, since transforms cascade. Budget nodes per instance and offer a lighter detail level for thumbnails.

Fit the reference first and abstract second. One shared curve or a generic appear helper applied to unrelated motions replaces the source's variety with house style; share a helper after it matches several appearances. When a shared component must change mid-run, announce the change and recheck the shots already using it; a silent per-shot override leaves visible steps between neighboring Scenes.

## Build each shot through a comparison loop

Keep each Scene's construction pure and deterministic (no live reads, randomness, or dates), with ids namespaced by Scene, so it can be rebuilt unchanged in the final project.

Loop: build → stage → compare paired reference and candidate frames → repair → accept. Choose comparison frames from the source's important states: entry, emphasis, transition, receiving state, and both join frames, not even intervals. `motionade compare` puts a candidate frame beside its reference frame and measures the difference, which helps locate a mismatch; judge the result by looking at the images. Inspect small text and UI at full resolution. Judge motion from runs of consecutive frames around fast events, not only from settled poses. When a stage is split into batches, review each batch or the assembled result.

With parallel authors, each author owns a folder and either one Scene of a shared project or its own scratch project. Each Stage's answer says its `scope`: a Scene Stage is replaced only by another Stage of that Scene, a whole-project Stage only by another whole-project Stage, so authors of different Scenes stage and accept side by side once the director has registered the fonts and other project-level state they use. Shared files are read-only to authors; never delete by wildcard in shared space. The director relays facts that cross Scene boundaries, such as join positions and shared colours, while authors work.

Do not stop on a candidate with a missing principal event, materially wrong framing or scale of the focal subject, a wrong event order, wrong copy, or a destructive collision, even when other parts look strong. Fine texture, exact typeface, and sub-pixel detail rank below these.

## Assemble and check joins

Each Scene reports a result (key, duration, background, name, source span) that assembly reads before laying out the project. Rebuild each Scene in the final project from its construction and confirm it matches the accepted scratch render. Compare paired frames at every boundary and frame runs across live joins. Place the soundtrack on the native clock.

## Review against the reference

A reviewer who did not build the film judges the result against the reference, not the authors' notes, using paired exact frames and frame runs around cuts, landings, morphs, typing, and dissolves: `renderFrame` for single frames, a `renderMotionStrip` contact sheet for a run. Review an exported draft the same way, frame for frame and with its sound (authoring reference, "Export and deliver"). Classify each discrepancy:

- **Blocker:** missing or extra principal event, wrong order, materially wrong framing, scale, or position of the focal subject, wrong copy, a pop or jump at a join, destructive overlap, content outside its window, a dead stretch the source lacks.
- **Major:** clearly off timing on a principal event, wrong motion character (linear where the source eases, overshoot the source lacks), wrong colour state, a missing secondary element.
- **Minor:** typeface, texture, small spacing drift, simplified detail.

Review is input. Settle a disputed claim by measuring the frames (colour, position, onset) rather than by arguing it. Route a repair to the author who built the shot when available. A similarity score such as SSIM locates problems; a high score does not establish fidelity.

## Report

Report three outcomes separately, each with its evidence and limits:

1. **Fidelity:** a verdict per Scene (faithful, acceptable draft, below fidelity), remaining blockers and majors with source frames, and every approximation.
2. **Editability:** the named groups and controls a person would adjust, and a meaningful manual edit for them to try in Studio, with its Undo.
3. **Export:** the exported file and its receipt: decode, duration, frame count, and audio, compared with the source.

Keep the first accepted candidate and the repaired one. Mark normal-speed perceptual review unverified until the person has watched the film in Studio. Delegation and agent count are means, not quality criteria.
