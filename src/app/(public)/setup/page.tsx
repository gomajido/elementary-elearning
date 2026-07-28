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
          <CardTitle>{adminExists ? "Setup complete" : "Create admin account"}</CardTitle>
          <CardDescription>
            {adminExists
              ? "An admin account already exists for this school."
              : "One-time setup — this creates the first admin account. Disabled after."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {adminExists ? (
            <Link href="/login" className="text-sm underline underline-offset-4">
              Go to sign in
            </Link>
          ) : (
            <BootstrapAdminForm />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
