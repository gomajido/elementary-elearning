import { requireUser } from "@/lib/auth/rbac";
import { ChangePasswordForm } from "@/components/forms/change-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ChangePasswordPage() {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Change your password</CardTitle>
          <CardDescription>
            {user.mustChangePassword
              ? "Your account was created with a temporary password. Set a new one to continue."
              : "Update your password below."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
