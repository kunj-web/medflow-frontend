"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { parseApiError } from "@/lib/auth";

interface AdminUser {
  id: string;
  email: string;
  phone: string | null;
  status: string;
  is_active: boolean;
  is_verified: boolean;
  is_super_admin: boolean;
  created_at: string;
}

interface AdminForm {
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
}

const EMPTY_FORM: AdminForm = {
  email: "",
  phone: "",
  password: "",
  confirm_password: "",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function AdminsPage() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [form, setForm] = useState<AdminForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get<AdminUser[]>("/api/v1/admin/users");
      setAdmins(data);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/api/v1/admin/users", {
        email: form.email.trim(),
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        password: form.password,
      });
      setForm(EMPTY_FORM);
      setSuccess("Admin account created.");
      await fetchAdmins();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  }

  if (!user?.is_super_admin) {
    return (
      <Card padding="lg" className="border-white/70 bg-white/75 text-sm text-[#55717b] shadow-[0_18px_50px_rgba(24,86,115,0.10)] backdrop-blur-xl">
        Super admin access is required.
      </Card>
    );
  }

  const regularAdmins = admins.filter((admin) => !admin.is_super_admin).length;

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="Admins"
        subtitle="Create and review website admin accounts"
        actions={
          <Button variant="secondary" size="sm" onClick={fetchAdmins} disabled={loading}>
            Refresh
          </Button>
        }
      />

      <section className="overflow-hidden rounded-[28px] border border-white/70 bg-[#dceff5]/80 p-5 shadow-[0_22px_70px_rgba(24,86,115,0.14)] backdrop-blur-2xl sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2f7689]">
              Superadmin controls
            </p>
            <h2 className="mt-3 max-w-2xl text-2xl font-semibold text-[#062f3d] md:text-3xl">
              Create trusted admins for the MedFlow workspace.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#55717b]">
              New admins can review doctors, manage appointments, patients,
              invoices, and operational records. Superadmin rights are not
              granted from this page.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/75 bg-[#d9edbd]/80 px-4 py-4 shadow-sm backdrop-blur-xl">
              <p className="text-xs font-medium text-[#55717b]">Total admins</p>
              <p className="mt-2 text-2xl font-semibold text-[#062f3d]">
                {loading ? "..." : admins.length}
              </p>
            </div>
            <div className="rounded-2xl border border-white/75 bg-[#bfe0f2]/80 px-4 py-4 shadow-sm backdrop-blur-xl">
              <p className="text-xs font-medium text-[#55717b]">Created admins</p>
              <p className="mt-2 text-2xl font-semibold text-[#062f3d]">
                {loading ? "..." : regularAdmins}
              </p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-[var(--error-bg)] px-4 py-3 text-sm text-[var(--error)]">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-2xl border border-green-200 bg-[var(--success-bg)] px-4 py-3 text-sm text-[var(--success)]">
          {success}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card padding="lg" className="border-white/70 bg-white/75 shadow-[0_18px_50px_rgba(24,86,115,0.10)] backdrop-blur-xl">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-[#062f3d]">Create admin</h2>
            <p className="mt-1 text-xs text-[#55717b]">
              This creates an active website admin account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              autoComplete="email"
              required
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              autoComplete="tel"
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              autoComplete="new-password"
              required
            />
            <Input
              label="Confirm password"
              type="password"
              value={form.confirm_password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, confirm_password: e.target.value }))
              }
              autoComplete="new-password"
              required
            />
            <Button type="submit" variant="primary" loading={saving}>
              Create admin
            </Button>
          </form>
        </Card>

        <Card padding="lg" className="border-white/70 bg-white/75 shadow-[0_18px_50px_rgba(24,86,115,0.10)] backdrop-blur-xl">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-[#062f3d]">Admin accounts</h2>
              <p className="mt-1 text-xs text-[#55717b]">
                Superadmin and created website admins.
              </p>
            </div>
            <Badge variant="neutral">{loading ? "..." : admins.length} total</Badge>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-[#55717b]">
              <Spinner size="sm" /> Loading admins...
            </div>
          ) : admins.length === 0 ? (
            <div className="rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/80 px-4 py-8 text-center">
              <p className="text-sm font-semibold text-[#062f3d]">No admins found</p>
              <p className="mt-1 text-xs text-[#55717b]">
                Created admins will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex flex-col gap-3 rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/80 px-4 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-[#062f3d]">
                        {admin.email}
                      </p>
                      {admin.is_super_admin && <Badge variant="warning">Superadmin</Badge>}
                      <Badge variant={admin.is_active ? "success" : "neutral"} dot>
                        {admin.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-[#55717b]">
                      {admin.phone ?? "No phone"} - Created {formatDate(admin.created_at)}
                    </p>
                  </div>
                  <Badge variant={admin.is_verified ? "success" : "warning"} dot>
                    {admin.is_verified ? "Verified" : "Unverified"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
