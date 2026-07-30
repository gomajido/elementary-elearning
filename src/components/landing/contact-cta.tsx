import { MapPin, Phone, Mail } from "lucide-react";

import { schoolConfig } from "@/lib/school-config";
import { LANDING_ACCENT_CYCLE } from "@/lib/landing-colors";

const ROWS = [
  { icon: MapPin, value: schoolConfig.contact.address },
  { icon: Phone, value: schoolConfig.contact.phone },
  { icon: Mail, value: schoolConfig.contact.email },
];

export function ContactCTA() {
  return (
    <section id="contact" className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h2 className="text-3xl font-bold text-[#0B6E4F]">Hubungi Kami</h2>
      <p className="mt-2 text-muted-foreground">
        Tertarik mendaftarkan putra/putri Anda? Hubungi kami dan pihak sekolah akan segera merespons.
      </p>
      <dl className="mx-auto mt-6 flex max-w-sm flex-col gap-3 text-left text-sm">
        {ROWS.map(({ icon: Icon, value }, i) => {
          const color = LANDING_ACCENT_CYCLE[i % LANDING_ACCENT_CYCLE.length];
          return (
            <div key={value} className="flex items-center gap-3">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${color}1a`, color }}
              >
                <Icon className="size-4" />
              </span>
              <dd className="text-muted-foreground">{value}</dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
