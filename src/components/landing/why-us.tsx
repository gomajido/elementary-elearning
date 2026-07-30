import { GraduationCap, HeartHandshake, Sparkles, UserCheck } from "lucide-react";

import { schoolConfig } from "@/lib/school-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LANDING_ACCENT_CYCLE } from "@/lib/landing-colors";

const WHY_US_ICONS = [GraduationCap, HeartHandshake, Sparkles, UserCheck];

export function WhyUs() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-3xl font-bold text-[#0B6E4F]">Mengapa SD Madani</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">{schoolConfig.about}</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {schoolConfig.whyUs.map((item, i) => {
            const Icon = WHY_US_ICONS[i % WHY_US_ICONS.length];
            const color = LANDING_ACCENT_CYCLE[i % LANDING_ACCENT_CYCLE.length];
            return (
              <Card
                key={item.title}
                className="rounded-3xl border-none shadow-md ring-1 ring-black/5 transition-transform hover:-translate-y-1"
              >
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                  <div
                    className="flex size-14 shrink-0 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${color}1a`, color }}
                  >
                    <Icon className="size-7" />
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{item.description}</CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
