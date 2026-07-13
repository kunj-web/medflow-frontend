import Image from "next/image";
import type { CSSProperties } from "react";

const steps = [
  {
    title: "Schedule Online",
    description: "Book patient appointments in minutes.",
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
        <path d="M12 14v4M10 16h4" />
      </svg>
    ),
  },
  {
    title: "Meet Your Provider",
    description: "Consult virtually or in person.",
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 14a5 5 0 1 0-5-5 5 5 0 0 0 5 5z" />
        <path d="M4 22a8 8 0 0 1 16 0" />
      </svg>
    ),
  },
  {
    title: "Get Personalized Care",
    description: "Track notes, invoices, and ongoing support.",
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
        <path d="M12 8v5M9.5 10.5h5" />
      </svg>
    ),
  },
  {
    title: "Follow-Up & Support",
    description: "Keep bookings and care plans on track.",
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 18a5 5 0 0 0-10 0" />
        <circle cx="12" cy="9" r="4" />
        <path d="M19 8v6M22 11h-6" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#dceff5] px-4 pb-16">
      <div className="mx-auto max-w-6xl rounded-[30px] border border-white/55 bg-white/62 px-7 py-16 shadow-[0_26px_80px_rgba(6,68,88,0.08)] backdrop-blur-2xl md:px-12 md:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1fr]">
          <div className="relative min-h-[500px] overflow-hidden rounded-[28px] border border-white/55 bg-white/35 shadow-[0_18px_42px_rgba(6,68,88,0.10)] backdrop-blur-xl">
            <Image
              src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=85"
              alt="Doctor consulting a family"
              fill
              sizes="(min-width: 1024px) 520px, 100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-white/70 backdrop-blur-sm" />
          </div>

          <div>
            <h2 className="mb-8 text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-[1.04] tracking-normal text-[#052f3a]">
              How It Works
            </h2>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <article
                  key={step.title}
                  className="flex items-center gap-4 rounded-[14px] border border-white/60 bg-white/50 px-5 py-4 shadow-[0_16px_38px_rgba(6,68,88,0.10)] backdrop-blur-xl transition-transform duration-200 hover:-translate-y-1 lg:ml-[calc(var(--offset)*1rem)]"
                  style={{ "--offset": index % 2 === 0 ? 0 : 2 } as CSSProperties}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/50 bg-[#e8f8f7]/70 text-[#052f3a] backdrop-blur-xl">
                    {step.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#052f3a]">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm text-[#244954]">
                      {step.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
