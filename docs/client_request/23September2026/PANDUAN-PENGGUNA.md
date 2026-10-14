# Panduan Pengguna — Fitur Baru (23 September 2026)

Panduan ini untuk staf sekolah (Admin/Tata Usaha dan Guru) yang akan menggunakan 5 fitur baru di sistem. Ditulis tanpa istilah teknis — cukup diikuti langkah demi langkah.

Daftar isi:
1. [Pendaftaran Siswa Baru Online](#1-pendaftaran-siswa-baru-online)
2. [Data Dapodik Guru](#2-data-dapodik-guru)
3. [Kenaikan Kelas Massal](#3-kenaikan-kelas-massal)
4. [Impor Kehadiran dari Mesin Fingerprint](#4-impor-kehadiran-dari-mesin-fingerprint)
5. [Biaya Full Day / Half Day](#5-biaya-full-day--half-day)

---

## 1. Pendaftaran Siswa Baru Online

**Siapa yang pakai:** Orang tua calon siswa (tanpa login), lalu Admin atau Guru untuk memeriksa dan menyetujui.

### Bagian A — Orang tua mengisi formulir

1. Orang tua membuka alamat **`/register`** di browser (tidak perlu login).
2. Mengisi semua data yang diminta — identitas anak, alamat, data ayah, data ibu, dan (jika ada) data wali.
3. Jika ada prestasi atau pendidikan non-formal (TK, PAUD, dll), bisa ditambahkan di bagian bawah formulir.
4. Menyelesaikan verifikasi keamanan (centang/captcha) lalu klik **Kirim Pendaftaran**.
5. Setelah terkirim, akan muncul **Nomor Referensi Pendaftaran** — ini bukti bahwa pendaftaran sudah masuk ke sistem. Tidak ada notifikasi email/SMS otomatis — pihak sekolah yang akan menghubungi.

### Bagian B — Admin/Guru memeriksa pendaftaran

1. Login sebagai Admin atau Guru.
2. Buka menu **Pendaftaran** di sisi kiri.
3. Semua pendaftaran yang masuk akan berstatus **Menunggu**.
4. Klik **Detail** untuk melihat seluruh data yang diisi orang tua sebelum memutuskan — jauh lebih lengkap daripada yang tampil di tabel.
5. Jika data sudah benar, klik **Setujui**. Lalu lengkapi data penempatan: kelas, tahun ajaran, dan nomor induk siswa. Setelah disimpan, siswa otomatis tercatat sebagai siswa resmi di sistem.
6. Jika data tidak valid atau ganda, klik **Tolak** dan isi alasannya. Status berubah jadi **Ditolak**, tidak ada siswa yang dibuat.

**Catatan:** siswa yang sudah disetujui lewat jalur ini, data pendaftarannya tetap bisa dilihat kembali lewat menu **Siswa → (pilih siswa) → Detail Pendaftaran**.

---

## 2. Data Dapodik Guru

**Siapa yang pakai:** Admin.

Data Dapodik adalah data resmi guru untuk keperluan laporan ke Dapodik (NIK, NUPTK, status kepegawaian, dll) — terpisah dari data guru sehari-hari.

1. Buka menu **Guru**.
2. Pilih guru yang ingin dilengkapi datanya, klik ikon menu (⋮) di kanan baris, lalu pilih **Data Dapodik**.
3. Isi data yang tersedia — boleh sebagian saja, tidak harus lengkap sekaligus.
4. Klik **Simpan**.

**Penting:** Formulir Data Dapodik ini **tidak** mengubah Nomor Induk Pegawai guru. Untuk mengubah Nomor Induk Pegawai, gunakan menu **Edit Guru** yang biasa (bukan Data Dapodik) — perubahan di sana akan otomatis menyesuaikan username login guru tersebut.

Data riwayat (riwayat jabatan, riwayat gaji, riwayat pendidikan, dst.) belum tersedia di versi ini — hanya data inti Dapodik.

---

## 3. Kenaikan Kelas Massal

**Siapa yang pakai:** Admin.

⚠️ **Perhatian: proses ini tidak bisa dibatalkan.** Begitu kelas dinaikkan, daftar siswa di kelas lama akan kosong. Pastikan sudah benar sebelum konfirmasi.

1. Buka menu **Kelas**.
2. Pilih kelas yang akan dinaikkan, klik ikon menu (⋮), lalu pilih **Promosikan**.
3. Pilih **Tahun Ajaran Tujuan** dan **Kelas Tujuan** default (kelas berikutnya untuk sebagian besar siswa).
4. Semua siswa otomatis diatur **Naik Kelas** ke kelas tujuan. Jika ada siswa yang perlu dikecualikan:
   - **Tinggal Kelas** — siswa tetap di tingkat yang sama, pilih kelas tujuannya sendiri.
   - **Keluar** — siswa tidak lagi aktif (pindah sekolah, lulus, dll), tidak akan ditempatkan ke kelas manapun.
5. Setelah semua pengecualian diatur, klik **Konfirmasi**.

Setelah selesai, kelas lama akan kosong (karena semua siswanya sudah dipindahkan atau dikeluarkan) — ini normal, bukan error.

---

## 4. Impor Kehadiran dari Mesin Fingerprint

**Siapa yang pakai:** Admin.

Untuk memasukkan data kehadiran dari mesin fingerprint (file Excel) ke sistem, tanpa input manual satu-satu.

1. Buka menu **Kehadiran**.
2. Klik tombol **Impor Kehadiran dari Mesin Fingerprint (Excel)** di pojok kanan atas.
3. Pilih jenis data: **Siswa** atau **Guru**, lalu unggah file Excel dari mesin fingerprint.
4. Sistem akan menampilkan daftar nama yang terdeteksi di file. Untuk nama yang belum pernah dicocokkan sebelumnya, pilih orangnya secara manual lewat dropdown **Cocokkan dengan**.
5. Klik **Konfirmasi** untuk menyimpan.

**Catatan penting:**
- Pencocokan nama **tidak otomatis** — harus dipilih manual sekali di awal. Setelah dicocokkan sekali, impor berikutnya untuk orang yang sama akan otomatis terhubung.
- Mengunggah file yang sama dua kali **tidak akan menggandakan data** — sistem otomatis memperbarui data yang sudah ada untuk tanggal yang sama.
- Hasil impor untuk guru bisa dilihat di menu **Kehadiran → Kehadiran Guru**.

---

## 5. Biaya Full Day / Half Day

**Siapa yang pakai:** Admin.

Sekarang tagihan biaya bisa dibedakan antara siswa **Full Day** dan **Half Day**.

### Langkah 1 — Tandai tipe hari siswa

Saat membuat atau mengedit data siswa, isi kolom **Tipe Hari**: **Full Day** atau **Half Day**.

### Langkah 2 — Buat struktur biaya sesuai tipe hari

1. Buka menu **Biaya → Struktur Biaya**.
2. Saat membuat struktur biaya baru, isi kolom **Tipe Hari**:
   - Pilih **Full Day** — biaya ini hanya berlaku untuk siswa Full Day.
   - Pilih **Half Day** — biaya ini hanya berlaku untuk siswa Half Day.
   - **Kosongkan** — biaya ini berlaku untuk semua siswa, apapun tipe harinya.

### Langkah 3 — Buat tagihan

1. Buka menu **Biaya → Tagihan**.
2. Pilih kelas, lalu centang struktur biaya yang ingin ditagihkan.
3. Sistem otomatis menyesuaikan: siswa Full Day hanya mendapat biaya Full Day + biaya umum; siswa Half Day hanya mendapat biaya Half Day + biaya umum. Tidak perlu memisahkan tagihan secara manual.

---

## Jika Terjadi Masalah

Jika muncul pesan error yang tidak dimengerti, catat **teks error-nya secara lengkap** dan screenshot halamannya, lalu laporkan ke tim teknis. Jangan mengulang-ulang klik tombol yang sama — ini bisa membuat data tercatat dua kali.
