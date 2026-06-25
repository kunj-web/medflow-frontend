import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import DashboardRouteGuard from "@/components/dashboard/DashboardRouteGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-base)]">
      {/* Sidebar — sticky, full height */}
      <Sidebar />

      {/* Main area — scrollable */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <DashboardRouteGuard>{children}</DashboardRouteGuard>
          </div>
        </main>
      </div>
    </div>
  );
}
