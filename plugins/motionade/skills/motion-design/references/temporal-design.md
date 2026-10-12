# Temporal design

Use with the [core contract](../SKILL.md) when planning a film's time, changing duration or content, shaping motion timing, or diagnosing pauses, readability, stagger, or handoffs. Work on the affected interval and its neighboring joins for a local revision. This guidance requires no template library.

## Responsibility

Turn the intended relationships into an appropriate schedule and perceptual rhythm. [Choreography](choreography.md) establishes participants, spatial relationships, and meaningful order or concurrency. Temporal design places their events, allocates reading and response time, and checks movement behavior in context. Engine operation names and time-mapping semantics belong to the live authoring layer.

Respect the user's fixed duration, audio, copy, accepted motion, and protected decisions as applicable. Distinguish those commitments from provisional choices. If the content cannot fit the available time legibly, explore permitted layout or treatment changes and surface any remaining conflict through the task workflow. Do not silently shorten protected copy or move a locked cue.

## Terms that change a decision

| Term | What to decide or inspect |
| --- | --- |
| Timing | Placement and duration of events and state changes |
| Spacing | How far a property or object moves between sampled times, including the resulting screen-space travel |
| Easing | How progress changes through a segment; inspect it with path, distance, and duration |
| Stagger | Relative starts or phases across targets, including order and the last target's opportunity to resolve |
| Rhythm | The pattern of events, accents, reading, motion, and rest across a phrase and the film |

A phrase is a useful grouping of related events for this design task. It is not a new Scene requirement or Motion IR type. Rhythm can come from cuts, language, sound, scale changes, motion, and stillness; adding animation is only one available choice.

## One shared decision record

Keep important decisions inspectable in project structure and concise notes. Extend the existing plan only where intent or an edit dependency would otherwise be lost. A useful record contains:

```text
Scope / object IDs: affected entities and neighboring join
Intent / important states: what changes and what the viewer should understand
Relationships: what stays attached, leads, responds, persists, or deliberately changes
Understanding / events: what becomes understandable or expected, and when that enables the next event
Commitments / variables: fixed decisions, adjustable choices, affected dependencies
Review: candidate revision, observed issue, repair, and unresolved uncertainty
```

This is an optional compact notation for shared decisions, not a second authored timeline or a form to fill for every object. Store exact authored timing in ProjectDocument. After an edit, derive timing from the current document and update stale explanatory notes.

## Allocate time around meaningful events

Identify events such as contact, recognition, reveal, completion, an accent, and transfer of focus. Some are exact authored events; others, such as becoming readable, require perceptual judgment. A cue, action, response, and handoff can overlap or be omitted according to purpose. Do not allocate equal time slots merely because a film has several sections.

### Design how understanding develops

Treat comprehension as developing throughout the phrase. Start with what the viewer should understand, feel, or expect, how the designed change makes that available, and what understanding the next event depends on. Resolve composition, motion, and timing around that progression. A technique is one possible implementation of the relationship; observations from references should keep expanding the available choices.

Count meaningful exposure from the point the relevant content or relationship becomes understandable, including exposure during movement. Inspect actual visibility, scale, contrast, information density, spatial relationships, and competing attention. Evaluate the real copy at the delivered size over the frames where it is actually readable; the person's playback in Studio confirms it at normal speed. An animation endpoint is an implementation boundary; it does not start the viewer's comprehension clock.

For any additional settled interval, identify the remaining communication or expressive purpose and check whether it is already being served while the phrase develops. Advance the related response or next idea when the necessary understanding is available. Keep stillness when its contrast, expectation, emphasis, or viewing opportunity contributes to the intended experience. Choose duration from the content and behavior; no universal minimum hold, continuous-motion requirement, or target reduction applies.

When reviewing a slow phrase, inspect what continues to develop and what has already been communicated. If a wait adds no useful development, recognition, or experience, revise its timing and dependencies while preserving accepted movement character. Adding decorative activity does not establish comprehension or progression. Test whether the viewer can still follow the intended meaning and relationships after the change.

Keep the decision rule at the level of purpose, perception, and relationships. Particular effects and examples are conditional evidence, with their limits and adaptable variables; they do not form an exhaustive vocabulary or a mandatory sequence.

