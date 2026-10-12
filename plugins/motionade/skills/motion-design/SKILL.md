---
name: motion-design
description: Create, reconstruct, and revise editable motion films in Motionade. Use for whole-film direction, coordinated object motion, timing and rhythm, or a scoped motion-design repair; delivers a native project that can be adjusted in Studio.
---

# Motion design

Use the brief and current project to design the viewer's experience and construct it as editable native motion. This experimental package works without a template library. Follow the user's requested creative direction and revision scope.

## Start here

Motionade works like After Effects: Scenes of layered objects whose properties change through keyframed Actions, with masks, effects, Shaders and a camera on top. What you build is a project the person opens and adjusts in Studio, Motionade's editor. The tools come from the Motionade MCP server. If your host lists them by name only (Claude Code loads MCP tools through its tool search; Codex lists them in code mode's ALL_TOOLS), load `listCapabilities` and call it before any other tool. Then find what you need in this order:

1. `listCapabilities` with no arguments: the overview of the building blocks, and the sections it serves by name.
2. `listCapabilities({"section":"model"})`: how the medium works. What an object shows before, during and after an Action, how Actions on one property combine, how Frames carry their children, where masks, effects and the camera sit, and an After Effects word list. Read it once before you author; [How Motionade works](references/medium.md) is the same page.
3. `listCapabilities({"section":"needs"})`: start from what the picture needs, in a designer's words. Each need lists every construction that serves it, what a person can adjust in Studio afterwards, and what each gives up. Look each moment up here before you fake it with something else: the native construction (a moving mask for a wipe, a path Merge or a Morph for shapes that fuse) is the one a person can adjust. The same index opens [Find a capability from the need](references/capability-map.md).
4. `listCapabilities({"kinds":["addMorph","addMaskBinding"]})`: before you write an operation kind, its exact input, examples that stage, and where to read next; up to 20 kinds per call. A domain's whole contract is its section, such as `actions`, `camera`, `path`, `geometryMorph`, `shaderAuthoring`, `visualCatalog` (the ready-made Shader looks) or `timingStyles` (curves many Actions share).

When the server refuses an operation, the answer names it (`failedIndex`, `kind`), each field at fault (`issues`), what to send instead (`fix`) and the one call that answers the rest (`read`). Make that call before you resend.

### Create a film

Read [Motion composition](references/motion-composition.md), then [Choreography](references/choreography.md) and [Temporal design](references/temporal-design.md) as the design calls for them. Make the composition pass visible in a compact board or equivalent inspectable frames, using essential copy and representative product states. Resolve each important moment's communication purpose, first focus, and relationship to its neighbors; then test exposure and connections in a playable native rough. A palette paragraph or topic outline leaves these decisions unresolved. Scale the board to the task; a short concept needs no exhaustive storyboard. Review internally and proceed within the user's authorization; show a design checkpoint when the user requests one. No fixed frame count, equal-duration slots, curve family, or transition effect is prescribed. A brand typeface the server does not list in `fonts` can't be added yet: choose the nearest listed family, and tell the person, before you build, which one stands in. Then `createProject` and build through the loop below, mapping distinct sequences to Scenes. A look no ready-made Shader gives is yours to write in SkSL: you decide which of its values become Properties a person can retune and keyframe in Studio, and everything else stays fixed in the source ([Shaders you write](references/authoring.md#shaders-you-write)).

### Reconstruct a reference

Read [Reference reconstruction](references/reconstruction.md) first. Fix the source's clocks and cut map and write its event model; then find each mechanism you observe in `needs` and prototype the hardest one before the full build. The reference fixes composition, copy, timing and motion character; change them only when the user asks.

### Revise an existing film

Find the project with `listProjects` unless the user gave its id, and read it as it is: `getProject` (with `sceneId` for one Scene) and `getSceneAuthoringContext`, which serves the fingerprints that precise edits quote back. The `needs` group "Changing what exists" lists the local edits: retime an Action, edit keys by id, rebase a track, reorder, rename. Keep to the scope asked, and prefer these edits to rebuilding, which loses identities and the person's adjustments. A stage lists in `overwroteUserEdits` any manual edit it would overwrite; resolve each one you were not asked to change before accepting.

### The loop, in every route

