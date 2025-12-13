// Konfigurasi Google Apps Script
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwK2vJ9j7wUo6qJq4F5lWmXx3fLkHj5sT6vZ4gG0Y/exec';

// Variabel global
let currentGuestName = '';
let currentGuestId = '';
let isMusicPlaying = true;
let currentConfirmation = null;

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    // Periksa apakah ini halaman admin atau undangan
    if (document.getElementById('guestForm')) {
        initAdminPage();
    } else {
        initInvitationPage();
    }
    
    // Setup modal
    setupModals();
});

// ================== FUNGSI ADMIN PAGE ==================

function initAdminPage() {
    // Setup form pembuatan link
    const guestForm = document.getElementById('guestForm');
    guestForm.addEventListener('submit', handleGenerateLink);
    
    // Setup tombol reset
    document.getElementById('resetBtn').addEventListener('click', resetForm);
    
    // Setup tombol copy link
    document.getElementById('copyBtn').addEventListener('click', copyGeneratedLink);
    
    // Setup tombol preview
    document.getElementById('previewBtn').addEventListener('click', showPreview);
    
    // Setup tombol refresh database
    document.getElementById('refreshDbBtn').addEventListener('click', loadGuestData);
    
    // Setup tombol export
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    
    // Setup tombol lihat ucapan
    document.getElementById('viewMessagesBtn').addEventListener('click', showMessages);
    
    // Load data awal
    loadGuestData();
}