For speech and music, place relevant spoken cues, accents, pauses, and phrase boundaries into the rough. Decide where visual events synchronize or deliberately differ. Do not force every visual change onto a musical beat. Mark provisional or missing audio because its presence can change attention and the apparent pace. Keep claims about reviewed synchronization limited to the audio actually checked.

## Resolve time through the current authoring model

State the frame rate, time origin, units, and endpoint convention when discussing exact events. Source-video time, project time, scene time, and local animation time may differ. Use the actual scene offsets and any retiming or source offsets when translating between them. Read the current authoring capabilities instead of assuming a planned semantic event is a supported operation.

When authoring, convert selected event times into valid native ranges and keys, then inspect the quantized result at the project's frame rate. Keep an object's effective lifetime compatible with its intended visibility and property changes. A local fade or transformation should not accidentally define the lifetime of the whole composition.

Prefer supported native relationships for dependent timing. If timing is compiled into independent keys, identify which keys, object ranges, stagger schedules, and reading windows must be recomputed after an edit. Recheck the neighboring joins. Do not promise automatic retiming for relationships recorded only in prose or absolute frames.

## Shape movement and handoffs together

Choose arrival, travel, contact, and recovery behavior according to the intended character. Easing interacts with duration and distance: preserving a curve while shortening its duration changes absolute speed. For an accepted movement, distinguish shifting its phase from changing its duration, path, or curve. Diagnose the relevant cause before replacing accepted easing.

A readable hold, gradual growth, and a short accelerating exit can belong to the same object. For a reference reconstruction, inspect the final visible movement before important cuts; coarse samples can miss a brief accent. Resolve enough neighboring frames to distinguish a cut, acceleration, or settle, then express a compact phase/curve model. Preserve the useful reading interval. A settled ending may fit a different brief, so an observed exit punch is not a default for future films.

For a desired continuous handoff, compare the incoming first meaningful activity with the outgoing substantial travel or recovery. Inspect actual visibility, spatial relation, and competition for attention. Moving the next response into the previous recovery is a candidate repair when the gap is unintended. A near-invisible easing tail or barely visible incoming object can produce nominal overlap without a useful handoff.

Choose a cut, separated reveal, or pause when that serves the message. Review these by their intended contrast, reading, or expectation. A continuity diagnostic must not turn every scene boundary into an overlap rule.

### Pair the outro with the next intro

For compositions intended to form a continuous phrase, design the boundary before polishing the two movements separately. A composition's outro includes its last readable state, release, and last visible travel; the next intro includes its first meaningful exposure, acquisition, and settling. Scene boundaries select visible portions of these movements and need not coincide with their starts or rests.

For an important join, record a short paired decision with the real subjects: where the outgoing focus leaves, its direction and speed at last exposure; where the incoming focus first becomes meaningful, its direction and speed; and how attention passes between them. Resolve both in one project-time interval, then map that interval into native Scene clocks. Use an intentional cut or pause when the message calls for one.

Choose the two easing behaviors together with travel distance and duration. A brisk phrase may accelerate its outgoing release and expose an incoming movement already traveling quickly into a longer deceleration. This is a possible motion character, not a fixed curve pair. Preserve an accepted entrance when the defect is the preceding release or relative phase. Avoid assuming a reversed entrance curve will provide a suitable exit.

A clean cut can connect motion without overlapping images or adding a bridge object. Inspect the final outgoing and first incoming screen-space spacing, scale, and focal position. If one gesture or identity continues, preserve its progression across the boundary rather than repeating the seam pose or restarting easing from rest. Different subjects need a perceptible relationship in energy and attention, not identical velocities. Pre-running or trimming a movement must use supported native timing/visibility; an explanatory note does not implement it. Larger transitions need a role in the composition and should not substitute for this timing decision.

For text, include the last arriving word's recognition and reading opportunity in the pair. Entry and exit can have different grouping, stagger density, and property clocks. Prevent outgoing text from lingering over the incoming reading region merely to manufacture overlap.

Check the join with enough context to read both phrases: a frame run or contact sheet across the boundary shows effective exposure and relative phase, and the person's playback in Studio shows whether it feels like two independent animations. Inspect exposure and phase before adding an effect, and diagnose with boundary frames and tracks. An intentional interruption can succeed with a discontinuity; explain its purpose rather than smoothing every boundary.

