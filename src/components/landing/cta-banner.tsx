import Link from "next/link";

import { Button } from "@/components/ui/button";

export function CtaBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0B6E4F] to-[#0B6E4F]/80 px-6 py-16 text-center text-white">
      <div aria-hidden className="pointer-events-none absolute -top-16 -left-16 size-56 rounded-full bg-[#8DC63F]/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-10 -bottom-16 size-64 rounded-full bg-white/10 blur-3xl" />

      <h2 className="relative text-2xl font-bold sm:text-3xl">Siap bergabung dengan keluarga besar SD Madani?</h2>
      <p className="relative mx-auto mt-3 max-w-xl text-white/90">
        Sudah punya akun dari pihak sekolah? Masuk ke portal untuk memantau kehadiran, biaya, dan nilai anak Anda.
      </p>
      <div className="relative mt-6">
        <Button
          size="lg"
          nativeButton={false}
          render={<Link href="/login" />}
          className="rounded-full bg-[#8DC63F] px-8 text-[#0B6E4F] shadow-md hover:bg-[#8DC63F]/90"
        >
          Masuk ke Portal
        </Button>
      </div>
    </section>
  );
}
