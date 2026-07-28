import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeacherDashboardPage() {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Teacher dashboard</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Class roster, attendance, and course tools land here in later phases.
      </CardContent>
    </Card>
  );
}
