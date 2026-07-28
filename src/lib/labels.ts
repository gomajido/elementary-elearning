// Indonesian display labels for DB enum values. Enum values themselves stay
// in English (they're internal identifiers used in queries/filters) — only
// what's shown on screen is translated here, in one place.

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  present: "Hadir",
  absent: "Tidak Hadir",
  late: "Terlambat",
  excused: "Izin",
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  paid: "Lunas",
  partial: "Sebagian",
  unpaid: "Belum Lunas",
  void: "Dibatalkan",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Transfer bank",
  cash: "Tunai",
  cheque: "Cek",
  other: "Lainnya",
};

export const FEE_FREQUENCY_LABELS: Record<string, string> = {
  termly: "Per semester",
  annual: "Tahunan",
  one_time: "Sekali bayar",
  monthly: "Bulanan",
};

export const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  active: "Aktif",
  inactive: "Tidak Aktif",
  graduated: "Lulus",
  withdrawn: "Mengundurkan Diri",
};

export const GUARDIAN_RELATIONSHIP_LABELS: Record<string, string> = {
  mother: "Ibu",
  father: "Ayah",
  guardian: "Wali",
  other: "Lainnya",
};

export const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  submitted: "Terkumpul",
  late: "Terlambat",
  graded: "Dinilai",
  missing: "Belum Dikumpulkan",
};

export const QUIZ_ATTEMPT_STATUS_LABELS: Record<string, string> = {
  in_progress: "Sedang Berlangsung",
  submitted: "Terkumpul",
  auto_graded: "Dinilai Otomatis",
};

export const CONTENT_ITEM_TYPE_LABELS: Record<string, string> = {
  video: "Video",
  pdf: "PDF",
  note: "Catatan",
  link: "Tautan",
};

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  multiple_choice: "Pilihan ganda",
  true_false: "Benar/Salah",
  short_answer: "Isian singkat",
};

export function label(map: Record<string, string>, value: string): string {
  return map[value] ?? value;
}
