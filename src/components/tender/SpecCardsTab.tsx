"use client";

import { useEffect, useState, useCallback } from "react";
import type { Tender } from "@/types/database";
import type { SpecCard, SpecParameter } from "@/types/spec-cards";
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Spinner,
  Alert,
} from "@/components/ui";
import {
  buildSpecCards,
  listSpecCards,
  approveSpecCard,
  rejectSpecCard,
  approveAllSpecCards,
  deleteSpecCards,
} from "@/app/actions/spec-cards";
import {
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Hammer,
  CheckCheck,
  Trash2,
  RefreshCw,
  Pencil,
  ArrowLeft,
} from "lucide-react";

interface SpecCardsTabProps {
  tenderId: string;
  tender: Tender;
  onNavigateToNominations?: () => void;
}

function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const variant = pct >= 80 ? "success" : pct >= 50 ? "warning" : "danger";
  return (
    <Badge variant={variant} size="sm">
      {pct}%
    </Badge>
  );
}

function StatusBadgeLocal({ status }: { status: SpecCard["status"] }) {
  switch (status) {
    case "approved":
      return (
        <Badge variant="success" size="sm">
          معتمد
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="danger" size="sm">
          مرفوض
        </Badge>
      );
    default:
      return (
        <Badge variant="default" size="sm">
          مسودة
        </Badge>
      );
  }
}

