// Google Sheets Integration Handler
// This file handles all communication with Google Sheets API

// Configuration - REPLACE WITH YOUR OWN VALUES
const CONFIG = {
    SHEET_ID: 'YOUR_GOOGLE_SHEET_ID_HERE',
    API_KEY: 'YOUR_GOOGLE_API_KEY_HERE',
    SHEET_NAMES: {
        INVITATIONS: 'Invitations',
        GUESTS: 'Guests',
        MESSAGES: 'Messages'
    }
};

// Base URL for Google Sheets API
const BASE_URL = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values`;

// Initialize Google Sheets integration
function initGoogleSheets() {
    // Check if configuration is set
    if (CONFIG.SHEET_ID === 'YOUR_GOOGLE_SHEET_ID_HERE' || CONFIG.API_KEY === 'YOUR_GOOGLE_API_KEY_HERE') {
        console.warn('Google Sheets configuration not set. Using localStorage as fallback.');
        return false;
    }
    
    console.log('Google Sheets integration initialized');
    return true;
}

// Save invitation data to Google Sheets
async function saveInvitationToSheets(invitationData) {
    if (!initGoogleSheets()) {
        // Fallback to localStorage
        localStorage.setItem('invitationData', JSON.stringify(invitationData));
        return { success: true, message: 'Saved to localStorage (fallback)' };
    }
    
    try {
        const timestamp = new Date().toISOString();
        const values = [[
            invitationData.id,
            invitationData.childName,
            invitationData.childAge,
            invitationData.parentName,
            invitationData.parentPhone,
            invitationData.eventDate,
            invitationData.eventLocation,
            invitationData.eventDescription,
            invitationData.enableMusic,
            invitationData.enableGuestBook,
            invitationData.colorTheme,
            timestamp
        ]];
        
        const response = await fetch(
            `${BASE_URL}/${CONFIG.SHEET_NAMES.INVITATIONS}!A:L?valueInputOption=USER_ENTERED&key=${CONFIG.API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    values: values
                })
            }
        );
        
        if (!response.ok) {
            throw new Error(`Google Sheets API error: ${response.status}`);
        }
        
        return { success: true, message: 'Invitation saved to Google Sheets' };
    } catch (error) {
        console.error('Error saving invitation to Google Sheets:', error);
        // Fallback to localStorage
        localStorage.setItem('invitationData', JSON.stringify(invitationData));
        return { success: false, message: 'Failed to save to Google Sheets, using localStorage', error };
    }
}

