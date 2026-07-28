import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Dasbor Admin</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Gunakan menu di atas untuk mengelola siswa, guru, kelas, kehadiran, dan biaya.
      </CardContent>
    </Card>
  );
}