async function handleGenerateLink(e) {
    e.preventDefault();
    
    const guestName = document.getElementById('guestName').value;
    const guestGroup = document.getElementById('guestGroup').value;
    const additionalNote = document.getElementById('additionalNote').value;
    
    // Tampilkan loading
    const resultSection = document.getElementById('resultSection');
    resultSection.style.display = 'block';
    resultSection.innerHTML = '<div class="text-center"><div class="spinner"></div><p>Membuat link undangan...</p></div>';
    
    try {
        // Generate unique ID untuk tamu
        const guestId = generateGuestId(guestName);
        
        // Simpan data ke Google Sheets via Apps Script
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'createInvitation',
                guestName: guestName,
                guestId: guestId,
                guestGroup: guestGroup,
                additionalNote: additionalNote,
                timestamp: new Date().toISOString()
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Tampilkan link yang dihasilkan
            const baseUrl = window.location.hostname === 'localhost' 
                ? 'http://localhost:5500/invitation.html'
                : 'https://[username].github.io/[repo-name]/invitation.html';
                
            const invitationLink = `${baseUrl}?guest=${guestId}`;
            
            resultSection.innerHTML = `
                <h3><i class="fas fa-check-circle"></i> Link Undangan Berhasil Dibuat!</h3>
                <div class="link-container">
                    <input type="text" id="generatedLink" value="${invitationLink}" readonly>
                    <button class="btn-copy" id="copyBtn">
                        <i class="far fa-copy"></i> Salin
                    </button>
                </div>
                <p class="link-instruction">
                    <i class="fas fa-info-circle"></i> Link ini dapat dibagikan ke tamu. Nama tamu akan otomatis muncul saat link dibuka.
                </p>
                
                <div class="preview-section">
                    <h4><i class="fas fa-eye"></i> Preview Undangan</h4>
                    <div class="preview-card">
                        <div class="preview-header">
                            <h5>Undangan Khitanan</h5>
                            <p class="preview-guest">Untuk: <span id="previewGuestName">${guestName}</span></p>
                        </div>
                        <div class="preview-body">
                            <p>Ini adalah preview tampilan undangan yang akan dilihat oleh tamu.</p>
                            <button class="btn-preview" id="previewBtn">Lihat Preview Lengkap</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Re-attach event listeners
            document.getElementById('copyBtn').addEventListener('click', copyGeneratedLink);
            document.getElementById('previewBtn').addEventListener('click', () => showPreview(guestId, guestName));
            
            // Update preview nama
            document.getElementById('previewGuestName').textContent = guestName;
            
            // Refresh tabel data
            loadGuestData();
        } else {
            throw new Error(result.message || 'Gagal membuat link undangan');
        }
    } catch (error) {
        resultSection.innerHTML = `
            <div class="message error">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error: ${error.message}</p>
            </div>
            <button class="btn-generate" onclick="handleGenerateLink(event)">Coba Lagi</button>
        `;
    }
}

function generateGuestId(guestName) {
    // Buat ID unik dari nama dan timestamp
    const timestamp = Date.now();
    const namePart = guestName.replace(/\s+/g, '_').substring(0, 10).toLowerCase();
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `${namePart}_${randomPart}_${timestamp.toString(36)}`;
}

function resetForm() {
    document.getElementById('guestForm').reset();
    document.getElementById('resultSection').style.display = 'none';
}

function copyGeneratedLink() {
    const linkInput = document.getElementById('generatedLink');
    linkInput.select();
    linkInput.setSelectionRange(0, 99999); // Untuk mobile
    
    try {
        navigator.clipboard.writeText(linkInput.value);
        
        // Tampilkan feedback
        const copyBtn = document.getElementById('copyBtn');
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Tersalin!';
        copyBtn.style.background = '#2ecc71';
        
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.style.background = '';
        }, 2000);
    } catch (error) {
        alert('Gagal menyalin link: ' + error.message);
    }
}

function showPreview(guestId, guestName) {
    const previewFrame = document.getElementById('previewFrame');
    const baseUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:5500/invitation.html'
        : 'https://[username].github.io/[repo-name]/invitation.html';
    
    previewFrame.src = `${baseUrl}?guest=${guestId || 'preview'}&preview=true`;
    document.getElementById('previewModal').classList.add('active');
}

async function loadGuestData() {
    const tableBody = document.getElementById('guestTableBody');
    tableBody.innerHTML = '<tr><td colspan="6" class="loading-data"><div class="spinner"></div><p>Memuat data...</p></td></tr>';
    
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getGuests`);
        const data = await response.json();
        
        if (data.success) {
            renderGuestTable(data.guests);
            updateStats(data.stats);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-data">
                    <div class="message error">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Gagal memuat data: ${error.message}</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

function renderGuestTable(guests) {
    const tableBody = document.getElementById('guestTableBody');
    
    if (!guests || guests.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-data">
                    <p>Belum ada data tamu. Buat undangan pertama Anda!</p>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    guests.forEach((guest, index) => {
        const statusClass = guest.opened ? 'status-opened' : 'status-pending';
        const statusText = guest.opened ? 'Sudah Dibuka' : 'Belum Dibuka';
        
        html += `
            <tr class="fade-in">
                <td>${index + 1}</td>
                <td><strong>${guest.name}</strong><br><small>${guest.group}</small></td>
                <td>
                    <div class="link-cell">
                        <input type="text" value="${guest.link}" readonly>
                        <button class="btn-small btn-copy" onclick="copyTableLink('${guest.link}')">
                            <i class="far fa-copy"></i>
                        </button>
                    </div>
                </td>
                <td>${formatDate(guest.timestamp)}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn-small btn-view" onclick="viewGuestDetails('${guest.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-small btn-delete" onclick="deleteGuest('${guest.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

function copyTableLink(link) {
    navigator.clipboard.writeText(link).then(() => {
        showToast('Link berhasil disalin!');
    });
}

function updateStats(stats) {
    document.getElementById('totalGuests').textContent = stats.total || 0;
    document.getElementById('openedGuests').textContent = stats.opened || 0;
    document.getElementById('messageCount').textContent = stats.messages || 0;
}

function exportToCSV() {
    // Implementasi export ke CSV
    showToast('Fitur export sedang dalam pengembangan');
}

async function showMessages() {
    const modal = document.getElementById('messagesModal');
    const container = document.getElementById('messagesContainer');
    
    container.innerHTML = '<div class="text-center"><div class="spinner"></div><p>Memuat ucapan...</p></div>';
    modal.classList.add('active');
    
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getMessages`);
        const data = await response.json();
        
        if (data.success && data.messages.length > 0) {
            let html = '';
            data.messages.forEach(message => {
                html += `
                    <div class="wish-item">
                        <div class="wish-header">
                            <span class="wish-name">${message.name}</span>
                            <span class="wish-date">${formatDate(message.timestamp)}</span>
                        </div>
                        <p class="wish-message">${message.message}</p>
                    </div>
                `;
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p class="text-center">Belum ada ucapan dari tamu.</p>';
        }
    } catch (error) {
        container.innerHTML = `
            <div class="message error">
                <i class="fas fa-exclamation-circle"></i>
                <p>Gagal memuat ucapan: ${error.message}</p>
            </div>
        `;
    }
}

// ================== FUNGSI INVITATION PAGE ==================

function initInvitationPage() {
    // Ambil parameter dari URL
    const urlParams = new URLSearchParams(window.location.search);
    const guestId = urlParams.get('guest');
    const isPreview = urlParams.get('preview') === 'true';
    
    // Setup kontrol musik
    const musicToggle = document.getElementById('musicToggle');
    const volumeControl = document.getElementById('volumeControl');
    const backgroundMusic = document.getElementById('backgroundMusic');
    
    if (musicToggle) {
        musicToggle.addEventListener('click', toggleMusic);
    }
    
    if (volumeControl) {
        volumeControl.addEventListener('click', toggleVolume);
    }
    
    // Auto-play musik dengan volume rendah
    if (backgroundMusic) {
        backgroundMusic.volume = 0.3;
        backgroundMusic.play().catch(e => console.log('Auto-play prevented:', e));
    }
    
    // Jika preview mode, tampilkan nama default
    if (isPreview) {
        document.getElementById('guestNameDisplay').textContent = 'Bapak/Ibu Budi Santoso (Preview)';
        currentGuestName = 'Bapak/Ibu Budi Santoso (Preview)';
        currentGuestId = 'preview';
        document.getElementById('wisherName').value = currentGuestName;
        loadWishes();
        return;
    }
    
    // Jika ada guest ID, ambil data tamu
    if (guestId) {
        loadGuestDataFromId(guestId);
    } else {
        // Redirect ke halaman utama jika tidak ada parameter
        window.location.href = 'index.html';
    }
    
    // Setup konfirmasi kehadiran
    document.getElementById('confirmYes')?.addEventListener('click', () => setConfirmation('hadir'));
    document.getElementById('confirmNo')?.addEventListener('click', () => setConfirmation('tidak-hadir'));
    
    // Setup form ucapan
    document.getElementById('submitWishBtn')?.addEventListener('click', submitWish);
    
    // Setup tombol peta
    document.getElementById('mapBtn')?.addEventListener('click', showMap);
    
    // Setup tombol bagikan
    document.getElementById('shareBtn')?.addEventListener('click', shareInvitation);
    
    // Setup tombol download
    document.getElementById('downloadBtn')?.addEventListener('click', downloadInvitation);
    
    // Load ucapan yang sudah ada
    loadWishes();
    
    // Track opening undangan
    trackInvitationOpen(guestId);
}

async function loadGuestDataFromId(guestId) {
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getGuest&guestId=${guestId}`);
        const data = await response.json();
        
        if (data.success && data.guest) {
            currentGuestName = data.guest.name;
            currentGuestId = guestId;
            
            // Tampilkan nama tamu
            document.getElementById('guestNameDisplay').textContent = currentGuestName;
            document.getElementById('wisherName').value = currentGuestName;
            
            // Tambahkan kelas animasi
            document.getElementById('guestNameDisplay').classList.add('fade-in');
        } else {
            throw new Error('Tamu tidak ditemukan');
        }
    } catch (error) {
        // Fallback ke parameter URL jika gagal
        const urlParams = new URLSearchParams(window.location.search);
        const guestParam = urlParams.get('guest');
        if (guestParam) {
            currentGuestName = decodeURIComponent(guestParam.replace(/_/g, ' '));
            document.getElementById('guestNameDisplay').textContent = currentGuestName;
            document.getElementById('wisherName').value = currentGuestName;
        }
    }
}

function toggleMusic() {
    const backgroundMusic = document.getElementById('backgroundMusic');
    const musicStatus = document.getElementById('musicStatus');
    
    if (isMusicPlaying) {
        backgroundMusic.pause();
        musicStatus.textContent = 'Musik: OFF';
        document.getElementById('musicToggle').innerHTML = '<i class="fas fa-music"></i> Musik: OFF';
    } else {
        backgroundMusic.play();
        musicStatus.textContent = 'Musik: ON';
        document.getElementById('musicToggle').innerHTML = '<i class="fas fa-music"></i> Musik: ON';
    }
    
    isMusicPlaying = !isMusicPlaying;
}

function toggleVolume() {
    const backgroundMusic = document.getElementById('backgroundMusic');
    const volumeBtn = document.getElementById('volumeControl');
    
    if (backgroundMusic.volume === 0.3) {
        backgroundMusic.volume = 0.7;
        volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    } else if (backgroundMusic.volume === 0.7) {
        backgroundMusic.volume = 1.0;
        volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    } else {
        backgroundMusic.volume = 0.3;
        volumeBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
    }
}

function setConfirmation(status) {
    currentConfirmation = status;
    
    // Update tampilan
    const confirmYes = document.getElementById('confirmYes');
    const confirmNo = document.getElementById('confirmNo');
    
    if (status === 'hadir') {
        confirmYes.classList.add('selected');
        confirmNo.classList.remove('selected');
    } else {
        confirmNo.classList.add('selected');
        confirmYes.classList.remove('selected');
    }
    
    // Tampilkan modal konfirmasi
    document.getElementById('confirmModalTitle').textContent = 
        status === 'hadir' ? 'Konfirmasi Kehadiran' : 'Konfirmasi Ketidakhadiran';
    
    document.getElementById('confirmModalMessage').textContent = 
        status === 'hadir' 
            ? 'Apakah Anda yakin akan hadir di acara khitanan?'
            : 'Apakah Anda yakin tidak bisa hadir di acara khitanan?';
    
    document.getElementById('confirmModal').classList.add('active');
}

async function submitConfirmation() {
    if (!currentConfirmation || !currentGuestId) return;
    
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'saveConfirmation',
                guestId: currentGuestId,
                confirmation: currentConfirmation,
                timestamp: new Date().toISOString()
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Terima kasih atas konfirmasi Anda!');
            document.getElementById('confirmModal').classList.remove('active');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    }
}

async function submitWish() {
    const wishMessage = document.getElementById('wishMessage').value.trim();
    
    if (!wishMessage) {
        showToast('Silakan tulis ucapan terlebih dahulu', 'error');
        return;
    }
    
    if (!currentGuestId) {
        showToast('Data tamu tidak valid', 'error');
        return;
    }
    
    // Tampilkan loading
    const submitBtn = document.getElementById('submitWishBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'saveWish',
                guestId: currentGuestId,
                guestName: currentGuestName,
                message: wishMessage,
                timestamp: new Date().toISOString()
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Ucapan Anda telah terkirim! Terima kasih.');
            document.getElementById('wishMessage').value = '';
            
            // Refresh daftar ucapan
            loadWishes();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function loadWishes() {
    const container = document.getElementById('wishesContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-wishes"><i class="fas fa-spinner fa-spin"></i> Memuat ucapan...</div>';
    
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getWishes`);
        const data = await response.json();
        
        if (data.success && data.wishes.length > 0) {
            let html = '';
            // Tampilkan maksimal 10 ucapan terbaru
            const recentWishes = data.wishes.slice(-10).reverse();
            
            recentWishes.forEach(wish => {
                html += `
                    <div class="wish-item fade-in">
                        <div class="wish-header">
                            <span class="wish-name">${wish.name}</span>
                            <span class="wish-date">${formatDate(wish.timestamp)}</span>
                        </div>
                        <p class="wish-message">${wish.message}</p>
                    </div>
                `;
            });
            
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p class="no-wishes">Jadilah yang pertama mengirim ucapan!</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="error-wishes">Gagal memuat ucapan</p>';
    }
}

async function trackInvitationOpen(guestId) {
    if (!guestId || guestId === 'preview') return;
    
    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'trackOpen',
                guestId: guestId,
                timestamp: new Date().toISOString()
            })
        });
    } catch (error) {
        console.log('Gagal melacak pembukaan undangan:', error);
    }
}