1. Stage a batch with `applyOperations`. Staging never saves. Values with no creative meaning may be left out: the server fills them and lists them in the answer's `filled`; what you send is kept or refused, never overwritten, except an auto-sized Text's measured box. The answer also carries the `proposal`, a `candidate` outline, `warnings`, `overwroteUserEdits`, a pacing digest and, for a Morph, the `morphReport`.
2. Check the candidate with the proposal's `stageId`. `renderFrame` shows one frame as the viewer sees it; `renderMotionStrip` shows motion in one image (an onion skin for paths and spacing, a contact sheet for poses across a range); `previewRange` gives exact boxes, visibility and on-screen bounds; `getPacingReport` measures where nothing moves and for how long. `renderFrame`, `renderMotionStrip`, `previewRange` and `getPacingReport` also take `operations`, to try a change without staging it.
3. Accept with `acceptOperations`, quoting the proposal's `stageId` and `proposalDigest`. Within the creation or editing task the user gave you, accept a change you have checked without asking again; when the user asked to review before saving, wait for their decision.
4. Read it back with `getProject`, and read `getSceneAuthoringContext` again before the next precise edit. Keep a checkpoint of each change in your working folder (the operations, the stage answer, your checks, the accepted revision): accepting adds nothing to Studio's History.
5. Give the person the Studio link from `openEditor`.

## Shared core

> Design the viewer's experience through composition and motion. Realize it as a legible, editable system of objects, states, and relationships. Judge both its visual quality and its behavior through playback.

1. **Begin with meaning and the user's intent.** Establish what the viewer should understand or feel and the purpose of each important composition. Distinguish original creation, reference reconstruction, adaptation, and local revision. Identify user commitments, locked decisions, and negotiable choices; let these determine fidelity, scope, and creative freedom.

2. **Design the visual idea and compositions in motion.** For original work, decide how a visible change communicates the message before detailing assets. Establish a coherent visual language across the film. Choose the focal subject, scale, framing, typography, contrast, and negative space of important moments, together with what transforms or carries attention into the next. Resolve connected, inspectable composition frames before detailed animation; test their development in a timed native rough. For a fast promo, avoid defaulting to a repeated eyebrow, headline, description, and illustration layout; keep supporting copy only when it supplies necessary information. Preserve requested copy and essential labels. A reference reconstruction starts with the supplied composition logic; a local edit preserves accepted design.

3. **Construct meaningful object relationships.** Identify entities, groups, parents, anchors, coordinate spaces, and drawing order. Decide what travels together, changes independently, persists, or deliberately becomes something else. Preserve intended relationships through transformations and edits. Give important groups and controls meaningful names so a person can understand and adjust the construction.

4. **Plan object lifetimes and meaningful events.** Establish when objects become visible, readable, change state, and leave or persist. Distinguish lifetime from property changes within it. Design how understanding develops throughout the phrase: what the viewer comes to understand or expect, how the composition and motion make it available, and when the next event can use that understanding. Count meaningful exposure during motion; give additional settled time a specific purpose. Express dependencies and relative timing before resolving detailed keys. Entrances, holds, exits, cuts, and stillness are design choices; no universal animation envelope is required.

