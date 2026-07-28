import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ParentDashboardPage() {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Parent dashboard</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Your children&apos;s grades, attendance, and fees land here in Phase 2.
      </CardContent>
    </Card>
  );
}