function showMap() {
    document.getElementById('mapModal').classList.add('active');
}

function shareInvitation() {
    const shareData = {
        title: 'Undangan Khitanan',
        text: `Undangan khitanan untuk ${currentGuestName}. Buka link untuk detail lengkap.`,
        url: window.location.href
    };
    
    if (navigator.share) {
        navigator.share(shareData)
            .then(() => showToast('Undangan berhasil dibagikan!'))
            .catch(error => console.log('Error sharing:', error));
    } else {
        // Fallback untuk browser yang tidak support Web Share API
        navigator.clipboard.writeText(window.location.href)
            .then(() => showToast('Link undangan telah disalin!'));
    }
}

function downloadInvitation() {
    // Implementasi download sebagai gambar atau PDF
    showToast('Fitur download sedang dalam pengembangan');
}

// ================== FUNGSI UMUM ==================

function setupModals() {
    // Setup semua modal
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close-modal, .btn-cancel');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modals.forEach(modal => modal.classList.remove('active'));
        });
    });
    
    // Setup tombol konfirmasi di modal
    const finalConfirmBtn = document.getElementById('finalConfirmBtn');
    if (finalConfirmBtn) {
        finalConfirmBtn.addEventListener('click', submitConfirmation);
    }
    
    // Tutup modal saat klik di luar
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function showToast(message, type = 'success') {
    // Buat elemen toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Tampilkan toast
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Hapus toast setelah 3 detik
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Style untuk toast
const toastStyle = document.createElement('style');
toastStyle.textContent = `
    .toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #2ecc71;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.3s ease;
        z-index: 10000;
        max-width: 300px;
    }
    
    .toast.show {
        transform: translateY(0);
        opacity: 1;
    }
    
    .toast.error {
        background: #e74c3c;
    }
    
    .toast i {
        font-size: 1.2rem;
    }
`;
document.head.appendChild(toastStyle);
