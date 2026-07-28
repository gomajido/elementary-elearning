import { schoolConfig } from "@/lib/school-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Programs() {
  return (
    <section className="bg-muted/30 px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-2xl font-semibold">Program</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {schoolConfig.programs.map((program) => (
            <Card key={program.name}>
              <CardHeader>
                <CardTitle className="text-base">{program.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{program.description}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
