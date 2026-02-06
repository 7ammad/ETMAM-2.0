/**
 * Centralized AI prompts for tender analysis and extraction.
 * Section-targeted approach based on TENDER-STRUCTURE.md.
 */

export const TENDER_ANALYSIS_PROMPT = `
You are an expert Saudi government tender analyst.

TASK: Analyze this tender and provide a structured evaluation.

INPUT TENDER:
{tenderContent}

SCORING WEIGHTS (user-configurable):
- Relevance: {relevanceWeight}%
- Budget Fit: {budgetWeight}%
- Timeline Feasibility: {timelineWeight}%
- Competition Level: {competitionWeight}%
- Strategic Alignment: {strategicWeight}%

OUTPUT FORMAT (JSON only, no markdown):
{
  "overall_score": <0-100>,
  "confidence": "<high|medium|low>",
  "scores": {
    "relevance": { "score": <0-100>, "reasoning": "<1-2 sentences>" },
    "budget_fit": { "score": <0-100>, "reasoning": "<1-2 sentences>" },
    "timeline": { "score": <0-100>, "reasoning": "<1-2 sentences>" },
    "competition": { "score": <0-100>, "reasoning": "<1-2 sentences>" },
    "strategic": { "score": <0-100>, "reasoning": "<1-2 sentences>" }
  },
  "evidence": [
    { "text": "<exact quote from tender>", "relevance": "<supporting|concerning|neutral>", "source": "<section reference>" }
  ],
  "recommendation": "<pursue|review|skip>",
  "recommendation_reasoning": "<2-3 sentences>",
  "red_flags": ["<list of concerns if any>"],
  "key_dates": ["<extracted deadlines>"]
}

RULES:
- Score MUST reflect the weighted criteria above
- Evidence MUST be direct quotes from the tender text
- If you cannot find evidence for a score, set confidence to "low"
- Do NOT invent information not present in the tender
- If tender is too short or unclear, say so in recommendation_reasoning
`;

export const SECTION_TARGETED_EXTRACTION_PROMPT = `
أنت مساعد متخصص في تحليل كراسات الشروط والمواصفات السعودية.
الوثيقة تتبع الهيكل المعياري لمنصة اعتماد (11 قسم).

المطلوب:
1. حدد القسم الأول (المقدمة) واستخرج:
   - الجهة الحكومية
   - رقم المنافسة
   - عنوان المنافسة
   - الموعد النهائي لتقديم العروض

2. حدد القسم السابع (نطاق العمل) واستخرج:
   - وصف المشروع
   - جدول الكميات (كل بند مع الوصف والكمية والوحدة)
   - القيمة التقديرية (إن وجدت)

3. حدد القسم الثامن (المواصفات) واستخرج:
   - متطلبات العمالة الرئيسية
   - المواد والمعدات الأساسية

القواعد الصارمة:
1. استخرج فقط المعلومات الموجودة فعلياً في الوثيقة
2. إذا لم تجد المعلومة، اكتب null — لا تخمن أبداً
3. اذكر النص الأصلي كدليل لكل حقل
4. أعط درجة ثقة (0-100) لكل حقل
5. اذكر رقم الصفحة التي وجدت فيها المعلومة
6. إذا كان هناك تعارض أو غموض، سجله في التحذيرات
7. لا تضف معلومات من خارج الوثيقة

أجب بـ JSON فقط، بدون أي نص إضافي.
`;

export function buildAnalysisPrompt(
  tenderContent: string,
  weights: Record<string, number>
): string {
  return TENDER_ANALYSIS_PROMPT
    .replace("{tenderContent}", tenderContent)
    .replace("{relevanceWeight}", String(weights.relevance ?? 30))
    .replace("{budgetWeight}", String(weights.budgetFit ?? 25))
    .replace("{timelineWeight}", String(weights.timeline ?? 20))
    .replace("{competitionWeight}", String(weights.competition ?? 15))
    .replace("{strategicWeight}", String(weights.strategic ?? 10));
}
