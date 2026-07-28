// Single source of truth for landing-page branding content. No CMS for
// MVP (RFC 0001) — edit this file directly when copy needs to change.
export const schoolConfig = {
  name: "SD Madani",
  tagline: "Menumbuhkan rasa ingin tahu anak, selangkah demi selangkah.",
  about:
    "SD Madani berkomitmen memberikan setiap anak fondasi akademik yang kuat dalam lingkungan yang peduli dan mendukung, di mana rasa ingin tahu didorong dan setiap siswa dikenal namanya.",
  programs: [
    { name: "TK / Kelompok Persiapan", description: "Literasi dasar, berhitung, dan keterampilan sosial." },
    { name: "Kelas 1 - 3", description: "Mata pelajaran inti dengan fokus membaca, menulis, dan berhitung." },
    { name: "Kelas 4 - 6", description: "Kurikulum lanjutan untuk mempersiapkan siswa ke jenjang SMP." },
  ],
  contact: {
    address: "Tambahkan alamat sekolah di sini",
    phone: "Tambahkan nomor telepon di sini",
    email: "info@example.com",
  },
} as const;
