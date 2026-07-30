import { Hero } from "@/components/landing/hero";
import { WhyUs } from "@/components/landing/why-us";
import { Programs } from "@/components/landing/programs";
import { CtaBanner } from "@/components/landing/cta-banner";
import { ContactCTA } from "@/components/landing/contact-cta";

export default function LandingPage() {
  return (
    <main>
      <Hero />
      <WhyUs />
      <Programs />
      <CtaBanner />
      <ContactCTA />
    </main>
  );
}
