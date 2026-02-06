/**
 * API request/response types.
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ImportResponse {
  success: boolean;
  imported: number;
  errors?: { row: number; message: string }[];
}

export interface ExtractionResponse {
  success: boolean;
  extraction: {
    entity: string | null;
    tender_title: string | null;
    tender_number: string | null;
    deadline: string | null;
    estimated_value: number | null;
    description: string | null;
    requirements: string[];
    line_items: {
      description: string;
      quantity: number | null;
      unit: string | null;
      confidence: number;
    }[];
    confidence: Record<string, number>;
    evidence: Record<string, string | null>;
    overall_confidence: number;
    warnings: string[];
    not_found: string[];
    cached: boolean;
    model_used: string;
    processing_time_ms: number;
  };
  validation: {
    valid: boolean;
    issues: string[];
    requires_review: boolean;
  };
  file_path: string;
}

export interface OdooTestResponse {
  success: boolean;
  connected: boolean;
  error?: string;
  server_version?: string;
  database_name?: string;
}

export interface ExportResponse {
  success: boolean;
  results: {
    tender_id: string;
    status: "created" | "updated" | "error";
    odoo_lead_id?: number;
    odoo_url?: string;
    error?: string;
  }[];
}
