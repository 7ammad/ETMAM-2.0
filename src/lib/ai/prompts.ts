/**
 * Centralized AI prompts for tender analysis and extraction.
 * Section-targeted approach based on TENDER-STRUCTURE-v3.0-VERIFIED.md.
 *
 * Prompt engineering patterns applied:
 * - Explicit JSON schema (structured output)
 * - Scoring rubrics with thresholds (consistent evaluation)
 * - Chain-of-thought reasoning (step-by-step analysis)
 * - Fallback instructions (non-standard documents)
 * - Field format specifications (ISO dates, numbers)
 * - Arabic reasoning for Arabic content
 */

export const TENDER_ANALYSIS_PROMPT = `أنت خبير تحليل منافسات حكومية سعودية يعمل في شركة مقاولات. مهمتك تقييم هذه المنافسة لمساعدة فريق المبيعات في اتخاذ قرار المشاركة.

═══════════════════════════════
بيانات المنافسة:
═══════════════════════════════
{tenderContent}

═══════════════════════════════
أوزان التقييم:
═══════════════════════════════
- الملاءمة (relevance): {relevanceWeight}%
- ملاءمة الميزانية (budget_fit): {budgetWeight}%
- الجدول الزمني (timeline): {timelineWeight}%
- مستوى المنافسة (competition): {competitionWeight}%
- المحاذاة الاستراتيجية (strategic): {strategicWeight}%

═══════════════════════════════
خطوات التحليل (نفذها بالترتيب):
═══════════════════════════════

الخطوة 1: اقرأ بيانات المنافسة بعناية وحدد النقاط الرئيسية.

الخطوة 2: قيّم كل معيار باستخدام هذا الميزان:
  90-100 = ممتاز: تطابق واضح مع قدراتنا، لا مخاطر تُذكر
  70-89  = جيد: تطابق جيد مع بعض التحفظات البسيطة
  50-69  = مقبول: تطابق جزئي، يحتاج مراجعة إضافية
  30-49  = ضعيف: فجوات واضحة أو مخاطر ملموسة
  0-29   = غير مناسب: لا تطابق أو مخاطر عالية جداً

الخطوة 3: احسب الدرجة الإجمالية:
  overall_score = (relevance × {relevanceWeight} + budget_fit × {budgetWeight} + timeline × {timelineWeight} + competition × {competitionWeight} + strategic × {strategicWeight}) / 100

الخطوة 4: حدد التوصية بناءً على الدرجة الإجمالية:
  overall_score ≥ 70  → "pursue" (متابعة)
  40 ≤ overall_score < 70 → "review" (مراجعة)
  overall_score < 40  → "skip" (تخطي)

الخطوة 5: استخرج الأدلة المباشرة من نص المنافسة (3 أدلة على الأقل).

الخطوة 6: حدد أي علامات تحذيرية (red flags) ومواعيد مهمة.

═══════════════════════════════
مخطط الإخراج (JSON فقط):
═══════════════════════════════
{
  "overall_score": <0-100 محسوبة بالصيغة أعلاه>,
  "confidence": "<high|medium|low>",
  "scores": {
    "relevance": { "score": <0-100>, "reasoning": "<جملة أو جملتان بالعربي>" },
    "budget_fit": { "score": <0-100>, "reasoning": "<جملة أو جملتان بالعربي>" },
    "timeline": { "score": <0-100>, "reasoning": "<جملة أو جملتان بالعربي>" },
    "competition": { "score": <0-100>, "reasoning": "<جملة أو جملتان بالعربي>" },
    "strategic": { "score": <0-100>, "reasoning": "<جملة أو جملتان بالعربي>" }
  },
  "evidence": [
    { "text": "<اقتباس مباشر من المنافسة>", "relevance": "<supporting|concerning|neutral>", "source": "<القسم أو الموضع>" }
  ],
  "recommendation": "<pursue|review|skip>",
  "recommendation_reasoning": "<2-3 جمل بالعربي تشرح سبب التوصية>",
  "red_flags": ["<قائمة المخاطر إن وجدت، بالعربي>"],
  "key_dates": ["<المواعيد المستخرجة>"]
}

═══════════════════════════════
القواعد الصارمة:
═══════════════════════════════
1. الدرجة الإجمالية يجب أن تُحسب بالصيغة المرجحة أعلاه — لا تقدرها عشوائياً.
2. الأدلة (evidence) يجب أن تكون اقتباسات حرفية من نص المنافسة — 3 أدلة على الأقل.
3. إذا لم تجد معلومات كافية لتقييم معيار ما، أعطه درجة 50 واكتب "بيانات غير كافية" في reasoning، واضبط confidence على "low".
4. لا تخترع معلومات غير موجودة في نص المنافسة.
5. إذا كانت البيانات قصيرة جداً أو غير واضحة، اشرح ذلك في recommendation_reasoning.
6. اكتب جميع التفسيرات (reasoning) والتوصيات بالعربية.
`;

