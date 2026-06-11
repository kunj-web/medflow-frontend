import LandingNav from "@/components/landing/LandingNav";
import Hero from "@/components/landing/Hero";
import FeatureStrip from "@/components/landing/FeatureStrip";
import HowItWorks from "@/components/landing/HowItWorks";
import TrustStrip from "@/components/landing/TrustStrip";
import LandingFooter from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      <main>
        <Hero />
        <FeatureStrip />
        <HowItWorks />
        <TrustStrip />
      </main>
      <LandingFooter />
    </div>
  );
}
