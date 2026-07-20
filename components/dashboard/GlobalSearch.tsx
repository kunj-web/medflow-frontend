"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  PlusCircle,
  ReceiptText,
  Search,
  ShieldCheck,
  Stethoscope,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import api from "@/lib/api";
import { parseApiError } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/common";

type SearchKind = "appointment" | "patient" | "doctor" | "invoice";
type QuickActionKind = "book" | "appointments" | "schedule" | "profile" | "invoices" | "review" | "audit" | "admins";

interface SearchResult {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle: string;
  meta: string;
  href: string;
}

interface SearchResponse {
  data: SearchResult[];
}

interface QuickAction {
  id: QuickActionKind;
  title: string;
  subtitle: string;
  href: string;
}

const QUICK_ACTIONS: Record<UserRole, QuickAction[]> = {
  [UserRole.ADMIN]: [
    {
      id: "review",
      title: "Review doctors",
      subtitle: "Approve pending doctor registrations",
      href: "/admin-review",
    },
    {
      id: "invoices",
      title: "Create invoice",
      subtitle: "Open billing and invoice tools",
      href: "/invoices",
    },
    {
      id: "audit",
      title: "Open audit trail",
      subtitle: "Review important admin activity",
      href: "/audit-trail",
    },
    {
      id: "admins",
      title: "Manage admins",
      subtitle: "Create and manage admin accounts",
      href: "/admins",
    },
  ],
  [UserRole.DOCTOR]: [
    {
      id: "schedule",
      title: "My schedule",
      subtitle: "Manage working days and slot blocks",
      href: "/my-schedule",
    },
    {
      id: "appointments",
      title: "Appointments",
      subtitle: "Review patient appointments",
      href: "/appointments",
    },
    {
      id: "profile",
      title: "Profile",
      subtitle: "Review your account profile",
      href: "/profile",
    },
  ],
  [UserRole.PATIENT]: [
    {
      id: "book",
      title: "Book appointment",
      subtitle: "Open the appointment booking flow",
      href: "/appointments",
    },
    {
      id: "appointments",
      title: "My appointments",
      subtitle: "Review booking history and status",
      href: "/appointments",
    },
    {
      id: "invoices",
      title: "My invoices",
      subtitle: "Review bills and balances",
      href: "/invoices",
    },
    {
      id: "profile",
      title: "Update profile",
      subtitle: "Complete your medical details",
      href: "/profile",
    },
  ],
};

function resultIcon(kind: SearchKind) {
  const className = "h-4 w-4";
  if (kind === "appointment") return <CalendarDays className={className} />;
  if (kind === "patient") return <UserRound className={className} />;
  if (kind === "doctor") return <Stethoscope className={className} />;
  return <FileText className={className} />;
}

function kindLabel(kind: SearchKind) {
  if (kind === "appointment") return "Appointment";
  if (kind === "patient") return "Patient";
  if (kind === "doctor") return "Doctor";
  return "Invoice";
}

function quickActionIcon(kind: QuickActionKind) {
  const className = "h-4 w-4";
  if (kind === "book") return <PlusCircle className={className} />;
  if (kind === "appointments") return <CalendarDays className={className} />;
  if (kind === "schedule") return <ClipboardList className={className} />;
  if (kind === "profile") return <UserRound className={className} />;
  if (kind === "invoices") return <ReceiptText className={className} />;
  if (kind === "review") return <Stethoscope className={className} />;
  if (kind === "audit") return <ShieldCheck className={className} />;
  return <UsersRound className={className} />;
}

