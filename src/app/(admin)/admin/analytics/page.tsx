import { ClipboardCheck, Wallet, Award, Users } from "lucide-react";

import { requireRole } from "@/lib/auth/rbac";
import { AnalyticsService } from "@/server/services/analytics-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/dashboard/stat-card";

function formatCents(cents: number) {
  return `Rp${(cents / 100).toLocaleString("id-ID")}`;
}

function formatPct(pct: number) {
  return `${pct.toFixed(1)}%`;
}

export default async function AnalyticsPage() {
  await requireRole(["admin"]);

  const [attendance, fees, grades, enrollment] = await Promise.all([
    AnalyticsService.attendanceSummary(),
    AnalyticsService.feeSummary(),
    AnalyticsService.gradeSummary(),
    AnalyticsService.enrollmentSummary(),
  ]);

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Analitik</h1>
        <p className="text-sm text-muted-foreground">Ringkasan kehadiran, biaya, nilai, dan siswa sekolah.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={ClipboardCheck} label="Tingkat Kehadiran (bulan ini)" value={formatPct(attendance.schoolWideRate)} />
        <StatCard icon={Wallet} label="Tingkat Penagihan" value={formatPct(fees.collectionRate)} />
        <StatCard icon={Award} label="Rata-rata Nilai" value={formatPct(grades.schoolWideAveragePct)} />
        <StatCard icon={Users} label="Siswa Aktif" value={enrollment.totalActive} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kehadiran per Kelas (bulan ini)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kelas</TableHead>
                <TableHead>Hadir</TableHead>
                <TableHead>Absen</TableHead>
                <TableHead>Terlambat</TableHead>
                <TableHead>Izin</TableHead>
                <TableHead>Tingkat Kehadiran</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.perClass.map((row) => (
                <TableRow key={row.classId}>
                  <TableCell>{row.className}</TableCell>
                  <TableCell>{row.present}</TableCell>
                  <TableCell>{row.absent}</TableCell>
                  <TableCell>{row.late}</TableCell>
                  <TableCell>{row.excused}</TableCell>
                  <TableCell>{formatPct(row.rate)}</TableCell>
                </TableRow>
              ))}
              {attendance.perClass.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Belum ada data kehadiran bulan ini
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Biaya</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Tagihan</p>
            <p className="text-lg font-semibold">{formatCents(fees.totalBilledCents)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Terkumpul</p>
            <p className="text-lg font-semibold">{formatCents(fees.totalCollectedCents)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Tunggakan</p>
            <p className="text-lg font-semibold">{formatCents(fees.totalOutstandingCents)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nilai Rata-rata per Mata Pelajaran</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mata Pelajaran</TableHead>
                <TableHead>Rata-rata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.perSubject.map((row) => (
                <TableRow key={row.subjectId}>
                  <TableCell>{row.subjectName}</TableCell>
                  <TableCell>{formatPct(row.averagePct)}</TableCell>
                </TableRow>
              ))}
              {grades.perSubject.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    Belum ada nilai
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Siswa per Kelas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kelas</TableHead>
                <TableHead>Jumlah Siswa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollment.perClass.map((row) => (
                <TableRow key={row.classId}>
                  <TableCell>{row.className}</TableCell>
                  <TableCell>{row.count}</TableCell>
                </TableRow>
              ))}
              {enrollment.perClass.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    Belum ada siswa
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pendaftaran per Tahun Ajaran</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tahun Ajaran</TableHead>
                <TableHead>Jumlah Siswa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollment.perYear.map((row) => (
                <TableRow key={row.academicYearId}>
                  <TableCell>{row.academicYearName}</TableCell>
                  <TableCell>{row.count}</TableCell>
                </TableRow>
              ))}
              {enrollment.perYear.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    Belum ada data pendaftaran
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
