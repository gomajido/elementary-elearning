import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeacherDashboardPage() {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Dasbor Guru</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Gunakan menu di atas untuk kehadiran kelas dan kursus Anda.
      </CardContent>
    </Card>
  );
}