// Save guest link to Google Sheets
async function saveGuestLinkToSheets(guestLink) {
    if (!initGoogleSheets()) {
        // Fallback to localStorage
        const guestLinks = JSON.parse(localStorage.getItem('guestLinks') || '[]');
        guestLinks.push(guestLink);
        localStorage.setItem('guestLinks', JSON.stringify(guestLinks));
        return { success: true, message: 'Saved to localStorage (fallback)' };
    }
    
    try {
        const values = [[
            guestLink.id,
            guestLink.name,
            guestLink.link,
            guestLink.status,
            guestLink.createdAt
        ]];
        
        const response = await fetch(
            `${BASE_URL}/${CONFIG.SHEET_NAMES.GUESTS}!A:E?valueInputOption=USER_ENTERED&key=${CONFIG.API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    values: values
                })
            }
        );
        
        if (!response.ok) {
            throw new Error(`Google Sheets API error: ${response.status}`);
        }
        
        return { success: true, message: 'Guest link saved to Google Sheets' };
    } catch (error) {
        console.error('Error saving guest link to Google Sheets:', error);
        // Fallback to localStorage
        const guestLinks = JSON.parse(localStorage.getItem('guestLinks') || '[]');
        guestLinks.push(guestLink);
        localStorage.setItem('guestLinks', JSON.stringify(guestLinks));
        return { success: false, message: 'Failed to save to Google Sheets, using localStorage', error };
    }
}

// Save RSVP/message to Google Sheets
async function saveMessageToSheets(messageData) {
    if (!initGoogleSheets()) {
        // Fallback to localStorage
        const messages = JSON.parse(localStorage.getItem('guestMessages') || '[]');
        messages.push(messageData);
        localStorage.setItem('guestMessages', JSON.stringify(messages));
        return { success: true, message: 'Saved to localStorage (fallback)' };
    }
    
    try {
        const values = [[
            messageData.invitationId || 'N/A',
            messageData.name || messageData.guestName,
            messageData.message || '',
            messageData.attendance || '',
            messageData.guestCount || '',
            messageData.timestamp || new Date().toISOString(),
            messageData.type || 'message'
        ]];
        
        const response = await fetch(
            `${BASE_URL}/${CONFIG.SHEET_NAMES.MESSAGES}!A:G?valueInputOption=USER_ENTERED&key=${CONFIG.API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    values: values
                })
            }
        );
        
        if (!response.ok) {
            throw new Error(`Google Sheets API error: ${response.status}`);
        }
        
        return { success: true, message: 'Message saved to Google Sheets' };
    } catch (error) {
        console.error('Error saving message to Google Sheets:', error);
        // Fallback to localStorage
        const messages = JSON.parse(localStorage.getItem('guestMessages') || '[]');
        messages.push(messageData);
        localStorage.setItem('guestMessages', JSON.stringify(messages));
        return { success: false, message: 'Failed to save to Google Sheets, using localStorage', error };
    }
}

// Load invitations from Google Sheets
async function loadInvitationsFromSheets() {
    if (!initGoogleSheets()) {
        // Fallback to localStorage
        const invitationData = JSON.parse(localStorage.getItem('invitationData') || 'null');
        return { success: true, data: invitationData ? [invitationData] : [] };
    }
    
    try {
        const response = await fetch(
            `${BASE_URL}/${CONFIG.SHEET_NAMES.INVITATIONS}?key=${CONFIG.API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error(`Google Sheets API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.values || data.values.length < 2) {
            return { success: true, data: [] };
        }
        
        // Skip header row and map to objects
        const invitations = data.values.slice(1).map(row => ({
            id: row[0],
            childName: row[1],
            childAge: row[2],
            parentName: row[3],
            parentPhone: row[4],
            eventDate: row[5],
            eventLocation: row[6],
            eventDescription: row[7],
            enableMusic: row[8] === 'TRUE',
            enableGuestBook: row[9] === 'TRUE',
            colorTheme: row[10],
            createdAt: row[11]
        }));
        
        return { success: true, data: invitations };
    } catch (error) {
        console.error('Error loading invitations from Google Sheets:', error);
        // Fallback to localStorage
        const invitationData = JSON.parse(localStorage.getItem('invitationData') || 'null');
        return { success: false, data: invitationData ? [invitationData] : [], error };
    }
}

// Load guest links from Google Sheets
async function loadGuestLinksFromSheets() {
    if (!initGoogleSheets()) {
        // Fallback to localStorage
        const guestLinks = JSON.parse(localStorage.getItem('guestLinks') || '[]');
        return { success: true, data: guestLinks };
    }
    
    try {
        const response = await fetch(
            `${BASE_URL}/${CONFIG.SHEET_NAMES.GUESTS}?key=${CONFIG.API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error(`Google Sheets API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.values || data.values.length < 2) {
            return { success: true, data: [] };
        }
        
        // Skip header row and map to objects
        const guestLinks = data.values.slice(1).map(row => ({
            id: row[0],
            name: row[1],
            link: row[2],
            status: row[3],
            createdAt: row[4]
        }));
        
        return { success: true, data: guestLinks };
    } catch (error) {
        console.error('Error loading guest links from Google Sheets:', error);
        // Fallback to localStorage
        const guestLinks = JSON.parse(localStorage.getItem('guestLinks') || '[]');
        return { success: false, data: guestLinks, error };
    }
}