5. **Choreograph attention across objects and compositions.** Make the intended focus and reading structure clear, including deliberately distributed attention. Coordinate leads, responses, stagger, overlap, shared motion, and handoffs. Assess rhythm through accents, variation, pauses, and changing energy across the film. Choose continuity, interruption, or a cut according to purpose; timeline overlap alone does not establish perceptual continuity. For a continuous sequence, design the outgoing composition's release and the next composition's acquisition together; use the paired-join guidance in [Temporal design](references/temporal-design.md#pair-the-outro-with-the-next-intro).

6. **Design each important movement's behavior.** Relate trajectory, spacing, easing, acceleration, anticipation, follow-through, and settling to purpose and motion character. Consider coupled properties and neighboring movements. Choose curves and durations deliberately and evaluate them in context. A preset name or numeric curve is an implementation choice, not a complete explanation of the design.

7. **Use references to resolve design questions when useful.** Inspect selected source structure and playback when available. Separate observations from inferred intent or unknown mechanisms. Distinguish studying an example, reconstructing its mechanism, and adapting a supported template. Distill the decision principle and the conditions that made a reference work. Examples remain an open set of possible implementations; choose or invent techniques from the communication goal. Evaluate fit against the brief; proceed without a library or decline unsuitable examples. With rendered-only material, test a plausible authored model. Preserve the user's chosen content and direction.

8. **Author a legible, editable native project.** Everything you author lives in the project, and its motion is native Actions and motion blocks, not a separate timeline. Map independently editable sequences to meaningful native Scenes; use groups for relationships within a Scene. A continuous shot can stay together, while the blank project's single Scene is only a starting point. Resolve continuity across chosen boundaries through supported native semantics. Make every change through staged operations, respecting revisions and manual edits; expose controls and preserve recoverability. Identify dependencies that require recomputation after edits. Keep concise notes without a second authoritative timeline. Delivered projects must remain usable independently of later skill or template changes.

9. **Review the design before polishing its execution.** For new sequences or substantial revisions, inspect the connected key moments and the rough for a clear visual idea, composition development, attention, and the requested energy. A readable sequence can still miss the creative brief. Resolve a weak premise or repeated generic layout before refining easing or decoration. Check movement, joins and holds with strips, frame runs and pacing numbers; rhythm and feel at normal speed are judged in playback, which is the person's in Studio ([Review and hand over](#review-and-hand-over)). Report creative assessment and technical verification separately, with their evidence limits.

Scale this reasoning to the task. A whole film needs a compact design model; a local edit needs the relevant existing relationships and intended change. Load specialist knowledge and reference files on demand. Do not require an exhaustive written plan for every object or load the entire library into each task.

## Load the guidance that changes this task

- Before authoring, read [How Motionade works](references/medium.md), the model of the medium with an After Effects word list; the server serves the same page as `listCapabilities` section `model`.
- For every authoring task, read [Native authoring](references/authoring.md) and discover the live Motionade capabilities. It defines the tool protocol and runtime semantics.
- When choosing how to construct a moment (which objects, Actions, or operations serve it, what a designer can adjust afterwards in Studio, and which limits bite), read [Find a capability from the need](references/capability-map.md), which opens with the index from a need to its constructions (section `needs`). Choose from the design, not from what is available. Each construction names the Studio handle a person adjusts it with, and section `canvasCreation` lists what Studio's shape, pencil and pen tools draw.
- For an original film, substantial redesign, or critique of presentation-like composition, read [Motion composition](references/motion-composition.md): resolved design frames, attention and neighboring relationships, exposure based on purpose, copy economy, and review before detailed production.
- For a new film or changes to object relationships, read [Choreography](references/choreography.md): ownership, shared travel, cause/response, attention, and spatial handoffs.
- For a new film, timing change, or readability/rhythm repair, read [Temporal design](references/temporal-design.md): event placement, property phases, reading windows, and film rhythm. Use the same project decisions as choreography.
- For a reference reconstruction, read [Reference reconstruction](references/reconstruction.md): clocks and cut map, the observed event model, recurring components, the comparison loop, joins, the stopping rule, and separate reports.
- For text with phased properties, layered demonstrations, or movement carried through a cut, read [Construction mechanisms](references/construction-mechanisms.md). These teaching cases show conditional choices and failure modes; adapt their relationships to the current content.
- When a film is split among several agents, read [Roles](references/roles.md). Where your host lists the plugin's agents, one per hat, use them; otherwise pass the shared rules and that hat's part as each agent's brief.

## Coordinate modules and preserve decisions

User commitments and explicit locks define the boundary. Shared visual language, copy, and timing anchors govern local techniques. Resolve conflicting local proposals in the film's design model; surface a concrete conflict if it requires changing a protected decision. Express real dependencies in native structure when supported. Notes identify dependencies that require recomputation; they are not another timeline.

## Review and hand over

Check what you can see yourself: frames at the telling moments, strips and frame runs around fast events, landings and joins, exact boxes where geometry or overlap matters, and the pacing report for holds. Compare paired frames with the reference when there is one; `motionade compare <frame.png> <reference>` measures a pair and saves them side by side.

Export only when the person asks for a file or for delivery: `createExportLink` and the plugin's export script render it on this machine through Studio's own export, save the MP4 and print a receipt ([Export and deliver](references/authoring.md#export-and-deliver)). Watching the film at speed with its sound, in Studio from the `openEditor` link, and a manual edit with Undo stay the person's. Give them the `openEditor` link (its `sceneId` and `frame` open Studio on a moment, `objectId` selects an object), say what to watch for, and report those checks as still to be made. A valid document, clean frames, a smooth strip or a passing receipt alone cannot establish motion quality.

Retain project and revision IDs, intended relationships, significant repair decisions, and the evidence you gathered. Keep the editable project and what you report aligned.

Match the finish to the requested handoff. When the user accepts an editable foundation and reserves fine polish for manual work, record that acceptance and the remaining adjustable details, then hand over. Preserve explicit requirements and surface unresolved functional or material design failures. Distinguish accepted creative choices from defects; further automatic refinement needs a reason within the user's remaining scope.
