import Link from "next/link";
import Image from "next/image";

import { schoolConfig } from "@/lib/school-config";
import { Button } from "@/components/ui/button";
import logo from "@/app/logo.png";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b bg-gradient-to-br from-[#8DC63F]/15 via-background to-[#0B6E4F]/10 px-6 py-24 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-[#8DC63F]/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-10 size-80 rounded-full bg-[#0B6E4F]/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/3 size-56 rounded-full bg-accent/20 blur-3xl"
      />

      <div className="relative mx-auto mb-6 flex size-28 items-center justify-center rounded-[2rem] bg-white p-4 shadow-lg ring-4 ring-white">
        <Image src={logo} alt={schoolConfig.name} className="h-full w-full object-contain" priority />
      </div>
      <h1 className="relative text-4xl font-bold tracking-tight text-[#0B6E4F] sm:text-6xl">{schoolConfig.name}</h1>
      <p className="relative mx-auto mt-4 max-w-xl text-lg text-muted-foreground sm:text-xl">{schoolConfig.tagline}</p>
      <div className="relative mt-8 flex flex-wrap justify-center gap-3">
        <Button
          size="lg"
          nativeButton={false}
          render={<Link href="/login" />}
          className="rounded-full bg-[#0B6E4F] px-8 text-white shadow-md hover:bg-[#0B6E4F]/90"
        >
          Masuk ke Portal
        </Button>
        <Button
          size="lg"
          variant="outline"
          nativeButton={false}
          render={<Link href="#contact" />}
          className="rounded-full border-2 border-[#0B6E4F] px-8 text-[#0B6E4F] hover:bg-[#0B6E4F]/10"
        >
          Tanya Info Pendaftaran
        </Button>
      </div>
    </section>
  );
}
