import Link from "next/link";

const footerColumns = [
  {
    title: "Company",
    links: ["About Us", "Doctors", "Appointments", "Blog", "FAQ"],
  },
  {
    title: "Services",
    links: ["General Consultation", "Preventive Care", "Emergency Support", "Specialist Visits", "Home Healthcare"],
  },
  {
    title: "Quick Links",
    links: ["Help Center", "Patient Portal", "Insurance & Billing", "Terms & Conditions", "Privacy Policy"],
  },
];

export default function LandingFooter() {
  return (
    <footer className="bg-[#dceff5] px-4 pb-10">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[30px] border border-white/55 bg-white/48 px-7 pb-8 pt-14 text-[#052f3a] shadow-[0_26px_80px_rgba(6,68,88,0.12)] backdrop-blur-2xl md:px-12">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[clamp(5rem,16vw,13rem)] font-semibold leading-none text-[#075f8b]/10">
          <span className="rounded-[32px] border border-white/45 bg-white/20 px-8 py-3 backdrop-blur-xl">
            MedFlow
          </span>
        </div>

        <div className="relative z-10 grid gap-10 md:grid-cols-2 xl:grid-cols-[1.2fr_0.8fr_1fr_1fr_1.35fr]">
          <div className="min-w-0">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#80c3cf]/70 bg-white/45 text-[#075f8b] backdrop-blur-xl">
                <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2v4M8 10v4M2 8h4M10 8h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </span>
              <span className="text-xl font-semibold">MedFlow</span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-[#244954]">
              A calm healthcare operations platform for appointments, schedules,
              billing, patient records, and role-aware dashboards.
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title} className="min-w-0">
              <h3 className="text-sm font-semibold text-[#052f3a]">{column.title}</h3>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link}>
                    <a href="#features" className="text-sm text-[#244954] transition-colors hover:text-[#0a9f9b]">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[#052f3a]">Contact Us</h3>
            <div className="mt-5 space-y-3 text-sm text-[#244954]">
              <p>Phone: +91 98765 43210</p>
              <p>Email: support@medflow.local</p>
              <p>Address: Healthcare Street, City Center</p>
            </div>
            <div className="mt-6 flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="h-10 min-w-0 flex-1 rounded-full border border-white/55 bg-white/35 px-4 text-sm text-[#052f3a] placeholder:text-[#335f6b] shadow-sm backdrop-blur-xl outline-none focus:border-[#18b7ae]"
              />
              <Link
                href="/register"
                className="inline-flex h-10 items-center rounded-full border border-[#80c3cf]/70 bg-[#c8eee6]/75 px-5 text-sm font-semibold text-[#052f3a] shadow-sm backdrop-blur-xl transition-colors hover:bg-[#b9e7df]"
              >
                Subscribe
              </Link>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-12 flex flex-col gap-4 border-t border-[#80c3cf]/35 pt-6 text-xs text-[#335f6b] md:flex-row md:items-center md:justify-between">
          <p>Copyright © MedFlow. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-[#0a9f9b]">Login</Link>
            <Link href="/register" className="hover:text-[#0a9f9b]">Sign up</Link>
            <a href="#features" className="hover:text-[#0a9f9b]">Services</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
