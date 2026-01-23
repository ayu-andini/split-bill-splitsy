# 💰 Splitsy - Split Bill App

Aplikasi web untuk split bill dengan mudah, mendukung scan struk (OCR) dan input manual, dengan metode pembagian rata dan custom fitur per-item.

## ✨ Features

- 📸 **Upload Struk** - Upload struk dari galeri.
- ✍️ **Input Manual** - Masukkan item, harga, dan biaya tambahan secara manual.
- 🤖 **AI-Powered OCR** - Menggunakan Google Gemini untuk mengekstrak dan menyusun data dari teks hasil OCR.
- ✏️ **Editor Item** - Review dan edit hasil OCR, tambah/hapus/ubah item dan biaya.
- ➗ **Metode Pembagian Fleksibel**:
  - **Bagi Rata (Equal)**: Pembayaran dibagi rata untuk semua orang.
  - **Kustom per-Item (Custom)**: Assign setiap item ke orang tertentu, biaya tambahan akan dihitung proporsional.
- 💬 **Berbagi Hasil** - Bagikan ke WhatsApp atau salin ke clipboard.
- 🎨 **UI Modern** - Desain bersih, simpel, dan mobile-first.
- 🌓 **Mode Gelap & Terang** - Tema dapat menyesuaikan dengan preferensi sistem.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **AI**: Google Gemini 1.5 Flash (via API)
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

## 📋 Prasyarat

- Node.js 18+
- npm atau yarn
- Google Gemini API Key ([Dapatkan di sini](https://aistudio.google.com/))

## 🚀 Memulai

### 1. Clone atau Download Project

```bash
git clone https://github.com/username/repo-name.git
cd repo-name
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Buat file `.env.local` di root folder dan masukkan Google Gemini API key Anda:

```
GOOGLE_API_KEY=your_actual_api_key_here
```

### 4. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## 📱 Alur Pengguna

1.  **Pilih Metode Input** - Pengguna memilih antara upload foto struk atau input manual.
2.  **Proses & Ekstraksi**:
    *   **Jika OCR**: Gambar di-upload, dan API Google Gemini mengekstrak data menjadi JSON (items, prices, tax, service).
    *   **Jika Manual**: Pengguna mengisi form item dan biaya.
3.  **Edit & Konfirmasi** - Pengguna mereview dan mengedit hasil ekstraksi/input.
4.  **Pilih Metode Pembagian** - Pilih antara **Bagi Rata** atau **Kustom per-Item**.
5.  **Hitung** - Lakukan perhitungan pembagian per orang.
6.  **Bagikan** - Bagikan hasilnya melalui WhatsApp atau salin ke clipboard.

## 🎨 Prinsip Desain

- **Alur Mulus** - Klik minimal, transisi halus.
- **Warna Netral** - Tampilan profesional dan bersih.
- **Mobile First** - Dioptimalkan untuk penggunaan mobile.
- **Feedback Jelas** - Status loading, indikator progres.
- **Penanganan Error** - Fallback yang baik jika terjadi kesalahan.

## 🔧 Komponen Kunci

### UploadSection
- Upload gambar (kamera/galeri) atau memilih input manual.
- Memanggil API untuk ekstraksi data jika menggunakan OCR.
- Menyediakan modal untuk input manual.

### ItemsEditor
- Menampilkan item yang diekstraksi atau diinput.
- Fungsi untuk menambah/edit/hapus item.
- Edit pajak & biaya layanan.
- Kalkulasi total secara real-time.

### SplitSection
- Opsi metode **Bagi Rata** (dengan counter jumlah orang).
- Opsi metode **Kustom** (memilih item untuk setiap orang).
- Kalkulasi per orang secara real-time.

### ResultSection
- Menampilkan rincian pembagian per orang.
- Pratinjau pesan yang akan dibagikan.
- Tombol untuk berbagi ke WhatsApp dan salin ke clipboard.
- Tombol untuk memulai dari awal.
   |
<!-- ## 🎯 Rencana Pengembangan

- [ ] Simpan riwayat pembagian (membutuhkan database)
- [ ] Dukungan multi-mata uang
- [ ] Split banyak bill
- [ ] Menambahkan detail info pembayaran
- [ ] Kalkulator tip
- [ ] Akun pengguna & grup -->

## 📝 Catatan

- **Tanpa Database**: Project ini hanya menggunakan state di sisi klien.
- **Privasi Terjaga**: Tidak ada data struk yang disimpan di server setelah diproses.
- **Dioptimalkan untuk Mobile**: Pengalaman terbaik di browser mobile.
- **Mode Gelap**: Mendeteksi preferensi sistem secara otomatis.

## 🤝 Kontribusi

Jangan ragu untuk mengirimkan isu atau pull request untuk perbaikan!

## 👨‍💻 Developer

Dibuat dengan ❤️ NextJS, Tailwind CSS, dan Typescript
Ayu Andini - https://www.linkedin.com/in/ayu-andinii 

---

**Happy Splitting! 🎉**