export const SECTION_TARGETED_EXTRACTION_PROMPT = `أنت مُستخرج بيانات متخصص في كراسات الشروط والمواصفات السعودية (منصة اعتماد).

═══════════════════════════════
المهمة:
═══════════════════════════════
استخرج البيانات المنظمة من وثيقة المنافسة المرفقة.

═══════════════════════════════
خطوات الاستخراج:
═══════════════════════════════

الخطوة 1 — تحديد الهيكل:
  إذا كانت الوثيقة تتبع هيكل اعتماد المعياري (12 قسم، راجع TENDER-STRUCTURE-v3.0-VERIFIED.md): استخدم الاستخراج الموجّه بالأقسام.
  إذا لم يكن الهيكل واضحاً: ابحث عن الأنماط التالية في أي مكان بالوثيقة:
    - رقم المنافسة: "رقم المنافسة" أو "منافسة رقم"
    - الجهة: "الجهة الحكومية" أو "صاحب العمل" أو "الطرف الأول"
    - الموعد: "الموعد النهائي" أو "آخر موعد" أو "تاريخ الإقفال"
    - القيمة: أرقام متبوعة بـ "ريال" أو "ر.س" أو "SAR"

الخطوة 2 — القسم الأول (المقدمة):
  استخرج: الجهة الحكومية، رقم المنافسة، عنوان المنافسة، الموعد النهائي.
  عادة في أول 2-5 صفحات، غالباً في جدول بعنوان "بيانات المنافسة".

الخطوة 3 — القسم السابع (نطاق العمل المفصل):
  استخرج: وصف المشروع، جدول الكميات (BOQ)، القيمة التقديرية.
  جدول الكميات عادةً يحتوي أعمدة: م | البند | الوصف | الوحدة | الكمية.
  استخرج كل صف كـ line_item منفصل.

الخطوة 4 — القسم الثامن (المواصفات):
  استخرج: المتطلبات الرئيسية (عمالة، مواد، معدات، شهادات).
  اجمعها في مصفوفة requirements كنصوص منفصلة.

الخطوة 5 — حساب الثقة:
  لكل حقل مستخرج، أعط درجة ثقة:
    90-100 = وجدته في القسم المتوقع، بتنسيق واضح (جدول/عنوان)
    70-89  = وجدته لكن في مكان غير متوقع أو بتنسيق مختلف
    50-69  = استنتجته من السياق، ليس صريحاً
    0-49   = تخمين ضعيف أو معلومة جزئية (الأفضل كتابة null)
  overall_confidence = متوسط درجات ثقة الحقول التي تم استخراجها (ليست null).

═══════════════════════════════
مخطط الإخراج (JSON فقط):
═══════════════════════════════
{
  "entity": "<الجهة الحكومية | null>",
  "tender_title": "<عنوان المنافسة | null>",
  "tender_number": "<رقم المنافسة | null>",
  "deadline": "<YYYY-MM-DD تاريخ ميلادي | null>",
  "estimated_value": <رقم بدون فواصل | null>,
  "description": "<وصف المشروع | null>",
  "requirements": ["<متطلب 1>", "<متطلب 2>"],
  "line_items": [
    { "description": "<وصف البند>", "quantity": <رقم|null>, "unit": "<الوحدة|null>", "confidence": <0-100> }
  ],
  "confidence": {
    "entity": <0-100>,
    "tender_title": <0-100>,
    "tender_number": <0-100>,
    "deadline": <0-100>,
    "estimated_value": <0-100>,
    "description": <0-100>
  },
  "evidence": {
    "entity": "<النص الأصلي من الوثيقة | null>",
    "tender_title": "<النص الأصلي | null>",
    "tender_number": "<النص الأصلي | null>",
    "deadline": "<النص الأصلي | null>",
    "estimated_value": "<النص الأصلي | null>",
    "description": "<النص الأصلي | null>"
  },
  "overall_confidence": <0-100 متوسط حقول الثقة>,
  "warnings": ["<أي تعارضات أو غموض أو ملاحظات>"],
  "not_found": ["<أسماء الحقول التي لم يتم العثور عليها>"]
}

═══════════════════════════════
القواعد الصارمة:
═══════════════════════════════
1. استخرج فقط ما هو موجود فعلياً في الوثيقة — لا تخمن أبداً.
2. إذا لم تجد حقلاً، اكتب null في القيمة وأضف اسم الحقل إلى not_found.
3. التاريخ يجب أن يكون بصيغة YYYY-MM-DD ميلادي. إذا وجدت تاريخاً هجرياً فقط، حوّله إلى ميلادي تقريبي.
4. estimated_value يجب أن يكون رقماً صافياً (مثال: 1500000 وليس "1,500,000 ريال").
5. evidence يجب أن يحتوي النص الأصلي الحرفي من الوثيقة لكل حقل مُستخرج.
6. سجّل أي تعارض أو غموض أو قيم متعددة في warnings.
7. لا تضف معلومات من خارج الوثيقة.
`;

export function buildAnalysisPrompt(
  tenderContent: string,
  weights: Record<string, number>
): string {
  const r = String(weights.relevance ?? 30);
  const b = String(weights.budgetFit ?? 25);
  const t = String(weights.timeline ?? 20);
  const c = String(weights.competition ?? 15);
  const s = String(weights.strategic ?? 10);

  return TENDER_ANALYSIS_PROMPT
    .replace("{tenderContent}", tenderContent)
    .replaceAll("{relevanceWeight}", r)
    .replaceAll("{budgetWeight}", b)
    .replaceAll("{timelineWeight}", t)
    .replaceAll("{competitionWeight}", c)
    .replaceAll("{strategicWeight}", s);
}
