# Scaffolding Decisions — Doc Conflicts Resolved

During Phase 1.1, FRONTEND.md and TECH-STACK.md disagreed on two points. The scaffold picked one option without asking. **You can override either** when you do UI polish.

---

## 1. Dark mode vs light mode

| Doc | Says |
|-----|------|
| **TECH-STACK.md** | “Light mode only (dark mode is future scope).” |
| **FRONTEND.md** | Design tokens (bg.primary, etc.) are dark (navy-950, navy-900). |

**What we did:** Implemented **dark theme** (navy background, gold accents, `className="dark"` on root). Rationale: FRONTEND tokens are all dark; dashboard wireframes assume dark surfaces.

**If you want light mode:** Change root layout to remove `dark`, and add a light palette in `globals.css` and use it for body/background. TECH-STACK can be treated as “default was light later”; we can switch when you’re ready.

---

## 2. Fonts: Inter + Noto Sans Arabic vs Cairo + Noto Kufi Arabic

| Doc | Says |
|-----|------|
| **TECH-STACK.md** | “Cairo (clean, modern) + Noto Kufi Arabic (traditional Kufic).” |
| **FRONTEND.md** | “Inter + Noto Sans Arabic” in typography tokens. |

**What we did:** Implemented **Inter + Noto Sans Arabic** (and loaded them in root layout). Rationale: FRONTEND design tokens section lists these; both support Arabic and are widely available.

**If you want Cairo + Noto Kufi:** Swap in `layout.tsx` to load Cairo and Noto Kufi Arabic from `next/font/google`, and update `globals.css` and `design-tokens.ts` font names. No other code change required.

---

## Summary

- **Dark mode:** In use; switch to light when you want.
- **Fonts:** Inter + Noto Sans Arabic in use; switch to Cairo + Noto Kufi if you prefer.

Neither choice blocks the build. We can document the final choice in PRD or TECH-STACK once you decide.
