const services = [
  {
    title: "General Consultation",
    description: "Expert guidance for everyday health concerns and routine visits.",
    tint: "bg-[#dbeec3]",
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
        <path d="M7.5 7.5 5.8 5.8M16.5 7.5l1.7-1.7" />
      </svg>
    ),
  },
  {
    title: "Preventive Care",
    description: "Screenings, vaccinations, wellness checks, and follow-up reminders.",
    tint: "bg-[#ffc4dc]",
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21s-7-4.4-7-11a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 6.6-7 11-7 11z" />
        <path d="M12 8v5M9.5 10.5h5" />
      </svg>
    ),
  },
  {
    title: "Emergency Support",
    description: "Quick access to urgent cases, priority tokens, and care coordination.",
    tint: "bg-[#bedcf0]",
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 18a4 4 0 0 1 0-8 6 6 0 0 1 11.7-1.5A4.5 4.5 0 0 1 18 18H6z" />
        <path d="M12 9v5M9.5 11.5h5" />
      </svg>
    ),
  },
  {
    title: "Specialist Visits",
    description: "Connect patients with specialists across departments and clinics.",
    tint: "bg-[#c8eee6]",
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 14a5 5 0 1 0-5-5 5 5 0 0 0 5 5z" />
        <path d="M4 22a8 8 0 0 1 16 0" />
        <path d="M18 3v4M16 5h4" />
      </svg>
    ),
  },
];

export default function FeatureStrip() {
  return (
    <section id="features" className="bg-[#dceff5] px-4 pb-16">
      <div className="mx-auto max-w-6xl rounded-[30px] border border-white/55 bg-white/62 px-7 py-16 shadow-[0_26px_80px_rgba(6,68,88,0.08)] backdrop-blur-2xl md:px-12 md:py-20">
        <div className="mx-auto mb-10 max-w-xl text-center">
          <h2 className="text-balance text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[1.05] tracking-normal text-[#052f3a]">
            Comprehensive Care for Every Stage of Life
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {services.map((service) => (
            <article
              key={service.title}
              className="group overflow-hidden rounded-[14px] border border-white/55 bg-white/45 shadow-[0_18px_42px_rgba(6,68,88,0.10)] backdrop-blur-xl transition-transform duration-200 hover:-translate-y-1"
            >
              <div className={`${service.tint} flex min-h-[150px] flex-col justify-between bg-opacity-72 p-5 text-[#052f3a]`}>
                <div className="text-[#052f3a]">{service.icon}</div>
                <h3 className="max-w-[150px] text-lg font-semibold leading-[1.08]">
                  {service.title}
                </h3>
              </div>

              <div className="p-5">
                <p className="min-h-[64px] text-sm leading-relaxed text-[#244954]">
                  {service.description}
                </p>
                <a
                  href="/login"
                  className="mt-5 inline-flex h-8 items-center justify-center rounded-full border border-white/60 bg-white/35 px-4 text-xs font-semibold text-[#052f3a] backdrop-blur-xl transition-colors hover:border-[#18b7ae] hover:bg-white/65"
                >
                  Learn More
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
