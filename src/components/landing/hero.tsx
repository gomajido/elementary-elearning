import Link from "next/link";

import { schoolConfig } from "@/lib/school-config";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="border-b bg-muted/30 px-6 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{schoolConfig.name}</h1>
      <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">{schoolConfig.tagline}</p>
      <div className="mt-8 flex justify-center gap-3">
        <Button size="lg" nativeButton={false} render={<Link href="#contact" />}>
          Tanya Info Pendaftaran
        </Button>
        <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/login" />}>
          Masuk
        </Button>
      </div>
    </section>
  );
}
