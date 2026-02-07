"use client";

import { AIProviderConfig } from "./AIProviderConfig";
import { ScoringWeights } from "./ScoringWeights";
import { RateCardsTab } from "./RateCardsTab";
import { OdooConfigTab } from "./OdooConfigTab";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";

/** PRD §5 / IRONCLAD A3: Settings = 4 tabs (no placeholders).
 * (1) Rate Cards: upload, list, delete — rate_cards + rate_card_items.
 * (2) Evaluation Criteria: ScoringWeights.
 * (3) Odoo/CRM: config form (ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY) + connection test.
 * (4) AI Provider: provider selection + config. */
export function SettingsTabs() {
  return (
    <div className="space-y-4" dir="rtl">
      <Tabs defaultValue="rate-cards">
        <TabsList>
          <TabsTrigger value="rate-cards">بطاقات الأسعار</TabsTrigger>
          <TabsTrigger value="evaluation-criteria">معايير التقييم</TabsTrigger>
          <TabsTrigger value="odoo-crm">ربط Odoo/CRM</TabsTrigger>
          <TabsTrigger value="ai-provider">مزود الذكاء الاصطناعي</TabsTrigger>
        </TabsList>
        <TabsContent value="rate-cards"><RateCardsTab /></TabsContent>
        <TabsContent value="evaluation-criteria"><ScoringWeights /></TabsContent>
        <TabsContent value="odoo-crm"><OdooConfigTab /></TabsContent>
        <TabsContent value="ai-provider"><AIProviderConfig /></TabsContent>
      </Tabs>
    </div>
  );
}
