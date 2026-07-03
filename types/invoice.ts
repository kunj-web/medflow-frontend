import { PaginationParams } from "./common";

export enum InvoiceStatus {
  DRAFT = "draft",
  ISSUED = "issued",
  PAID = "paid",
  PARTIALLY_PAID = "partially_paid",
  CANCELLED = "cancelled",
}

export enum PaymentMethod {
  CASH = "cash",
  CARD = "card",
  UPI = "upi",
  INSURANCE = "insurance",
}

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  appointment_id: string;
  patient_id: string;
  status: InvoiceStatus;
  line_items: LineItem[];
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  payment_method: PaymentMethod | string | null;
  transaction_reference?: string | null;
  notes?: string | null;
  issued_at?: string | null;
  paid_at?: string | null;
  created_at: string;
}

export interface InvoiceCreate {
  appointment_id: string;
  line_items: LineItem[];
  discount_amount?: number;
  notes?: string;
}

export interface InvoicePay {
  amount_paid: number;
  payment_method: PaymentMethod;
  transaction_reference?: string;
}

export interface InvoiceListParams extends PaginationParams {
  status?: InvoiceStatus;
}
