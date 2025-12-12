// Main JavaScript file for the invitation website

// Global variables
let currentColorTheme = '#2E7D32';
let guestLinks = [];
let invitationData = {};

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the app based on current page
    if (document.body.classList.contains('creator-page')) {
        initCreatorPage();
    } else if (document.body.classList.contains('guest-page')) {
        initGuestPage();
    }
    
    // Set current year in footer if exists
    const yearElement = document.querySelector('.current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
});

// Creator Page Functions
function initCreatorPage() {
    // Color picker functionality
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            colorOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            currentColorTheme = this.dataset.color;
            document.documentElement.style.setProperty('--primary-color', currentColorTheme);
        });
    });
    
    // Set first color as active
    if (colorOptions.length > 0) {
        colorOptions[0].classList.add('active');
    }
    
    // Form submission for creating invitation
    const invitationForm = document.getElementById('invitationForm');
    if (invitationForm) {
        invitationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createInvitation();
        });
    }
    
    // Generate guest link button
    const generateLinkBtn = document.getElementById('generateLinkBtn');
    if (generateLinkBtn) {
        generateLinkBtn.addEventListener('click', generateGuestLink);
    }
    
    // Copy link button
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', copyGeneratedLink);
    }
    
    // Load existing data
    loadGuestData();
    loadMessagesData();
    
    // Refresh data button
    const refreshBtn = document.getElementById('refreshDataBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadGuestData();
            loadMessagesData();
            showNotification('Data diperbarui', 'success');
        });
    }
    
    // Open Google Sheets button
    const openSheetsBtn = document.getElementById('openSheetsBtn');
    if (openSheetsBtn) {
        openSheetsBtn.addEventListener('click', function() {
            // Replace with your actual Google Sheets URL
            window.open('https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit', '_blank');
        });
    }
    
    // Set default date/time to next Saturday
    const eventDateInput = document.getElementById('eventDate');
    if (eventDateInput) {
        const nextSaturday = getNextSaturday();
        eventDateInput.value = nextSaturday;
    }
}

// Guest Page Functions
function initGuestPage() {
    // Get guest name from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const guestName = urlParams.get('guest') || 'Tamu Undangan';
    
    // Display guest name in various places
    const guestNameElements = document.querySelectorAll('.guest-name-display');
    guestNameElements.forEach(el => {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.value = guestName;
        } else {
            el.textContent = guestName;
        }
    });
    
    // RSVP form submission
    const rsvpForm = document.getElementById('rsvpForm');
    if (rsvpForm) {
        rsvpForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitRSVP();
        });
    }
    
    // Guest message submission
    const submitMessageBtn = document.getElementById('submitMessageBtn');
    if (submitMessageBtn) {
        submitMessageBtn.addEventListener('click', submitGuestMessage);
    }
    
    // Share buttons
    const shareButtons = document.querySelectorAll('.share-btn');
    shareButtons.forEach(button => {
        button.addEventListener('click', function() {
            const platform = this.classList.contains('whatsapp') ? 'whatsapp' : 
                            this.classList.contains('telegram') ? 'telegram' : 'copy';
            shareInvitation(platform);
        });
    });
    
    // Load invitation data
    loadInvitationDataForGuest();
    loadGuestMessagesForDisplay();
}

// Function to create a new invitation
async function createInvitation() {
    // Get form values
    const childName = document.getElementById('childName').value;
    const childAge = document.getElementById('childAge').value;
    const parentName = document.getElementById('parentName').value;
    const parentPhone = document.getElementById('parentPhone').value;
    const eventDate = document.getElementById('eventDate').value;
    const eventLocation = document.getElementById('eventLocation').value;
    const eventDescription = document.getElementById('eventDescription').value;
    const enableMusic = document.getElementById('enableMusic').checked;
    const enableGuestBook = document.getElementById('enableGuestBook').checked;
    
    // Create invitation object
    invitationData = {
        id: generateInvitationId(),
        childName,
        childAge,
        parentName,
        parentPhone,
        eventDate,
        eventLocation,
        eventDescription,
        enableMusic,
        enableGuestBook,
        colorTheme: currentColorTheme,
        createdAt: new Date().toISOString(),
        guestCount: 0,
        messageCount: 0
    };
    
    // In a real app, you would save this to Google Sheets
    // For now, we'll simulate by saving to localStorage
    localStorage.setItem('invitationData', JSON.stringify(invitationData));
    
    // Show success message
    showNotification(`Undangan untuk ${childName} berhasil dibuat!`, 'success');
    
    // Enable guest link generator
    document.getElementById('guestNameInput').disabled = false;
    document.getElementById('generateLinkBtn').disabled = false;
    
    // Update stats display
    updateStatsDisplay();
    
    return invitationData;
}

