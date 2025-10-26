FEATURE ROADMAP — 5 High-Impact Enhancements

Goal: take Lucy's Match from a delightful single-player memory game to a polished, shareable, and replayable experience. Below are five features that together deliver visual polish, richer gameplay, and social hooks that top game designers would recommend.

1) Polished Animated Theme System (Visual Overhaul)
- Summary: Add selectable visual themes (day, night, confetti gala, underwater) that switch card backs/fronts, background, music, and particle effects. Include animated background layers (parallax/soft gradients) and a subtle scene-specific soundtrack.
- Why it matters: Strong, coherent visual themes increase perceived production value and player retention. Players love personalization and the surprise of an animated theme when they win.
- Key elements:
  - Theme JSON files describing colors, gradients, card-back image or SVG, background layers, confetti colors, and a short music loop.
  - CSS variables toggled per-theme + JS-driven parallax layers and canvas particle effects.
  - Small music loop (2–10s) using WebAudio API with a mute toggle.
- Implementation notes & tests:
  - Add ThemeManager to load/apply themes; show selector on start modal.
  - Tests: unit tests for ThemeManager loading and applying CSS vars; visual smoke tests that the correct CSS variables update; accessibility check for contrast.
- Effort: Medium (2–4 days).

2) Progression & Unlocks (Motivation Loop)
- Summary: Add player progression: XP for matches, levels, badges for streaks/perfect games, and unlockable themes/emoji packs.
- Why it matters: Progression hooks drive retention and give players reasons to replay.
- Key elements:
  - Local player profile stored in localStorage (or optional cloud save later).
  - Leveling curve, XP per match (bonus for streaks/fast match), badges UI on result modal.
  - Unlockable content and a Reward screen.
- Implementation notes & tests:
  - Add PlayerState module, unit tests for XP math, persistence tests for localStorage.
  - Add UI tests that completing a perfect game awards correct XP and unlocks.
- Effort: Medium (2–3 days).

3) Timed & Mode Variants + Combo System (Deeper Gameplay)
- Summary: Add new modes: Timed Mode (score by remaining seconds), Blitz (rapid small boards), and Combo Mode (matching multiple pairs quickly increases combo multiplier). Add daily challenges.
- Why it matters: Mode variety increases engagement and creates reasons for repeat plays; combo and timed scoring add depth for skilled players.
- Key elements:
  - Mode select on start modal with mode-specific rules and scoring.
  - Score/Timer HUD, combo visuals, and end-of-game score breakdown.
- Implementation notes & tests:
  - Modularize game loop rules so modes plug in and score calculators are testable.
  - Tests: unit tests for scoring formulas, integration test that timer reaches zero and ends game, DOM tests asserting HUD updates.
- Effort: Medium (3–5 days).

4) Local Multiplayer & Social Share (Make it Social)
- Summary: Add local-pass-and-play multiplayer for 2–4 players and a simple online leaderboard and share card (image + stats) for sharing on social networks.
- Why it matters: Social features convert single plays into social sessions and word-of-mouth growth.
- Key elements:
  - Pass-and-play turn system with player avatars and score tracking.
  - Leaderboard (initially local top scores; optional server later). Generate a shareable PNG snapshot using HTML2Canvas or Canvas to include board state, score, and stars.
  - A small “Invite” flow (copy link or share text) for mobile users.
- Implementation notes & tests:
  - Implement TurnManager for local multiplayer. Unit tests for turn rotation and scoring.
  - Tests: end-to-end test that two-player game tallies scores properly and winner is declared.
- Effort: Medium-high (4–7 days depending on server work).

5) Accessibility & Mobile Polish (Quality & Reach)
- Summary: Improve keyboard navigation, ARIA labels, screen-reader friendly result descriptions, larger touch targets, and optimize for low-end mobile. Add haptic feedback support for devices that expose it.
- Why it matters: Accessibility widens audience, reduces churn, and makes the game feel polished. Mobile touch/haptic polish greatly improves perceived quality.
- Key elements:
  - Proper focus management for modals, tabindex, ARIA roles for cards, and announcements (aria-live) for matches/results.
  - Responsive layout tweaks and larger hit targets for small screens.
  - Optional haptic feedback via the Vibration API on mobile (small, optional calls).
- Implementation notes & tests:
  - Accessibility tests: axe-core integration in test pipeline for automated a11y checks.
  - Mobile tests: manual testing on popular devices; unit tests for fallback behaviors.
- Effort: Small-medium (2–4 days).

Implementation priorities & phasing
- Sprint 1 (weeks 1–2): Visual Theme System (1) + Accessibility polish (5). This delivers immediate visual uplift and correctness.
- Sprint 2 (weeks 3–4): Progression & Unlocks (2) + Timed/Combo modes (3). Adds retention hooks and deeper gameplay.
- Sprint 3 (weeks 5–6): Local Multiplayer & Social Share (4) + server-led leaderboards (optional). Launch social features and measure uplift.

Testing & CI
- Keep tests small and focused. Add automation using GitHub Actions (example job): install, run lint (if added), then run jest tests including accessibility checks using axe.
- Add snapshot or visual regression testing (Percy or Playwright screenshots) for theme changes when adding visual polish.

Metrics to measure impact
- D1/D7 retention (players returning after day 1 and day 7) — expect increases after progression/themes.
- Average session length and plays per user — measure uplift once modes and progression land.
- Social shares and leaderboard entries.

Suggested next step (concrete)
- Implement ThemeManager and a single new theme (e.g., "Confetti Gala") as a proof-of-concept. Add tests ensuring CSS vars update and the theme selector persists.

If you want, I can:
- Create the initial ThemeManager skeleton and the Confetti Gala theme files now.
- Add a GitHub Actions workflow that runs the Jest tests and an accessibility check.

Pick one feature to start and I will scaffold it and add tests.