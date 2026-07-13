import LandingNav from "@/components/landing/LandingNav";
import Hero from "@/components/landing/Hero";
import AboutSection from "@/components/landing/AboutSection";
import FeatureStrip from "@/components/landing/FeatureStrip";
import HowItWorks from "@/components/landing/HowItWorks";
import TrustStrip from "@/components/landing/TrustStrip";
import LandingFooter from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#dceff5]">
      <LandingNav />
      <main>
        <Hero />
        <AboutSection />
        <FeatureStrip />
        <HowItWorks />
        <TrustStrip />
      </main>
      <LandingFooter />
    </div>
  );
}
