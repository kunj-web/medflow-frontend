import { PaginationParams } from "./common";

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum InvoiceStatus {
  DRAFT = "DRAFT",
  ISSUED = "ISSUED",
  PAID = "PAID",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  CANCELLED = "CANCELLED",
}

export enum PaymentMethod {
  CASH = "CASH",
  CARD = "CARD",
  UPI = "UPI",
  BANK_TRANSFER = "BANK_TRANSFER",
  INSURANCE = "INSURANCE",
}

// ─── Line Item (JSONB) ────────────────────────────────────────────────────────

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number; // quantity * unit_price
}

// ─── Invoice ──────────────────────────────────────────────────────────────────

export interface Invoice {
  id: string;
  hospital_id: string;
  patient_id: string;
  appointment_id?: string;
  invoice_number: string;
  status: InvoiceStatus;
  line_items: LineItem[];
  discount_amount: number;
  total_amount: number;
  balance_due: number;
  payment_method?: PaymentMethod;
  transaction_reference?: string;
  notes?: string;
  issued_at?: string;
  created_at: string;
  deleted_at: string | null;
  // relations
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
  };
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export interface InvoiceCreate {
  patient_id: string;
  appointment_id?: string;
  line_items: Omit<LineItem, "total">[];
  discount_amount?: number;
  notes?: string;
}

export interface InvoicePay {
  amount: number;
  payment_method: PaymentMethod;
  transaction_reference?: string;
}

export interface InvoiceCancel {
  reason?: string;
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export interface InvoiceListParams extends PaginationParams {
  status?: InvoiceStatus;
  patient_id?: string;
}
