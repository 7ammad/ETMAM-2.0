# Etmam 2.0 — Saudi Tender Document Structure

> **⚠️ DEPRECATED — DO NOT USE FOR IMPLEMENTATION**  
> This file (v2.0, 11-section) is superseded by **TENDER-STRUCTURE-v3.0-VERIFIED.md** (12-section, verified against real tender). All code, prompts, and docs must reference the verified doc only.

## Document Info
- **Version:** 2.0 (superseded by v3.0 VERIFIED)
- **Last Updated:** February 6, 2026
- **Source:** Ministry of Finance Official Guide (الدليل الإرشادي لإعداد الكراسات)

---

## كراسة الشروط والمواصفات — Standard Structure

All Saudi government tenders on Etimad platform follow a **standardized 11-section template**. This enables deterministic extraction by targeting specific sections rather than scanning entire documents.

### Section Map

| # | القسم | Section | Key Data | Extract Priority |
|---|-------|---------|----------|-----------------|
| 1 | المقدمة | Introduction | الجهة، رقم المنافسة، المواعيد | ⭐ HIGH |
| 2 | الأحكام العامة | General Terms | تجزئة المنافسة | LOW |
| 3 | إعداد العروض | Bid Preparation | متطلبات العرض | LOW |
| 4 | تقديم العروض | Bid Submission | الضمان الابتدائي | LOW |
| 5 | تقييم العروض | Bid Evaluation | معايير التقييم | MEDIUM |
| 6 | متطلبات التعاقد | Contract Requirements | الضمان النهائي | LOW |
| **7** | **نطاق العمل** | **Scope of Work** | **BOQ, مكان التنفيذ, برنامج العمل** | ⭐⭐ **CRITICAL** |
| **8** | **المواصفات** | **Specifications** | **SOW, العمالة, المواد, المعدات** | ⭐⭐ **CRITICAL** |
| 9 | الشروط الخاصة | Special Terms | شروط إضافية | MEDIUM |
| 10 | الملحقات | Attachments | العقد, المخططات | LOW |
| 11 | (ضمن الملحقات) | Evaluation Criteria | معايير التقييم التفصيلية | MEDIUM |

---

## Section 1: المقدمة (Introduction)

### Data to Extract:
```yaml
entity: الجهة الحكومية
tender_number: رقم المنافسة
tender_title: اسم/عنوان المنافسة
document_value: قيمة وثائق المنافسة
dates:
  participation_confirmation: تاريخ تأكيد المشاركة
  bid_submission_deadline: الموعد النهائي لتقديم العروض
  bid_opening: تاريخ فتح المظاريف
required_licenses: السجلات والتراخيص المطلوبة
entity_representative:
  name: اسم ممثل الجهة
  email: البريد الإلكتروني
  phone: رقم الهاتف
delivery_location: مكان التسليم
```

### Where to Find:
- First 2-5 pages of document
- Usually in a standardized table format
- Look for "بيانات المنافسة" or "معلومات عامة"

---

## Section 7: نطاق العمل (Scope of Work) — CRITICAL

### Data to Extract:
```yaml
project_scope:
  description: وصف المشروع
  objectives: أهداف المشروع
  deliverables: المخرجات المطلوبة

work_location:
  city: المدينة
  region: المنطقة
  address: العنوان التفصيلي
  coordinates: الإحداثيات (if available)

work_schedule:
  duration: مدة التنفيذ
  phases: مراحل التنفيذ
  milestones: المعالم الرئيسية

bill_of_quantities:  # BOQ - جدول الكميات
  items:
    - description: وصف البند
      quantity: الكمية
      unit: وحدة القياس
      specifications: المواصفات
```

### BOQ Structure (جدول الكميات):
The BOQ is typically presented in this format:

| م | البند | الوصف | الوحدة | الكمية | السعر الفردي | الإجمالي |
|---|-------|-------|--------|--------|--------------|----------|
| 1 | ... | ... | جهاز | 50 | (bidder fills) | (calculated) |

**Important:** Price columns are left empty for bidders to fill.

### Where to Find:
- Usually after page 15-20
- Section header: "القسم السابع: نطاق العمل" or "نطاق الأعمال"
- BOQ often in separate table or attached Excel file

---

## Section 8: المواصفات (Specifications) — CRITICAL

### Data to Extract:
```yaml
labor_requirements:  # شروط العمالة
  positions:
    - title: المسمى الوظيفي
      count: العدد
      qualifications: المؤهلات
      saudi_percentage: نسبة السعودة (if specified)

material_requirements:  # شروط المواد
  items:
    - name: اسم المادة
      specifications: المواصفات
      standards: المعايير (ISO, SASO, etc.)
      quantity: الكمية
      unit: الوحدة

equipment_requirements:  # شروط المعدات
  items:
    - name: اسم المعدة
      specifications: المواصفات
      quantity: الكمية

work_execution:  # كيفية تنفيذ الأعمال (SOW)
  procedures: إجراءات التنفيذ
  testing: الاختبارات المطلوبة
  quality_standards: معايير الجودة
  safety_requirements: متطلبات السلامة
```

