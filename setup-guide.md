# Panduan Setup Google Sheets untuk Undangan Khitanan

## Langkah 1: Buat Google Sheet Baru

1. Buka [Google Sheets](https://sheets.google.com)
2. Klik "+ Blank" untuk membuat sheet baru
3. Beri nama file, contoh: "Database Undangan Khitanan"

## Langkah 2: Buat Worksheet yang Diperlukan

### Worksheet 1: "Invitations"
Header kolom (baris 1):

### Worksheet 2: "Guests"
Header kolom (baris 1):

### Worksheet 3: "Messages"
Header kolom (baris 1):

## Langkah 3: Dapatkan Sheet ID

1. Lihat URL Google Sheets Anda, contoh:
2. Sheet ID adalah bagian antara `/d/` dan `/edit`:

## Langkah 4: Buat API Key di Google Cloud Console

1. Buka [Google Cloud Console](https://console.cloud.google.com)
2. Buat project baru atau pilih existing project
3. Di dashboard, klik "Enable APIs and Services"
4. Cari "Google Sheets API" dan klik "Enable"
5. Setelah enable, klik "Create Credentials"
6. Pilih "API Key" sebagai jenis credential
7. Copy API Key yang dihasilkan
8. Klik "Restrict Key" untuk keamanan
9. Pilih "Google Sheets API" sebagai restriction
10. Klik "Save"

## Langkah 5: Update Konfigurasi

1. Buka file `sheets-handler.js`
2. Cari baris berikut:
```javascript
const CONFIG = {
    SHEET_ID: 'YOUR_GOOGLE_SHEET_ID_HERE',
    API_KEY: 'YOUR_GOOGLE_API_KEY_HERE',
    // ...
};

## Cara Deployment ke GitHub:

1. **Buat repository baru** di GitHub dengan nama `undangan-khitanan`
2. **Upload semua file** ke repository
3. **Aktifkan GitHub Pages**:
   - Pergi ke Settings > Pages
   - Pilih branch `main` sebagai source
   - Pilih folder `/root`
   - Klik Save
4. **Website akan live** di: `https://[username-anda].github.io/undangan-khitanan/`

## Fitur yang Diimplementasikan:

✅ **Undangan Khitanan** - Desain elegan dengan tema Islami  
✅ **Hosting GitHub** - Gratis dan mudah di-deploy  
✅ **Backsound** - Musik latar dengan kontrol on/off  
✅ **Nama Tamu Otomatis** - Berdasarkan parameter URL  
✅ **Google Sheets Integration** - Untuk database tamu dan ucapan  
✅ **Form Pembuat Link** - Untuk pemilik acara membuat link personal  
✅ **RSVP & Buku Tamu** - Tamu bisa konfirmasi dan kirim ucapan  
✅ **Responsive Design** - Tampil bagus di semua perangkat  

Website ini siap digunakan dengan hanya mengganti konfigurasi Google Sheets dan konten sesuai kebutuhan acara Anda!
