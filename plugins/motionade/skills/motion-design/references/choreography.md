# Choreography

Use with the [core contract](../SKILL.md) when creating or revising relationships between objects, coordinating a response, connecting compositions, or diagnosing lost attention or broken attachment. A local task needs only the affected relationships and neighboring handoffs. This guidance requires no template library.

## Responsibility

Decide what the viewer follows, what each participant does, what changes together, and how one event relates to the next. Establish order and concurrency constraints and the spatial mechanism of a transition. [Temporal design](temporal-design.md) resolves those decisions into event times, readable windows, and rhythm. Both work on the same project and concise design notes.

Work within the brief, visual language, and protected decisions. Propose a change to a shared decision through the task workflow when local choices cannot satisfy it. A choreography pass does not independently rewrite the film's copy, palette, or duration.

For an original sequence, [motion composition](motion-composition.md) supplies a visual premise and connected key moments. Test those relationships before assuming the proposed layout is settled. If the same title-and-illustration arrangement keeps resetting, return the composition question to that design pass; local overlap and smooth rig motion may leave the film's larger problem intact.

## Establish a composition that can change

Describe the meaningful before/after states and the experience between them: a comparison becomes clear, a response confirms an action, a shape changes identity, or a composition builds tension. Expressive movement can serve mood or visual character; it need not imitate a physical interaction.

Use the actual content and intended layout to decide the attention structure. Identify a lead and supporting activity when useful. For a deliberate comparison, specify the regions the viewer should compare and how they remain understandable together. Inspect important intermediate states for balance, legibility, collisions, and unintended occlusion; well-composed endpoints alone are insufficient.

Identify the entities and their owners. A product's outline, screen, label, and attached pointer may form a rigid assembly. Its content may respond independently while staying in that shared coordinate space. Flexible parts can lag when their character supports it; rigid attachments should remain attached unless separation is intentional. Distinguish a persistent entity, a replacement in the same slot, and a deliberate identity transformation.

## Choose relationships that explain the action

Use only the relationships needed for the composition. These are design concepts, not additional Motionade IR types or guaranteed API operations.

| Relationship | Decision to make | Failure to check |
| --- | --- | --- |
| Shared travel | Which objects inherit one motion, anchor, or spatial frame? | Attachments drift or receive the same transform twice. |
| Cause and response | Which visible event motivates a reaction, and how is it recognized? | The result appears before its trigger without an intended anticipatory cue. |
| Concurrent action | Why should events occur together, and how is attention distributed? | Independent movement obscures the content the viewer needs to follow. |
| Stagger or cascade | What orders the targets: reading path, spatial distance, priority, or another meaningful relation? | More targets push the last response outside its reading opportunity. |
| Handoff | What carries attention between states: identity, position, direction, shape, reveal, or an editorial cue? | The next focal event is absent or competes when the previous event yields. |
| Interruption or cut | What is deliberately reset, contrasted, or surprising? | An accidental discontinuity is mistaken for an intentional editorial choice. |

Specify important spatial conditions along with order. A tree replacing a letter needs the relevant letter anchor. A foreground wipe needs a revealing edge, drawing order, and content behind it. A camera/group move needs the appropriate shared coordinate system. Similar event times cannot supply a missing spatial mechanism.

Anticipation can come from layout, another object, sound, or the moving subject. Choose it when preparation serves the event; a reversal or bounce is optional. Follow-through concerns continuing response after the main action, while settling describes arrival at a stable state. Choose each according to the intended material or motion character. Do not attach the same preparation and settling gesture to every object.

## Carry attention between compositions

For a handoff, identify the outgoing information, the incoming information, and the visible connection. Decide what persists, what becomes background, and what is released. Keep the required reading region usable during the transfer, or explicitly schedule its replacement.

For a continuous phrase, inspect whether the next event becomes meaningful while the outgoing action visibly yields. A long easing tail or overlapping block ranges may have little perceptible effect. If continuity is missing, first inspect the actual incoming cue, the outgoing travel, and their spatial relationship. Ask temporal design to adjust their phase when appropriate.

