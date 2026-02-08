import "@/lib/pdf/dom-matrix-polyfill";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai/provider";
import { verifyExtraction } from "@/lib/ai/verification";
import { MAX_PDF_SIZE_MB } from "@/lib/constants";

const MAX_PDF_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "يجب تسجيل الدخول" },
      { status: 401 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "طلب غير صالح" },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: "لم يتم إرسال ملف PDF" },
      { status: 400 }
    );
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json(
      { success: false, error: "يجب أن يكون الملف بصيغة PDF" },
      { status: 400 }
    );
  }

  if (file.size > MAX_PDF_BYTES) {
    return NextResponse.json(
      {
        success: false,
        error: `حجم الملف يتجاوز الحد المسموح (${MAX_PDF_SIZE_MB} ميجابايت)`,
      },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    // PDF extraction requires vision/model that accepts PDF; use Gemini (Groq does not support PDF)
    const provider = await getAIProvider("gemini");
    const rawExtraction = await provider.extractFromPDF(buffer, file.name);

    // --- Guardrail: verify extraction sanity (confidence, dates, values) ---
    const { corrected: extraction, corrections } =
      verifyExtraction(rawExtraction);

    return NextResponse.json({
      success: true,
      extraction,
      corrections: corrections.length > 0 ? corrections : undefined,
      fileName: file.name,
    });
  } catch (err) {
    console.error("[extract/route] Extraction failed:", err);
    const message = err instanceof Error ? err.message : String(err);
    const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : undefined;
    return NextResponse.json(
      {
        success: false,
        error: message.includes("مفتاح")
          ? message
          : "فشل استخراج البيانات من الملف: " + message,
        errorCode: code,
      },
      { status: 500 }
    );
  }
}
