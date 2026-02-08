"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select } from "@/components/ui";
import type { Tender } from "@/types/database";
import type { CostItem, CostItemSource } from "@/types/database";
import {
  listCostItems,
  createCostItem,
  updateCostItem,
  deleteCostItem,
  updateTenderBidPrice,
  matchCostItems,
  seedCostItemsFromLineItems,
} from "@/app/actions/costs";
import { Plus, Trash2, Search, FileDown } from "lucide-react";

const DEFAULT_PROFIT_MARGIN_PERCENT = 15;

/** Format number with Western numerals + comma separators (never Arabic-Indic ٠١٢) */
function fmtNum(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface CostEstimateTabProps {
  tenderId: string;
  tender: Tender;
}

function SourceBadge({ source, sourceNotes }: { source: CostItemSource; sourceNotes?: string | null }) {
  if (source === "rate_card") {
    return (
      <span className="inline-flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-green-600/20 px-2 py-0.5 text-xs font-medium text-green-800 dark:text-green-200">
          🏷️ بطاقة أسعار
        </span>
        {sourceNotes && (
          <span className="text-xs text-muted-foreground">{sourceNotes}</span>
        )}
      </span>
    );
  }
  if (source === "ai_suggested") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/20 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-200">
        🤖 ذكاء اصطناعي
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/20 px-2 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300">
      ✋ يدوي
    </span>
  );
}