export default function GlobalSearch() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const role = user?.role as UserRole | undefined;
  const trimmedQuery = query.trim();

  const placeholder = useMemo(() => {
    if (role === UserRole.ADMIN) return "Search patients, doctors, invoices, appointments";
    if (role === UserRole.DOCTOR) return "Search appointments and patients";
    if (role === UserRole.PATIENT) return "Search your appointments and invoices";
    return "Search MedFlow";
  }, [role]);

  const quickActions = useMemo(() => {
    const actions = role ? QUICK_ACTIONS[role] ?? [] : [];
    if (user?.is_super_admin) return actions;
    return actions.filter((action) => action.id !== "admins");
  }, [role, user?.is_super_admin]);

  const search = useCallback(async () => {
    if (!role || trimmedQuery.length < 2) {
      setResults([]);
      setError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data } = await api.get<SearchResponse>("/api/v1/search", {
        params: { q: trimmedQuery },
      });
      setResults(data.data ?? []);
    } catch (err) {
      setResults([]);
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [role, trimmedQuery]);

  useEffect(() => {
    const timer = window.setTimeout(search, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      const isCtrlK = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
      const isSlash = event.key === "/" && !isTyping;

      if (!isCtrlK && !isSlash) return;

      event.preventDefault();
      setOpen(true);
      inputRef.current?.focus();
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  function closeAndClear() {
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  return (
    <div ref={containerRef} className="relative hidden min-w-0 flex-1 md:block">
      <div className="relative max-w-xl">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6a8791]"
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="h-9 w-full rounded-full border border-[#d8edf3] bg-white/75 pl-9 pr-9 text-sm text-[#062f3d] shadow-sm outline-none backdrop-blur-xl transition placeholder:text-[#7f99a3] focus:border-[#9bd4dd] focus:bg-white"
        />
        {query && (
          <button
            type="button"
            onClick={closeAndClear}
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[#6a8791] transition hover:bg-[#eef7fa] hover:text-[#062f3d]"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 w-[min(620px,calc(100vw-320px))] overflow-hidden rounded-[24px] border border-white/70 bg-[#f8fcfd]/94 shadow-[0_24px_70px_rgba(24,86,115,0.18)] backdrop-blur-2xl">
          <div className="border-b border-[#d8edf3] bg-[#dceff5]/70 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#24708a]">
                  Global Search
                </p>
                <p className="mt-1 text-xs text-[#55717b]">{placeholder}</p>
              </div>
              <div className="hidden items-center gap-1 rounded-full border border-white/80 bg-white/65 px-2 py-1 text-[10px] font-semibold text-[#456773] sm:flex">
                <span>Ctrl</span>
                <span>+</span>
                <span>K</span>
              </div>
            </div>
          </div>

          <div className="max-h-[430px] overflow-y-auto p-3">
            {!query ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-dashed border-[#c8e3ea] bg-white/55 px-4 py-5">
                  <p className="text-sm font-semibold text-[#062f3d]">Start typing to search</p>
                  <p className="mt-1 text-xs leading-5 text-[#55717b]">
                    Use a name, phone, token, invoice number, status, or date.
                  </p>
                </div>

                {quickActions.length > 0 && (
                  <div>
                    <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#24708a]">
                      Quick actions
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {quickActions.map((action) => (
                        <Link
                          key={action.id}
                          href={action.href}
                          onClick={closeAndClear}
                          className="group flex items-start gap-3 rounded-2xl border border-[#d8edf3] bg-white/62 px-3 py-3 transition hover:border-[#9bd4dd] hover:bg-[#dceff5]/75"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-[#d9edbd]/80 text-[#427522]">
                            {quickActionIcon(action.id)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#062f3d]">
                              {action.title}
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#55717b]">
                              {action.subtitle}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : trimmedQuery.length < 2 ? (
              <div className="rounded-2xl border border-dashed border-[#c8e3ea] bg-white/55 px-4 py-6 text-center text-sm text-[#55717b]">
                Type at least 2 characters.
              </div>
            ) : loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-16 animate-pulse rounded-2xl bg-gradient-to-r from-[#e7f4f7] via-white/80 to-[#d7edf3]"
                  />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-[var(--error-bg)] px-4 py-3 text-sm text-[var(--error)]">
                {error}
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#c8e3ea] bg-white/55 px-4 py-8 text-center">
                <p className="text-sm font-medium text-[#062f3d]">No results found</p>
                <p className="mt-1 text-xs text-[#55717b]">
                  Try a name, phone, token, invoice number, status, or date.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {results.map((result) => (
                  <Link
                    key={`${result.kind}-${result.id}`}
                    href={result.href}
                    onClick={closeAndClear}
                    className="group flex items-center gap-3 rounded-2xl border border-[#d8edf3] bg-white/62 px-3 py-3 transition hover:border-[#9bd4dd] hover:bg-[#dceff5]/75"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-[#bfe0f2]/80 text-[#0c6983]">
                      {resultIcon(result.kind)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-[#062f3d]">
                          {result.title}
                        </p>
                        <span className="shrink-0 rounded-full border border-[#d8edf3] bg-[#f8fcfd] px-2 py-0.5 text-[10px] font-medium text-[#456773]">
                          {kindLabel(result.kind)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-[#55717b]">{result.subtitle}</p>
                    </div>
                    <p className="hidden max-w-[160px] truncate text-right text-[11px] font-medium text-[#6a8791] lg:block">
                      {result.meta}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
