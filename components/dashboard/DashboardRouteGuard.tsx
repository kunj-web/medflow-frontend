"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/common";
import { SkeletonCard } from "@/components/ui/Skeleton";

interface DashboardRouteGuardProps {
  children: React.ReactNode;
}

const ROUTE_RULES: { prefix: string; roles: UserRole[]; superAdminOnly?: boolean }[] = [
  { prefix: "/admins", roles: [UserRole.ADMIN], superAdminOnly: true },
  { prefix: "/admin-review", roles: [UserRole.ADMIN] },
  { prefix: "/audit-trail", roles: [UserRole.ADMIN] },
  { prefix: "/my-schedule", roles: [UserRole.DOCTOR] },
  { prefix: "/doctors", roles: [UserRole.ADMIN] },
  { prefix: "/invoices", roles: [UserRole.ADMIN, UserRole.PATIENT] },
  { prefix: "/patients", roles: [UserRole.ADMIN] },
  { prefix: "/appointments", roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT] },
  { prefix: "/dashboard", roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT] },
  { prefix: "/profile", roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT] },
];

function routeRuleFor(pathname: string) {
  return ROUTE_RULES.find(
    (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)
  );
}

export default function DashboardRouteGuard({ children }: DashboardRouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loaded } = useAuth();

  const routeRule = useMemo(() => routeRuleFor(pathname), [pathname]);
  const allowedRoles = useMemo(
    () =>
      routeRule?.roles ?? [
        UserRole.ADMIN,
        UserRole.DOCTOR,
        UserRole.PATIENT,
      ],
    [routeRule]
  );
  const isAllowed =
    !!user &&
    user.status === "active" &&
    allowedRoles.includes(user.role as UserRole) &&
    (!routeRule?.superAdminOnly || user.is_super_admin);

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

    if (
      !allowedRoles.includes(user.role as UserRole) ||
      (routeRule?.superAdminOnly && !user.is_super_admin)
    ) {
      router.replace("/dashboard");
    }
  }, [allowedRoles, loaded, pathname, routeRule?.superAdminOnly, router, user]);

  if (!loaded) {
    return (
      <div className="grid gap-4 p-6">
        <SkeletonCard />
        <SkeletonCard />
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
