"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { logoutAction } from "@/server/controllers/auth-controller";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type StudentNavItem = { href: string; label: string; icon: ReactNode };

export function StudentShell({
  email,
  navItems,
  children,
}: {
  email: string;
  navItems: StudentNavItem[];
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-muted/30 text-base">
      <header className="flex items-center justify-between bg-student-accent px-4 py-4 text-student-accent-foreground">
        <div>
          <p className="text-lg font-bold">Halo! 👋</p>
          <p className="text-sm opacity-80">{email}</p>
        </div>
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="outline"
            size="icon"
            className="rounded-full border-student-accent-foreground/30 bg-student-accent-foreground/10 text-student-accent-foreground hover:bg-student-accent-foreground/20"
          >
            <LogOut className="size-5" />
            <span className="sr-only">Keluar</span>
          </Button>
        </form>
      </header>

      <main className="flex-1 p-4 pb-24">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 flex border-t bg-background px-2 py-2 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-xs font-semibold transition-colors",
                active ? "bg-student-accent text-student-accent-foreground" : "text-muted-foreground",
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
