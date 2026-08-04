import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { AuthService } from "@/server/services/auth-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BootstrapAdminForm } from "@/components/forms/bootstrap-admin-form";

// No cookies()/headers() touch here (unlike every protected page, which
// gets dynamic rendering for free via requireRole() reading the session
// cookie) — without this, Next has no per-request signal and prerenders
// the adminExists() check once at build time, baking in whatever the
// build environment's DB said instead of querying live. Caught via a real
// deploy: the built static snapshot (from local dev's seeded DB, which has
// an admin) was served by the Worker regardless of the real Neon state.
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const adminExists = await AuthService.adminExists();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="size-6" />
          </div>
          <CardTitle>{adminExists ? "Pengaturan selesai" : "Buat akun admin"}</CardTitle>
          <CardDescription>
            {adminExists
              ? "Akun admin untuk sekolah ini sudah ada."
              : "Pengaturan sekali jalan — ini membuat akun admin pertama. Dinonaktifkan setelahnya."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {adminExists ? (
            <Link href="/login" className="text-sm underline underline-offset-4">
              Ke halaman masuk
            </Link>
          ) : (
            <BootstrapAdminForm />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
