# Movie Claw – Product Design Spec

## 1. Vision
Help indecisive movie watchers pick tonight’s film faster by transforming fuzzy vibes ("feel-good but clever", "stylish sci-fi") into head-to-head recommendations that learn from each choice until the user locks a final pick.

## 2. Target user & context
- **Primary:** Streaming-heavy adults who are overwhelmed by giant catalogs but want a deliberate choice, not an endless scroll.
- **Moment:** Friday night, on the couch with a partner/friend group, phone or laptop in hand, wanting to decide in under 5 minutes.
- **Constraints:** Short attention span, want minimal typing, expect posters/trailers, may be sharing a screen.

## 3. Experience principles
1. **Low cognitive load:** Only two options at a time, with crisp reasons for each.
2. **Flexible intent capture:** Freeform sentence input + optional quick chips (genre, decade, streaming service).
3. **Progress clarity:** Always show how close the system is to a confident recommendation.
4. **Delightful endings:** The “I pick this movie” state should feel celebratory and shareable.

## 4. User flow summary
1. **Landing:** Name + tagline + single text field + sample prompts. CTA: “Find my movie.”
2. **Vibe parsing:** Submit intent → spinner with a plain-language summary (“Looking for: clever heist comedies on Netflix”). Offer an edit button.
3. **Battle loop:** Present two cards side-by-side (or stacked on mobile) with: poster, title, year, runtime, two-sentence hook, badges (genre, tone, streaming availability), and a short “Why you’re seeing this.”
4. **Learning feedback:** After each pick, subtle toast (“Noted: witty banter over gritty stakes”). Update a visible progress meter (“Dialing in your pick… 3 of 5 comparisons”).
5. **Decision surfacing:** Once one candidate’s confidence crosses a threshold, swap the secondary card for a “Lock it in” card highlighting the frontrunner with expanded details, trailer link, and watch buttons.
6. **Final screen:** Show the chosen movie, key stats, recap of top 3 runners-up, and share/Save actions.

## 5. Detailed interaction notes
### 5.1 Prompt entry
- Placeholder examples (“E.g., cozy mystery, rainy-day vibe”).
- Optional chips: Mood, Era, Language, Streaming service.
- Error guard: if the prompt is empty or nonsense, show inline helper text instead of modal errors.

### 5.2 Comparison cards
- **Hierarchy:** Poster > title/year > hook copy > metadata chips.
- **Why-text:** one sentence produced by the LLM (“Because you said you love witty ensembles”).
- **Actions:** “Pick this one” button + “Tell me more” secondary link to reveal synopsis/ratings overlay.
- **Accessibility:** Ensure cards are keyboard navigable and have 44px tap targets.

### 5.3 Progress indicator
- Simple stepped bar (5 segments) or radial meter that fills as the ranking confidence grows.
- Tooltip explaining that the system adapts with every choice.

### 5.4 Session log drawer
- Collapsible side drawer listing past comparisons (Movie A vs Movie B → winner). Offers quick undo.

### 5.5 Final choice state
- Hero poster, confetti animation, “Tonight’s pick” heading.
- Buttons: “Copy link,” “Watch trailer,” “Start over.”
- Optional shareable card (image) for socials.

## 6. Information architecture
- **Page 1:** `/` – entire experience lives on a single page with progressive states.
- **Sections:** hero, comparison stack, progress footer. Modal for expanded details.
- **State machine:** `idle → loadingCandidates → pairing → awaitingChoice → learning → decisionReady → confirmed`.

## 7. Edge/empty states
- **API failure:** fallback message + “Try again” button; log error with request ID.
- **No suitable movies:** display friendly “We ran out” screen with option to broaden criteria.
- **Idle timeout:** if user stops choosing for X minutes, gently prompt to resume or reset.

## 8. Technical assumptions influencing UX
- Candidate pool per session limited to ~30 movies fetched from TMDb + LLM-tagged rationale.
- Preference model runs completely in-session (no login), so refresh = new session; warn users subtly about that.
- We can prefetch next pair while user views current one to avoid spinner between picks.

## 9. Success signals (first version)
- User completes at least 4 comparisons before ending session.
- Time-to-pick under 4 minutes median.
- At least 50% of sessions end with “I pick this movie” rather than a rage quit.

## 10. Open questions
1. Should we surface streaming availability badges now or add later?
2. Do we need co-op mode (two users voting on separate devices)?
3. Do we want to persist anonymous session IDs for analytics, or keep it stateless for launch?

---
This spec should guide the initial UX and UI exploration before we start coding. Next step: visual wireframes based on the flows above.