export function CostEstimateTab({ tenderId, tender }: CostEstimateTabProps) {
  const router = useRouter();
  const [items, setItems] = useState<CostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidPrice, setBidPrice] = useState<string>(
    tender.proposed_price != null ? String(tender.proposed_price) : ""
  );
  const [profitMarginPercent, setProfitMarginPercent] = useState(DEFAULT_PROFIT_MARGIN_PERCENT);
  const [savingBid, setSavingBid] = useState(false);
  const [adding, setAdding] = useState(false);
  const [matching, setMatching] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<Partial<CostItem>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const hasLineItems = Array.isArray(tender.line_items) && tender.line_items.length > 0;

  async function load() {
    setLoading(true);
    setError(null);
    const result = await listCostItems(tenderId);
    setLoading(false);
    if (result.success) setItems(result.items);
    else setError(result.error);
  }

  useEffect(() => {
    load();
  }, [tenderId]);

  const { directSum, indirectSum, subtotal, profitAmount, finalBidFromCalc } = useMemo(() => {
    const direct = items
      .filter((i) => i.category === "direct")
      .reduce((s, i) => s + Number(i.total), 0);
    const indirect = items
      .filter((i) => i.category === "indirect")
      .reduce((s, i) => s + Number(i.total), 0);
    const sub = direct + indirect;
    const margin = Math.max(0, Math.min(100, profitMarginPercent));
    const profit = sub * (margin / 100);
    const finalBid = sub + profit;
    return {
      directSum: direct,
      indirectSum: indirect,
      subtotal: sub,
      profitAmount: profit,
      finalBidFromCalc: finalBid,
    };
  }, [items, profitMarginPercent]);

  const estimatedValue = tender.estimated_value != null ? Number(tender.estimated_value) : null;
  const bidPriceNum = (() => {
    const v = bidPrice.trim() === "" ? null : parseFloat(bidPrice.replace(/[,،]/g, ""));
    return v != null && !Number.isNaN(v) && v >= 0 ? v : null;
  })();
  const diffAmount =
    estimatedValue != null && bidPriceNum != null ? estimatedValue - bidPriceNum : null;
  const diffPercent =
    estimatedValue != null && bidPriceNum != null && estimatedValue > 0
      ? ((estimatedValue - bidPriceNum) / estimatedValue) * 100
      : null;

  useEffect(() => {
    if (items.length > 0 && finalBidFromCalc > 0) {
      setBidPrice(String(Math.round(finalBidFromCalc * 100) / 100));
    }
  }, [finalBidFromCalc, items.length]);

  async function handleAddRow() {
    setAdding(true);
    setError(null);
    const result = await createCostItem(tenderId, {
      description: "بند جديد",
      quantity: 1,
      unit: "وحدة",
      unit_price: 0,
      source: "manual",
    });
    setAdding(false);
    if (result.success) load();
    else setError(result.error);
  }

  function startEdit(item: CostItem) {
    setEditingId(item.id);
    setEditRow({
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      category: item.category,
    });
  }

  async function saveEdit() {
    if (!editingId) return;
    setError(null);
    const result = await updateCostItem(editingId, editRow);
    if (result.success) {
      setEditingId(null);
      setEditRow({});
      load();
    } else setError(result.error);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditRow({});
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);
    const result = await deleteCostItem(id);
    setDeletingId(null);
    if (result.success) load();
    else setError(result.error);
  }

  async function handleSaveBidPrice() {
    const val = bidPrice.trim() === "" ? null : parseFloat(bidPrice.replace(/[,،]/g, ""));
    if (val !== null && (Number.isNaN(val) || val < 0)) {
      setError("أدخل رقماً صالحاً لسعر العرض");
      return;
    }
    setSavingBid(true);
    setError(null);
    setSaveSuccess(null);
    const result = await updateTenderBidPrice(tenderId, val);
    setSavingBid(false);
    if (!result.success) {
      setError(result.error);
    } else {
      setSaveSuccess("تم حفظ سعر العرض بنجاح ✓");
      // Delay router.refresh() to let user see the success message
      setTimeout(() => {
        setSaveSuccess(null);
        router.refresh();
      }, 3000);
    }
  }

  const [matchInfo, setMatchInfo] = useState<string | null>(null);

  async function handleMatchFromRateCards() {
    if (items.length === 0) {
      setError("أضف بنوداً أولاً ثم استخدم المطابقة");
      return;
    }
    setMatching(true);
    setError(null);
    setMatchInfo(null);
    const toMatch = items.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      unit: i.unit,
    }));
    const result = await matchCostItems(tenderId, toMatch);
    setMatching(false);
    if (!result.success) {
      setError(result.error);
      return;
    }

    const matchedCount = result.matches.filter((m) => m.matched).length;
    const total = result.matches.length;
    const rciCount = result.rateCardItemCount;

    if (rciCount === 0) {
      setMatchInfo(`لا توجد بطاقات أسعار مرفوعة. ارفع بطاقة أسعار CSV من صفحة الإعدادات أولاً.`);
      return;
    }

    if (matchedCount === 0) {
      setMatchInfo(`لم يتم العثور على تطابق لأي بند من ${total} بنود (تم البحث في ${rciCount} عنصر من بطاقات الأسعار). أوصاف البنود قد تختلف عن أسماء عناصر بطاقة الأسعار.`);
      return;
    }

    let updated = 0;
    for (let i = 0; i < result.matches.length; i++) {
      const m = result.matches[i];
      if (m.matched && m.suggested_price != null && m.rate_card_item && items[i]) {
        await updateCostItem(items[i].id, {
          unit_price: m.suggested_price,
          unit: m.rate_card_item?.unit ?? items[i].unit,
          source: "rate_card",
          rate_card_item_id: m.rate_card_item.id,
          source_notes: m.rate_card_item.rate_card_name
            ? `من بطاقة: ${m.rate_card_item.rate_card_name}`
            : null,
        });
        updated++;
      }
    }

    setMatchInfo(`تم تسعير ${updated} من ${total} بنود من بطاقات الأسعار.`);
    load();
  }

  async function handleSeedFromLineItems() {
    setSeeding(true);
    setError(null);
    const result = await seedCostItemsFromLineItems(tenderId);
    setSeeding(false);
    if (result.success) {
      load();
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      {error && (
        <div className="rounded-md border border-red-600/50 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200" role="alert">
          {error}
        </div>
      )}
      {saveSuccess && (
        <div className="rounded-md border border-green-600/50 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-200 flex items-center justify-between">
          <span>{saveSuccess}</span>
          <button type="button" onClick={() => setSaveSuccess(null)} className="text-green-400 hover:text-green-200 mr-2">✕</button>
        </div>
      )}
      {matchInfo && (
        <div className="rounded-md border border-blue-600/50 bg-blue-500/10 px-3 py-2 text-sm text-blue-700 dark:text-blue-200 flex items-center justify-between">
          <span>{matchInfo}</span>
          <button type="button" onClick={() => setMatchInfo(null)} className="text-blue-400 hover:text-blue-200 mr-2">✕</button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleAddRow} disabled={adding} size="sm">
          <Plus className="h-4 w-4 ml-1" />
          إضافة بند
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleMatchFromRateCards}
          disabled={matching || items.length === 0}
          isLoading={matching}
        >
          <Search className="h-4 w-4 ml-1" />
          مطابقة من بطاقات الأسعار
        </Button>
        {hasLineItems && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeedFromLineItems}
            disabled={seeding}
            isLoading={seeding}
          >
            <FileDown className="h-4 w-4 ml-1" />
            استيراد بنود PDF
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">جاري التحميل...</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
          {hasLineItems ? (
            <>
              <p className="text-sm text-foreground mb-2">
                تم استخراج {(tender.line_items as unknown[]).length} بند من ملف PDF
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                استورد البنود المستخرجة كبنود تكلفة ثم طابقها مع بطاقات الأسعار لتسعيرها تلقائيًا.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button onClick={handleSeedFromLineItems} disabled={seeding} isLoading={seeding}>
                  <FileDown className="h-4 w-4 ml-1" />
                  استيراد البنود المستخرجة
                </Button>
                <Button variant="outline" onClick={handleAddRow} disabled={adding}>
                  <Plus className="h-4 w-4 ml-1" />
                  إضافة بند يدوي
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3">لا توجد بنود تكلفة.</p>
              <p className="text-xs text-muted-foreground mb-4">
                أضف بنداً يدوياً أو ارفع بطاقة أسعار من الإعدادات ثم استخدم المطابقة.
              </p>
              <Button onClick={handleAddRow} disabled={adding}>
                <Plus className="h-4 w-4 ml-1" />
                إضافة أول بند
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-start p-3 font-medium text-foreground">البند</th>
                <th className="text-start p-3 font-medium text-foreground">المصدر</th>
                <th className="text-start p-3 font-medium text-foreground">الفئة</th>
                <th className="text-start p-3 font-medium text-foreground ltr-nums">الكمية</th>
                <th className="text-start p-3 font-medium text-foreground">الوحدة</th>
                <th className="text-start p-3 font-medium text-foreground ltr-nums">سعر الوحدة</th>
                <th className="text-start p-3 font-medium text-foreground ltr-nums">الإجمالي</th>
                <th className="w-20 p-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b border-border last:border-0 ${Number(editingId === item.id ? (editRow.unit_price ?? item.unit_price) : item.unit_price) === 0 ? "bg-amber-500/10" : ""}`}
                >
                  {editingId === item.id ? (
                    <>
                      <td className="p-2">
                        <Input
                          value={editRow.description ?? ""}
                          onChange={(e) => setEditRow((r) => ({ ...r, description: e.target.value }))}
                          className="w-full"
                        />
                      </td>
                      <td className="p-2">
                        <SourceBadge source={item.source} sourceNotes={item.source_notes} />
                      </td>
                      <td className="p-2">
                        <Select
                          value={editRow.category ?? "direct"}
                          onChange={(e) =>
                            setEditRow((r) => ({ ...r, category: e.target.value as "direct" | "indirect" }))
                          }
                          options={[
                            { value: "direct", label: "مباشرة" },
                            { value: "indirect", label: "غير مباشرة" },
                          ]}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={editRow.quantity ?? 0}
                          onChange={(e) =>
                            setEditRow((r) => ({ ...r, quantity: e.target.valueAsNumber || 0 }))
                          }
                          className="w-20 ltr"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={editRow.unit ?? ""}
                          onChange={(e) => setEditRow((r) => ({ ...r, unit: e.target.value }))}
                          className="w-24"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={editRow.unit_price ?? 0}
                          onChange={(e) =>
                            setEditRow((r) => ({ ...r, unit_price: e.target.valueAsNumber || 0 }))
                          }
                          className="w-28 ltr"
                        />
                      </td>
                      <td className="p-3 text-muted-foreground ltr-nums">
                        {fmtNum((editRow.quantity ?? 0) * (editRow.unit_price ?? 0))}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={saveEdit}
                          >
                            حفظ
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={cancelEdit}
                          >
                            إلغاء
                          </Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-3 text-foreground">
                        <span>{item.description}</span>
                        {item.source_notes && (
                          <span className="block text-xs text-muted-foreground mt-0.5">{item.source_notes}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <SourceBadge source={item.source} sourceNotes={item.source_notes} />
                      </td>
                      <td className="p-3 text-sm text-foreground">
                        {item.category === "indirect" ? "غير مباشرة" : "مباشرة"}
                      </td>
                      <td className="p-3 ltr-nums text-foreground">{item.quantity}</td>
                      <td className="p-3 text-foreground">{item.unit}</td>
                      <td className="p-3 ltr-nums text-foreground">
                        {fmtNum(Number(item.unit_price))}
                      </td>
                      <td className="p-3 ltr-nums text-foreground">
                        {fmtNum(Number(item.total))}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(item)}
                          >
                            تعديل
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            aria-label="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">ملخص التكاليف وسعر العرض</h3>

        {items.length > 0 ? (
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
              <p className="flex justify-between text-foreground">
                <span className="text-muted-foreground">مجموع التكاليف المباشرة</span>
                <span className="font-medium ltr-nums">{fmtNum(directSum)} SAR</span>
              </p>
              <p className="flex justify-between text-foreground">
                <span className="text-muted-foreground">مجموع التكاليف غير المباشرة</span>
                <span className="font-medium ltr-nums">{fmtNum(indirectSum)} SAR</span>
              </p>
              <p className="flex justify-between border-t border-border pt-2 font-medium text-foreground">
                <span>المجموع الفرعي</span>
                <span className="ltr-nums">{fmtNum(subtotal)} SAR</span>
              </p>
              <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
                <label className="text-muted-foreground">هامش الربح %</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={profitMarginPercent}
                  onChange={(e) =>
                    setProfitMarginPercent(Math.max(0, Math.min(100, e.target.valueAsNumber || 0)))
                  }
                  className="w-20 ltr"
                />
              </div>
              <p className="flex justify-between text-foreground">
                <span className="text-muted-foreground">مبلغ الربح</span>
                <span className="font-medium ltr-nums">{fmtNum(profitAmount)} SAR</span>
              </p>
              <p className="flex justify-between border-t border-border pt-2 font-medium text-foreground">
                <span>سعر العرض النهائي</span>
                <span className="ltr-nums">{fmtNum(finalBidFromCalc)} SAR</span>
              </p>
            </div>
            <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
              <p className="flex justify-between text-foreground">
                <span className="text-muted-foreground">القيمة التقديرية للمنافسة</span>
                <span className="font-medium ltr-nums">
                  {estimatedValue != null ? `${fmtNum(estimatedValue)} SAR` : "—"}
                </span>
              </p>
              {estimatedValue != null && bidPriceNum != null && (
                <>
                  <p className="flex justify-between text-foreground">
                    <span className="text-muted-foreground">الفرق (مبلغ)</span>
                    <span className={`font-medium ltr-nums ${diffAmount != null && diffAmount >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {diffAmount != null ? `${fmtNum(diffAmount)} SAR` : "—"}
                    </span>
                  </p>
                  <p className="flex justify-between text-foreground">
                    <span className="text-muted-foreground">الفرق %</span>
                    <span className={`font-medium ltr-nums ${diffPercent != null && diffPercent >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {diffPercent != null ? `${diffPercent.toFixed(1)}%` : "—"}
                    </span>
                  </p>
                </>
              )}
              <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
                <label className="text-muted-foreground">سعر العرض (للحفظ)</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={bidPrice}
                  onChange={(e) => setBidPrice(e.target.value)}
                  placeholder={finalBidFromCalc > 0 ? String(finalBidFromCalc) : ""}
                  className="w-36 ltr"
                />
                <Button size="sm" onClick={handleSaveBidPrice} disabled={savingBid} isLoading={savingBid}>
                  حفظ سعر العرض
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-muted-foreground">سعر العرض (اختياري)</label>
            <Input
              type="text"
              inputMode="decimal"
              value={bidPrice}
              onChange={(e) => setBidPrice(e.target.value)}
              className="w-36 ltr"
            />
            <Button size="sm" onClick={handleSaveBidPrice} disabled={savingBid} isLoading={savingBid}>
              حفظ سعر العرض
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          يُستخدم سعر العرض في التقييم (مثلاً الربحية). يتحدث تلقائياً مع هامش الربح؛ يمكنك تعديله يدوياً ثم الحفظ.
        </p>
      </div>
    </div>
  );
}
