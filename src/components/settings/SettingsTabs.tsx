"use client";

import { AIProviderConfig } from "./AIProviderConfig";
import { ScoringWeights } from "./ScoringWeights";
import { RateCardsTab } from "./RateCardsTab";
import { OdooConfigTab } from "./OdooConfigTab";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { useLanguageStore } from "@/stores/language-store";
import { ts } from "@/lib/i18n";

/** PRD §5 / IRONCLAD A3: Settings = 4 tabs (no placeholders).
 * (1) Rate Cards: upload, list, delete — rate_cards + rate_card_items.
 * (2) Evaluation Criteria: ScoringWeights.
 * (3) Odoo/CRM: config form (ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY) + connection test.
 * (4) AI Provider: provider selection + config. */
export function SettingsTabs() {
  const lang = useLanguageStore((s) => s.lang);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="rate-cards">
        <TabsList>
          <TabsTrigger value="rate-cards">{ts("rateCards", lang)}</TabsTrigger>
          <TabsTrigger value="evaluation-criteria">{ts("evalCriteria", lang)}</TabsTrigger>
          <TabsTrigger value="odoo-crm">{ts("odooCrm", lang)}</TabsTrigger>
          <TabsTrigger value="ai-provider">{ts("aiProvider", lang)}</TabsTrigger>
        </TabsList>
        <TabsContent value="rate-cards"><RateCardsTab /></TabsContent>
        <TabsContent value="evaluation-criteria"><ScoringWeights /></TabsContent>
        <TabsContent value="odoo-crm"><OdooConfigTab /></TabsContent>
        <TabsContent value="ai-provider"><AIProviderConfig /></TabsContent>
      </Tabs>
    </div>
  );
}