Trace effective visibility before moving a cue: include ancestor lifetime, masks/clips, drawing order, and foreground coverage. An incoming object's active range does not prove it can be seen. Give a transition surface a clear completion condition; once its visual responsibility has passed to the receiving composition, end or rearrange it as appropriate. Preserve its coverage while that coverage is still needed. A shared transform owner also need not imply shared opacity or compositing; resolve those semantics through native authoring.

For a cut, comparison, or quiet pause, design the intended contrast or viewing opportunity. No moving bridge is required. Preserve the transition's function when adapting it to different content; copying a path or overlap amount alone does not establish that function.

## Keep the construction adjustable

Use project identities and native ownership/controls to express relationships where supported. Where a relationship is resolved into separate absolute keys, leave a concise note identifying the affected objects and which events must be reconsidered together. Temporal design defines the shared [decision record](temporal-design.md#one-shared-decision-record); extend it only when a dependency would otherwise be lost.

For example: “The annotation follows the product rig; its readable interval must precede the next comparison. Changing the copy may require reflow and rescheduling that interval.” Link the note to real objects when authoring. This communicates a repair dependency without promising automatic layout or retiming support.

Check the intended relationship through a representative edit. Repositioning a rig tests attachment; changing copy tests layout and reading opportunity; changing target count tests ordering and scheduling. Choose the edit that matters for this construction, replay neighboring joins, and verify recovery. Do not require every possible edit for a small local task.

## Worked decisions and counterexamples

**Product action and result — illustrative construction.** A control moves with its product surface. A pointer reaches the control, the control acknowledges contact, and the relevant result begins responding. The result may develop during the control's recovery. Preserve attachment and recognizable cause/response; adjust travel, response placement, and timing to the actual layout. Longer result copy can require a quieter motion or a different reading interval. A non-interactive abstract film may have no need for pointer/contact choreography.

**Comparison — illustrative construction.** Two alternatives intentionally share attention. Align their comparable features and coordinate the revealing event so the relationship is easy to inspect. Concurrent action can communicate equality; a staged reveal can emphasize contrast. Choose using the message and information density. Forcing every comparison into a single moving focal point can undermine the intended side-by-side reading.

**Word becomes forest — evidence from Apple 2030.** The experiment's inferred model preserves word layout, uses selected glyph positions as tree anchors, pairs the glyph/tree visibility changes, and grows the larger forest from that exchange. The useful construction is the identity and spatial handoff. Exact original ownership and curves remain inferred. With different copy, reconsider glyph selection, tree placement, reading time, and population layout. Keeping every old coordinate would not preserve those relationships.

The recorded Apple analysis places this exchange at approximately 20.5–23.5 seconds and identifies it as a rendered-source hypothesis. Its times describe that reference, with estimated observation precision; they are not timing defaults for this module.

## Review the affected relationship

| Observed symptom | Investigate | Candidate repair |
| --- | --- | --- |
| Product and label separate unexpectedly | Parent, anchor, coordinate space, transform ownership | Repair shared ownership, then replay the complete travel. |
| Activity is continuous but the story feels disconnected | Visible cause, response, and the handoff's spatial cue | Strengthen the relationship or choose an appropriate cut. |
| Incoming content is active but cannot be seen | Foreground coverage, drawing order, ancestor lifetime, clipping | Repair the responsible visibility relationship, then reassess timing. |
| Two events are hard to follow | Intended attention structure, scale, contrast, occlusion, relative onset | Reduce competing activity or separate reading opportunities. |
| An adapted effect disrupts the film | Conflicting visual language, entry/exit state, scope, or timing anchor | Adapt local variables or select a different construction. |

Use these as diagnostic possibilities. Confirm the cause in the project and playback before changing it. For a timing cause, use temporal design; for missing implementation behavior, use the live authoring capabilities. Numerical validity and a legible layer tree do not establish perceptual success.

These cases clarify conditional decisions; they do not establish a required film sequence.
