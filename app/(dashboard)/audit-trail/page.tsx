"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SkeletonList } from "@/components/ui/Skeleton";
import api from "@/lib/api";
import { parseApiError } from "@/lib/auth";
import { cn, formatDateTime } from "@/lib/utils";
import { PaginatedResponse } from "@/types/common";

const PAGE_SIZE = 20;

interface AuditLog {
  id: string;
  actor_user_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  summary: string;
  details: Record<string, unknown>;
  created_at: string;
}

const ACTION_FILTERS = [
  { label: "All", value: "ALL" },
  { label: "Doctor approved", value: "doctor.approved" },
  { label: "Admin created", value: "admin.created" },
  { label: "Admin deactivated", value: "admin.deactivated" },
  { label: "Admin reactivated", value: "admin.reactivated" },
  { label: "Password reset", value: "admin.password_reset" },
  { label: "Appointment cancelled", value: "appointment.cancelled" },
  { label: "Invoice created", value: "invoice.created" },
  { label: "Invoice issued", value: "invoice.issued" },
  { label: "Invoice cancelled", value: "invoice.cancelled" },
];

const ACTION_TONE: Record<string, "success" | "warning" | "error" | "info" | "neutral" | "accent"> = {
  "doctor.approved": "success",
  "admin.created": "accent",
  "admin.deactivated": "warning",
  "admin.reactivated": "success",
  "admin.password_reset": "info",
  "appointment.cancelled": "error",
  "invoice.created": "neutral",
  "invoice.issued": "info",
  "invoice.cancelled": "warning",
};

function actionLabel(action: string) {
  return ACTION_FILTERS.find((item) => item.value === action)?.label ?? action.replace(".", " ");
}

function readableValue(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

function detailsFor(log: AuditLog) {
  return Object.entries(log.details ?? {})
    .map(([key, value]) => [key.replaceAll("_", " "), readableValue(value)] as const)
    .filter(([, value]) => value);
}

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [action, setAction] = useState("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | number> = {
        page,
        page_size: PAGE_SIZE,
      };
      if (action !== "ALL") params.action = action;

      const { data } = await api.get<PaginatedResponse<AuditLog>>(
        "/api/v1/admin/audit-logs",
        { params }
      );

      setLogs(data.data ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.total_pages ?? 1);
    } catch (err) {
      setLogs([]);
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [action, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const stats = useMemo(
    () => [
      { label: "Total events", value: total, tone: "bg-[#d9edbd]/80" },
      { label: "Shown", value: logs.length, tone: "bg-[#bfe0f2]/80" },
      { label: "Page", value: `${page}/${totalPages}`, tone: "bg-[#ffc2dc]/75" },
    ],
    [logs.length, page, total, totalPages]
  );

  function handleFilter(nextAction: string) {
    setAction(nextAction);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="Audit Trail"
        subtitle="Operational history for approvals, admins, cancellations, and invoices"
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
            leftIcon={<RefreshCw size={14} />}
          >
            Refresh
          </Button>
        }
      />

      <section className="overflow-hidden rounded-[28px] border border-white/70 bg-[#dceff5]/80 p-5 shadow-[0_22px_70px_rgba(24,86,115,0.14)] backdrop-blur-2xl sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end">
          <div>
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-white/55 text-[#24708a] shadow-sm backdrop-blur-xl">
              <ShieldCheck size={19} />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#24708a]">
              Admin trust
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-normal text-[#062f3d] sm:text-4xl">
              See who changed important operational records.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#456773]">
              Track doctor approvals, admin account changes, appointment
              cancellations, and invoice lifecycle events.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {stats.map((item) => (
              <div
                key={item.label}
                className={`${item.tone} rounded-2xl border border-white/65 px-3 py-4 text-[#062f3d] shadow-sm backdrop-blur-xl`}
              >
                <p className="truncate text-2xl font-semibold leading-none">
                  {loading ? "..." : item.value}
                </p>
                <p className="mt-2 text-xs font-medium text-[#456773]">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-[var(--error-bg)] px-4 py-3 text-sm text-[var(--error)]">
          {error}
        </div>
      )}

      <Card padding="none" className="overflow-hidden border-white/70 bg-white/72 shadow-[0_18px_45px_rgba(24,86,115,0.12)] backdrop-blur-xl">
        <div className="border-b border-[#d8edf3] bg-[#f8fcfd]/70 px-5 py-4">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-normal text-[#062f3d]">
                Event log
              </h2>
              <p className="mt-1 text-sm text-[#55717b]">
                Filter by action type and review the latest activity first.
              </p>
            </div>
            <Badge variant="info">{total} records</Badge>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {ACTION_FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => handleFilter(item.value)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  action === item.value
                    ? "border-[#1d9aaa] bg-[#1d9aaa] text-white shadow-sm"
                    : "border-[#c8e3ea] bg-white/70 text-[#456773] hover:border-[#7fc8d4] hover:text-[#062f3d]"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <SkeletonList rows={5} />
          ) : logs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#c8e3ea] bg-[#f8fcfd]/70 px-5 py-10 text-center text-sm text-[#55717b]">
              No audit events found for this filter.
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const details = detailsFor(log);
                return (
                  <article
                    key={log.id}
                    className="rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78 p-4 shadow-sm backdrop-blur-xl"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={ACTION_TONE[log.action] ?? "neutral"} dot>
                            {actionLabel(log.action)}
                          </Badge>
                          <span className="text-xs font-medium text-[#55717b]">
                            {formatDateTime(log.created_at)}
                          </span>
                        </div>
                        <h3 className="mt-3 text-base font-semibold text-[#062f3d]">
                          {log.summary}
                        </h3>
                        <p className="mt-1 text-sm text-[#55717b]">
                          By {log.actor_email ?? "Unknown user"}
                          {log.actor_role ? ` (${log.actor_role.replaceAll("_", " ")})` : ""}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/70 bg-[#dceff5]/70 px-3 py-2 text-xs text-[#456773]">
                        <span className="font-semibold text-[#062f3d]">
                          {log.target_type}
                        </span>
                        {log.target_id && (
                          <span className="ml-2 font-mono">
                            {log.target_id.slice(0, 8)}
                          </span>
                        )}
                      </div>
                    </div>

                    {details.length > 0 && (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        {details.map(([key, value]) => (
                          <div
                            key={`${log.id}-${key}`}
                            className="rounded-xl border border-white/70 bg-white/60 px-3 py-2 text-xs backdrop-blur-xl"
                          >
                            <p className="capitalize text-[#6a8791]">{key}</p>
                            <p className="mt-1 truncate font-medium text-[#062f3d]">
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-[#d8edf3] bg-[#f8fcfd]/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#55717b]">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={loading || page <= 1}
              leftIcon={<ChevronLeft size={14} />}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={loading || page >= totalPages}
              rightIcon={<ChevronRight size={14} />}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
