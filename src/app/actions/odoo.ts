"use server";

import { testOdooConnection as testConnection } from "@/lib/odoo";

export interface OdooConfigStatus {
  url: string;
  db: string;
  username: string;
  hasApiKey: boolean;
}

export type GetOdooConfigResult =
  | { success: true; config: OdooConfigStatus }
  | { success: false; error: string };

/**
 * Get Odoo config from environment (PRD: .env ODOO_*).
 * Does not send API key to client; only hasApiKey boolean.
 */
export async function getOdooConfig(): Promise<GetOdooConfigResult> {
  const url = process.env.ODOO_URL ?? "";
  const db = process.env.ODOO_DB ?? "";
  const username = process.env.ODOO_USERNAME ?? "";
  const hasApiKey = Boolean(process.env.ODOO_API_KEY?.trim());

  return {
    success: true,
    config: { url, db, username, hasApiKey },
  };
}

export type TestOdooConnectionResult =
  | { success: true; connected: boolean; error?: string; database_name?: string }
  | { success: false; error: string };

/**
 * Test Odoo connection with provided credentials (or from env if not provided).
 * Uses XML-RPC authenticate. Arabic error messages per BACKEND.md.
 */
export async function testOdooConnection(params: {
  url?: string;
  db?: string;
  username?: string;
  api_key?: string;
}): Promise<TestOdooConnectionResult> {
  const url = (params.url?.trim() || (process.env.ODOO_URL ?? "")).replace(/\/$/, "");
  const db = params.db?.trim() || (process.env.ODOO_DB ?? "");
  const username = params.username?.trim() || (process.env.ODOO_USERNAME ?? "");
  const api_key = params.api_key?.trim() || (process.env.ODOO_API_KEY ?? "");

  if (!url || !db || !username || !api_key) {
    return {
      success: false,
      error: "أدخل الرابط، قاعدة البيانات، اسم المستخدم، ومفتاح API",
    };
  }

  const result = await testConnection({ url, db, username, api_key });

  if (!result.success) {
    return { success: false, error: result.error ?? "تعذر الاتصال بـ Odoo" };
  }

  return {
    success: true,
    connected: result.connected,
    error: result.connected ? undefined : result.error,
    database_name: result.database_name,
  };
}
