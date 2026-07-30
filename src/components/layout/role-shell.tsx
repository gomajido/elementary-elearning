"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, LogOut } from "lucide-react";

import { logoutAction } from "@/server/controllers/auth-controller";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import logo from "@/app/logo.png";

export type RoleNavItem = { href: string; label: string; icon: ReactNode };

function NavLinks({ navItems, pathname, onNavigate }: { navItems: RoleNavItem[]; pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function RoleShell({
  roleLabel,
  email,
  navItems,
  children,
}: {
  roleLabel: string;
  email: string;
  navItems?: RoleNavItem[];
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-muted/30">
      {navItems && (
        <aside className="hidden w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex print:hidden">
          <div className="border-b border-sidebar-border px-4 py-4">
            <div className="mb-2 inline-block rounded-md bg-white p-1.5">
              <Image src={logo} alt="Madani Islamic School" className="h-8 w-auto object-contain" />
            </div>
            <p className="text-xs text-sidebar-foreground/70">Portal {roleLabel}</p>
          </div>
          <NavLinks navItems={navItems} pathname={pathname} />
          <div className="border-t border-sidebar-border p-3 text-xs text-sidebar-foreground/70">{email}</div>
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-background px-4 py-3 md:px-6 print:hidden">
          <div className="flex items-center gap-3">
            {navItems && (
              <Sheet>
                <SheetTrigger
                  render={
                    <Button variant="outline" size="icon-sm" className="md:hidden" />
                  }
                >
                  <Menu className="size-4" />
                  <span className="sr-only">Buka menu</span>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 bg-sidebar text-sidebar-foreground p-0">
                  <SheetTitle className="sr-only">Menu {roleLabel}</SheetTitle>
                  <div className="border-b border-sidebar-border px-4 py-4">
                    <div className="mb-2 inline-block rounded-md bg-white p-1.5">
                      <Image src={logo} alt="Madani Islamic School" className="h-8 w-auto object-contain" />
                    </div>
                    <p className="text-xs text-sidebar-foreground/70">Portal {roleLabel}</p>
                  </div>
                  <NavLinks navItems={navItems} pathname={pathname} />
                </SheetContent>
              </Sheet>
            )}
            <div className="md:hidden">
              <p className="text-sm font-medium">Portal {roleLabel}</p>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-muted-foreground">{email}</p>
            </div>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              <LogOut className="size-4" />
              Keluar
            </Button>
          </form>
        </header>
        <main className="flex-1 p-4 md:p-6 print:p-0">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
