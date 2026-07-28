import { requireUser } from "@/lib/auth/rbac";
import { ChangePasswordForm } from "@/components/forms/change-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ChangePasswordPage() {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Ubah kata sandi Anda</CardTitle>
          <CardDescription>
            {user.mustChangePassword
              ? "Akun Anda dibuat dengan kata sandi sementara. Buat kata sandi baru untuk melanjutkan."
              : "Perbarui kata sandi Anda di bawah ini."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
