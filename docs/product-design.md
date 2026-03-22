# Movie Claw – Product Design Spec

## 1. Vision
Help indecisive movie watchers pick tonight’s film faster by transforming fuzzy vibes ("feel-good but clever", "stylish sci-fi") into head-to-head recommendations that learn from each choice until the user locks a final pick.

## 2. Target user & context
- **Primary:** Streaming-heavy adults deciding with a friend/partner on the same couch and often sharing one laptop/tablet.
- **Moment:** End of day, want a decision within ~5 minutes without scrolling endless carousels.
- **Constraints:** Short attention span, minimal typing, expect posters/trailers, cooperative experience (both people can see the screen).

## 3. Experience principles
1. **Low cognitive load:** Only two options at a time, with crisp reasons for each.
2. **Curated intent capture:** Offer a rich library of vibe chips (e.g., "we’re multitasking", "ready to pay attention", "comfort rewatch", "mind-bending") that can be multi-selected, with optional freeform text for extra nuance.
3. **Progress clarity:** Always show how close the system is to a confident recommendation.
4. **Delightful endings:** The “I pick this movie” state should feel celebratory and shareable, matching a cozy, game-like atmosphere.

## 4. User flow summary
1. **Landing:** Name + tagline + multi-select vibe chips grouped by mood/attention level + optional text field. CTA: “Find my movie.”
2. **Vibe summary:** Spinner that paraphrases the selected chips/text (“Dialing up: chill background comfort watch”). Provide an edit button.
3. **Battle loop:** Present two cards side-by-side (or stacked on mobile) with poster, title, year, runtime, tone badges, and a short “why” sentence. (Streaming availability is deferred to a later version.)
4. **Learning feedback:** After each pick, subtle toast (“Noted: you’re leaning toward low-key humor”). Update a visible progress meter (“3 of 5 comparisons”).
5. **Decision surfacing:** When confidence crosses threshold, replace the challenger card with a “Lock it in” panel for the frontrunner (expanded synopsis, trailer link).
6. **Final screen:** Show the chosen movie, quick stats, recap of top 3 runners-up, and celebratory visuals with “Start over” + share controls.

## 5. Detailed interaction notes
### 5.1 Intent entry
- Default view shows categorized chips (Attention level, Tone, Energy, Era). Users can mix multiple chips to describe the vibe without typing.
- Optional text area remains for bespoke flavor, but chips should cover most cases so that we can lean less on freeform LLM prompts.
- Inline validation if nothing is selected (“Pick at least one vibe or describe what you’re feeling”).

### 5.2 Comparison cards
- **Hierarchy:** Poster > title/year > hook copy > metadata chips.
- **Why-text:** short sentence referencing user-selected chips (“Because you said you want something you can half-watch”).
- **Actions:** Primary “Pick this one” button; secondary “More details” link expands runtime, cast, ratings.
- **Layout:** Large tap targets suitable for two people glancing at the same screen.

### 5.3 Progress indicator
- Stepped bar (5 nodes). Each pick fills one node; tooltip clarifies “The more you pick, the smarter the next suggestions.”

### 5.4 Session log drawer
- Collapsible drawer listing past comparisons with ability to undo the last choice. Useful when two people disagree and change their minds.

### 5.5 Final choice state
- Hero poster framed with soft gradients/cozy textures.
- Buttons: “Copy link,” “Watch trailer,” “Start over.” No history beyond this session.

## 6. Information architecture
- Single-page app with state transitions: `idle → loadingCandidates → pairing → awaitingChoice → learning → decisionReady → confirmed`.
- Modal for expanded movie info; drawer for session log.

## 7. Edge/empty states
- **API failure:** Friendly message + retry action.
- **No suitable movies:** Suggest broadening by surfacing related vibe chips (“Try relaxing your attention level or adding ‘classic crowd-pleaser’”).
- **Idle timeout:** Prompt to resume or reset after several minutes without interaction.

## 8. Technical assumptions influencing UX
- Candidate pool per session limited to ~30 TMDb titles with short LLM-generated rationales.
- Preference model is session-only; refreshing the page wipes progress (call that out subtly near the Start button).
- Prefetch the next pair while user evaluates the current one to avoid spinner delays.

## 9. Success signals (first version)
- Users complete ≥4 comparisons in a session.
- Median time to “Lock it in” < 4 minutes.
- ≥50% of sessions end with a final pick.

## 10. Visual direction notes
- Aim for a cozy indie-game vibe: warm palettes, rounded cards, subtle grain, gentle motion cues (e.g., Alto’s Adventure, Spiritfarer inspiration).
- Typography should be friendly and legible from a distance (since two people share the screen).

## 11. Open questions
1. How large should the preset vibe library be at launch (e.g., 12 vs 30 chips)?
2. Do we want to let users reorder chips by importance (primary vs secondary vibe)?
3. Should the celebratory end state include recommendations for snacks/activities, or stay laser-focused on the movie?

---
This spec reflects the latest customer input and guides the next step: mid-fidelity wireframes expressing the cozy shared-screen experience.
