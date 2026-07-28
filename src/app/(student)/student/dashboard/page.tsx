import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentDashboardPage() {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Selamat datang!</CardTitle>
      </CardHeader>
      <CardContent className="text-base text-muted-foreground">
        Lihat kursus dan kuismu di menu Kursus.
      </CardContent>
    </Card>
  );
}
