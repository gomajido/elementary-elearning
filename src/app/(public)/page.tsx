import { Hero } from "@/components/landing/hero";
import { About } from "@/components/landing/about";
import { Programs } from "@/components/landing/programs";
import { ContactCTA } from "@/components/landing/contact-cta";

export default function LandingPage() {
  return (
    <main>
      <Hero />
      <About />
      <Programs />
      <ContactCTA />
    </main>
  );
}
