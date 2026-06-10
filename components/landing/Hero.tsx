import Link from "next/link";
import Button from "@/components/ui/button";
import LiveTicker from "./LiveTicker";

export default function Hero() {
  return (
    <section className="pt-32 pb-0 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Eyebrow */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--accent-light)] bg-[var(--accent-light)] text-xs font-medium text-[var(--accent)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            Built for Indian hospitals
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display text-center text-[clamp(2.4rem,5vw,4rem)] leading-[1.1] text-[var(--text-primary)] max-w-3xl mx-auto text-balance mb-6">
          Every ward, every doctor,
          <br />
          <em className="not-italic text-[var(--accent)]">one operations layer.</em>
        </h1>

        {/* Sub-headline */}
        <p className="text-center text-[var(--text-secondary)] text-lg max-w-xl mx-auto leading-relaxed mb-8">
          MedFlow gives hospitals a single platform to manage appointments, billing,
          doctor schedules, and patient records — with no data bleeding between tenants.
        </p>

        {/* CTAs */}
        <div className="flex items-center justify-center gap-3 flex-wrap mb-16">
          <Link href="/login">
            <Button variant="primary" size="lg">
              Login to your portal
              <svg
                className="ml-1 w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </Link>
          <a href="#features">
            <Button variant="outline" size="lg">
              See what's included
            </Button>
          </a>
        </div>

        {/* Trust row */}
        <div className="flex items-center justify-center gap-8 flex-wrap mb-12">
          {[
            { stat: "100%", label: "Multi-tenant isolation" },
            { stat: "Real-time", label: "slot management" },
            { stat: "INR", label: "native billing" },
          ].map((item) => (
            <div key={item.stat} className="flex items-center gap-2">
              <span className="font-mono font-medium text-sm text-[var(--accent)]">
                {item.stat}
              </span>
              <span className="text-sm text-[var(--text-muted)]">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live ticker — full width below hero content */}
      {/* <LiveTicker /> */}
    </section>
  );
}