import { BookOpen, Users, Trophy } from "lucide-react";

import { schoolConfig } from "@/lib/school-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LANDING_ACCENT_CYCLE } from "@/lib/landing-colors";

const PROGRAM_ICONS = [BookOpen, Users, Trophy];

export function Programs() {
  return (
    <section className="bg-[#8DC63F]/10 px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-3xl font-bold text-[#0B6E4F]">Program</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {schoolConfig.programs.map((program, i) => {
            const Icon = PROGRAM_ICONS[i % PROGRAM_ICONS.length];
            const color = LANDING_ACCENT_CYCLE[i % LANDING_ACCENT_CYCLE.length];
            return (
              <Card
                key={program.name}
                className="rounded-3xl border-none bg-white shadow-md ring-1 ring-black/5 transition-transform hover:-translate-y-1"
              >
                <CardHeader>
                  <div
                    className="mb-1 flex size-14 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${color}1a`, color }}
                  >
                    <Icon className="size-7" />
                  </div>
                  <CardTitle className="text-lg">{program.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{program.description}</CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