For stagger, choose the order and interval from the content and intended build. With equal item duration `d`, constant interval `delta`, and `n` items, the scheduled span is `d + (n - 1) * delta`; this is a scheduling relationship, not a perceptual quality score. More items can consume the last item's reading window even when each item's animation is unchanged. Reconsider grouping, order, interval, layout, or permitted duration. Nonuniform stagger and simultaneous groups are available.

## Shape rhythm across the film

Compare phrases by their arrival, result exposure, recovery, event density, and accents. Repetition can establish a useful pattern. If every phrase resets in the same way and that conflicts with the intended experience, vary the relation between phrases or redesign their connection. Preserve useful result-reading time when removing an unused wait.

For a requested fast, playful film, inspect the frequency of meaningful visual changes: a new reading, altered scale or framing, a recognizable response, or the next idea taking focus. A spinning decoration and repeated short entrances can coexist with a slow sequence. Avoid assigning every topic the same bar-length slot by default. Let content and musical phrases support distinct bursts, sustained development, and release.

Fast acquisition, reading during continuing movement, and a brief decisive departure are possible treatments; choose them for the actual phrase. Inspect outgoing and incoming visible speed together with their focal relationship. If the viewer keeps waiting for a composition to finish before the next begins, reconsider the join and information progression before shortening every key range. A new curve cannot repair an unresolved visual premise; return that problem to [motion composition](motion-composition.md).

For a quiet interval, identify the viewer's opportunity: read, compare, anticipate, register an outcome, or experience a deliberate pause. Evaluate that opportunity with the actual content. A static frame can be purposeful; background motion can coexist with an unhelpful wait. Automated stillness or pacing reports can locate intervals for review but cannot establish comprehension or artistic quality.

## Worked timing case: response during recovery

The recorded Orbit refinement isolates a useful diagnosis. Its first shorter candidate retained an empty incoming progress region after the owner region receded. A further revision shifted progress response into owner recovery while preserving the existing curves and overall candidate duration.

The event plan records these Scene 3 local frames at 30 fps:

| Event | Original baseline | Final recorded revision |
| --- | --- | --- |
| Owner recovery | f117–130 | f70–82 |
| Ready becomes Done | f131 | f77 |
| Progress fill | f131–167 | f80–111 |

The revised status change and fill begin inside the owner's recovery interval. The saved review reports a perceptible handoff and retained result reading. The frame table explains the candidate mechanism; it does not independently establish how the movement feels. These frame counts and the depth treatment are local choices, not defaults.

The case supports a local repair, not a default for unfamiliar briefs.

## Review and repair with a playable rough

Retain the actual content, representative layout, meaningful movement, and enough easing to test the mechanism under review. Simplify polish that does not affect the question. Use the native authoring and renderer path, and identify the candidate revision being reviewed.

Inspect detailed frames, strips, curves, and ranges to diagnose a problem, then recheck the repair with its neighboring joins. Playback at normal speed with the intended audio is the person's, in Studio. Your tools provide stills and timing data, so record temporal judgment as unverified until the person has watched it.

| Symptom | Candidate cause to inspect | Repair to consider |
| --- | --- | --- |
| A transition still feels sequential despite overlap | Incoming meaningful visibility starts after outgoing substantial travel | Rephase the response or redesign its cue. |
| Faster pacing makes the result harder to understand | A useful reading interval was compressed | Recover reading time through an allowed treatment, layout, or timing change. |
| A longer list rushes its last items | Stagger expands the group span into the next event | Recalculate the complete group and handoff. |
| An object flashes or disappears early | Lifetime, pre-track value, masking, or visibility differs from intent | Correct the relevant native state and replay that interval. |
| Motion character changes after retiming | Duration, distance, curve, or coupled property timing changed | Inspect actual spacing and restore the intended behavior. |

For a substantial edit, choose a change that stresses the intended timing relationship: longer copy, a new item count, a moved cue, or a shorter allowed duration. Inspect the resulting layout, reading, dependencies, and joins, and verify recovery. Numerical validity, playback completion, and Undo each provide specific evidence; none alone establishes that the timing succeeds.
