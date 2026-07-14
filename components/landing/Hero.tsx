import Link from "next/link";
import Image from "next/image";

const SERVICE_CARDS = [
  {
    title: "Online Consultation",
    bg: "bg-[#d9edbd]",
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M8 21h8M12 17v4M8 10h4M8 14h8" />
        <path d="M16 8h3M17.5 6.5v3" />
      </svg>
    ),
  },
  {
    title: "Doctor Schedules",
    bg: "bg-[#ffc2dc]",
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M4 10h16" />
        <path d="M9 15h6M12 12v6" />
      </svg>
    ),
  },
  {
    title: "Billing & Records",
    bg: "bg-[#bfe0f2]",
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
        <path d="M14 2v5h5M9 13h6M9 17h4" />
      </svg>
    ),
  },
];

export default function Hero() {
  return (
    <section className="px-4 pt-28 pb-16 md:pt-32">
      <div className="mx-auto max-w-6xl rounded-[30px] border border-white/55 bg-white/62 px-3 pb-14 pt-3 shadow-[0_26px_80px_rgba(6,68,88,0.12)] backdrop-blur-2xl md:px-4 md:pb-20">
        <div className="relative overflow-hidden rounded-[28px] border border-white/45 bg-[#b9ddf1]/78 px-7 py-12 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-xl md:min-h-[520px] md:px-12 md:py-16">
          <div className="relative z-10 max-w-[560px]">
            <h1 className="text-balance text-[clamp(2.35rem,5.3vw,4.8rem)] font-semibold leading-[0.98] tracking-normal text-[#052f3a]">
              Expert & Passionate Healthcare, Right at Your Doorstep
            </h1>
            <p className="mt-6 max-w-[460px] text-base leading-relaxed text-[#244954] md:text-lg">
              Instantly connect with trusted doctors, manage appointments, and
              keep every patient record in one simple workspace.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-full border border-[#80c3cf]/70 bg-white/45 px-7 text-sm font-semibold text-[#052f3a] shadow-[0_14px_32px_rgba(6,68,88,0.14)] backdrop-blur-xl transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white/70"
            >
              Talk to a Doctor Now
            </Link>
          </div>

          <div className="pointer-events-none absolute bottom-0 right-0 hidden h-[88%] w-[58%] md:block">
            <div className="absolute inset-y-8 right-0 w-full overflow-hidden rounded-[90px_28px_28px_190px] bg-[#dceff5]">
              <Image
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=980&q=85"
                alt=""
                fill
                sizes="(min-width: 768px) 58vw, 100vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-[#dceff5]/10" />
            </div>
          </div>

          <div className="absolute bottom-0 left-[50%] hidden h-[58%] w-[34%] -translate-x-2 rounded-tl-[120px] bg-[#b9ddf1]/78 md:block" />
        </div>

        <div className="relative z-20 mt-5 grid gap-4 px-5 sm:grid-cols-3 md:mt-6 md:max-w-[610px] md:px-9">
          {SERVICE_CARDS.map((card, index) => (
            <Link
              key={card.title}
              href={index === 0 ? "/appointments" : "/dashboard"}
              className={`${card.bg} group flex min-h-[150px] flex-col justify-between rounded-[16px] border border-white/50 bg-opacity-75 p-5 text-[#052f3a] shadow-[0_16px_38px_rgba(6,68,88,0.14)] backdrop-blur-xl transition-transform duration-200 hover:-translate-y-1`}
            >
              <div>{card.icon}</div>
              <div className="flex items-end justify-between gap-3">
                <h2 className="max-w-[120px] text-lg font-semibold leading-[1.05]">
                  {card.title}
                </h2>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#052f3a]/45 text-sm transition-colors group-hover:bg-white/45 group-hover:text-[#052f3a]">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
