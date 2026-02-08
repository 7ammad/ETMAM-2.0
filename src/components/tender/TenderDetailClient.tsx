"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Tender } from "@/types/database";
import type { Evaluation } from "@/types/database";
import { AnalysisPanel } from "@/components/analysis/AnalysisPanel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScoreBadge, Card, CardContent, Button } from "@/components/ui";
import { CostEstimateTab } from "@/components/tender/CostEstimateTab";
import { ExportTab } from "@/components/tender/ExportTab";
import { SpecCardsTab } from "@/components/tender/SpecCardsTab";
import { NominationsTab } from "@/components/tender/NominationsTab";
import { deleteTender } from "@/app/actions/tenders";
import { Trash2 } from "lucide-react";

interface TenderDetailClientProps {
  tenderId: string;
  tender: Tender;
  evaluation: Evaluation | null;
}

export function TenderDetailClient({
  tenderId,
  tender,
  evaluation,
}: TenderDetailClientProps) {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const navigateToTab = (tab: string) => setActiveTab(tab);

  async function handleDelete() {
    if (!confirm("هل أنت متأكد من حذف هذه المنافسة؟ سيتم حذف جميع البيانات المرتبطة بها.")) return;
    setDeleting(true);
    const result = await deleteTender(tenderId);
    if (result.success) {
      router.push("/tenders");
    } else {
      setError(result.error);
      setDeleting(false);
    }
  }

  const evaluationData =
    evaluation != null
      ? {
          overall_score: evaluation.overall_score,
          auto_recommendation: evaluation.auto_recommendation,
          criteria_scores: (evaluation.criteria_scores ?? {}) as Record<
            string,
            unknown
          >,
          updated_at: evaluation.updated_at,
        }
      : null;

  const deadlineDays = useMemo(() => {
    const deadline = new Date(tender.deadline);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    return Math.ceil((deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  }, [tender.deadline]);

  // Smart default tab based on workflow progress
  const hasLineItems = Array.isArray(tender.line_items) && (tender.line_items as unknown[]).length > 0;
  const isPdfWithBoq = tender.source_type === "pdf" && hasLineItems;

  const defaultTab = (() => {
    if (isPdfWithBoq && tender.spec_cards_status === "pending") return "spec-cards";
    if (tender.spec_cards_status === "ready" && tender.nominations_status === "pending") return "nominations";
    if (tender.nominations_status === "ready") return "cost-estimate";
    if (isPdfWithBoq && tender.status === "new") return "cost-estimate";
    return "overview";
  })();

  return (
    <div className="space-y-6" dir="rtl">
      <Tabs defaultValue={defaultTab} value={activeTab ?? undefined} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full inline-flex flex-wrap gap-1 sm:flex-nowrap">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="spec-cards">المواصفات</TabsTrigger>
          <TabsTrigger value="nominations">الترشيح</TabsTrigger>
          <TabsTrigger value="cost-estimate">التكاليف</TabsTrigger>
          <TabsTrigger value="evaluation">التقييم</TabsTrigger>
          <TabsTrigger value="export">التصدير</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-4">
                <h1 className="text-xl font-bold text-foreground">
                  {tender.tender_title}
                </h1>
                {tender.evaluation_score != null ? (
                  <ScoreBadge score={tender.evaluation_score} size="lg" showLabel />
                ) : (
                  <span className="text-sm text-muted-foreground">لم يتم التقييم</span>
                )}
              </div>
              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">الجهة</dt>
                  <dd className="font-medium text-foreground">{tender.entity}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">رقم المنافسة</dt>
                  <dd className="font-medium text-foreground">
                    {tender.tender_number}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">الموعد النهائي</dt>
                  <dd className="font-medium text-foreground">
                    {new Date(tender.deadline).toLocaleDateString("ar-SA")}
                    {deadlineDays < 0 ? (
                      <span className="mr-2 text-red-600 dark:text-red-400">(منتهي)</span>
                    ) : (
                      <span className="mr-2 text-muted-foreground">
                        ({deadlineDays} يوم متبقي)
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">القيمة التقديرية</dt>
                  <dd className="font-medium text-foreground" dir="ltr">
                    {tender.estimated_value != null
                      ? Number(tender.estimated_value).toLocaleString("ar-SA")
                      : "غير محدد"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">سعر العرض</dt>
                  <dd className="font-medium text-foreground" dir="ltr">
                    {tender.proposed_price != null
                      ? Number(tender.proposed_price).toLocaleString("ar-SA")
                      : "غير محدد"}
                  </dd>
                </div>
              </dl>
              {tender.description && (
                <div className="mt-4">
                  <dt className="text-muted-foreground">الوصف</dt>
                  <dd className="mt-1 text-foreground">{tender.description}</dd>
                </div>
              )}
              <div className="mt-6 pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  isLoading={deleting}
                  className="text-confidence-low hover:text-confidence-low hover:bg-confidence-low/10"
                >
                  <Trash2 className="h-4 w-4 ml-1" />
                  حذف المنافسة
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spec-cards">
          <SpecCardsTab tenderId={tenderId} tender={tender} onNavigateToNominations={() => navigateToTab("nominations")} />
        </TabsContent>

        <TabsContent value="nominations">
          <NominationsTab tenderId={tenderId} tender={tender} onNavigateToCosts={() => navigateToTab("cost-estimate")} />
        </TabsContent>

        <TabsContent value="cost-estimate">
          <CostEstimateTab tenderId={tenderId} tender={tender} />
        </TabsContent>

        <TabsContent value="evaluation">
          <AnalysisPanel
            tenderId={tenderId}
            evaluation={evaluationData}
            error={error}
            onError={setError}
          />
        </TabsContent>

        <TabsContent value="export">
          <ExportTab tenderId={tenderId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
