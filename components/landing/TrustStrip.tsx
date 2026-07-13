import Image from "next/image";

export default function TrustStrip() {
  return (
    <section id="contact" className="bg-[#dceff5] px-4 pb-8">
      <div className="mx-auto max-w-6xl rounded-[30px] border border-white/55 bg-white/62 px-5 pt-10 shadow-[0_26px_80px_rgba(6,68,88,0.08)] backdrop-blur-2xl md:px-8">
        <div className="relative overflow-hidden rounded-[28px] border border-white/45 bg-[#b9ddf1]/72 px-7 py-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-xl md:min-h-[300px] md:px-12 md:py-12">
          <div className="relative z-10 max-w-[520px]">
            <h2 className="max-w-[360px] text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.05] tracking-normal text-[#052f3a]">
              Get In Touch With Us Today!
            </h2>

            <form className="mt-8 grid max-w-[420px] gap-3" action="#">
              <input
                type="text"
                placeholder="Full Name"
                className="h-11 rounded-full border border-white/55 bg-white/35 px-5 text-sm text-[#052f3a] placeholder:text-[#335f6b] shadow-sm backdrop-blur-xl outline-none transition-colors focus:border-[#18b7ae] focus:bg-white/65"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                className="h-11 rounded-full border border-white/55 bg-white/35 px-5 text-sm text-[#052f3a] placeholder:text-[#335f6b] shadow-sm backdrop-blur-xl outline-none transition-colors focus:border-[#18b7ae] focus:bg-white/65"
              />
              <select
                defaultValue=""
                className="h-11 rounded-full border border-white/55 bg-white/35 px-5 text-sm text-[#052f3a] shadow-sm backdrop-blur-xl outline-none transition-colors focus:border-[#18b7ae] focus:bg-white/65"
              >
                <option value="" disabled>
                  Select Service
                </option>
                <option>Appointments</option>
                <option>Doctor Schedules</option>
                <option>Billing & Records</option>
              </select>
              <button
                type="button"
                className="mt-2 h-11 w-fit rounded-full border border-[#80c3cf]/70 bg-[#c8eee6]/75 px-7 text-sm font-semibold text-[#052f3a] shadow-[0_14px_28px_rgba(24,183,174,0.18)] backdrop-blur-xl transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#b9e7df]"
              >
                Submit Request
              </button>
            </form>
          </div>

          <div className="pointer-events-none absolute bottom-0 right-4 hidden h-[110%] w-[38%] lg:block">
            <div className="absolute bottom-0 right-0 h-[88%] w-full rounded-t-full border border-white/45 bg-[#c9eee8]/70 backdrop-blur-xl" />
            <Image
              src="https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=760&q=85"
              alt=""
              fill
              sizes="(min-width: 768px) 42vw, 100vw"
              className="object-cover object-top mix-blend-normal"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
