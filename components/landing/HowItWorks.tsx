const steps = [
  {
    step: "01",
    title: "Patients and doctors join the network",
    description:
      "Patients can create active accounts right away, while doctors submit their hospital or clinic affiliation for review before they start accepting bookings.",
  },
  {
    step: "02",
    title: "Onboard doctors and set schedules",
    description:
      "Add doctors with their specialization, working days, and hours. MedFlow generates available slots automatically. Leave days block out bookings.",
  },
  {
    step: "03",
    title: "Operations run through one dashboard",
    description:
      "Book appointments, issue invoices, track payments, and manage the patient queue from a single role-aware interface for admins, doctors, and staff.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-14 max-w-xl">
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--accent)] mb-3">
            How it works
          </p>
          <h2 className="font-display text-[clamp(1.8rem,3vw,2.5rem)] leading-tight text-[var(--text-primary)]">
            Up and running in a single afternoon.
          </h2>
        </div>

        <div className="flex flex-col md:flex-row gap-0 md:gap-0 relative">
          <div className="hidden md:block absolute top-7 left-[calc(16.67%+1px)] right-[calc(16.67%+1px)] h-px bg-[var(--border)] z-0" />

          {steps.map((s, i) => (
            <div key={s.step} className="flex-1 flex flex-col gap-4 relative z-10">
              <div className="flex md:block items-center gap-4 md:gap-0 mb-0 md:mb-4">
                <div className="w-14 h-14 rounded-full border-2 border-[var(--border)] bg-white flex items-center justify-center shrink-0">
                  <span className="font-mono text-sm font-medium text-[var(--accent)]">
                    {s.step}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className="md:hidden flex-1 h-px bg-[var(--border)]" />
                )}
              </div>

              <div className="md:pr-8">
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">{s.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {s.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
