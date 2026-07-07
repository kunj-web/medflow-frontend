"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/common";

interface DashboardRouteGuardProps {
  children: React.ReactNode;
}

const ROUTE_RULES: { prefix: string; roles: UserRole[] }[] = [
  { prefix: "/admin-review", roles: [UserRole.ADMIN] },
  { prefix: "/my-schedule", roles: [UserRole.DOCTOR] },
  { prefix: "/doctors", roles: [UserRole.ADMIN] },
  { prefix: "/invoices", roles: [UserRole.ADMIN] },
  { prefix: "/patients", roles: [UserRole.ADMIN] },
  { prefix: "/appointments", roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT] },
  { prefix: "/dashboard", roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT] },
  { prefix: "/profile", roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT] },
];

function allowedRolesFor(pathname: string): UserRole[] {
  return (
    ROUTE_RULES.find(
      (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)
    )?.roles ?? [UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT]
  );
}

export default function DashboardRouteGuard({ children }: DashboardRouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loaded } = useAuth();

  const allowedRoles = allowedRolesFor(pathname);
  const isAllowed =
    !!user &&
    user.status === "active" &&
    allowedRoles.includes(user.role as UserRole);

  useEffect(() => {
    if (!loaded) return;

    if (!user) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
      return;
    }

    if (user.status !== "active") {
      router.replace("/login");
      return;
    }

    if (!allowedRoles.includes(user.role as UserRole)) {
      router.replace("/dashboard");
    }
  }, [allowedRoles, loaded, pathname, router, user]);

  if (!loaded) {
    return (
      <div className="p-6 text-sm text-[var(--text-muted)]">
        Loading workspace...
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="p-6 text-sm text-[var(--text-muted)]">
        Redirecting...
      </div>
    );
  }

  return <>{children}</>;
}
