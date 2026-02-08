"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import type { Tender } from "@/types/database";
import type { SpecCard, ProductNomination, ComplianceDetail } from "@/types/spec-cards";
import {
  Button,
  Badge,
  Card,
  CardContent,
  Spinner,
  Alert,
  Progress,
  Input,
  FormField,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogClose,
} from "@/components/ui";
import { listSpecCards } from "@/app/actions/spec-cards";
import {
  nominateProductsBatch,
  listNominationsByTender,
  selectNomination,
  selectAllBestNominations,
  addManualNomination,
  updateNomination,
  deleteNomination,
  applyNominationsToCostItems,
} from "@/app/actions/nominations";
import {
  Search,
  ArrowLeftRight,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Pencil,
  CheckCheck,
  ArrowLeft,
} from "lucide-react";

interface NominationsTabProps {
  tenderId: string;
  tender: Tender;
  onNavigateToCosts?: () => void;
}

function SourceBadge({ source }: { source: ProductNomination["source"] }) {
  switch (source) {
    case "rate_card":
      return (
        <Badge variant="success" size="sm">
          بطاقة اسعار
        </Badge>
      );
    case "web_search":
      return (
        <Badge variant="info" size="sm">
          بحث ويب
        </Badge>
      );
    default:
      return (
        <Badge variant="default" size="sm">
          يدوي
        </Badge>
      );
  }
}

function complianceVariant(score: number): "success" | "warning" | "danger" {
  if (score >= 80) return "success";
  if (score >= 50) return "warning";
  return "danger";
}

function rankBorderColor(rank: number): string {
  switch (rank) {
    case 1:
      return "border-r-4 border-r-gold-500";
    case 2:
      return "border-r-4 border-r-navy-400";
    case 3:
      return "border-r-4 border-r-navy-600";
    default:
      return "";
  }
}

