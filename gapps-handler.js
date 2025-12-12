// Google Apps Script Integration Handler
// Menggunakan Web App URL dari Google Apps Script

// Konfigurasi - GANTI DENGAN WEB APP URL ANDA
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxwqk6n_92StNVmDJPunlA--rMwNuusYcKqFnY2DPesPla8ByVc83mRhlyeRc157Z-n/exec';

// Fungsi untuk mengirim data ke Google Apps Script
async function sendToGoogleAppsScript(action, data = {}) {
  try {
    const payload = {
      action: action,
      ...data
    };
    
    const response = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors', // Google Apps Script tidak support CORS
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    // Karena no-cors, kita tidak bisa membaca response secara langsung
    // Kita asumsikan berhasil jika tidak ada error
    return {
      success: true,
      message: 'Data berhasil dikirim ke Google Sheets'
    };
    
  } catch (error) {
    console.error('Error sending to Google Apps Script:', error);
    
    // Fallback ke localStorage jika gagal
    return {
      success: false,
      message: 'Gagal mengirim data, menggunakan localStorage',
      error: error.toString()
    };
  }
}

// Fungsi untuk mengambil data dari Google Apps Script
async function getFromGoogleAppsScript(action, params = {}) {
  try {
    // Build URL dengan parameter
    const urlParams = new URLSearchParams({
      action: action,
      ...params
    });
    
    const url = `${GAS_WEB_APP_URL}?${urlParams.toString()}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('Error fetching from Google Apps Script:', error);
    
    // Fallback ke localStorage
    return getFromLocalStorage(action, params);
  }
}

// Fallback ke localStorage
function getFromLocalStorage(action, params) {
  switch(action) {
    case 'getInvitation':
      const invitationData = localStorage.getItem('invitationData');
      return {
        success: !!invitationData,
        data: invitationData ? JSON.parse(invitationData) : null
      };
      
    case 'getGuests':
      const guestLinks = JSON.parse(localStorage.getItem('guestLinks') || '[]');
      const filteredGuests = guestLinks.filter(g => g.invitationId === params.invitationId);
      return {
        success: true,
        data: filteredGuests
      };
      
    case 'getMessages':
      const messages = JSON.parse(localStorage.getItem('guestMessages') || '[]');
      const filteredMessages = messages.filter(m => m.invitationId === params.invitationId);
      return {
        success: true,
        data: filteredMessages
      };
      
    default:
      return {
        success: false,
        message: 'Action tidak didukung di localStorage'
      };
  }
}

// Fungsi untuk menyimpan data invitation
async function saveInvitationToGAS(invitationData) {
  // Simpan ke localStorage terlebih dahulu (fallback)
  localStorage.setItem('invitationData', JSON.stringify(invitationData));
  
  // Coba kirim ke Google Apps Script
  const result = await sendToGoogleAppsScript('createInvitation', {
    data: invitationData
  });
  
  return result;
}

// Fungsi untuk menyimpan guest link
async function saveGuestLinkToGAS(guestLink) {
  // Simpan ke localStorage
  const guestLinks = JSON.parse(localStorage.getItem('guestLinks') || '[]');
  guestLinks.push(guestLink);
  localStorage.setItem('guestLinks', JSON.stringify(guestLinks));
  
  // Coba kirim ke Google Apps Script
  const result = await sendToGoogleAppsScript('createGuestLink', {
    data: guestLink
  });
  
  return result;
}

// Fungsi untuk menyimpan RSVP
async function saveRSVPToGAS(rsvpData) {
  // Simpan ke localStorage
  const messages = JSON.parse(localStorage.getItem('guestMessages') || '[]');
  messages.push({
    ...rsvpData,
    type: 'rsvp'
  });
  localStorage.setItem('guestMessages', JSON.stringify(messages));
  
  // Coba kirim ke Google Apps Script
  const result = await sendToGoogleAppsScript('saveRSVP', {
    data: rsvpData
  });
  
  return result;
}

// Fungsi untuk menyimpan message
async function saveMessageToGAS(messageData) {
  // Simpan ke localStorage
  const messages = JSON.parse(localStorage.getItem('guestMessages') || '[]');
  messages.push({
    ...messageData,
    type: 'message'
  });
  localStorage.setItem('guestMessages', JSON.stringify(messages));
  
  // Coba kirim ke Google Apps Script
  const result = await sendToGoogleAppsScript('saveMessage', {
    data: messageData
  });
  
  return result;
}

// Fungsi untuk mengambil data invitation
async function getInvitationFromGAS(invitationId) {
  // Coba ambil dari Google Apps Script
  const result = await getFromGoogleAppsScript('getInvitation', {
    invitationId: invitationId
  });
  
  return result;
}

// Fungsi untuk mengambil data guests
async function getGuestsFromGAS(invitationId) {
  // Coba ambil dari Google Apps Script
  const result = await getFromGoogleAppsScript('getGuests', {
    invitationId: invitationId
  });
  
  return result;
}

// Fungsi untuk mengambil data messages
async function getMessagesFromGAS(invitationId) {
  // Coba ambil dari Google Apps Script
  const result = await getFromGoogleAppsScript('getMessages', {
    invitationId: invitationId
  });
  
  return result;
}

// Update fungsi-fungsi utama untuk menggunakan GAS
document.addEventListener('DOMContentLoaded', function() {
  // Ganti dengan Web App URL Anda
  const webAppUrl = prompt("Masukkan Google Apps Script Web App URL Anda:", GAS_WEB_APP_URL);
  
  if (webAppUrl && webAppUrl !== GAS_WEB_APP_URL) {
    // Update URL
    GAS_WEB_APP_URL = webAppUrl;
    localStorage.setItem('gasWebAppUrl', webAppUrl);
  } else if (localStorage.getItem('gasWebAppUrl')) {
    // Gunakan URL yang sudah disimpan
    GAS_WEB_APP_URL = localStorage.getItem('gasWebAppUrl');
  }
  
  console.log('Using Google Apps Script URL:', GAS_WEB_APP_URL);
  
  // Override fungsi-fungsi di script.js utama
  if (typeof window !== 'undefined') {
    // Override save functions
    window.saveGuestLinkToStorage = saveGuestLinkToGAS;
    window.saveRSVPToStorage = saveRSVPToGAS;
    window.saveMessageToStorage = saveMessageToGAS;
    
    // Override load functions
    window.loadGuestData = async function() {
      if (!window.currentInvitationId) return;
      
      const result = await getGuestsFromGAS(window.currentInvitationId);
      if (result.success) {
        guestLinks = result.data;
        updateGuestTable();
        updateStatsDisplay();
      }
    };
    
    window.loadMessagesData = async function() {
      if (!window.currentInvitationId) return;
      
      const result = await getMessagesFromGAS(window.currentInvitationId);
      if (result.success) {
        // Process messages
        displayMessages(result.data);
      }
    };
    
    window.loadInvitationDataForGuest = async function() {
      const urlParams = new URLSearchParams(window.location.search);
      const invitationId = urlParams.get('invitation');
      
      if (invitationId) {
        const result = await getInvitationFromGAS(invitationId);
        if (result.success && result.data) {
          window.currentInvitationId = invitationId;
          invitationData = result.data;
          
          // Populate the page with invitation data
          populateInvitationData(result.data);
        }
      }
    };
    
    window.loadGuestMessagesForDisplay = async function() {
      const urlParams = new URLSearchParams(window.location.search);
      const invitationId = urlParams.get('invitation');
      
      if (invitationId) {
        const result = await getMessagesFromGAS(invitationId);
        if (result.success) {
          displayGuestMessages(result.data);
        }
      }
    };
  }
});

// Helper functions
function populateInvitationData(data) {
  document.getElementById('childNameDisplay').textContent = data.childName;
  document.getElementById('childAgeDisplay').textContent = `${data.childAge} Tahun`;
  document.getElementById('parentNameDisplay').textContent = data.parentName;
  document.getElementById('familyNameDisplay').textContent = data.parentName;
  document.getElementById('contactPhoneDisplay').textContent = data.parentPhone;
  
  // Format date
  const eventDate = new Date(data.eventDate);
  const formattedDate = formatDateForDisplay(eventDate);
  const formattedTime = formatTimeForDisplay(eventDate);
  
  document.getElementById('eventDateDisplay').textContent = formattedDate;
  document.getElementById('eventTimeDisplay').textContent = `Pukul ${formattedTime}`;
  
  // Location
  document.getElementById('eventLocationDisplay').textContent = data.eventLocation;
  
  // Google Maps link
  const mapsLink = document.getElementById('mapsLink');
  if (mapsLink) {
    const encodedLocation = encodeURIComponent(data.eventLocation);
    mapsLink.href = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
  }
  
  // Apply color theme
  if (data.colorTheme) {
    document.documentElement.style.setProperty('--primary-color', data.colorTheme);
  }
  
  // Music setting
  if (!data.enableMusic) {
    const musicToggle = document.getElementById('musicToggle');
    if (musicToggle) musicToggle.style.display = 'none';
  }
}

function displayMessages(messages) {
  const messagesList = document.getElementById('messagesList');
  if (!messagesList) return;
  
  if (!messages || messages.length === 0) {
    messagesList.innerHTML = `
      <div class="no-messages">
        <i class="fas fa-comment-slash"></i>
        <p>Belum ada ucapan dari tamu</p>
      </div>
    `;
    return;
  }
  
  // Display messages
  messagesList.innerHTML = messages.map(msg => `
    <div class="message-card fade-in">
      <div class="message-header">
        <div class="message-name">${msg.guestName || msg.name}</div>
        <div class="message-date">${formatDate(msg.timestamp || msg.createdAt)}</div>
      </div>
      <div class="message-text">${msg.message}</div>
      ${msg.attendanceStatus ? `
        <div class="message-meta">
          <span class="attendance-status">Status: ${getStatusText(msg.attendanceStatus)}</span>
        </div>
      ` : ''}
    </div>
  `).join('');
}

function displayGuestMessages(messages) {
  const guestbookMessages = document.getElementById('guestbookMessages');
  if (!guestbookMessages) return;
  
  if (!messages || messages.length === 0) {
    guestbookMessages.innerHTML = `
      <div class="no-messages">
        <i class="fas fa-comment-slash"></i>
        <p>Jadilah yang pertama mengirim ucapan!</p>
      </div>
    `;
    return;
  }
  
  // Display messages (latest 15)
  const recentMessages = messages.slice(-15).reverse();
  
  guestbookMessages.innerHTML = recentMessages.map(msg => `
    <div class="message-card fade-in">
      <div class="message-header">
        <div class="message-name">${msg.guestName || msg.name}</div>
        <div class="message-date">${formatDate(msg.timestamp || msg.createdAt)}</div>
      </div>
      <div class="message-text">${msg.message}</div>
    </div>
  `).join('');
}

// Formatting functions (sama seperti di script.js utama)
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString('id-ID', options);
}

function formatDateForDisplay(date) {
  const options = { 
    weekday: 'long',
    day: 'numeric', 
    month: 'long', 
    year: 'numeric'
  };
  return date.toLocaleDateString('id-ID', options);
}

function formatTimeForDisplay(date) {
  const options = { 
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleTimeString('id-ID', options);
}

function getStatusText(status) {
  switch(status) {
    case 'hadir': 
    case 'confirmed': 
      return 'Hadir';
    case 'mungkin': 
    case 'maybe': 
      return 'Mungkin Hadir';
    case 'tidak': 
    case 'declined': 
      return 'Tidak Hadir';
    default: 
      return 'Menunggu Konfirmasi';
  }
}
