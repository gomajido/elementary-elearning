import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { PLAYFUL_COLORS, type PlayfulColor } from "@/lib/playful-colors";

/** Colorful stat tile for the student portal only — the shared StatCard stays plain for admin/teacher/parent. */
export function PlayfulStatTile({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  color: PlayfulColor;
}) {
  return (
    <Card className={`rounded-3xl border-none ${PLAYFUL_COLORS[color].soft}`}>
      <CardContent className="flex flex-col items-center gap-2 py-5 text-center">
        <div className={`flex size-12 shrink-0 items-center justify-center rounded-full ${PLAYFUL_COLORS[color].solid}`}>
          <Icon className="size-6" />
        </div>
        <p className="font-[family-name:var(--font-playful)] text-2xl font-semibold leading-tight">{value}</p>
        <p className="text-xs font-medium">{label}</p>
      </CardContent>
    </Card>
  );
}