// Function to generate a guest link
function generateGuestLink() {
    const guestNameInput = document.getElementById('guestNameInput');
    const guestName = guestNameInput.value.trim();
    
    if (!guestName) {
        showNotification('Masukkan nama tamu terlebih dahulu', 'error');
        guestNameInput.focus();
        return;
    }
    
    if (!invitationData || !invitationData.id) {
        showNotification('Buat undangan terlebih dahulu', 'error');
        return;
    }
    
    // Create a unique ID for this guest
    const guestId = generateGuestId(guestName);
    
    // Create the invitation link with guest parameter
    const baseUrl = window.location.href.replace('index.html', 'invitation.html');
    const guestLink = `${baseUrl}?invitation=${invitationData.id}&guest=${encodeURIComponent(guestName)}&id=${guestId}`;
    
    // Display the link
    const linkResult = document.getElementById('linkResult');
    const generatedLinkInput = document.getElementById('generatedLink');
    
    generatedLinkInput.value = guestLink;
    linkResult.classList.add('active');
    
    // Add to guest links array
    const guestLinkObj = {
        id: guestId,
        name: guestName,
        link: guestLink,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    guestLinks.push(guestLinkObj);
    
    // Update guest table
    updateGuestTable();
    
    // Save to localStorage (in real app, save to Google Sheets)
    saveGuestLinkToStorage(guestLinkObj);
    
    // Clear input
    guestNameInput.value = '';
    
    showNotification(`Link untuk ${guestName} berhasil dibuat`, 'success');
}

// Function to copy generated link to clipboard
async function copyGeneratedLink() {
    const generatedLinkInput = document.getElementById('generatedLink');
    
    try {
        await navigator.clipboard.writeText(generatedLinkInput.value);
        showNotification('Link berhasil disalin ke clipboard', 'success');
    } catch (err) {
        console.error('Failed to copy: ', err);
        showNotification('Gagal menyalin link', 'error');
    }
}

// Function to load guest data
function loadGuestData() {
    // In a real app, load from Google Sheets
    // For demo, we'll use localStorage
    const savedGuests = localStorage.getItem('guestLinks');
    
    if (savedGuests) {
        guestLinks = JSON.parse(savedGuests);
        updateGuestTable();
    }
    
    // Update stats
    updateStatsDisplay();
}

// Function to update guest table
function updateGuestTable() {
    const tableBody = document.getElementById('guestTableBody');
    
    if (!tableBody) return;
    
    // Clear loading row
    tableBody.innerHTML = '';
    
    if (guestLinks.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px;">
                    Belum ada tamu. Buat link undangan di atas.
                </td>
            </tr>
        `;
        return;
    }
    
    // Add each guest to the table
    guestLinks.forEach((guest, index) => {
        const row = document.createElement('tr');
        row.className = 'fade-in';
        
        // Status badge
        let statusBadge = '';
        switch(guest.status) {
            case 'confirmed':
                statusBadge = '<span class="badge confirmed">Hadir</span>';
                break;
            case 'maybe':
                statusBadge = '<span class="badge maybe">Mungkin</span>';
                break;
            case 'declined':
                statusBadge = '<span class="badge declined">Tidak Hadir</span>';
                break;
            default:
                statusBadge = '<span class="badge pending">Menunggu</span>';
        }
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${guest.name}</td>
            <td>
                <input type="text" value="${guest.link}" readonly class="table-link">
            </td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn-small copy-row-link" data-link="${guest.link}">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="btn-small delete-guest" data-id="${guest.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to new buttons
    document.querySelectorAll('.copy-row-link').forEach(button => {
        button.addEventListener('click', function() {
            const link = this.getAttribute('data-link');
            navigator.clipboard.writeText(link)
                .then(() => showNotification('Link berhasil disalin', 'success'))
                .catch(err => console.error('Copy failed:', err));
        });
    });
    
    document.querySelectorAll('.delete-guest').forEach(button => {
        button.addEventListener('click', function() {
            const guestId = this.getAttribute('data-id');
            deleteGuestLink(guestId);
        });
    });
}

// Function to update stats display
function updateStatsDisplay() {
    // Update stats on creator page
    document.getElementById('totalGuests').textContent = guestLinks.length;
    
    // Count confirmed guests
    const confirmedCount = guestLinks.filter(g => g.status === 'confirmed').length;
    document.getElementById('confirmedGuests').textContent = confirmedCount;
    
    // Count messages (in a real app, this would come from Google Sheets)
    const messages = JSON.parse(localStorage.getItem('guestMessages') || '[]');
    document.getElementById('totalMessages').textContent = messages.length;
    
    document.getElementById('linksGenerated').textContent = guestLinks.length;
}

// Function to load messages data
function loadMessagesData() {
    // In a real app, load from Google Sheets
    const messages = JSON.parse(localStorage.getItem('guestMessages') || '[]');
    const messagesList = document.getElementById('messagesList');
    
    if (!messagesList) return;
    
    if (messages.length === 0) {
        messagesList.innerHTML = `
            <div class="no-messages">
                <i class="fas fa-comment-slash"></i>
                <p>Belum ada ucapan dari tamu</p>
            </div>
        `;
        return;
    }
    
    // Display messages (show only latest 10)
    const recentMessages = messages.slice(-10).reverse();
    
    messagesList.innerHTML = recentMessages.map(msg => `
        <div class="message-card fade-in">
            <div class="message-header">
                <div class="message-name">${msg.name}</div>
                <div class="message-date">${formatDate(msg.timestamp)}</div>
            </div>
            <div class="message-text">${msg.message}</div>
            <div class="message-meta">
                <span class="attendance-status">Status: ${getStatusText(msg.attendance)}</span>
                ${msg.guestCount ? `<span class="guest-count">Jumlah: ${msg.guestCount} orang</span>` : ''}
            </div>
        </div>
    `).join('');
}

// Function to submit RSVP (guest page)
function submitRSVP() {
    const guestName = document.getElementById('confirmName').value;
    const attendance = document.querySelector('input[name="attendance"]:checked').value;
    const guestCount = document.getElementById('guestCount').value;
    const guestMessage = document.getElementById('guestMessage').value;
    
    // Get invitation ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const invitationId = urlParams.get('invitation');
    
    // Create RSVP object
    const rsvpData = {
        invitationId,
        guestName,
        attendance,
        guestCount,
        message: guestMessage,
        timestamp: new Date().toISOString()
    };
    
    // In a real app, submit to Google Sheets
    // For demo, save to localStorage
    saveRSVPToStorage(rsvpData);
    
    // Update guest status in creator data if this guest has a link
    updateGuestStatus(guestName, attendance);
    
    // Show success message
    showNotification('Konfirmasi kehadiran berhasil dikirim!', 'success');
    
    // Reset form
    document.getElementById('guestMessage').value = '';
    
    // Reload messages to show the new one
    if (document.body.classList.contains('guest-page')) {
        loadGuestMessagesForDisplay();
    }
}

// Function to submit guest message
function submitGuestMessage() {
    const guestName = document.getElementById('messageName').value;
    const message = document.getElementById('newMessage').value.trim();
    
    if (!message) {
        showNotification('Tulis ucapan terlebih dahulu', 'error');
        document.getElementById('newMessage').focus();
        return;
    }
    
    // Get invitation ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const invitationId = urlParams.get('invitation');
    
    // Create message object
    const messageData = {
        invitationId,
        name: guestName,
        message,
        timestamp: new Date().toISOString()
    };
    
    // In a real app, submit to Google Sheets
    saveMessageToStorage(messageData);
    
    // Show success message
    showNotification('Ucapan berhasil dikirim!', 'success');
    
    // Clear input
    document.getElementById('newMessage').value = '';
    
    // Reload messages
    if (document.body.classList.contains('guest-page')) {
        loadGuestMessagesForDisplay();
    }
}

// Function to load invitation data for guest page
function loadInvitationDataForGuest() {
    // In a real app, load from Google Sheets based on invitation ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const invitationId = urlParams.get('invitation');
    
    if (invitationId) {
        // Try to load from localStorage (in real app, load from Google Sheets)
        const savedInvitation = localStorage.getItem('invitationData');
        
        if (savedInvitation) {
            invitationData = JSON.parse(savedInvitation);
            
            // Populate the invitation data on the page
            document.getElementById('childNameDisplay').textContent = invitationData.childName;
            document.getElementById('childAgeDisplay').textContent = `${invitationData.childAge} Tahun`;
            document.getElementById('parentNameDisplay').textContent = invitationData.parentName;
            document.getElementById('familyNameDisplay').textContent = invitationData.parentName;
            document.getElementById('contactPhoneDisplay').textContent = invitationData.parentPhone;
            
            // Format and display event date
            const eventDate = new Date(invitationData.eventDate);
            const formattedDate = formatDateForDisplay(eventDate);
            const formattedTime = formatTimeForDisplay(eventDate);
            
            document.getElementById('eventDateDisplay').textContent = formattedDate;
            document.getElementById('eventTimeDisplay').textContent = `Pukul ${formattedTime}`;
            
            // Display location
            document.getElementById('eventLocationDisplay').textContent = invitationData.eventLocation;
            
            // Create Google Maps link
            const mapsLink = document.getElementById('mapsLink');
            if (mapsLink) {
                const encodedLocation = encodeURIComponent(invitationData.eventLocation);
                mapsLink.href = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
            }
            
            // Apply color theme if different from default
            if (invitationData.colorTheme && invitationData.colorTheme !== '#2E7D32') {
                document.documentElement.style.setProperty('--primary-color', invitationData.colorTheme);
            }
            
            // Handle music setting
            if (!invitationData.enableMusic) {
                const musicToggle = document.getElementById('musicToggle');
                if (musicToggle) {
                    musicToggle.style.display = 'none';
                }
            }
        }
    }
}

// Function to load guest messages for display on guest page
function loadGuestMessagesForDisplay() {
    // In a real app, load from Google Sheets
    const messages = JSON.parse(localStorage.getItem('guestMessages') || '[]');
    const messagesContainer = document.getElementById('guestbookMessages');
    
    if (!messagesContainer) return;
    
    // Filter messages for this invitation
    const urlParams = new URLSearchParams(window.location.search);
    const invitationId = urlParams.get('invitation');
    
    const filteredMessages = invitationId 
        ? messages.filter(msg => msg.invitationId === invitationId)
        : messages;
    
    if (filteredMessages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="no-messages">
                <i class="fas fa-comment-slash"></i>
                <p>Jadilah yang pertama mengirim ucapan!</p>
            </div>
        `;
        return;
    }
    
    // Display messages (show only latest 15)
    const recentMessages = filteredMessages.slice(-15).reverse();
    
    messagesContainer.innerHTML = recentMessages.map(msg => `
        <div class="message-card fade-in">
            <div class="message-header">
                <div class="message-name">${msg.name}</div>
                <div class="message-date">${formatDate(msg.timestamp)}</div>
            </div>
            <div class="message-text">${msg.message}</div>
            ${msg.attendance ? `
                <div class="message-meta">
                    <span class="attendance-status">${getStatusText(msg.attendance)}</span>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Function to share invitation
function shareInvitation(platform) {
    const currentUrl = window.location.href;
    const guestName = document.getElementById('guestNameDisplay')?.textContent || 'Tamu Undangan';
    const childName = document.getElementById('childNameDisplay')?.textContent || 'Anak';
    
    const message = `Assalamu'alaikum, saya diundang dalam acara khitanan ${childName}. Buka undangan digital di: ${currentUrl}`;
    
    if (platform === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    } else if (platform === 'telegram') {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(message)}`, '_blank');
    } else {
        // Copy to clipboard
        navigator.clipboard.writeText(currentUrl)
            .then(() => showNotification('Link berhasil disalin ke clipboard', 'success'))
            .catch(err => console.error('Copy failed:', err));
    }
}

// Utility Functions
function generateInvitationId() {
    return 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateGuestId(guestName) {
    const normalizedName = guestName.toLowerCase().replace(/\s+/g, '_');
    return 'guest_' + Date.now() + '_' + normalizedName + '_' + Math.random().toString(36).substr(2, 5);
}

function getNextSaturday() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    let daysUntilSaturday = 6 - dayOfWeek;
    
    if (daysUntilSaturday <= 0) {
        daysUntilSaturday += 7;
    }
    
    const nextSaturday = new Date(today);
    nextSaturday.setDate(today.getDate() + daysUntilSaturday);
    nextSaturday.setHours(10, 0, 0, 0); // Set to 10:00 AM
    
    // Format as YYYY-MM-DDTHH:mm for datetime-local input
    return nextSaturday.toISOString().slice(0, 16);
}

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
        case 'hadir': return 'Hadir';
        case 'mungkin': return 'Mungkin Hadir';
        case 'tidak': return 'Tidak Hadir';
        default: return 'Menunggu Konfirmasi';
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function saveGuestLinkToStorage(guestLink) {
    // In a real app, save to Google Sheets
    // For demo, save to localStorage
    guestLinks.push(guestLink);
    localStorage.setItem('guestLinks', JSON.stringify(guestLinks));
}

function saveRSVPToStorage(rsvpData) {
    // In a real app, save to Google Sheets
    // For demo, save to localStorage
    const messages = JSON.parse(localStorage.getItem('guestMessages') || '[]');
    messages.push({
        ...rsvpData,
        type: 'rsvp'
    });
    localStorage.setItem('guestMessages', JSON.stringify(messages));
}

function saveMessageToStorage(messageData) {
    // In a real app, save to Google Sheets
    // For demo, save to localStorage
    const messages = JSON.parse(localStorage.getItem('guestMessages') || '[]');
    messages.push({
        ...messageData,
        type: 'message'
    });
    localStorage.setItem('guestMessages', JSON.stringify(messages));
}

function updateGuestStatus(guestName, status) {
    // Update guest status in local storage
    const guestIndex = guestLinks.findIndex(g => g.name === guestName);
    
    if (guestIndex !== -1) {
        // Map status values
        let mappedStatus = 'pending';
        if (status === 'hadir') mappedStatus = 'confirmed';
        if (status === 'mungkin') mappedStatus = 'maybe';
        if (status === 'tidak') mappedStatus = 'declined';
        
        guestLinks[guestIndex].status = mappedStatus;
        localStorage.setItem('guestLinks', JSON.stringify(guestLinks));
        
        // Update table if on creator page
        if (document.body.classList.contains('creator-page')) {
            updateGuestTable();
            updateStatsDisplay();
        }
    }
}

function deleteGuestLink(guestId) {
    if (confirm('Apakah Anda yakin ingin menghapus tamu ini?')) {
        guestLinks = guestLinks.filter(g => g.id !== guestId);
        localStorage.setItem('guestLinks', JSON.stringify(guestLinks));
        updateGuestTable();
        updateStatsDisplay();
        showNotification('Tamu berhasil dihapus', 'success');
    }
}

// Add CSS for notifications
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: var(--border-radius);
        padding: 15px 20px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 9999;
        transform: translateX(150%);
        transition: transform 0.3s ease;
        max-width: 400px;
        border-left: 4px solid var(--primary-color);
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification.success {
        border-left-color: #4CAF50;
    }
    
    .notification.error {
        border-left-color: #f44336;
    }
    
    .notification i {
        font-size: 1.2rem;
    }
    
    .notification.success i {
        color: #4CAF50;
    }
    
    .notification.error i {
        color: #f44336;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: #999;
        cursor: pointer;
        padding: 5px;
        margin-left: auto;
    }
    
    .badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 500;
    }
    
    .badge.confirmed {
        background-color: #d4edda;
        color: #155724;
    }
    
    .badge.maybe {
        background-color: #fff3cd;
        color: #856404;
    }
    
    .badge.declined {
        background-color: #f8d7da;
        color: #721c24;
    }
    
    .badge.pending {
        background-color: #e2e3e5;
        color: #383d41;
    }
    
    .btn-small {
        padding: 6px 12px;
        font-size: 0.9rem;
    }
    
    .table-link {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: #f8f9fa;
        font-size: 0.9rem;
    }
`;

// Add notification styles to the page
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);