function ComplianceTable({ details }: { details: ComplianceDetail[] }) {
  if (details.length === 0) return null;
  return (
    <div className="overflow-x-auto rounded-md border border-border mt-2">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="text-start p-2 font-medium text-foreground">المعامل</th>
            <th className="text-center p-2 font-medium text-foreground">مطابق</th>
            <th className="text-start p-2 font-medium text-foreground">ملاحظة</th>
          </tr>
        </thead>
        <tbody>
          {details.map((d, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              <td className="p-2 text-foreground">{d.parameter}</td>
              <td className="p-2 text-center">
                {d.meets_spec ? (
                  <CheckCircle2 className="inline h-4 w-4 text-confidence-high" />
                ) : (
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-confidence-low/20 text-confidence-low text-xs">
                    x
                  </span>
                )}
              </td>
              <td className="p-2 text-muted-foreground">{d.note || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function NominationsTab({ tenderId, tender, onNavigateToCosts }: NominationsTabProps) {
  const [nominations, setNominations] = useState<ProductNomination[]>([]);
  const [specCards, setSpecCards] = useState<SpecCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedNomId, setExpandedNomId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Manual dialog
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [manualDialogSpecCardId, setManualDialogSpecCardId] = useState<string | null>(null);
  const [manualForm, setManualForm] = useState({
    product_name: "",
    brand: "",
    model_sku: "",
    distributor: "",
    unit_price: "",
  });
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // Edit dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editNominationId, setEditNominationId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    product_name: "",
    brand: "",
    model_sku: "",
    distributor: "",
    unit_price: "",
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Select all
  const [selectingAll, setSelectingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cardsResult, nomsResult] = await Promise.all([
        listSpecCards(tenderId),
        listNominationsByTender(tenderId),
      ]);
      if (cardsResult.success) {
        setSpecCards(cardsResult.cards);
      } else {
        setError(cardsResult.error);
      }
      if (nomsResult.success) {
        setNominations(nomsResult.nominations);
      } else if (!cardsResult.success) {
        // Already showing error from cards
      } else {
        setError(nomsResult.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ في تحميل الترشيحات");
    } finally {
      setLoading(false);
    }
  }, [tenderId]);

  useEffect(() => {
    load();
  }, [load]);

  // Derived: group nominations by spec_card_id
  const grouped = useMemo(() => {
    const map = new Map<string, ProductNomination[]>();
    for (const nom of nominations) {
      const arr = map.get(nom.spec_card_id) ?? [];
      arr.push(nom);
      map.set(nom.spec_card_id, arr);
    }
    return map;
  }, [nominations]);

  // Derived: selected nominations
  const selectedNominations = useMemo(
    () => nominations.filter((n) => n.is_selected),
    [nominations]
  );

  const selectedCount = selectedNominations.length;
  const totalSpecCards = specCards.length;
  const hasApprovedCards = specCards.some((c) => c.status === "approved");

  // Derived: estimated total from selected nominations x boq quantity
  const estimatedTotal = useMemo(() => {
    let total = 0;
    for (const nom of selectedNominations) {
      if (nom.unit_price == null) continue;
      // Find the matching spec card to get boq_seq/quantity from line_items
      const card = specCards.find((c) => c.id === nom.spec_card_id);
      if (!card) continue;
      // Try to find quantity from line_items matching this boq_seq
      const lineItems = Array.isArray(tender.line_items)
        ? (tender.line_items as Array<{ quantity?: number; seq?: number }>)
        : [];
      const lineItem = lineItems.find((li) => li.seq === card.boq_seq);
      const qty = lineItem?.quantity ?? 1;
      total += nom.unit_price * qty;
    }
    return total;
  }, [selectedNominations, specCards, tender.line_items]);

  async function handleNominateBatch() {
    setGenerating(true);
    setError(null);
    try {
      const result = await nominateProductsBatch(tenderId);
      if (!result.success) {
        setError(result.error);
      } else {
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ في ترشيح المنتجات");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSelectNomination(nomId: string) {
    setActionLoading(nomId);
    setError(null);
    try {
      const result = await selectNomination(nomId);
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

  async function handleDeleteNomination(nomId: string) {
    setActionLoading(`del-${nomId}`);
    setError(null);
    try {
      const result = await deleteNomination(nomId);
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

  async function handleApplyToCosts() {
    setApplying(true);
    setError(null);
    try {
      const result = await applyNominationsToCostItems(tenderId);
      if (!result.success) {
        setError(result.error);
      } else {
        onNavigateToCosts?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ في تطبيق الترشيحات");
    } finally {
      setApplying(false);
    }
  }

  function openManualDialog(specCardId: string) {
    setManualDialogSpecCardId(specCardId);
    setManualForm({
      product_name: "",
      brand: "",
      model_sku: "",
      distributor: "",
      unit_price: "",
    });
    setShowManualDialog(true);
  }

  async function handleManualSubmit() {
    if (!manualDialogSpecCardId || !manualForm.product_name.trim()) return;
    setManualSubmitting(true);
    setError(null);
    try {
      const priceVal = manualForm.unit_price.trim()
        ? parseFloat(manualForm.unit_price.replace(/[,،]/g, ""))
        : undefined;
      const result = await addManualNomination({
        spec_card_id: manualDialogSpecCardId,
        tender_id: tenderId,
        product_name: manualForm.product_name.trim(),
        brand: manualForm.brand.trim() || undefined,
        model_sku: manualForm.model_sku.trim() || undefined,
        distributor: manualForm.distributor.trim() || undefined,
        unit_price: priceVal != null && !Number.isNaN(priceVal) ? priceVal : undefined,
      });
      if (!result.success) {
        setError(result.error);
      } else {
        setShowManualDialog(false);
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setManualSubmitting(false);
    }
  }

  function openEditDialog(nom: ProductNomination) {
    setEditNominationId(nom.id);
    setEditForm({
      product_name: nom.product_name ?? "",
      brand: nom.brand ?? "",
      model_sku: nom.model_sku ?? "",
      distributor: nom.distributor ?? "",
      unit_price: nom.unit_price != null ? String(nom.unit_price) : "",
    });
    setShowEditDialog(true);
  }

  async function handleEditSubmit() {
    if (!editNominationId || !editForm.product_name.trim()) return;
    setEditSubmitting(true);
    setError(null);
    try {
      const priceVal = editForm.unit_price.trim()
        ? parseFloat(editForm.unit_price.replace(/[,،]/g, ""))
        : undefined;
      const result = await updateNomination({
        id: editNominationId,
        product_name: editForm.product_name.trim(),
        brand: editForm.brand.trim() || undefined,
        model_sku: editForm.model_sku.trim() || undefined,
        distributor: editForm.distributor.trim() || undefined,
        unit_price: priceVal != null && !Number.isNaN(priceVal) ? priceVal : undefined,
      });
      if (!result.success) {
        setError(result.error);
      } else {
        setShowEditDialog(false);
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleSelectAll() {
    setSelectingAll(true);
    setError(null);
    try {
      const result = await selectAllBestNominations(tenderId);
      if (!result.success) {
        setError(result.error);
      } else {
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSelectingAll(false);
    }
  }

  // --- Generating state ---
  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16" dir="rtl">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">جاري البحث عن المنتجات...</p>
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

  // --- No approved spec cards ---
  if (!hasApprovedCards && specCards.length === 0) {
    return (
      <div className="space-y-4" dir="rtl">
        <Alert variant="warning" title="المواصفات مطلوبة">
          يجب بناء واعتماد المواصفات اولا قبل ترشيح المنتجات. انتقل الى تبويب
          &quot;المواصفات&quot; لبناء بطاقات المواصفات الفنية.
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-foreground">ترشيح المنتجات</h2>
        <Badge variant="primary" size="md">
          {selectedCount} / {totalSpecCards}
        </Badge>
        <div className="flex-1" />
        <Button
          variant="primary"
          size="sm"
          onClick={handleNominateBatch}
          disabled={generating || !hasApprovedCards}
          isLoading={generating}
        >
          <Search className="h-4 w-4 ml-1" />
          بحث وترشيح
        </Button>
        {nominations.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={selectingAll}
            isLoading={selectingAll}
          >
            <CheckCheck className="h-4 w-4 ml-1" />
            اختيار الكل
          </Button>
        )}
        {selectedCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleApplyToCosts}
            disabled={applying}
            isLoading={applying}
          >
            <ArrowLeftRight className="h-4 w-4 ml-1" />
            تطبيق على التكاليف
          </Button>
        )}
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive" title="خطأ" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* No approved cards warning */}
      {specCards.length > 0 && !hasApprovedCards && (
        <Alert variant="warning" title="لا توجد مواصفات معتمدة">
          يجب اعتماد بطاقات المواصفات اولا قبل ترشيح المنتجات.
        </Alert>
      )}

      {/* Nominations grouped by spec card */}
      {nominations.length === 0 && specCards.length > 0 && hasApprovedCards && (
        <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
          <p className="text-sm text-foreground mb-2">
            {specCards.filter((c) => c.status === "approved").length} بطاقة مواصفات
            معتمدة جاهزة للترشيح
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            ابحث عن منتجات مطابقة من بطاقات الاسعار والويب تلقائيا.
          </p>
          <Button
            variant="primary"
            onClick={handleNominateBatch}
            disabled={generating}
            isLoading={generating}
          >
            <Search className="h-4 w-4 ml-1" />
            بحث وترشيح
          </Button>
        </div>
      )}

      {specCards.map((card) => {
        const cardNoms = grouped.get(card.id) ?? [];
        if (cardNoms.length === 0 && card.status !== "approved") return null;

        return (
          <div key={card.id} className="space-y-2">
            {/* Group header */}
            <div className="flex items-center gap-2 border-b border-border pb-2">
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
            </div>

            {/* Nomination cards */}
            {cardNoms.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {cardNoms.map((nom) => {
                  const isExpanded = expandedNomId === nom.id;
                  const isSelected = nom.is_selected;

                  return (
                    <Card
                      key={nom.id}
                      className={`${rankBorderColor(nom.rank)} ${
                        isSelected
                          ? "bg-navy-800 border-gold-500/50 shadow-md"
                          : ""
                      }`}
                    >
                      <CardContent className="space-y-3">
                        {/* Product info */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground truncate">
                              {nom.product_name}
                            </p>
                            {nom.brand && (
                              <p className="text-sm text-muted-foreground">
                                {nom.brand}
                                {nom.model_sku && ` - ${nom.model_sku}`}
                              </p>
                            )}
                            {nom.distributor && (
                              <p className="text-xs text-muted-foreground">
                                {nom.distributor}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <SourceBadge source={nom.source} />
                            {isSelected && (
                              <CheckCircle2 className="h-5 w-5 text-gold-500" />
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        {nom.unit_price != null && (
                          <p className="text-sm text-foreground">
                            <span className="text-muted-foreground">السعر: </span>
                            <span className="font-medium ltr-nums" dir="ltr">
                              {Number(nom.unit_price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-muted-foreground mr-1">
                              {nom.currency ?? "SAR"}
                            </span>
                          </p>
                        )}

                        {/* Compliance bar */}
                        <Progress
                          value={nom.compliance_score}
                          max={100}
                          variant={complianceVariant(nom.compliance_score)}
                          size="sm"
                          showValue
                          label="المطابقة"
                        />

                        {/* Compliance details (expandable) */}
                        {nom.compliance_details?.length > 0 && (
                          <div>
                            <button
                              type="button"
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                              onClick={() =>
                                setExpandedNomId(isExpanded ? null : nom.id)
                              }
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                              تفاصيل المطابقة
                            </button>
                            {isExpanded && (
                              <ComplianceTable details={nom.compliance_details} />
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1 border-t border-border">
                          <Button
                            variant={isSelected ? "primary" : "outline"}
                            size="sm"
                            onClick={() => handleSelectNomination(nom.id)}
                            disabled={actionLoading === nom.id}
                            isLoading={actionLoading === nom.id}
                            className="flex-1"
                          >
                            {isSelected ? "تم الاختيار" : "اختيار"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEditDialog(nom)}
                            aria-label="تعديل"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDeleteNomination(nom.id)}
                            disabled={actionLoading === `del-${nom.id}`}
                            isLoading={actionLoading === `del-${nom.id}`}
                            aria-label="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-2">
                لا توجد ترشيحات لهذا البند بعد.
              </p>
            )}

            {/* Add manual button */}
            {card.status === "approved" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openManualDialog(card.id)}
              >
                <Plus className="h-4 w-4 ml-1" />
                اضافة يدوي
              </Button>
            )}
          </div>
        );
      })}

      {/* Summary footer */}
      {nominations.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4 sticky bottom-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-foreground">
                <span className="text-muted-foreground">تم اختيار: </span>
                <span className="font-semibold">
                  {selectedCount} من {totalSpecCards} بند
                </span>
              </p>
              {estimatedTotal > 0 && (
                <p className="text-sm text-foreground">
                  <span className="text-muted-foreground">
                    الاجمالي التقديري:{" "}
                  </span>
                  <span className="font-semibold ltr-nums" dir="ltr">
                    {estimatedTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-muted-foreground mr-1">SAR</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedCount > 0 && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleApplyToCosts}
                  disabled={applying}
                  isLoading={applying}
                >
                  <ArrowLeftRight className="h-4 w-4 ml-1" />
                  تطبيق على التكاليف
                </Button>
              )}
              {onNavigateToCosts && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={onNavigateToCosts}
                >
                  التالي: التكاليف
                  <ArrowLeft className="h-4 w-4 mr-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual nomination dialog */}
      <Dialog
        open={showManualDialog}
        onOpenChange={setShowManualDialog}
      >
        <DialogContent title="اضافة ترشيح يدوي" description="ادخل بيانات المنتج يدويا">
          <div className="space-y-4" dir="rtl">
            <FormField label="اسم المنتج" name="product_name" required>
              <Input
                id="product_name"
                value={manualForm.product_name}
                onChange={(e) =>
                  setManualForm((f) => ({ ...f, product_name: e.target.value }))
                }
                placeholder="اسم المنتج"
              />
            </FormField>
            <FormField label="العلامة التجارية" name="brand">
              <Input
                id="brand"
                value={manualForm.brand}
                onChange={(e) =>
                  setManualForm((f) => ({ ...f, brand: e.target.value }))
                }
                placeholder="اختياري"
              />
            </FormField>
            <FormField label="الموديل / SKU" name="model_sku">
              <Input
                id="model_sku"
                value={manualForm.model_sku}
                onChange={(e) =>
                  setManualForm((f) => ({ ...f, model_sku: e.target.value }))
                }
                placeholder="اختياري"
              />
            </FormField>
            <FormField label="الموزع" name="distributor">
              <Input
                id="distributor"
                value={manualForm.distributor}
                onChange={(e) =>
                  setManualForm((f) => ({ ...f, distributor: e.target.value }))
                }
                placeholder="اختياري"
              />
            </FormField>
            <FormField label="السعر" name="unit_price">
              <Input
                id="unit_price"
                type="text"
                inputMode="decimal"
                value={manualForm.unit_price}
                onChange={(e) =>
                  setManualForm((f) => ({ ...f, unit_price: e.target.value }))
                }
                placeholder="اختياري"
                className="ltr"
              />
            </FormField>
          </div>
          <DialogFooter>
            <DialogClose>
              <Button variant="ghost" size="sm">
                الغاء
              </Button>
            </DialogClose>
            <Button
              variant="primary"
              size="sm"
              onClick={handleManualSubmit}
              disabled={manualSubmitting || !manualForm.product_name.trim()}
              isLoading={manualSubmitting}
            >
              اضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit nomination dialog */}
      <Dialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      >
        <DialogContent title="تعديل الترشيح" description="تعديل بيانات المنتج">
          <div className="space-y-4" dir="rtl">
            <FormField label="اسم المنتج" name="edit_product_name" required>
              <Input
                id="edit_product_name"
                value={editForm.product_name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, product_name: e.target.value }))
                }
                placeholder="اسم المنتج"
              />
            </FormField>
            <FormField label="العلامة التجارية" name="edit_brand">
              <Input
                id="edit_brand"
                value={editForm.brand}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, brand: e.target.value }))
                }
                placeholder="اختياري"
              />
            </FormField>
            <FormField label="الموديل / SKU" name="edit_model_sku">
              <Input
                id="edit_model_sku"
                value={editForm.model_sku}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, model_sku: e.target.value }))
                }
                placeholder="اختياري"
              />
            </FormField>
            <FormField label="الموزع" name="edit_distributor">
              <Input
                id="edit_distributor"
                value={editForm.distributor}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, distributor: e.target.value }))
                }
                placeholder="اختياري"
              />
            </FormField>
            <FormField label="السعر" name="edit_unit_price">
              <Input
                id="edit_unit_price"
                type="text"
                inputMode="decimal"
                value={editForm.unit_price}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, unit_price: e.target.value }))
                }
                placeholder="اختياري"
                className="ltr"
              />
            </FormField>
          </div>
          <DialogFooter>
            <DialogClose>
              <Button variant="ghost" size="sm">
                الغاء
              </Button>
            </DialogClose>
            <Button
              variant="primary"
              size="sm"
              onClick={handleEditSubmit}
              disabled={editSubmitting || !editForm.product_name.trim()}
              isLoading={editSubmitting}
            >
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
