import { schoolConfig } from "@/lib/school-config";

export function About() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h2 className="text-2xl font-semibold">About us</h2>
      <p className="mt-4 text-muted-foreground">{schoolConfig.about}</p>
    </section>
  );
}
