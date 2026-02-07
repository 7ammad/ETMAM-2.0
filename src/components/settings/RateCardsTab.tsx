"use client";

import { useEffect, useState } from "react";
import { Dropzone } from "@/components/ui/dropzone";
import { Button } from "@/components/ui/button";
import {
  listRateCards,
  uploadRateCard,
  deleteRateCard,
  type RateCardListItem,
} from "@/app/actions/rate-cards";
import { Trash2 } from "lucide-react";

export function RateCardsTab() {
  const [cards, setCards] = useState<RateCardListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const result = await listRateCards();
    setLoading(false);
    if (result.success) setCards(result.cards);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpload() {
    if (!uploadFile) return;
    setUploadError(null);
    setUploading(true);
    const formData = new FormData();
    formData.set("file", uploadFile);
    if (uploadName.trim()) formData.set("name", uploadName.trim());
    const result = await uploadRateCard(formData);
    setUploading(false);
    if (result.success) {
      setUploadFile(null);
      setUploadName("");
      load();
    } else {
      setUploadError(result.error);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteRateCard(id);
    setDeletingId(null);
    if (result.success) load();
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">رفع بطاقة أسعار</h3>
        <p className="text-xs text-muted-foreground mb-3">
          CSV أو Excel: أعمدة البند، التصنيف، الوحدة، سعر الوحدة (أو item_name, category, unit, unit_price)
        </p>
        <Dropzone
          accept={{ "file": [".csv", ".xlsx", ".xls"] }}
          maxSize={5 * 1024 * 1024}
          maxFiles={1}
          onFilesSelected={(files) => setUploadFile(files[0] ?? null)}
          label="اسحب الملف هنا أو اضغط للاختيار"
          hint=".csv, .xlsx, .xls — حتى 5 ميجابايت"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="اسم البطاقة (اختياري)"
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground w-56"
          />
          <Button
            onClick={handleUpload}
            disabled={!uploadFile || uploading}
            isLoading={uploading}
          >
            رفع
          </Button>
        </div>
        {uploadError && (
          <p className="mt-2 text-sm text-red-500" role="alert">
            {uploadError}
          </p>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">بطاقات الأسعار</h3>
        {loading ? (
          <p className="text-sm text-muted-foreground">جاري التحميل...</p>
        ) : cards.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            لا توجد بطاقات أسعار. ارفع ملف CSV أو Excel أعلاه.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-start p-3 font-medium text-foreground">الاسم</th>
                  <th className="text-start p-3 font-medium text-foreground">الملف</th>
                  <th className="text-start p-3 font-medium text-foreground ltr-nums">عدد البنود</th>
                  <th className="text-start p-3 font-medium text-foreground">التاريخ</th>
                  <th className="w-10 p-3" />
                </tr>
              </thead>
              <tbody>
                {cards.map((card) => (
                  <tr key={card.id} className="border-b border-border last:border-0">
                    <td className="p-3 text-foreground">{card.name}</td>
                    <td className="p-3 text-muted-foreground">{card.file_name}</td>
                    <td className="p-3 ltr-nums text-foreground">{card.item_count}</td>
                    <td className="p-3 text-muted-foreground ltr-nums">
                      {new Date(card.created_at).toLocaleDateString("ar-SA")}
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleDelete(card.id)}
                        disabled={deletingId === card.id}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50"
                        aria-label="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
