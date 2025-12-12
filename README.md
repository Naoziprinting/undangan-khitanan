# Undangan Khitanan Digital

Website undangan khitanan digital yang elegan dengan fitur lengkap, hosting gratis di GitHub Pages, dan integrasi Google Sheets sebagai database.

## Fitur Utama

1. **Undangan Digital yang Elegan** - Desain responsif dan modern untuk undangan khitanan
2. **Hosting di GitHub Pages** - Gratis dan mudah di-deploy
3. **Backsound Otomatis** - Musik latar yang dapat dikontrol oleh tamu
4. **Personalized Links** - Setiap tamu mendapatkan link dengan nama mereka
5. **Google Sheets Database** - Menyimpan data tamu, RSVP, dan ucapan
6. **Buku Tamu Digital** - Tamu dapat mengirim ucapan dan doa
7. **RSVP Online** - Konfirmasi kehadiran secara digital
8. **Admin Dashboard** - Untuk pemilik acara mengelola tamu dan data

## Cara Menggunakan

### 1. Setup Awal

1. **Fork repository** ini ke akun GitHub Anda
2. **Clone repository** ke komputer Anda
3. **Buka folder project** di editor kode favorit Anda

### 2. Konfigurasi Google Sheets

1. **Buat Google Sheet baru** di [sheets.google.com](https://sheets.google.com)
2. **Buat 3 worksheet** dengan nama:
   - `Invitations` (untuk data undangan)
   - `Guests` (untuk data tamu dan link)
   - `Messages` (untuk RSVP dan ucapan)
3. **Set header kolom** untuk setiap sheet:

   **Invitations:**

**Guests:**

**Messages:**

4. **Aktifkan Google Sheets API:**
- Buka [Google Cloud Console](https://console.cloud.google.com)
- Buat project baru
- Aktifkan Google Sheets API
- Buat API Key
- Batasi API Key untuk hanya mengakses Google Sheets API

5. **Update konfigurasi:**
- Buka file `sheets-handler.js`
- Ganti `YOUR_GOOGLE_SHEET_ID_HERE` dengan ID Sheet Anda
- Ganti `YOUR_GOOGLE_API_KEY_HERE` dengan API Key Anda

### 3. Customisasi Konten

1. **Ubah teks dan gambar** sesuai kebutuhan Anda
2. **Ganti backsound** di folder `assets/music/`
3. **Update gambar** di folder `assets/images/`
4. **Sesuaikan warna tema** di file `style.css` (variabel CSS)

### 4. Deploy ke GitHub Pages

1. **Commit semua perubahan** ke repository GitHub Anda
2. **Buka Settings** di repository GitHub
3. **Pergi ke Pages** di sidebar
4. **Pilih branch main** sebagai source
5. **Klik Save** - Website akan live di `https://username.github.io/repository-name/`

### 5. Cara Membuat Undangan

1. **Buka website** yang sudah di-deploy
2. **Isi formulir** pembuatan undangan
3. **Klik "Buat Undangan Sekarang"**
4. **Buat link personal** untuk setiap tamu
5. **Bagikan link** kepada tamu undangan

## Struktur File

## Fitur Keamanan

1. **API Key Terbatas** - Hanya dapat mengakses Google Sheets
2. **Validasi Input** - Formulir memiliki validasi client-side
3. **Data Terenkripsi** - Data tersimpan aman di Google Sheets
4. **Link Personal** - Setiap tamu memiliki link unik

## Troubleshooting

### Google Sheets API Error
- Pastikan API Key aktif dan tidak dibatasi
- Pastikan Sheet ID benar
- Pastikan worksheet memiliki nama yang tepat

### Backsound Tidak Berjalan
- Browser memerlukan interaksi pengguna untuk memutar audio
- Format file harus MP3
- Ukuran file tidak terlalu besar

### Link Tidak Berfungsi
- Pastikan deployment GitHub Pages berhasil
- Cek console browser untuk error JavaScript
- Pastikan parameter URL benar

## Kontribusi

Jika Anda ingin berkontribusi atau melaporkan bug, silakan buka issue atau pull request.

## Lisensi

Proyek ini tersedia untuk penggunaan pribadi dan komersial.

## Dukungan

Untuk pertanyaan dan dukungan, silakan buka issue di repository GitHub.
