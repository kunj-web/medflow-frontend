const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <path d="M16 2v4M8 2v4M3 10h18"/>
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
      </svg>
    ),
    title: "Appointment Management",
    description:
      "Slot-based booking with doctor schedules, leave management, and live queue tokens. Double-booking is impossible by design.",
    highlights: ["Doctor schedule builder", "Slot availability in real-time", "Token-based queue system"],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    title: "Billing & Invoices",
    description:
      "Full invoice lifecycle from draft to paid. Supports partial payments, UPI, cash, card, and insurance. INR-native.",
    highlights: ["Line-item invoices (JSONB)", "Partial payment tracking", "UPI / Cash / Card / Insurance"],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
    title: "Doctors & Patients",
    description:
      "Onboard doctors with specializations and schedules. Manage patient records, history, existing conditions, and appointment trails.",
    highlights: ["Doctor schedule per day-of-week", "Patient appointment history", "Role-based access control"],
  },
];

export default function FeatureStrip() {
  return (
    <section id="features" className="py-24 bg-[var(--gray-50)]">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="mb-14 max-w-xl">
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--accent)] mb-3">
            Platform capabilities
          </p>
          <h2 className="font-display text-[clamp(1.8rem,3vw,2.5rem)] leading-tight text-[var(--text-primary)]">
            Everything a hospital needs,
            <br />nothing it doesn't.
          </h2>
        </div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="card p-6 flex flex-col gap-5 hover:shadow-md transition-shadow duration-200"
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center shrink-0">
                {f.icon}
              </div>

              {/* Text */}
              <div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{f.description}</p>
              </div>

              {/* Highlights */}
              <ul className="mt-auto flex flex-col gap-2">
                {f.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <svg
                      className="w-3.5 h-3.5 text-[var(--success)] shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}