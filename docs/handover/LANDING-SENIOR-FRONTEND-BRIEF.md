# Handover: Senior Frontend — Landing Page Implementation

**From:** Gotcha (logic/code verified) + Creative Director (visual/UX direction)  
**To:** Senior Frontend  
**Code:** `src/components/landing/LandingPage.tsx`, `src/app/globals.css`, `src/components/ui/*`

---

## Your mission

Implement the **creative direction** for the landing page: **modern, high-tech** look with **geometry and sharp edges**, plus **targeted animation**. Avoid generic “AI slob” aesthetics. Keep **RTL/Arabic** and **navy + gold** as the base.

---

## Inputs

1. **Gotcha report:** `docs/reviews/LANDING-GOTCHA-REPORT.md`  
   - Logic and structure are verified; no factual changes required.  
   - Your work is visual and motion only.

2. **Creative Director brief:** `docs/handover/LANDING-CREATIVE-DIRECTOR-BRIEF.md`  
   - Use their direction for: visual rules, shape language, section layout, component treatment, animation principles.  
   - If the creative doc is not yet written, use the brief’s “What we need” list as the checklist and apply: geometry/sharp edges, no generic AI look, purposeful animation.

---

## Implementation checklist

- [ ] **Shape language**  
  Introduce sharp/geometric treatment (e.g. `rounded-none` or custom clip paths for key panels, icon wrappers, or cards) where creative direction specifies. Keep changes consistent across sections.

- [ ] **Section layout**  
  Adjust spacing, max-widths, and section backgrounds/dividers per creative direction (hero, problem, solution, features, tech, CTA). Preserve semantic structure (header, main, footer, aria labels).

- [ ] **Cards & icon containers**  
  Replace default “rounded box” look where directed (e.g. angled corners, hexagon-style icon frames, or bordered panels). Ensure design system components (Card, etc.) are reused with new classes or variants rather than replaced ad hoc.

- [ ] **Animation**  
  Add only the motions specified by creative direction (e.g. hero entrance, step/feature stagger, CTA emphasis). Prefer CSS/Tailwind (e.g. `animate-*`, `transition-*`) or small JS if needed. Keep animations short and purposeful.

- [ ] **Palette and RTL**  
  Do not change base navy/gold tokens unless creative direction explicitly asks. All new UI must support RTL (no hardcoded left/right that breaks in RTL).

- [ ] **Accessibility**  
  Preserve existing a11y: decorative icons with `aria-hidden`, `<main id="main-content">`, header/footer `aria-label`, and section `aria-labelledby` where applicable. Ensure any new motion respects `prefers-reduced-motion` (e.g. disable or simplify animations when requested).

- [ ] **Build and lint**  
  Run `pnpm build` and fix any type/lint errors. Test at least: unauthenticated `/` (landing), authenticated redirect to `/dashboard`, and Login/Register links.

---

## Files to touch (typical)

- `src/components/landing/LandingPage.tsx` — layout, sections, class names, optional animation wrappers.
- `src/app/globals.css` — only if new tokens or keyframes are agreed (e.g. for shared animation or geometric utilities).
- `src/components/ui/*` — only if adding new variants (e.g. “sharp” card variant) or small tweaks for landing-specific use.

---

## Definition of done

- Landing page reflects creative direction (high-tech, geometry, sharp edges, no generic AI look).
- Animation is applied only where specified and respects reduced motion.
- RTL and navy+gold preserved; a11y and routing logic unchanged.
- Build passes; senior-frontend sign-off on implementation.
