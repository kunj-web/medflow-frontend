const stats = [
  { value: "500+", label: "Appointments managed daily" },
  { value: "Multi-tenant", label: "Hospital isolation built-in" },
  { value: "FCM + Email", label: "Push & email notifications" },
  { value: "RBAC", label: "Role-based access control" },
];

export default function TrustStrip() {
  return (
    <section className="py-16 bg-[var(--gray-950)]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.value} className="flex flex-col gap-1">
              <span className="font-mono font-medium text-2xl text-white">
                {s.value}
              </span>
              <span className="text-sm text-[var(--gray-400)]">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
