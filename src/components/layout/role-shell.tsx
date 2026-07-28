import type { ReactNode } from "react";

import { logoutAction } from "@/server/controllers/auth-controller";
import { Button } from "@/components/ui/button";

export function RoleShell({
  roleLabel,
  email,
  children,
}: {
  roleLabel: string;
  email: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/20">
      <header className="flex items-center justify-between border-b bg-background px-6 py-3">
        <div>
          <p className="text-sm font-medium">{roleLabel} portal</p>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
