export type Lang = "ar" | "en";

const dict = {
  // ── Brand ──
  brand: { ar: "إتمام", en: "Etmam" },
  brandSub: {
    ar: "نظام إدارة المنافسات",
    en: "Tender Management System",
  },

  // ── Navigation ──
  dashboard: { ar: "لوحة التحكم", en: "Dashboard" },
  tenders: { ar: "المنافسات", en: "Tenders" },
  settings: { ar: "الإعدادات", en: "Settings" },

  // ── Header ──
  logout: { ar: "تسجيل الخروج", en: "Sign out" },
  user: { ar: "مستخدم", en: "User" },

  // ── Dashboard stats ──
  totalTenders: { ar: "إجمالي المنافسات", en: "Total Tenders" },
  analyzed: { ar: "مقيّمة", en: "Analyzed" },
  avgScore: { ar: "متوسط التقييم", en: "Avg. Score" },
  pushedToCrm: { ar: "مرسلة إلى CRM", en: "Pushed to CRM" },

  // ── Dashboard sections ──
  recentTenders: { ar: "آخر المنافسات", en: "Recent Tenders" },
  viewAll: { ar: "عرض الكل", en: "View all" },
  exportToOdoo: { ar: "التصدير إلى Odoo", en: "Export to Odoo" },
  viewTenders: { ar: "عرض المنافسات", en: "View tenders" },
  scoreDistribution: { ar: "توزيع التقييم", en: "Score Distribution" },
  noTendersYet: { ar: "لا توجد منافسات بعد", en: "No tenders yet" },
  noPushYet: {
    ar: "لم يُرسل أي منافسات إلى Odoo بعد.",
    en: "No tenders pushed to Odoo yet.",
  },
  pushedCount: {
    ar: (n: number) => `تم إرسال ${n} منافسة إلى Odoo.`,
    en: (n: number) => `${n} tender(s) pushed to Odoo.`,
  },
  exportBulkHint: {
    ar: "للتصدير الجماعي أو الفردي، توجه إلى",
    en: "For bulk or individual export, go to",
  },
  tendersList: { ar: "قائمة المنافسات", en: "Tenders list" },

  // ── Empty state ──
  emptyTitle: { ar: "ابدأ برفع أول منافسة", en: "Upload your first tender" },
  emptyDesc: {
    ar: "ارفع ملف Excel أو CSV أو PDF لاستخراج البيانات والتقييم.",
    en: "Upload an Excel, CSV, or PDF file to extract data and evaluate.",
  },
  uploadNew: { ar: "رفع منافسة جديدة", en: "Upload new tender" },

  // ── Auth ──
  loginRequired: { ar: "يجب تسجيل الدخول.", en: "Login required." },
  loginTitle: { ar: "تسجيل الدخول — إتمام", en: "Sign in — Etmam" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  password: { ar: "كلمة المرور", en: "Password" },
  loginBtn: { ar: "تسجيل الدخول", en: "Sign in" },
  loggingIn: { ar: "جارٍ تسجيل الدخول...", en: "Signing in..." },
  noAccount: { ar: "ليس لديك حساب؟", en: "Don't have an account?" },
  createAccount: { ar: "إنشاء حساب", en: "Create account" },

  // ── Status labels ──
  statusNew: { ar: "جديدة", en: "New" },
  statusEvaluated: { ar: "مقيّمة", en: "Evaluated" },
  statusCosted: { ar: "مُكلّفة", en: "Costed" },
  statusExported: { ar: "مُصدّرة", en: "Exported" },

  // ── Greeting ──
  greeting: {
    ar: (name: string) => `مرحباً، ${name}`,
    en: (name: string) => `Welcome, ${name}`,
  },

  // ── Tenders list ──
  noTenders: { ar: "لا توجد منافسات", en: "No tenders" },
  noTendersDesc: {
    ar: "ابدأ برفع ملف CSV أو Excel أو PDF يحتوي على بيانات المنافسات",
    en: "Start by uploading a CSV, Excel, or PDF file with tender data",
  },
  uploadTenders: { ar: "رفع منافسات", en: "Upload tenders" },
  entity: { ar: "الجهة", en: "Entity" },
  tenderTitle: { ar: "عنوان المنافسة", en: "Tender Title" },
  tenderNumber: { ar: "رقم المنافسة", en: "Tender Number" },
  deadline: { ar: "الموعد النهائي", en: "Deadline" },
  estimatedValue: { ar: "القيمة التقديرية", en: "Estimated Value" },
  evaluation: { ar: "التقييم", en: "Evaluation" },
  status: { ar: "الحالة", en: "Status" },

  // ── Settings tabs ──
  rateCards: { ar: "بطاقات الأسعار", en: "Rate Cards" },
  evalCriteria: { ar: "معايير التقييم", en: "Evaluation Criteria" },
  odooCrm: { ar: "ربط Odoo/CRM", en: "Odoo/CRM" },
  aiProvider: { ar: "مزود الذكاء الاصطناعي", en: "AI Provider" },

  // ── Evaluation modes ──
  evalModeAi: { ar: "تقييم بالذكاء الاصطناعي", en: "AI Evaluation" },
  evalModeConfigurable: { ar: "تقييم قابل للتعديل", en: "Configurable Evaluation" },
  evalModeLabel: { ar: "نمط التقييم", en: "Evaluation Mode" },
  profileSelector: { ar: "ملف التقييم", en: "Evaluation Profile" },
  saveProfile: { ar: "حفظ", en: "Save" },
  deleteProfile: { ar: "حذف", en: "Delete" },
  newProfile: { ar: "ملف جديد", en: "New Profile" },
  weightSum: { ar: "مجموع الأوزان", en: "Weight Sum" },
  enabled: { ar: "مفعّل", en: "Enabled" },
  weight: { ar: "الوزن", en: "Weight" },
  runEvaluation: { ar: "تشغيل التقييم", en: "Run Evaluation" },
  evaluating: { ar: "جارٍ التقييم...", en: "Evaluating..." },
  decisionGo: { ar: "المضي قدماً", en: "GO" },
  decisionMaybe: { ar: "مراجعة", en: "MAYBE" },
  decisionSkip: { ar: "تخطي", en: "SKIP" },
  factors: { ar: "عوامل التقييم", en: "Evaluation Factors" },
  autoFilled: { ar: "معبأ تلقائياً", en: "Auto-filled" },
  score: { ar: "الدرجة", en: "Score" },
  reasoning: { ar: "التعليل", en: "Reasoning" },

  // ── Landing page ──
  heroTagline: { ar: "من الملف إلى الفرصة في دقائق", en: "From file to opportunity in minutes" },
  whyEtmam: { ar: "لماذا إتمام؟", en: "Why Etmam?" },
  getStarted: { ar: "ابدأ الآن", en: "Get Started" },
  pipelineSteps: { ar: "سير العمل", en: "Pipeline" },
  featTitle1: { ar: "استخراج ذكي", en: "Smart Extraction" },
  featDesc1: { ar: "استخراج بيانات المنافسات من ملفات PDF و Excel و CSV بالذكاء الاصطناعي", en: "AI-powered data extraction from PDF, Excel, and CSV files" },
  featTitle2: { ar: "تقييم فوري", en: "Instant Evaluation" },
  featDesc2: { ar: "تقييم تلقائي بـ5 معايير مع توصية وأدلة من نص المنافسة", en: "Automatic evaluation with 5 criteria, recommendations and evidence" },
  featTitle3: { ar: "تصدير للـCRM", en: "CRM Export" },
  featDesc3: { ar: "تصدير مباشر إلى Odoo أو تحميل ملف Excel جاهز", en: "Direct Odoo export or ready-to-use Excel download" },
} as const;

export type TransKey = keyof typeof dict;

/**
 * Get a translated string. For simple strings returns string.
 * For function entries (with interpolation), returns the function.
 */
export function t(key: TransKey, lang: Lang): string | ((...args: unknown[]) => string) {
  const entry = dict[key];
  if (!entry) return key;
  return entry[lang] as string | ((...args: unknown[]) => string);
}

/** Simple string-only translation helper */
export function ts(key: TransKey, lang: Lang): string {
  const val = t(key, lang);
  return typeof val === "string" ? val : key;
}
