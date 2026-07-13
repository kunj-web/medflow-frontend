import Image from "next/image";
import Link from "next/link";

const TEAM_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=520&q=85",
    alt: "Medical team smiling in a hospital corridor",
    className: "row-span-2",
  },
  {
    src: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=420&q=85",
    alt: "Doctor in white coat",
    className: "",
  },
  {
    src: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=420&q=85",
    alt: "Clinician ready for patient care",
    className: "",
  },
];

export default function AboutSection() {
  return (
    <section id="about" className="bg-[#dceff5] px-4 pb-16">
      <div className="mx-auto max-w-6xl rounded-[30px] border border-white/55 bg-white/62 px-7 py-16 shadow-[0_26px_80px_rgba(6,68,88,0.08)] backdrop-blur-2xl md:px-12 md:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[0.92fr_1fr]">
          <div className="grid h-[420px] grid-cols-2 gap-3 md:h-[500px]">
            {TEAM_IMAGES.map((image) => (
              <div
                key={image.src}
                className={`relative overflow-hidden rounded-[24px] border border-white/55 bg-white/35 shadow-[0_16px_34px_rgba(6,68,88,0.10)] backdrop-blur-xl ${image.className}`}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 1024px) 280px, 50vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          <div className="max-w-[560px]">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#18a7a0]">
              About MedFlow
            </p>
            <h2 className="text-balance text-[clamp(2.15rem,4vw,4rem)] font-semibold leading-[1.06] tracking-normal text-[#052f3a]">
              We are more than just a platform; we are your dedicated health partner.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-[#244954] md:text-lg">
              MedFlow was founded on a simple belief: healthcare operations should
              be accessible, calm, and dependable for everyone. We help doctors,
              patients, and administrators work from one connected system without
              losing the human care at the center of every appointment.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="#features"
                className="inline-flex h-12 items-center justify-center rounded-full border border-[#80c3cf]/70 bg-[#c8eee6]/75 px-7 text-sm font-semibold text-[#052f3a] shadow-[0_14px_28px_rgba(24,183,174,0.18)] backdrop-blur-xl transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#b9e7df]"
              >
                Explore Our Values
              </Link>
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/60 bg-white/45 px-7 text-sm font-semibold text-[#052f3a] shadow-sm backdrop-blur-xl transition-colors hover:bg-white/70"
              >
                Join MedFlow
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
