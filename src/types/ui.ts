export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

export type ModalId =
  | "criteria-editor"
  | "confirm-delete"
  | "rate-card-upload"
  | "odoo-push-preview"
  | null;

export interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  headerAr?: string;
  sortable?: boolean;
  width?: string;
  render?: (row: T) => React.ReactNode;
}

export type SortDirection = "asc" | "desc";

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export type ViewMode = "table" | "card";
