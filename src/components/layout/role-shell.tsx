import type { ReactNode } from "react";
import Link from "next/link";

import { logoutAction } from "@/server/controllers/auth-controller";
import { Button } from "@/components/ui/button";

export function RoleShell({
  roleLabel,
  email,
  navItems,
  children,
}: {
  roleLabel: string;
  email: string;
  navItems?: { href: string; label: string }[];
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/20">
      <header className="flex items-center justify-between border-b bg-background px-6 py-3">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm font-medium">{roleLabel} portal</p>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
          {navItems && (
            <nav className="flex gap-4">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="text-sm text-muted-foreground hover:text-foreground">
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
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
