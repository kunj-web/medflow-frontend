import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  accent?: boolean;
  className?: string;
}

export default function StatCard({
  label,
  value,
  icon,
  trend,
  accent = false,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "card p-5 flex flex-col gap-3",
        accent && "border-[var(--accent)] bg-[var(--accent)] text-white",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-xs font-medium uppercase tracking-wider",
            accent ? "text-blue-100" : "text-[var(--text-muted)]"
          )}
        >
          {label}
        </span>
        <div
          className={cn(
            "w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center",
            accent
              ? "bg-white/20 text-white"
              : "bg-[var(--accent-light)] text-[var(--accent)]"
          )}
        >
          {icon}
        </div>
      </div>

      <div className="flex items-end justify-between gap-2">
        <span
          className={cn(
            "font-mono text-2xl font-semibold leading-none",
            accent ? "text-white" : "text-[var(--text-primary)]"
          )}
        >
          {value}
        </span>

        {trend && (
          <span
            className={cn(
              "text-xs font-medium flex items-center gap-1 mb-0.5",
              trend.direction === "up" && !accent && "text-[var(--success)]",
              trend.direction === "down" && !accent && "text-[var(--error)]",
              trend.direction === "neutral" && "text-[var(--text-muted)]",
              accent && "text-blue-100"
            )}
          >
            {trend.direction === "up" && "↑"}
            {trend.direction === "down" && "↓"}
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
