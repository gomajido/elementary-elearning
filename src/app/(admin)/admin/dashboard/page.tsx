import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Admin dashboard</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Student, teacher, class, and fee management modules land here in Phase 1.
      </CardContent>
    </Card>
  );
}