// Load messages from Google Sheets
async function loadMessagesFromSheets() {
    if (!initGoogleSheets()) {
        // Fallback to localStorage
        const messages = JSON.parse(localStorage.getItem('guestMessages') || '[]');
        return { success: true, data: messages };
    }
    
    try {
        const response = await fetch(
            `${BASE_URL}/${CONFIG.SHEET_NAMES.MESSAGES}?key=${CONFIG.API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error(`Google Sheets API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.values || data.values.length < 2) {
            return { success: true, data: [] };
        }
        
        // Skip header row and map to objects
        const messages = data.values.slice(1).map(row => ({
            invitationId: row[0],
            name: row[1],
            message: row[2],
            attendance: row[3],
            guestCount: row[4],
            timestamp: row[5],
            type: row[6]
        }));
        
        return { success: true, data: messages };
    } catch (error) {
        console.error('Error loading messages from Google Sheets:', error);
        // Fallback to localStorage
        const messages = JSON.parse(localStorage.getItem('guestMessages') || '[]');
        return { success: false, data: messages, error };
    }
}

// Update guest status in Google Sheets
async function updateGuestStatusInSheets(guestId, status) {
    if (!initGoogleSheets()) {
        // Fallback to localStorage
        const guestLinks = JSON.parse(localStorage.getItem('guestLinks') || '[]');
        const guestIndex = guestLinks.findIndex(g => g.id === guestId);
        if (guestIndex !== -1) {
            guestLinks[guestIndex].status = status;
            localStorage.setItem('guestLinks', JSON.stringify(guestLinks));
        }
        return { success: true, message: 'Updated in localStorage (fallback)' };
    }
    
    // Note: Updating specific cells is more complex with Sheets API
    // This would require finding the row number and using the update endpoint
    console.log('Guest status update requested for Google Sheets implementation');
    return { success: false, message: 'Guest status update not implemented for Google Sheets in this demo' };
}

// Update the main script functions to use Google Sheets
document.addEventListener('DOMContentLoaded', function() {
    // Replace localStorage functions with Google Sheets functions if configured
    if (CONFIG.SHEET_ID !== 'YOUR_GOOGLE_SHEET_ID_HERE' && CONFIG.API_KEY !== 'YOUR_GOOGLE_API_KEY_HERE') {
        console.log('Using Google Sheets for data storage');
        
        // Override the save functions in the main script
        window.saveGuestLinkToStorage = saveGuestLinkToSheets;
        window.saveRSVPToStorage = saveMessageToSheets;
        window.saveMessageToStorage = saveMessageToSheets;
        
        // Override the load functions
        window.loadGuestData = async function() {
            const result = await loadGuestLinksFromSheets();
            if (result.success) {
                guestLinks = result.data;
                updateGuestTable();
                updateStatsDisplay();
            }
        };
        
        window.loadMessagesData = async function() {
            const result = await loadMessagesFromSheets();
            if (result.success) {
                // Process and display messages
                const messagesList = document.getElementById('messagesList');
                if (messagesList) {
                    // Display logic here
                }
            }
        };
        
        window.loadInvitationDataForGuest = async function() {
            const result = await loadInvitationsFromSheets();
            if (result.success && result.data.length > 0) {
                // Get invitation ID from URL
                const urlParams = new URLSearchParams(window.location.search);
                const invitationId = urlParams.get('invitation');
                
                if (invitationId) {
                    const invitation = result.data.find(inv => inv.id === invitationId);
                    if (invitation) {
                        invitationData = invitation;
                        // Populate the page with invitation data
                        // (Same as existing logic)
                    }
                }
            }
        };
        
        window.loadGuestMessagesForDisplay = async function() {
            const result = await loadMessagesFromSheets();
            if (result.success) {
                // Filter and display messages
                // (Same as existing logic)
            }
        };
    }
});
