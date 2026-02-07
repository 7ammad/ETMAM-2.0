/**
 * Odoo connection test via XML-RPC (no external xmlrpc package).
 * PRD: ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY.
 */

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildXmlRpcBody(method: string, params: (string | number)[], appendStruct = false): string {
  const paramEls = params
    .map(
      (p) =>
        `<param><value>${
          typeof p === "number" ? `<int>${p}</int>` : `<string>${escapeXml(String(p))}</string>`
        }</value></param>`
    )
    .join("");
  const structParam = appendStruct ? "<param><value><struct></struct></value></param>" : "";
  return `<?xml version="1.0"?><methodCall><methodName>${escapeXml(method)}</methodName><params>${paramEls}${structParam}</params></methodCall>`;
}

export interface OdooTestResult {
  success: boolean;
  connected: boolean;
  error?: string;
  server_version?: string;
  database_name?: string;
}

/**
 * Test Odoo connection using XML-RPC authenticate.
 * Uses fetch to POST to /xmlrpc/2/common.
 */
export async function testOdooConnection(params: {
  url: string;
  db: string;
  username: string;
  api_key: string;
}): Promise<OdooTestResult> {
  const { url, db, username, api_key } = params;
  const base = url.replace(/\/$/, "");
  const endpoint = `${base}/xmlrpc/2/common`;

  try {
    const body = buildXmlRpcBody("authenticate", [db, username, api_key], true);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/xml" },
      body,
    });

    if (!res.ok) {
      return {
        success: false,
        connected: false,
        error: `تعذر الاتصال بـ Odoo (${res.status})`,
      };
    }

    const text = await res.text();
    if (text.includes("<fault>") || text.includes("Fault")) {
      const msgMatch = text.match(/<string>([^<]*)<\/string>/);
      return {
        success: false,
        connected: false,
        error: msgMatch?.[1]?.trim() || "تعذر الاتصال بـ Odoo",
      };
    }

    const intMatch = text.match(/<int>(\d+)<\/int>/);
    const boolMatch = text.match(/<boolean>(\d)<\/boolean>/);
    const uid = intMatch ? parseInt(intMatch[1], 10) : boolMatch ? parseInt(boolMatch[1], 10) : null;
    const connected = typeof uid === "number" && uid > 0;

    if (!connected) {
      return {
        success: true,
        connected: false,
        error: "فشل تسجيل الدخول (اسم مستخدم أو كلمة مرور غير صحيحة)",
      };
    }

    return {
      success: true,
      connected: true,
      database_name: db,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "تعذر الاتصال بـ Odoo";
    return {
      success: false,
      connected: false,
      error: message,
    };
  }
}

/** Get UID for object API (execute_kw). */
export async function getOdooUid(params: {
  url: string;
  db: string;
  username: string;
  api_key: string;
}): Promise<{ success: true; uid: number } | { success: false; error: string }> {
  const result = await testOdooConnection(params);
  if (!result.success || !result.connected) {
    return { success: false, error: result.error ?? "تعذر الاتصال بـ Odoo" };
  }
  const base = params.url.replace(/\/$/, "");
  const endpoint = `${base}/xmlrpc/2/common`;
  const body = buildXmlRpcBody("authenticate", [params.db, params.username, params.api_key], true);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "text/xml" },
    body,
  });
  if (!res.ok) return { success: false, error: `تعذر الاتصال (${res.status})` };
  const text = await res.text();
  const intMatch = text.match(/<int>(\d+)<\/int>/);
  const uid = intMatch ? parseInt(intMatch[1], 10) : null;
  if (typeof uid !== "number" || uid <= 0) return { success: false, error: "فشل تسجيل الدخول" };
  return { success: true, uid };
}

function buildStructXml(fields: Record<string, string | number | boolean>): string {
  const entries = Object.entries(fields)
    .map(([k, v]) => {
      const val =
        typeof v === "number"
          ? `<int>${v}</int>`
          : typeof v === "boolean"
            ? `<boolean>${v ? "1" : "0"}</boolean>`
            : `<string>${escapeXml(String(v))}</string>`;
      return `<member><name>${escapeXml(k)}</name><value>${val}</value></member>`;
    })
    .join("");
  return `<struct>${entries}</struct>`;
}

export interface CreateLeadResult {
  success: boolean;
  lead_id?: number;
  error?: string;
}

/**
 * Create crm.lead (opportunity) in Odoo via XML-RPC execute_kw.
 * Maps Etmam tender fields to Odoo opportunity (PRD 6B).
 */
export async function createOdooLead(
  params: {
    url: string;
    db: string;
    username: string;
    api_key: string;
  },
  lead: {
    name: string;
    expected_revenue?: number;
    date_deadline?: string;
    description?: string;
    partner_name?: string;
  }
): Promise<CreateLeadResult> {
  const uidResult = await getOdooUid(params);
  if (!uidResult.success) return { success: false, error: uidResult.error };

  const base = params.url.replace(/\/$/, "");
  const endpoint = `${base}/xmlrpc/2/object`;

  const fields: Record<string, string | number | boolean> = {
    name: lead.name,
    type: "opportunity",
  };
  if (lead.expected_revenue != null) fields.expected_revenue = lead.expected_revenue;
  if (lead.date_deadline) fields.date_deadline = lead.date_deadline;
  if (lead.description) fields.description = lead.description;
  if (lead.partner_name) fields.partner_name = lead.partner_name;

  const structXml = buildStructXml(fields);
  const body = `<?xml version="1.0"?><methodCall><methodName>execute_kw</methodName><params><param><value><string>${escapeXml(params.db)}</string></value></param><param><value><int>${uidResult.uid}</int></value></param><param><value><string>${escapeXml(params.api_key)}</string></value></param><param><value><string>crm.lead</string></value></param><param><value><string>create</string></value></param><param><value><array><data><value>${structXml}</value></data></array></value></param></params></methodCall>`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/xml" },
      body,
    });
    if (!res.ok) return { success: false, error: `تعذر الاتصال بـ Odoo (${res.status})` };
    const text = await res.text();
    if (text.includes("<fault>") || text.includes("Fault")) {
      const msgMatch = text.match(/<string>([^<]*)<\/string>/);
      return { success: false, error: msgMatch?.[1]?.trim() ?? "خطأ من Odoo" };
    }
    const intMatch = text.match(/<int>(\d+)<\/int>/);
    const leadId = intMatch ? parseInt(intMatch[1], 10) : undefined;
    return { success: true, lead_id: leadId };
  } catch (e) {
    const message = e instanceof Error ? e.message : "تعذر الاتصال بـ Odoo";
    return { success: false, error: message };
  }
}
