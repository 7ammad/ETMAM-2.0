# Cursor Prompts — Remaining Work

**Date:** February 7, 2026
**Author:** Claude Code (overseer)
**Status:** Prompts 1–6 done. Prompt 3 (Evaluation criteria), 4 (Visual polish), 5 (Landing), 6 (Build) implemented 2026-02-07. See CHANGELOG.md.

---

## Prompt 3 — Evaluation Criteria (Saudi IT/Telecom context)

Read docs/CHANGELOG.md (latest entry) and docs/CLAUDE-CODE-HANDOVER.md before changing code.

Update evaluation criteria to be meaningful for Saudi government tenders (IT/Telecom/Security). The current criteria are generic placeholders.

Changes:

1. src/lib/constants.ts — DEFAULT_SCORING_WEIGHTS: Replace with balanced weights:

relevance: 25 (was 30)
budgetFit: 25 (was 25 — keep)
timeline: 20 (keep)
competition: 15 (keep)
strategic: 15 (was 10)

Keep the same keys so existing evaluations do not break. Only weights change.

2. src/lib/ai/prompts.ts — In the Arabic analysis prompt, update each criterion description to be specific for Saudi government tenders:

- التوافق التقني (relevance): "هل متطلبات المنافسة تتوافق مع قدرات الشركة؟ هل لدينا الخبرة والشهادات والمنتجات المطلوبة؟ هل يمكننا تنفيذ نطاق العمل بالكامل؟"
- الملاءمة المالية (budgetFit): "إذا توفرت بيانات التكاليف، قيّم: هل هامش الربح معقول (10-25% جيد)؟ هل سعر العرض أقل من القيمة التقديرية؟ هل التكاليف المباشرة وغير المباشرة متوازنة؟ إذا لم تتوفر بيانات التكاليف، قيّم بناءً على القيمة التقديرية ومتطلبات المنافسة."
- الجدول الزمني (timeline): "هل الموعد النهائي للتقديم كافٍ لإعداد عرض متكامل؟ هل مدة التنفيذ المطلوبة واقعية بالنسبة لمواردنا الحالية؟ هل هناك تداخل مع مشاريع قائمة؟"
- مستوى المنافسة (competition): "كم عدد المنافسين المتوقع؟ هل المنافسة مفتوحة أو محدودة أو مستثناة؟ هل هناك متطلبات تأهيل تقلل المنافسة مثل تصنيف مقاولين أو شهادات محددة؟"
- القيمة الاستراتيجية (strategic): "هل المنافسة مع جهة حكومية استراتيجية (وزارة، هيئة كبرى)؟ هل ستفتح فرص مستقبلية وعقود تشغيلية؟ هل تعزز سمعة الشركة وسجل أعمالها؟"

3. src/components/analysis/ScoreBreakdown.tsx — Update display labels:

relevance: "التوافق التقني"
budgetFit: "الملاءمة المالية"
timeline: "الجدول الزمني"
competition: "مستوى المنافسة"
strategic: "القيمة الاستراتيجية"

4. src/components/settings/ScoringWeights.tsx — Update labels to match the same Arabic names.

Do NOT change the scoring formula, verification logic, or number of criteria. Same 5 keys, just better descriptions and balanced weights.

After changes: pnpm build must pass. Append entry to docs/CHANGELOG.md.

---

## Prompt 4 — Visual Polish (Phase 3.4)

Read docs/CHANGELOG.md (latest entry) and docs/CLAUDE-CODE-HANDOVER.md before changing code.

Phase 3.4 — Minimal visual polish for the 4 pages judges will see in the demo.

1. Dashboard (src/app/(dashboard)/dashboard/page.tsx):
   - Ensure StatsRow cards have consistent padding and the gold accent from design tokens
   - Empty state: if no tenders, show a centered card with text "ابدأ برفع أول منافسة" and an upload button linking to /tenders/upload
   - No other changes needed if it already looks clean

2. Tender List (src/app/(dashboard)/tenders/page.tsx):
   - Ensure table rows are clickable with a hover state
   - Score column should use ScoreBadge component from @/components/ui if not already
   - No other changes needed

3. Tender Detail (src/components/tender/TenderDetailClient.tsx):
   - Overview tab: show evaluation score badge (large, using ScoreBadge) if tender has evaluation_score, or text "لم يتم التقييم" if not
   - Show days remaining until deadline. Calculate from tender.deadline: if future show "X يوم متبقي", if past show "منتهي" in red
   - No other changes needed

4. Settings (src/components/settings/SettingsTabs.tsx):
   - Verify 3 main tabs show: بطاقات الأسعار | معايير التقييم | ربط Odoo/CRM
   - If there is a 4th "عام" tab, keep it but ensure the 3 main ones are listed first
   - No other changes needed

Use existing design system components (Button, Card, Badge, ScoreBadge, etc.) from @/components/ui. Do not create new components.

After changes: pnpm build must pass. Append entry to docs/CHANGELOG.md.

---

## Prompt 5 — Landing Page

Read docs/CHANGELOG.md (latest entry) before changing code.

Build or enhance the landing page at / (src/app/page.tsx or src/components/landing/LandingPage.tsx).

Keep it simple. One page, no animations, just content. Arabic RTL.

1. Hero section:
   - Large title: إتمام
   - Subtitle: من الملف إلى الفرصة في دقائق
   - Two buttons: "تسجيل الدخول" linking to /login, "إنشاء حساب" linking to /register

2. Problem section with 3 cards:
   - Card 1: البيانات متفرقة — إتمام يجمع بيانات المنافسات من ملفات Excel وكراسات الشروط PDF في مكان واحد
   - Card 2: التقييم يدوي — إتمام يقيّم المنافسات بالذكاء الاصطناعي ويعطي توصية فورية
   - Card 3: التكلفة تخمينية — إتمام يحسب التكاليف من بطاقات الأسعار الفعلية ويقارنها بالقيمة التقديرية

3. Pipeline visual (simple text-based flow, not a diagram):
   رفع الملف ← استخراج البيانات ← تقدير التكاليف ← التقييم ← التصدير إلى Odoo أو Excel

4. No footer with team names or competition references.

Use design system components from @/components/ui. If LandingPage.tsx already exists, enhance it. Do not create a new file unless needed.

Auth redirect: if user is logged in and visits /, redirect to /dashboard. Check if this already works in middleware (src/lib/supabase/middleware.ts).

After changes: pnpm build must pass. Append entry to docs/CHANGELOG.md.

---

## Prompt 6 — Build Passes and Final Check

Read docs/CHANGELOG.md (latest entry) before doing anything.

Run pnpm build and fix any errors. Then verify:

1. pnpm build completes with zero errors
2. No TypeScript type errors
3. No unused imports causing warnings

If build fails, fix the errors. Do not change functionality, only fix type/import/build issues.

After fixes: append entry to docs/CHANGELOG.md listing what was fixed. Update docs/CLAUDE-CODE-HANDOVER.md to mark Phase 3.4 and Landing as done.

---

## Execution Order

| # | Prompt | What it does | Depends on |
|---|--------|-------------|------------|
| 3 | Evaluation Criteria | Better labels and weights for Saudi tenders | Nothing |
| 4 | Visual Polish | Clean up the 4 demo pages | Nothing |
| 5 | Landing Page | Public page at / | Nothing |
| 6 | Build Check | Ensure everything compiles | After 3, 4, 5 |

Prompts 3, 4, and 5 can run in parallel if using multiple Cursor sessions. Prompt 6 runs last.

After all prompts: the app is ready for end-to-end testing with the real tender PDF at docs/tenders/251139011431.pdf.
