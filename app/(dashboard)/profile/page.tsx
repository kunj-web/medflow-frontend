"use client";

import PageHeader from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import { getInitials } from "@/lib/utils";

function displayValue(value?: string | null) {
  return value || "-";
}

export default function ProfilePage() {
  const { user } = useAuth();
  const fullName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const roleLabel = user?.role?.replace("_", " ") ?? "-";

  return (
    <div>
      <PageHeader
        title="Profile"
        subtitle="Your account details"
      />

      <Card padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-[var(--border)]">
          <div className="w-14 h-14 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-base font-semibold text-[var(--accent)] shrink-0">
            {getInitials(user?.first_name ?? "U", user?.last_name)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] truncate">
                {fullName || "User"}
              </h2>
              <Badge variant="info" className="capitalize">
                {roleLabel}
              </Badge>
            </div>
            <p className="text-sm text-[var(--text-muted)] mt-1 truncate">
              {displayValue(user?.email)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 pt-6">
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)]">
              First name
            </p>
            <p className="text-sm text-[var(--text-primary)] mt-1">
              {displayValue(user?.first_name)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)]">
              Last name
            </p>
            <p className="text-sm text-[var(--text-primary)] mt-1">
              {displayValue(user?.last_name)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)]">
              Email
            </p>
            <p className="text-sm text-[var(--text-primary)] mt-1 break-all">
              {displayValue(user?.email)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)]">
              Account status
            </p>
            <p className="text-sm text-[var(--text-primary)] mt-1 capitalize">
              {displayValue(user?.status)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
