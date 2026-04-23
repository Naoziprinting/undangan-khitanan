// Google Apps Script untuk integrasi dengan Google Sheets
// Script ini HARUS ditempatkan di dalam Google Apps Script yang sama dengan Google Sheets target

// Nama sheet dalam spreadsheet
var GUEST_SHEET_NAME = 'DaftarTamu';
var RSVP_SHEET_NAME = 'Konfirmasi';
var SETTINGS_SHEET_NAME = 'Settings';

// Fungsi untuk mendapatkan nama tamu berdasarkan ID
function doGet(e) {
  // Periksa apakah e ada dan memiliki parameter
  if (!e) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false, 
        message: 'No request parameters provided'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var params = e.parameter || {};
  var action = params.action;
  
  if (action === 'getGuest') {
    var guestId = params.id;
    if (!guestId) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false, 
          message: 'Guest ID is required'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return getGuestName(guestId);
  } else if (action === 'getComments') {
    return getComments();
  } else if (action === 'getCommentsTest') {
    return getCommentsTest();
  } else if (action === 'getSettings') {
    return getSettings();
  } else if (action === 'testConnection') {
    return ContentService
      .createTextOutput(JSON.stringify(testConnection()))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (!action) {
    // Jika tidak ada action, kembalikan pesan default
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Google Apps Script API is running',
        available_actions: ['getGuest', 'getComments', 'getCommentsTest', 'testConnection'],
        usage: 'Add ?action=getGuest&id=YOUR_ID to get guest name'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({
      success: false, 
      message: 'Action not found. Available actions: getGuest, getComments, getCommentsTest, testConnection'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Fungsi untuk menangani POST request (RSVP)
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false, 
          message: 'No data provided in POST request'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var data = JSON.parse(e.postData.contents);
    
    if (data.action === 'saveSettings') {
      return saveSettings(data.settings);
    }
    
    return saveRSVP(data);
    
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false, 
        message: 'Error parsing request: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Fungsi untuk mendapatkan komentar/ucapan dari sheet Konfirmasi - VERSION FIXED
function getComments() {
  try {
    // Mendapatkan spreadsheet aktif
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(RSVP_SHEET_NAME);
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false, 
          message: 'Sheet "' + RSVP_SHEET_NAME + '" tidak ditemukan. Silakan jalankan setupSpreadsheet() terlebih dahulu.',
          comments: []
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var lastRow = sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();
    
    // Jika tidak ada data (hanya header atau kosong)
    if (lastRow <= 1 || lastColumn < 7) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true, 
          comments: [],
          count: 0,
          total: 0,
          message: 'Belum ada data konfirmasi',
          sheetInfo: {
            lastRow: lastRow,
            lastColumn: lastColumn,
            name: sheet.getName()
          }
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Ambil semua data (dengan header)
    var data = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
    
    // Debug: Log struktur data
    Logger.log('Total rows: ' + data.length);
    Logger.log('Total columns: ' + data[0].length);
    Logger.log('Header: ' + JSON.stringify(data[0]));
    
    var comments = [];
    var skippedRows = [];
    
    // Mulai dari baris 2 untuk melewati header
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      
      // DEBUG: Log setiap baris
      Logger.log('Row ' + i + ': ' + JSON.stringify(row));
      
      // Kolom index:
      // 0: Timestamp, 1: Nama, 2: Email, 3: Telepon, 
      // 4: Konfirmasi, 5: Jumlah Tamu, 6: Ucapan/Doa, 7: Guest ID, 8: Status
      
      var name = (row[1] && row[1].toString().trim()) || 'Tamu Undangan';
      var message = (row[6] && row[6].toString().trim()) || '';
      var timestamp = row[0] || new Date();
      var attendance = (row[4] && row[4].toString().trim()) || 'Hadir';
      
      // Hanya ambil yang memiliki ucapan/doa TIDAK KOSONG
      if (message && message !== '') {
        // Generate warna avatar berdasarkan nama
        var avatarColor = generateAvatarColor(name);
        
        // Format waktu relatif
        var timeAgo = getTimeAgo(timestamp);
        var exactTime = formatExactTime(timestamp);
        
        // Cek apakah ini keluarga/host
        var isHost = false;
        var nameLower = name.toLowerCase();
        if (nameLower.includes('keluarga') || 
            nameLower.includes('farhan') || 
            nameLower.includes('soleh') || 
            nameLower.includes('yayuk') || 
            nameLower.includes('listri') ||
            nameLower.includes('rayyan')) {
          isHost = true;
        }
        
        comments.push({
          id: i,
          name: name,
          message: message,
          timestamp: timestamp instanceof Date ? timestamp.toISOString() : new Date(timestamp).toISOString(),
          timeAgo: timeAgo,
          exactTime: exactTime,
          avatarColor: avatarColor,
          attendance: attendance,
          isHost: isHost,
          guests: row[5] || '1',
          phone: row[3] || '',
          email: row[2] || ''
        });
      } else {
        skippedRows.push({
          row: i + 1,
          reason: 'No message',
          name: name,
          attendance: attendance
        });
      }
    }
    
    // Urutkan berdasarkan timestamp (terbaru pertama)
    comments.sort(function(a, b) {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    // Debug: Log hasil
    Logger.log('Comments found: ' + comments.length);
    Logger.log('Skipped rows: ' + skippedRows.length);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true, 
        comments: comments,
        count: comments.length,
        total: comments.length,
        skipped: skippedRows,
        message: 'Data komentar berhasil diambil',
        sheetInfo: {
          totalRows: data.length,
          totalColumns: data[0].length,
          rowsWithData: comments.length,
          skippedRows: skippedRows.length
        }
      }))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error in getComments: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false, 
        message: 'Terjadi kesalahan: ' + error.toString(),
        comments: [],
        count: 0,
        errorDetails: {
          message: error.message,
          stack: error.stack
        }
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Fungsi TEST untuk memeriksa struktur data sheet
function getCommentsTest() {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(RSVP_SHEET_NAME);
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: 'Sheet tidak ditemukan: ' + RSVP_SHEET_NAME
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var lastRow = sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();
    
    // Ambil 5 baris pertama termasuk header
    var sampleData = sheet.getRange(1, 1, Math.min(lastRow, 5), lastColumn).getValues();
    
    // Ambil semua data untuk analisis
    var allData = [];
    if (lastRow > 1) {
      allData = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
    }
    
    // Analisis kolom pesan (kolom 7, index 6)
    var messageAnalysis = {
      totalRows: allData.length - 1, // Exclude header
      rowsWithMessages: 0,
      rowsWithoutMessages: 0,
      sampleMessages: []
    };
    
    for (var i = 1; i < allData.length; i++) {
      var message = allData[i][6];
      if (message && message.toString().trim() !== '') {
        messageAnalysis.rowsWithMessages++;
        if (messageAnalysis.sampleMessages.length < 3) {
          messageAnalysis.sampleMessages.push({
            row: i + 1,
            name: allData[i][1],
            message: message.toString().trim().substring(0, 50) + '...',
            length: message.toString().trim().length
          });
        }
      } else {
        messageAnalysis.rowsWithoutMessages++;
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        sheetInfo: {
          name: sheet.getName(),
          lastRow: lastRow,
          lastColumn: lastColumn,
          range: 'A1:' + String.fromCharCode(64 + lastColumn) + lastRow
        },
        headers: sampleData[0],
        sampleRows: sampleData.slice(1),
        columnStructure: [
          {index: 0, letter: 'A', name: 'Timestamp', sample: sampleData[1] ? sampleData[1][0] : null},
          {index: 1, letter: 'B', name: 'Nama', sample: sampleData[1] ? sampleData[1][1] : null},
          {index: 2, letter: 'C', name: 'Email', sample: sampleData[1] ? sampleData[1][2] : null},
          {index: 3, letter: 'D', name: 'Telepon/WA', sample: sampleData[1] ? sampleData[1][3] : null},
          {index: 4, letter: 'E', name: 'Konfirmasi Kehadiran', sample: sampleData[1] ? sampleData[1][4] : null},
          {index: 5, letter: 'F', name: 'Jumlah Tamu', sample: sampleData[1] ? sampleData[1][5] : null},
          {index: 6, letter: 'G', name: 'Ucapan/Doa', sample: sampleData[1] ? sampleData[1][6] : null},
          {index: 7, letter: 'H', name: 'Guest ID', sample: sampleData[1] ? sampleData[1][7] : null},
          {index: 8, letter: 'I', name: 'Status', sample: sampleData[1] ? sampleData[1][8] : null}
        ],
        messageAnalysis: messageAnalysis,
        testUrl: ScriptApp.getService().getUrl() + '?action=getComments'
      }))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Error in getCommentsTest: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Fungsi untuk mendapatkan nama tamu berdasarkan ID
function getGuestName(guestId) {
  try {
    // Mendapatkan spreadsheet aktif (tempat script ini berada)
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(GUEST_SHEET_NAME);
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false, 
          message: 'Sheet "' + GUEST_SHEET_NAME + '" tidak ditemukan. Silakan jalankan setupSpreadsheet() terlebih dahulu.'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var data = sheet.getDataRange().getValues();
    
    // Cari tamu berdasarkan ID (ID ada di kolom 1/A)
    for (var i = 1; i < data.length; i++) {
      // Kolom 0/A = ID, Kolom 1/B = Nama
      if (data[i][0] && data[i][0].toString().trim().toLowerCase() === guestId.toString().trim().toLowerCase()) {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: true, 
            guestName: data[i][1],
            additionalInfo: data[i].slice(2), // Info tambahan dari kolom selanjutnya
            foundAtRow: i + 1
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false, 
        message: 'Tamu dengan ID "' + guestId + '" tidak ditemukan',
        availableIds: data.slice(1).map(row => row[0]).filter(id => id)
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('Error in getGuestName: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false, 
        message: 'Terjadi kesalahan sistem: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Fungsi untuk menghasilkan warna avatar berdasarkan nama
function generateAvatarColor(name) {
  var colors = [
    '#D4AF37', '#B8860B', '#8B6914', // Gold tones
    '#2a6e3f', '#3a8c5f', '#4aaa7f', // Green tones
    '#6a5acd', '#7b68ee', '#9370db', // Purple tones
    '#cd853f', '#d2691e', '#b22222', // Brown/Red tones
    '#4682b4', '#5f9ea0', '#6495ed'  // Blue tones
  ];
  
  // Generate hash dari nama
  var hash = 0;
  for (var i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Pilih warna berdasarkan hash
  var index = Math.abs(hash) % colors.length;
  return colors[index];
}

// Fungsi untuk mendapatkan waktu relatif (time ago) - IMPROVED
function getTimeAgo(timestamp) {
  try {
    var now = new Date();
    var date;
    
    // Handle berbagai format timestamp
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      // Coba parse berbagai format tanggal
      date = new Date(timestamp);
      // Jika parsing gagal, coba format lain
      if (isNaN(date.getTime())) {
        // Coba format tanggal spreadsheet (dd/mm/yyyy hh:mm:ss)
        var parts = timestamp.split(/[/ :]/);
        if (parts.length >= 3) {
          date = new Date(parts[2], parts[1] - 1, parts[0], 
                         parts[3] || 0, parts[4] || 0, parts[5] || 0);
        }
      }
    } else if (timestamp && typeof timestamp === 'object' && timestamp.getTime) {
      date = timestamp;
    } else {
      return 'Baru saja';
    }
    
    // Validasi tanggal
    if (!date || isNaN(date.getTime())) {
      return 'Baru saja';
    }
    
    var diff = Math.floor((now - date) / 1000); // perbedaan dalam detik
    
    if (diff < 60) {
      return 'Baru saja';
    } else if (diff < 3600) {
      var minutes = Math.floor(diff / 60);
      return minutes + (minutes === 1 ? ' menit' : ' menit') + ' yang lalu';
    } else if (diff < 86400) {
      var hours = Math.floor(diff / 3600);
      return hours + (hours === 1 ? ' jam' : ' jam') + ' yang lalu';
    } else if (diff < 604800) {
      var days = Math.floor(diff / 86400);
      return days + (days === 1 ? ' hari' : ' hari') + ' yang lalu';
    } else if (diff < 2592000) {
      var weeks = Math.floor(diff / 604800);
      return weeks + (weeks === 1 ? ' minggu' : ' minggu') + ' yang lalu';
    } else {
      var months = Math.floor(diff / 2592000);
      return months + (months === 1 ? ' bulan' : ' bulan') + ' yang lalu';
    }
  } catch (e) {
    Logger.log('Error in getTimeAgo: ' + e.toString());
    return 'Baru saja';
  }
}

// Fungsi untuk format waktu eksak - IMPROVED
function formatExactTime(timestamp) {
  try {
    var date;
    
    // Handle berbagai format timestamp
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        // Coba format spreadsheet
        var parts = timestamp.split(/[/ :]/);
        if (parts.length >= 3) {
          date = new Date(parts[2], parts[1] - 1, parts[0], 
                         parts[3] || 0, parts[4] || 0, parts[5] || 0);
        }
      }
    } else if (timestamp && typeof timestamp === 'object' && timestamp.getTime) {
      date = timestamp;
    } else {
      return 'Tanggal tidak tersedia';
    }
    
    // Validasi tanggal
    if (!date || isNaN(date.getTime())) {
      return 'Tanggal tidak valid';
    }
    
    var options = { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    };
    
    var formatter = new Intl.DateTimeFormat('id-ID', options);
    return formatter.format(date);
    
  } catch (e) {
    Logger.log('Error in formatExactTime: ' + e.toString());
    return 'Tanggal tidak valid';
  }
}

// Fungsi untuk menyimpan data RSVP
function saveRSVP(data) {
  try {
    // Validasi data input
    if (!data) {
      throw new Error('Data tidak boleh kosong');
    }
    
    // Mendapatkan spreadsheet aktif
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(RSVP_SHEET_NAME);
    
    // Jika sheet belum ada, buat baru
    if (!sheet) {
      sheet = spreadsheet.insertSheet(RSVP_SHEET_NAME);
      // Format header dengan gaya yang lebih baik
      var headers = [
        'Timestamp', 
        'Nama', 
        'Email', 
        'Telepon/WA', 
        'Konfirmasi Kehadiran', 
        'Jumlah Tamu', 
        'Ucapan/Doa', 
        'Guest ID',
        'Status'
      ];
      
      sheet.appendRow(headers);
      
      // Format header agar lebih menarik
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#2a6e3f')
                .setFontColor('white')
                .setFontWeight('bold')
                .setHorizontalAlignment('center');
      
      // Set lebar kolom
      sheet.setColumnWidth(1, 180); // Timestamp
      sheet.setColumnWidth(2, 200); // Nama
      sheet.setColumnWidth(3, 180); // Email
      sheet.setColumnWidth(4, 150); // Telepon
      sheet.setColumnWidth(5, 180); // Konfirmasi
      sheet.setColumnWidth(6, 120); // Jumlah Tamu
      sheet.setColumnWidth(7, 300); // Pesan
      sheet.setColumnWidth(8, 120); // Guest ID
      sheet.setColumnWidth(9, 100); // Status
    }
    
    // Validasi field wajib
    if (!data.name || !data.phone || !data.attendance || !data.guests) {
      throw new Error('Field wajib tidak lengkap: nama, telepon, konfirmasi, dan jumlah tamu harus diisi');
    }
    
    // Tentukan status berdasarkan konfirmasi
    var status = data.attendance === 'Hadir' ? 'Akan Hadir' : 'Tidak Hadir';
    
    // Bersihkan dan validasi data
    var name = data.name.toString().trim();
    var email = data.email ? data.email.toString().trim() : '';
    var phone = data.phone.toString().trim();
    var message = data.message ? data.message.toString().trim() : '';
    var guestId = data.guestId ? data.guestId.toString().trim() : 'unknown';
    var attendance = data.attendance;
    var guests = data.guests;
    
    // Pastikan ada pesan minimal untuk komentar
    if (!message || message === '') {
      message = 'Tidak mengisi ucapan';
    }
    
    // Validasi format email jika ada
    if (email && !isValidEmail(email)) {
      email = ''; // Kosongkan email jika tidak valid
    }
    
    // Tambahkan data baru ke sheet
    var newRow = [
      new Date(),
      name,
      email,
      phone,
      attendance,
      guests,
      message,
      guestId,
      status
    ];
    
    sheet.appendRow(newRow);
    
    // Dapatkan baris terakhir
    var lastRow = sheet.getLastRow();
    
    // Format baris baru (warna alternatif)
    var rowRange = sheet.getRange(lastRow, 1, 1, newRow.length);
    
    // Warna baris bergantian untuk keterbacaan
    if (lastRow % 2 === 0) {
      rowRange.setBackground('#f9f9f9');
    } else {
      rowRange.setBackground('#ffffff');
    }
    
    // Format kolom timestamp
    sheet.getRange(lastRow, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
    
    // Auto-resize kolom pesan
    sheet.autoResizeColumn(7);
    
    // Log untuk debugging
    Logger.log('RSVP saved successfully for: ' + name + ' (Guest ID: ' + guestId + ')');
    Logger.log('Message: ' + (message && message !== 'Tidak mengisi ucapan' ? 'Yes' : 'No'));
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true, 
        message: 'Konfirmasi kehadiran berhasil disimpan',
        rowNumber: lastRow,
        guestName: name,
        hasMessage: message && message !== 'Tidak mengisi ucapan',
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error in saveRSVP: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false, 
        message: 'Terjadi kesalahan saat menyimpan data: ' + error.toString(),
        errorDetails: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Fungsi validasi email sederhana
function isValidEmail(email) {
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Fungsi tambahan untuk memeriksa koneksi (opsional)
function testConnection() {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = spreadsheet.getSheets();
    var sheetNames = sheets.map(function(sheet) {
      return sheet.getName();
    });
    
    // Cek sheet yang diperlukan
    var guestSheet = spreadsheet.getSheetByName(GUEST_SHEET_NAME);
    var rsvpSheet = spreadsheet.getSheetByName(RSVP_SHEET_NAME);
    
    // Cek data di sheet RSVP
    var rsvpDataCount = 0;
    var rsvpMessagesCount = 0;
    if (rsvpSheet) {
      var lastRow = rsvpSheet.getLastRow();
      if (lastRow > 1) {
        var data = rsvpSheet.getRange(1, 1, lastRow, 9).getValues();
        rsvpDataCount = data.length - 1; // Exclude header
        
        // Hitung yang punya pesan
        for (var i = 1; i < data.length; i++) {
          if (data[i][6] && data[i][6].toString().trim() !== '' && 
              data[i][6].toString().trim() !== 'Tidak mengisi ucapan') {
            rsvpMessagesCount++;
          }
        }
      }
    }
    
    return {
      success: true,
      message: '✅ Terhubung ke spreadsheet: ' + spreadsheet.getName(),
      spreadsheetUrl: spreadsheet.getUrl(),
      sheets: sheetNames,
      requiredSheets: {
        guestSheet: guestSheet ? '✅ Tersedia' : '❌ Tidak ditemukan',
        rsvpSheet: rsvpSheet ? '✅ Tersedia' : '❌ Tidak ditemukan'
      },
      rsvpData: {
        totalEntries: rsvpDataCount,
        entriesWithMessages: rsvpMessagesCount,
        entriesWithoutMessages: rsvpDataCount - rsvpMessagesCount
      },
      apiEndpoints: {
        getGuest: ScriptApp.getService().getUrl() + '?action=getGuest&id=fam001',
        getComments: ScriptApp.getService().getUrl() + '?action=getComments',
        getCommentsTest: ScriptApp.getService().getUrl() + '?action=getCommentsTest',
        testSetup: 'Jalankan setupSpreadsheet() di editor script'
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      message: '❌ Error: ' + error.toString(),
      timestamp: new Date().toISOString()
    };
  }
}

// Fungsi untuk setup awal spreadsheet (run manual sekali) - IMPROVED
function setupSpreadsheet() {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var result = {
      success: true,
      messages: [],
      sheetsCreated: [],
      dataAdded: {}
    };
    
    // Hapus sheet default jika ada
    var defaultSheet = spreadsheet.getSheetByName('Sheet1');
    if (defaultSheet) {
      spreadsheet.deleteSheet(defaultSheet);
      result.messages.push('Sheet default "Sheet1" dihapus');
    }
    
    // Buat sheet DaftarTamu jika belum ada
    var guestSheet = spreadsheet.getSheetByName(GUEST_SHEET_NAME);
    if (!guestSheet) {
      guestSheet = spreadsheet.insertSheet(GUEST_SHEET_NAME);
      var guestHeaders = ['ID', 'Nama', 'Alamat', 'Hubungan', 'Keterangan', 'Tanggal Ditambahkan'];
      guestSheet.appendRow(guestHeaders);
      
      // Format header
      var guestHeaderRange = guestSheet.getRange(1, 1, 1, guestHeaders.length);
      guestHeaderRange.setBackground('#2a6e3f')
                     .setFontColor('white')
                     .setFontWeight('bold')
                     .setHorizontalAlignment('center');
      
      // Contoh data tamu DENGAN UCAPAN CONTOH
      var sampleData = [
        ['fam001', 'Keluarga Ahmad Fauzi', 'Jl. Merdeka No. 123', 'Keluarga Inti', 'Orang Tua Rayyan', new Date()],
        ['fam002', 'Keluarga Suryadi', 'Jl. Diponegoro No. 45', 'Saudara', 'Paman dari Ibu', new Date()],
        ['fam003', 'Keluarga Rahman', 'Jl. Gatot Subroto No. 78', 'Teman Kerja', 'Rekan kerja Ayah', new Date()],
        ['fam004', 'Keluarga Santoso', 'Jl. Asia Afrika No. 56', 'Tetangga', 'Tetangga depan rumah', new Date()],
        ['fam005', 'Keluarga Wijaya', 'Jl. Sudirman No. 89', 'Teman Sekolah', 'Teman sekelas Farhan', new Date()]
      ];
      
      // Tambahkan data contoh
      for (var i = 0; i < sampleData.length; i++) {
        guestSheet.appendRow(sampleData[i]);
      }
      
      // Set lebar kolom
      guestSheet.setColumnWidth(1, 100); // ID
      guestSheet.setColumnWidth(2, 200); // Nama
      guestSheet.setColumnWidth(3, 250); // Alamat
      guestSheet.setColumnWidth(4, 150); // Hubungan
      guestSheet.setColumnWidth(5, 200); // Keterangan
      guestSheet.setColumnWidth(6, 180); // Tanggal
      
      // Format tanggal
      guestSheet.getRange(2, 6, sampleData.length, 1).setNumberFormat('yyyy-mm-dd');
      
      result.sheetsCreated.push(GUEST_SHEET_NAME);
      result.dataAdded[GUEST_SHEET_NAME] = sampleData.length;
      result.messages.push('✅ Sheet "' + GUEST_SHEET_NAME + '" berhasil dibuat dengan ' + sampleData.length + ' data contoh');
    } else {
      result.messages.push('ℹ️ Sheet "' + GUEST_SHEET_NAME + '" sudah ada');
    }
    
    // Buat sheet Konfirmasi jika belum ada
    var rsvpSheet = spreadsheet.getSheetByName(RSVP_SHEET_NAME);
    if (!rsvpSheet) {
      rsvpSheet = spreadsheet.insertSheet(RSVP_SHEET_NAME);
      var rsvpHeaders = [
        'Timestamp', 
        'Nama', 
        'Email', 
        'Telepon/WA', 
        'Konfirmasi Kehadiran', 
        'Jumlah Tamu', 
        'Ucapan/Doa', 
        'Guest ID',
        'Status'
      ];
      
      rsvpSheet.appendRow(rsvpHeaders);
      
      // Format header
      var rsvpHeaderRange = rsvpSheet.getRange(1, 1, 1, rsvpHeaders.length);
      rsvpHeaderRange.setBackground('#2a6e3f')
                    .setFontColor('white')
                    .setFontWeight('bold')
                    .setHorizontalAlignment('center');
      
      // Set lebar kolom
      rsvpSheet.setColumnWidth(1, 180); // Timestamp
      rsvpSheet.setColumnWidth(2, 200); // Nama
      rsvpSheet.setColumnWidth(3, 180); // Email
      rsvpSheet.setColumnWidth(4, 150); // Telepon
      rsvpSheet.setColumnWidth(5, 180); // Konfirmasi
      rsvpSheet.setColumnWidth(6, 120); // Jumlah Tamu
      rsvpSheet.setColumnWidth(7, 300); // Pesan
      rsvpSheet.setColumnWidth(8, 120); // Guest ID
      rsvpSheet.setColumnWidth(9, 100); // Status
      
      // Tambahkan data contoh DENGAN UCAPAN YANG BAGUS
      var sampleRSVP = [
        [
          new Date('2024-12-20T10:30:00'), 
          'Keluarga Ahmad Fauzi', 
          'ahmad@gmail.com', 
          '081234567890', 
          'Hadir', 
          '4', 
          'Selamat ya Farhan, semoga menjadi anak yang sholeh dan berbakti kepada orang tua. Doa kami menyertai perjalanan hidupmu. Semoga selalu sehat dan sukses! 😊🙏', 
          'fam001', 
          'Akan Hadir'
        ],
        [
          new Date('2024-12-21T14:20:00'), 
          'Keluarga Suryadi', 
          'suryadi@yahoo.com', 
          '082345678901', 
          'Hadir', 
          '3', 
          'Semoga acara khitanan berjalan lancar dan Farhan sehat selalu. Barakallah, semoga menjadi anak yang cerdas dan berakhlak mulia. Kami sangat berbahagia bisa turut hadir! ❤️', 
          'fam002', 
          'Akan Hadir'
        ],
        [
          new Date('2024-12-22T09:15:00'), 
          'Keluarga Rahman', 
          '', 
          '083456789012', 
          'Tidak Hadir', 
          '0', 
          'Maaf tidak bisa hadir, ada acara keluarga yang sudah terjadwal. Semoga Farhan sehat selalu dan menjadi anak yang sukses dunia akhirat. Doa kami menyertai dari jauh. 🙏', 
          'fam003', 
          'Tidak Hadir'
        ],
        [
          new Date('2024-12-19T16:45:00'), 
          'Budi Santoso', 
          'budi.santoso@gmail.com', 
          '084567890123', 
          'Hadir', 
          '2', 
          'Selamat atas khitanannya Farhan! Semoga menjadi anak yang membanggakan orang tua dan berguna bagi agama, nusa, dan bangsa. Sukses selalu! 👍', 
          '', 
          'Akan Hadir'
        ],
        [
          new Date('2024-12-18T11:10:00'), 
          'Ibu Siti Rahayu', 
          '', 
          '085678901234', 
          'Hadir', 
          '1', 
          'Alhamdulillah, selamat ya Nak Farhan. Semoga selalu dalam lindungan Allah SWT. Jangan lupa rajin belajar dan mengaji ya. Doa nenek menyertaimu selalu. ❤️🙏', 
          '', 
          'Akan Hadir'
        ]
      ];
      
      for (var j = 0; j < sampleRSVP.length; j++) {
        rsvpSheet.appendRow(sampleRSVP[j]);
      }
      
      // Format timestamp
      rsvpSheet.getRange(2, 1, sampleRSVP.length, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
      
      // Beri warna pada baris
      for (var k = 2; k <= sampleRSVP.length + 1; k++) {
        var rowRange = rsvpSheet.getRange(k, 1, 1, 9);
        if (k % 2 === 0) {
          rowRange.setBackground('#f9f9f9');
        }
      }
      
      result.sheetsCreated.push(RSVP_SHEET_NAME);
      result.dataAdded[RSVP_SHEET_NAME] = sampleRSVP.length;
      result.messages.push('✅ Sheet "' + RSVP_SHEET_NAME + '" berhasil dibuat dengan ' + sampleRSVP.length + ' data contoh (semua memiliki ucapan)');
    } else {
      result.messages.push('ℹ️ Sheet "' + RSVP_SHEET_NAME + '" sudah ada');
    }
    
    // Reorder sheets: DaftarTamu di kiri, Konfirmasi di kanan
    var sheets = spreadsheet.getSheets();
    for (var k = 0; k < sheets.length; k++) {
      if (sheets[k].getName() === GUEST_SHEET_NAME) {
        spreadsheet.setActiveSheet(sheets[k]);
        spreadsheet.moveActiveSheet(1); // Pindah ke posisi pertama
      }
    }
    
    result.message = '✅ Setup spreadsheet selesai! Spreadsheet siap digunakan.';
    result.timestamp = new Date().toISOString();
    result.apiUrl = ScriptApp.getService().getUrl();
    result.testLinks = {
      testConnection: result.apiUrl + '?action=testConnection',
      getComments: result.apiUrl + '?action=getComments',
      getCommentsTest: result.apiUrl + '?action=getCommentsTest'
    };
    
    Logger.log('Spreadsheet setup completed successfully!');
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error in setupSpreadsheet: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: '❌ Error saat setup: ' + error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ==============================================
// FUNGSI BANTUAN DAN DEBUG
// ==============================================

// Fungsi untuk menambahkan data contoh tambahan ke RSVP
function addSampleComments() {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(RSVP_SHEET_NAME);
    
    if (!sheet) {
      return 'Sheet "' + RSVP_SHEET_NAME + '" tidak ditemukan';
    }
    
    var sampleComments = [
      {
        name: 'Pak Darmawan',
        email: 'darmawan@email.com',
        phone: '086789012345',
        attendance: 'Hadir',
        guests: '2',
        message: 'Selamat Farhan! Semoga acara khitanannya lancar dan menjadi awal yang baik untuk masa depan yang cerah. Sukses selalu! 🎉',
        guestId: 'guest001'
      },
      {
        name: 'Ibu Mulyati',
        email: '',
        phone: '087890123456',
        attendance: 'Hadir',
        guests: '1',
        message: 'Alhamdulillah, selamat ya Nak. Semoga Farhan selalu diberi kesehatan dan kecerdasan. Doa bibi menyertaimu. ❤️🙏',
        guestId: 'guest002'
      },
      {
        name: 'Keluarga Hasan',
        email: 'hasan.family@gmail.com',
        phone: '088901234567',
        attendance: 'Tidak Hadir',
        guests: '0',
        message: 'Mohon maaf tidak bisa hadir karena sedang di luar kota. Semoga Farhan sehat selalu dan menjadi anak yang berbakti. Barakallah!',
        guestId: 'guest003'
      },
      {
        name: 'Saudara Rudi',
        email: 'rudi87@yahoo.com',
        phone: '089012345678',
        attendance: 'Hadir',
        guests: '3',
        message: 'Congratulations Farhan! Wishing you all the best on your special day. Semoga sukses dan bahagia selalu! 👍😊',
        guestId: 'guest004'
      }
    ];
    
    var addedCount = 0;
    var now = new Date();
    
    for (var i = 0; i < sampleComments.length; i++) {
      var comment = sampleComments[i];
      var status = comment.attendance === 'Hadir' ? 'Akan Hadir' : 'Tidak Hadir';
      
      // Buat timestamp yang berbeda untuk setiap entry
      var timestamp = new Date(now.getTime() - (i * 3600000)); // Kurangi i jam
      
      var newRow = [
        timestamp,
        comment.name,
        comment.email,
        comment.phone,
        comment.attendance,
        comment.guests,
        comment.message,
        comment.guestId,
        status
      ];
      
      sheet.appendRow(newRow);
      addedCount++;
    }
    
    // Format timestamp untuk baris baru
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow - addedCount + 1, 1, addedCount, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
    
    return 'Berhasil menambahkan ' + addedCount + ' komentar contoh ke sheet "' + RSVP_SHEET_NAME + '"';
    
  } catch (error) {
    return 'Error: ' + error.toString();
  }
}

// Fungsi untuk memeriksa dan memperbaiki struktur sheet
function fixSheetStructure() {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(RSVP_SHEET_NAME);
    
    if (!sheet) {
      return 'Sheet "' + RSVP_SHEET_NAME + '" tidak ditemukan';
    }
    
    var lastColumn = sheet.getLastColumn();
    var result = {
      originalColumns: lastColumn,
      actionsTaken: []
    };
    
    // Jika kolom kurang dari 9, tambahkan kolom yang hilang
    if (lastColumn < 9) {
      for (var i = lastColumn + 1; i <= 9; i++) {
        sheet.insertColumnAfter(i - 1);
        result.actionsTaken.push('Menambahkan kolom ' + String.fromCharCode(64 + i));
      }
    }
    
    // Periksa header
    var headers = sheet.getRange(1, 1, 1, 9).getValues()[0];
    var expectedHeaders = [
      'Timestamp', 
      'Nama', 
      'Email', 
      'Telepon/WA', 
      'Konfirmasi Kehadiran', 
      'Jumlah Tamu', 
      'Ucapan/Doa', 
      'Guest ID',
      'Status'
    ];
    
    var headersFixed = false;
    for (var j = 0; j < headers.length; j++) {
      if (!headers[j] || headers[j].toString().trim() === '') {
        sheet.getRange(1, j + 1).setValue(expectedHeaders[j]);
        headersFixed = true;
        result.actionsTaken.push('Memperbaiki header kolom ' + String.fromCharCode(65 + j) + ' menjadi "' + expectedHeaders[j] + '"');
      }
    }
    
    // Format header
    var headerRange = sheet.getRange(1, 1, 1, 9);
    headerRange.setBackground('#2a6e3f')
              .setFontColor('white')
              .setFontWeight('bold')
              .setHorizontalAlignment('center');
    
    result.actionsTaken.push('Memformat header');
    result.finalColumns = sheet.getLastColumn();
    result.success = true;
    result.message = 'Struktur sheet berhasil diperbaiki';
    
    return JSON.stringify(result, null, 2);
    
  } catch (error) {
    return 'Error: ' + error.toString();
  }
}

// Fungsi untuk melihat data mentah sheet
function viewRawData() {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(RSVP_SHEET_NAME);
    
    if (!sheet) {
      return 'Sheet "' + RSVP_SHEET_NAME + '" tidak ditemukan';
    }
    
    var lastRow = sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();
    
    if (lastRow <= 1) {
      return 'Tidak ada data di sheet "' + RSVP_SHEET_NAME + '"';
    }
    
    var data = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
    
    var result = {
      sheet: RSVP_SHEET_NAME,
      dimensions: {
        rows: lastRow,
        columns: lastColumn,
        range: 'A1:' + String.fromCharCode(64 + lastColumn) + lastRow
      },
      headers: data[0],
      data: []
    };
    
    // Ambil 10 baris pertama data (termasuk header)
    var sampleSize = Math.min(10, data.length);
    for (var i = 0; i < sampleSize; i++) {
      var rowData = {};
      for (var j = 0; j < data[i].length; j++) {
        var header = result.headers[j] || 'Kolom ' + (j + 1);
        var value = data[i][j];
        rowData[header] = {
          raw: value,
          type: typeof value,
          string: value ? value.toString() : '',
          trimmed: value ? value.toString().trim() : '',
          isEmpty: !value || value.toString().trim() === ''
        };
      }
      result.data.push(rowData);
    }
    
    // Analisis kolom pesan
    var messageColumnIndex = 6; // Kolom G
    var messages = [];
    var hasMessages = 0;
    var noMessages = 0;
    
    for (var k = 1; k < data.length; k++) {
      var message = data[k][messageColumnIndex];
      if (message && message.toString().trim() !== '') {
        hasMessages++;
        if (messages.length < 5) {
          messages.push({
            row: k + 1,
            name: data[k][1],
            message: message.toString().trim().substring(0, 100),
            length: message.toString().trim().length
          });
        }
      } else {
        noMessages++;
      }
    }
    
    result.messageAnalysis = {
      totalRows: data.length - 1,
      rowsWithMessages: hasMessages,
      rowsWithoutMessages: noMessages,
      sampleMessages: messages
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(result, null, 2))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return 'Error: ' + error.toString();
  }
}

// Fungsi untuk mendapatkan pengaturan undangan
function getSettings() {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(SETTINGS_SHEET_NAME);
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false, 
          message: 'Settings sheet not found'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var data = sheet.getDataRange().getValues();
    var settings = {};
    
    // Mulai dari baris 2 (lewatkan header)
    for (var i = 1; i < data.length; i++) {
      if (data[i][0]) {
        var value = data[i][1];
        // Jika value adalah Date, ubah ke string agar tidak berformat ISO di client
        if (value instanceof Date) {
          // Jika jamnya 0, anggap ini tanggal saja
          if (value.getHours() === 0 && value.getMinutes() === 0) {
            value = Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
          } else {
            value = Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
          }
        }
        settings[data[i][0]] = value;
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true, 
        settings: settings
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false, 
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Fungsi untuk menyimpan pengaturan undangan
function saveSettings(settings) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(SETTINGS_SHEET_NAME);
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SETTINGS_SHEET_NAME);
      sheet.appendRow(['Key', 'Value']);
    }
    
    // Bersihkan data lama kecuali header
    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).clearContent();
    }
    
    // Masukkan data baru
    var rows = [];
    for (var key in settings) {
      rows.push([key, settings[key]]);
    }
    
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, 2).setValues(rows);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true, 
        message: 'Settings saved to Cloud'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false, 
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}