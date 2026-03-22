# Movie Claw – Low-Fidelity Wireframes

_Text-only wireframes to capture layout, hierarchy, and flows before visual design._

---

## 1. Landing / Intent Capture
```
+--------------------------------------------------------------------------------+
| Logo (🪵 Movie Claw)                                     [About] [Feedback]     |
|--------------------------------------------------------------------------------|
| "What kind of movie night is this?"                                              |
|                                                                                |
| [ Chips: Attention Level ]  Chill background   |  Ready to pay attention  |    |
|                              Need a comfort rewatch  |  Brain-melting twist    |
|                                                                                |
| [ Chips: Tone ]  Cozy / Heartwarming  |  Dark comedy  |  Stylish action         |
|                                                                                |
| [ Chips: Energy ]  Slow-burn  |  Mid  |  High-octane                            |
|                                                                                |
| Optional note (free text)                                                      |
| +----------------------------------------------------------------------------+ |
| |  e.g., "We might be folding laundry, keep it light"                        | |
| +----------------------------------------------------------------------------+ |
|                                                                                |
|                             [ Find my movie ➜ ]                                |
|--------------------------------------------------------------------------------|
| Tip: Pick a couple vibes or describe it in your own words.                     |
+--------------------------------------------------------------------------------+
```

Key interactions:
- Chips are multi-select; categories collapse/expand.
- CTA disabled until at least one chip or text is provided.

---

## 2. Pairwise Comparison Loop
```
+--------------------------------------------------------------------------------+
| Logo + tagline                         Progress: ●●●○○  (3 of 5 comparisons)   |
|--------------------------------------------------------------------------------|
| Summary pill: "Dialing up a Chill background + Cozy vibe"   [Edit vibes]       |
|--------------------------------------------------------------------------------|
|  CARD A (left)                                             CARD B (right)      |
|  +-----------------------------+         +-----------------------------+        |
|  |           Poster            |         |           Poster            |        |
|  +-----------------------------+         +-----------------------------+        |
|  Title (Year)  •  1h48m                    Title (Year)  •  2h05m              |
|  "Why you're seeing this" line             "Why you're seeing this" line      |
|  Tone badges: Cozy • Light mystery         Tone badges: Whimsical • Musical     |
|  [ Pick this one ]                         [ Pick this one ]                    |
|  [ More details ]                          [ More details ]                     |
|                                                                                |
|                                OR                                              |
|                                                                                |
|                         [ I already know what I want ]                          |
|--------------------------------------------------------------------------------|
| Toast area: "Noted: you’re leaning toward laid-back humor"                     |
| Session log (collapsed tab on right edge)                                      |
+--------------------------------------------------------------------------------+
```

Details:
- On mobile, cards stack vertically with the same content order.
- "More details" expands an overlay with synopsis, cast, ratings, trailer link.
- Session log drawer slides in from the right, listing past matchups and an Undo.

---

## 3. Decision Ready State
```
+--------------------------------------------------------------------------------+
| Progress: ●●●●●  "We think this is the one"                                    |
|--------------------------------------------------------------------------------|
|  Spotlight Card                                                               |
|  +-----------------------------+                                              |
|  |           Poster            |                                              |
|  +-----------------------------+                                              |
|  Tonight's pick: TITLE (Year)                                                  |
|  Runtime • Genre • Tone                                                        |
|  Why it fits: "Checks your Chill + Cozy vibes"                                 |
|                                                                                |
|  [ Watch trailer ]   [ Copy link ]   [ Lock it in 🎬 ]                          |
|--------------------------------------------------------------------------------|
|  Runners-up                                                                  |
|  1. Movie X  — short note                                                     |
|  2. Movie Y  — short note                                                     |
|  3. Movie Z  — short note                                                     |
|--------------------------------------------------------------------------------|
|  Confetti / subtle animation layer                                            |
|  [ Start over ]                                                               |
+--------------------------------------------------------------------------------+
```

Once the user taps “Lock it in,” the buttons collapse into a celebratory banner with the final choice and a reset CTA.

---

## 4. Empty / Error States
- **No results:** replace cards with illustration + message “We ran out of perfect matches. Try relaxing your vibe (e.g., uncheck ‘background-only’). [Reset vibes] [Broaden search].”
- **Network/API issue:** inline card skeletons plus toast “Couldn’t reach our movie elves. [Retry].”

---

These wireframes establish information hierarchy and flow so we can proceed to mid-fidelity visuals (colors, type, cozy aesthetic) next.