### Where to Find:
- After Section 7
- Section header: "القسم الثامن: المواصفات"
- Often most detailed section (10-30 pages)

---

## Extraction Strategy

### Approach 1: Section-Targeted Extraction (RECOMMENDED)
```
1. Identify document structure
2. Locate Section 1 → Extract basic info (entity, number, dates)
3. Locate Section 7 → Extract BOQ items
4. Locate Section 8 → Extract specifications/SOW
5. Calculate estimated value from BOQ (if prices exist)
6. Validate extracted data
```

### Approach 2: Full Document Scan (FALLBACK)
```
Use when:
- Document doesn't follow standard template
- Section headers are missing
- Document is scanned/image-based

Process:
1. Extract all text
2. Search for key patterns (رقم المنافسة, الموعد النهائي, etc.)
3. Extract surrounding context
4. Apply lower confidence scores
```

### Pattern Recognition

**Tender Number Patterns:**
```regex
# Pattern: Letters + numbers (e.g., "م/25/1446" or "450000123456")
رقم المنافسة[:\s]*([أ-ي\d\/\-]+)
منافسة رقم[:\s]*([أ-ي\d\/\-]+)
```

**Deadline Patterns:**
```regex
# Hijri date
[\d]{1,2}\/[\d]{1,2}\/[\d]{4}\s*هـ
# Gregorian date
[\d]{1,2}\/[\d]{1,2}\/[\d]{4}\s*م
```

**Value Patterns:**
```regex
# SAR amounts
([\d,]+(?:\.\d{2})?)\s*(?:ريال|ر\.س|SAR)
```

---

## Etimad Platform Integration

### Key Services:
1. **عرض المنافسات** — Browse available tenders
2. **شراء الكراسة** — Purchase RFP document
3. **تقديم العروض** — Submit bids (technical + financial)
4. **جدول الكميات** — Fill BOQ online

### Tender Lifecycle on Etimad:
```
1. Entity creates tender → Publishes on Etimad
2. Supplier purchases كراسة الشروط
3. Supplier reviews requirements
4. Supplier submits:
   - العرض الفني (Technical Proposal)
   - العرض المالي (Financial Proposal) — includes filled BOQ
5. Entity evaluates bids
6. Award announcement
7. Contract signing
```

### File Formats:
- كراسة الشروط: PDF (primary), DOCX (rare)
- جدول الكميات: Excel (XLSX) or embedded in PDF
- الملحقات: PDF, DWG (drawings), other

---

## Data Quality Indicators

### High Confidence Extraction:
- Found in expected section
- Clear formatting (tables, headers)
- Matches expected patterns
- No conflicting values

### Low Confidence Extraction:
- Found outside expected section
- Poor formatting or scanned document
- Partial pattern match
- Multiple conflicting values found

### Requires Manual Review:
- Value not found
- Confidence < 70%
- Document structure non-standard
- Critical date parsing uncertainty

---

## Sample Extraction Prompt (Section-Targeted)

```
أنت مساعد متخصص في تحليل كراسات الشروط والمواصفات السعودية.

الوثيقة تتبع الهيكل المعياري لمنصة اعتماد (11 قسم).

المطلوب:
1. حدد القسم الأول (المقدمة) واستخرج:
   - الجهة الحكومية
   - رقم المنافسة
   - عنوان المنافسة
   - الموعد النهائي

2. حدد القسم السابع (نطاق العمل) واستخرج:
   - وصف المشروع
   - جدول الكميات (كل بند مع الكمية والوحدة)

3. حدد القسم الثامن (المواصفات) واستخرج:
   - متطلبات العمالة
   - المواد والمعدات الرئيسية

القواعد:
- إذا لم تجد المعلومة، اكتب null
- اذكر رقم الصفحة التي وجدت فيها كل معلومة
- أعط درجة ثقة (0-100) لكل حقل
- لا تخمن القيم — استخرج فقط ما هو موجود فعلياً
```

---

## References

1. **Ministry of Finance (MOF):**
   - الدليل الإرشادي لإعداد الكراسات
   - https://mof.gov.sa/Knowledgecenter/newGovTendandProcLow/

2. **Etimad Platform:**
   - https://portal.etimad.sa
   - Official e-procurement portal

3. **Digital Government Authority (DGA):**
   - الدليل الاسترشادي لإعداد كراسات الشروط والمواصفات الخاصة بالمشاريع الرقمية
   - https://dga.gov.sa

4. **Government Tenders and Procurement Law:**
   - نظام المنافسات والمشتريات الحكومية
   - Royal Decree M/128