function ParametersTable({ parameters }: { parameters: SpecParameter[] }) {
  if (parameters.length === 0) return null;
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="text-start p-2 font-medium text-foreground">المعامل</th>
            <th className="text-start p-2 font-medium text-foreground">القيمة</th>
            <th className="text-start p-2 font-medium text-foreground">الوحدة</th>
            <th className="text-center p-2 font-medium text-foreground">الزامي</th>
          </tr>
        </thead>
        <tbody>
          {parameters.map((param, idx) => (
            <tr key={idx} className="border-b border-border last:border-0">
              <td className="p-2 text-foreground">{param.name}</td>
              <td className="p-2 text-foreground ltr-nums">{param.value}</td>
              <td className="p-2 text-muted-foreground">{param.unit ?? "—"}</td>
              <td className="p-2 text-center">
                {param.is_mandatory ? (
                  <Check className="inline h-4 w-4 text-confidence-high" />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SpecCardsTab({ tenderId, tender, onNavigateToNominations }: SpecCardsTabProps) {
  const [specCards, setSpecCards] = useState<SpecCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const hasLineItems =
    Array.isArray(tender.line_items) && tender.line_items.length > 0;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listSpecCards(tenderId);
      if (result.success) {
        setSpecCards(result.cards);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ في تحميل المواصفات");
    } finally {
      setLoading(false);
    }
  }, [tenderId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleBuildSpecCards() {
    setGenerating(true);
    setError(null);
    try {
      const result = await buildSpecCards(tenderId);
      if (!result.success) {
        setError(result.error);
      } else {
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ في بناء المواصفات");
    } finally {
      setGenerating(false);
    }
  }

  async function handleApproveAll() {
    setActionLoading("approve-all");
    setError(null);
    try {
      const result = await approveAllSpecCards(tenderId);
      if (!result.success) {
        setError(result.error);
      } else {
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteAll() {
    setActionLoading("delete-all");
    setError(null);
    try {
      const result = await deleteSpecCards(tenderId);
      if (!result.success) {
        setError(result.error);
      } else {
        setSpecCards([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleApprove(id: string) {
    setActionLoading(id);
    setError(null);
    try {
      const result = await approveSpecCard(id);
      if (!result.success) {
        setError(result.error);
      } else {
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: string) {
    setActionLoading(id);
    setError(null);
    try {
      const result = await rejectSpecCard(id);
      if (!result.success) {
        setError(result.error);
      } else {
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setActionLoading(null);
    }
  }

  function toggleExpand(id: string) {
    setExpandedCardId((prev) => (prev === id ? null : id));
  }

  // --- Generating state ---
  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16" dir="rtl">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">جاري بناء المواصفات...</p>
      </div>
    );
  }

  // --- Loading state ---
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-16" dir="rtl">
        <Spinner size="md" />
        <p className="text-sm text-muted-foreground">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          بطاقات المواصفات الفنية
        </h2>
        {specCards.length > 0 && (
          <Badge variant="primary" size="md">
            {specCards.length}
          </Badge>
        )}
        <div className="flex-1" />
        <Button
          variant="primary"
          size="sm"
          onClick={handleBuildSpecCards}
          disabled={generating || !hasLineItems}
          isLoading={generating}
        >
          <Hammer className="h-4 w-4 ml-1" />
          بناء المواصفات
        </Button>
        {specCards.length > 0 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleApproveAll}
              disabled={actionLoading === "approve-all"}
              isLoading={actionLoading === "approve-all"}
            >
              <CheckCheck className="h-4 w-4 ml-1" />
              اعتماد الكل
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteAll}
              disabled={actionLoading === "delete-all"}
              isLoading={actionLoading === "delete-all"}
              className="text-confidence-low hover:text-confidence-low"
            >
              <Trash2 className="h-4 w-4 ml-1" />
              حذف واعادة
            </Button>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive" title="خطأ">
          <div className="flex items-center gap-2">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={handleBuildSpecCards}>
              <RefreshCw className="h-3 w-3 ml-1" />
              اعادة المحاولة
            </Button>
          </div>
        </Alert>
      )}

      {/* Empty state */}
      {specCards.length === 0 && !error && (
        <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
          {hasLineItems ? (
            <>
              <p className="text-sm text-foreground mb-2">
                تم استخراج {(tender.line_items as unknown[]).length} بند من جدول
                الكميات
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                ابن بطاقات المواصفات الفنية لكل بند ليتم ترشيح المنتجات المناسبة
                تلقائيا.
              </p>
              <Button
                variant="primary"
                onClick={handleBuildSpecCards}
                disabled={generating}
                isLoading={generating}
              >
                <Hammer className="h-4 w-4 ml-1" />
                بناء المواصفات
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              لا توجد بنود في جدول الكميات
            </p>
          )}
        </div>
      )}

      {/* Cards list */}
      {specCards.length > 0 && (
        <div className="space-y-3">
          {specCards.map((card) => {
            const isExpanded = expandedCardId === card.id;
            const borderColor =
              card.status === "approved"
                ? "border-r-4 border-r-confidence-high"
                : card.status === "rejected"
                  ? "border-r-4 border-r-confidence-low"
                  : "";

            return (
              <Card key={card.id} className={borderColor}>
                {/* Card header — always visible */}
                <CardHeader
                  className="cursor-pointer select-none"
                  onClick={() => toggleExpand(card.id)}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-navy-700 text-xs font-bold text-gold-400">
                      {card.boq_seq}
                    </span>
                    <span className="font-medium text-foreground flex-1 min-w-0 truncate">
                      {card.boq_description}
                    </span>
                    {card.category && (
                      <Badge variant="info" size="sm">
                        {card.category}
                      </Badge>
                    )}
                    <ConfidenceBadge score={card.ai_confidence} />
                    <StatusBadgeLocal status={card.status} />
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </div>
                </CardHeader>

                {/* Card content — expandable */}
                {isExpanded && (
                  <>
                    <CardContent className="space-y-4">
                      {/* Parameters */}
                      {card.parameters.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-2">
                            المعاملات الفنية
                          </h4>
                          <ParametersTable parameters={card.parameters} />
                        </div>
                      )}

                      {/* Standards */}
                      {card.referenced_standards.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-2">
                            المعايير المرجعية
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {card.referenced_standards.map((std, i) => (
                              <Badge key={i} variant="primary" size="sm">
                                {std}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Approved Brands */}
                      {card.approved_brands.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-2">
                            العلامات التجارية المعتمدة
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {card.approved_brands.map((brand, i) => (
                              <Badge key={i} variant="default" size="sm">
                                {brand}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Constraints */}
                      {card.constraints.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-2">
                            القيود
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
                            {card.constraints.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Notes */}
                      {card.notes && (
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-2">
                            ملاحظات
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {card.notes}
                          </p>
                        </div>
                      )}
                    </CardContent>

                    {/* Card footer */}
                    <CardFooter>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApprove(card.id)}
                        disabled={
                          actionLoading === card.id || card.status === "approved"
                        }
                        isLoading={actionLoading === card.id}
                      >
                        <Check className="h-4 w-4 ml-1" />
                        اعتماد
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(card.id)}
                        disabled={
                          actionLoading === card.id || card.status === "rejected"
                        }
                        className="text-confidence-low border-confidence-low/30 hover:bg-confidence-low/10"
                      >
                        <X className="h-4 w-4 ml-1" />
                        رفض
                      </Button>
                      <Button variant="ghost" size="sm" disabled>
                        <Pencil className="h-4 w-4 ml-1" />
                        تعديل
                      </Button>
                    </CardFooter>
                  </>
                )}
              </Card>
            );
          })}

          {/* Next step button */}
          {specCards.some((c) => c.status === "approved") && onNavigateToNominations && (
            <div className="flex justify-start pt-4">
              <Button
                variant="primary"
                size="md"
                onClick={onNavigateToNominations}
              >
                التالي: ترشيح المنتجات
                <ArrowLeft className="h-4 w-4 mr-1" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
