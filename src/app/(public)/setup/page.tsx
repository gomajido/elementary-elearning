import Link from "next/link";

import { AuthService } from "@/server/services/auth-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BootstrapAdminForm } from "@/components/forms/bootstrap-admin-form";

export default async function SetupPage() {
  const adminExists = await AuthService.adminExists();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
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
