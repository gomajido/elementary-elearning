"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fredoka } from "next/font/google";
import { LogOut } from "lucide-react";

import { logoutAction } from "@/server/controllers/auth-controller";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PLAYFUL_COLORS, type PlayfulColor } from "@/lib/playful-colors";

const fredoka = Fredoka({ variable: "--font-playful", subsets: ["latin"], weight: ["500", "600", "700"] });

export type StudentNavItem = { href: string; label: string; icon: ReactNode; color: PlayfulColor };

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
    <div className={cn(fredoka.variable, "flex min-h-screen flex-col bg-muted/30 text-base")}>
      <header className="flex items-center justify-between bg-gradient-to-br from-student-accent to-sky-500 px-4 py-5 text-student-accent-foreground">
        <div>
          <p className="font-[family-name:var(--font-playful)] text-2xl font-semibold">Halo! 🌟</p>
          <p className="text-sm opacity-90">{email}</p>
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

      <nav className="fixed inset-x-0 bottom-0 flex gap-1 border-t bg-background px-2 py-2 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-xs font-semibold transition-colors",
                active ? PLAYFUL_COLORS[item.color].solid : "text-muted-foreground",
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
