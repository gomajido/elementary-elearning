import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GENDER_LABELS, label } from "@/lib/labels";
import type { studentRegistrationApplications } from "@/lib/db/schema";

export type RegistrationApplicationRow = typeof studentRegistrationApplications.$inferSelect;
export type RegistrationAchievementRow = { id: string; type: string; level: string; name: string; year: string; organizer: string };
export type RegistrationNonformalEducationRow = { id: string; type: string; organizerOrSource: string; startYear: string; endYear: string | null };

function DetailField({ fieldLabel, value }: { fieldLabel: string; value: string | number | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{fieldLabel}</span>
      <span className="text-sm">{value === null || value === undefined || value === "" ? "-" : value}</span>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-3">{children}</div>
    </div>
  );
}

/** Full Dapodik registration detail — shared between the registration approval queue and a student's own detail view. */
export function RegistrationDetailSections({
  application,
  subRecords,
}: {
  application: RegistrationApplicationRow;
  subRecords: { achievements: RegistrationAchievementRow[]; nonformalEducations: RegistrationNonformalEducationRow[] } | null;
}) {
  return (
    <div className="flex flex-col gap-6">
      <DetailSection title="Identitas Peserta Didik">
        <DetailField fieldLabel="Nama Lengkap" value={application.fullName} />
        <DetailField fieldLabel="Jenis Kelamin" value={label(GENDER_LABELS, application.gender)} />
        <DetailField fieldLabel="NISN" value={application.nisn} />
        <DetailField fieldLabel="NIS" value={application.nis} />
        <DetailField fieldLabel="NIK" value={application.nik} />
        <DetailField fieldLabel="Tempat Lahir" value={application.placeOfBirth} />
        <DetailField fieldLabel="Tanggal Lahir" value={application.dateOfBirth} />
        <DetailField fieldLabel="Agama" value={application.religion} />
        <DetailField fieldLabel="Kebutuhan Khusus" value={application.specialNeeds} />
        <DetailField fieldLabel="No. Akta Lahir" value={application.birthCertNumber} />
        <DetailField fieldLabel="Tingkat yang Dituju" value={application.appliedGradeLevel} />
        <DetailField fieldLabel="Program yang Dituju" value={application.appliedProgram} />
        <DetailField fieldLabel="Sekolah Asal (NPSN)" value={application.previousSchoolNpsn} />
        <DetailField fieldLabel="Nama Sekolah Asal" value={application.previousSchoolName} />
        <DetailField fieldLabel="No. Seri Ijazah" value={application.certificateSerialNumber} />
        <DetailField fieldLabel="No. Seri SKHUN" value={application.skhunSerialNumber} />
        <DetailField fieldLabel="No. Ujian Nasional" value={application.nationalExamNumber} />
      </DetailSection>

      <DetailSection title="Alamat & Kontak">
        <DetailField fieldLabel="Alamat" value={application.addressDetail} />
        <DetailField fieldLabel="Dusun" value={application.dusun} />
        <DetailField fieldLabel="RT" value={application.rt} />
        <DetailField fieldLabel="RW" value={application.rw} />
        <DetailField fieldLabel="Kelurahan" value={application.kelurahan} />
        <DetailField fieldLabel="Kode Pos" value={application.postalCode} />
        <DetailField fieldLabel="Kecamatan" value={application.kecamatan} />
        <DetailField fieldLabel="Kabupaten/Kota" value={application.kabupaten} />
        <DetailField fieldLabel="Propinsi" value={application.provinsi} />
        <DetailField fieldLabel="Alat Transportasi" value={application.transportMode} />
        <DetailField fieldLabel="Jenis Tinggal" value={application.livingArrangement} />
        <DetailField fieldLabel="No Telepon Rumah" value={application.homePhone} />
        <DetailField fieldLabel="No. Hp" value={application.mobilePhone} />
        <DetailField fieldLabel="Email Pribadi" value={application.personalEmail} />
      </DetailSection>

      <DetailSection title="Program Bantuan">
        <DetailField fieldLabel="Penerima KKS" value={application.kksRecipient} />
        <DetailField fieldLabel="No. KKS" value={application.kksNumber} />
        <DetailField fieldLabel="Penerima KPS" value={application.kpsRecipient} />
        <DetailField fieldLabel="No. KPS" value={application.kpsNumber} />
        <DetailField fieldLabel="Alasan Layak PIP" value={application.pipEligibleReason} />
        <DetailField fieldLabel="Penerima KIP" value={application.kipRecipient} />
        <DetailField fieldLabel="No. KIP" value={application.kipNumber} />
        <DetailField fieldLabel="Nama Tertera di KIP" value={application.kipHolderName} />
        <DetailField fieldLabel="Alasan Menolak KIP" value={application.kipRejectReason} />
      </DetailSection>

      <DetailSection title="Data Periodik">
        <DetailField fieldLabel="Tinggi Badan (cm)" value={application.heightCm} />
        <DetailField fieldLabel="Berat Badan (kg)" value={application.weightKg} />
        <DetailField fieldLabel="Jarak ke Sekolah (km)" value={application.distanceToSchoolKm} />
        <DetailField fieldLabel="Waktu Tempuh (menit)" value={application.travelTimeMinutes} />
        <DetailField fieldLabel="Jumlah Saudara Kandung" value={application.siblingCount} />
      </DetailSection>

      <DetailSection title="Data Ayah Kandung">
        <DetailField fieldLabel="Nama" value={application.fatherName} />
        <DetailField fieldLabel="Tahun Lahir" value={application.fatherBirthYear} />
        <DetailField fieldLabel="Kebutuhan Khusus" value={application.fatherSpecialNeeds} />
        <DetailField fieldLabel="Pekerjaan" value={application.fatherOccupation} />
        <DetailField fieldLabel="Pendidikan" value={application.fatherEducationLevel} />
        <DetailField fieldLabel="Penghasilan Bulanan" value={application.fatherMonthlyIncome} />
      </DetailSection>

      <DetailSection title="Data Ibu Kandung">
        <DetailField fieldLabel="Nama" value={application.motherName} />
        <DetailField fieldLabel="Tahun Lahir" value={application.motherBirthYear} />
        <DetailField fieldLabel="Kebutuhan Khusus" value={application.motherSpecialNeeds} />
        <DetailField fieldLabel="Pekerjaan" value={application.motherOccupation} />
        <DetailField fieldLabel="Pendidikan" value={application.motherEducationLevel} />
        <DetailField fieldLabel="Penghasilan Bulanan" value={application.motherMonthlyIncome} />
      </DetailSection>

      <DetailSection title="Data Wali (opsional)">
        <DetailField fieldLabel="Nama" value={application.guardianName} />
        <DetailField fieldLabel="Tahun Lahir" value={application.guardianBirthYear} />
        <DetailField fieldLabel="Pekerjaan" value={application.guardianOccupation} />
        <DetailField fieldLabel="Pendidikan" value={application.guardianEducationLevel} />
        <DetailField fieldLabel="Penghasilan Bulanan" value={application.guardianMonthlyIncome} />
      </DetailSection>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Prestasi</h3>
        {!subRecords && <p className="text-sm text-muted-foreground">Memuat…</p>}
        {subRecords && subRecords.achievements.length === 0 && <p className="text-sm text-muted-foreground">Tidak ada data prestasi</p>}
        {subRecords && subRecords.achievements.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jenis</TableHead>
                <TableHead>Tingkat</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Tahun</TableHead>
                <TableHead>Penyelenggara</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subRecords.achievements.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.type}</TableCell>
                  <TableCell>{a.level}</TableCell>
                  <TableCell>{a.name}</TableCell>
                  <TableCell>{a.year}</TableCell>
                  <TableCell>{a.organizer}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Pendidikan Non-Formal</h3>
        {!subRecords && <p className="text-sm text-muted-foreground">Memuat…</p>}
        {subRecords && subRecords.nonformalEducations.length === 0 && <p className="text-sm text-muted-foreground">Tidak ada data pendidikan non-formal</p>}
        {subRecords && subRecords.nonformalEducations.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jenis</TableHead>
                <TableHead>Penyelenggara/Sumber</TableHead>
                <TableHead>Tahun Mulai</TableHead>
                <TableHead>Tahun Selesai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subRecords.nonformalEducations.map((n) => (
                <TableRow key={n.id}>
                  <TableCell>{n.type}</TableCell>
                  <TableCell>{n.organizerOrSource}</TableCell>
                  <TableCell>{n.startYear}</TableCell>
                  <TableCell>{n.endYear}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
