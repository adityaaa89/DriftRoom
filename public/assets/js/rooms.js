// rooms.js - Handling the Rooms Listing and Creation

document.addEventListener('DOMContentLoaded', () => {
    // 1. Verify user completely registered a name
    const username = localStorage.getItem('localChat_username');
    if (!username) {
        window.location.href = 'index.html'; // Redirect to start if no name
        return;
    }

    // 2. Set the UI profile name + avatar
    const encodedName = encodeURIComponent(username);
    const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodedName}`;
    document.getElementById('profile-name').innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px;">
            <img src="${avatarUrl}" style="width: 18px; height: 18px; border-radius: 50%;" alt="${escapeHTML(username)}" />
            <span>${escapeHTML(username)}</span>
        </div>
    `;

    const roomsList = document.getElementById('rooms-list');

    // Helper to calculate time left
    function formatTimeLeft(expiresAt) {
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diffMs = expiry - now;
        
        if (diffMs <= 0) return 'Expired';
        
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) {
            return `${diffMins}m left`;
        }
        const diffHrs = Math.floor(diffMins / 60);
        const remainderMins = diffMins % 60;
        return `${diffHrs}h ${remainderMins}m left`;
    }

    // 3. Render the room cards
    function renderRooms(rooms) {
        roomsList.innerHTML = '';
        
        if (rooms.length === 0) {
            roomsList.innerHTML = `
                <div class="empty-state">
                    No active rooms found. Create one to start chatting!
                </div>
            `;
            return;
        }

        rooms.forEach(room => {
            const card = document.createElement('div');
            card.className = 'room-card';
            
            const timeLeft = formatTimeLeft(room.expiresAt);

            card.innerHTML = `
                <div class="room-info">
                    <h3 class="room-name">${escapeHTML(room.roomName)}</h3>
                    <div class="room-meta">
                        <span class="tag">${escapeHTML(room.category)}</span>
                        <span class="meta-item">👥 ${room.activeUsers}</span>
                        <span class="meta-item">⏳ ${timeLeft}</span>
                    </div>
                </div>
                <button class="btn-join" data-id="${room._id}" data-name="${escapeHTML(room.roomName)}">Join</button>
            `;
            roomsList.appendChild(card);
        });

        // Add event listeners to dynamically created join buttons
        document.querySelectorAll('.btn-join').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const name = e.target.getAttribute('data-name');
                joinRoom(id, name);
            });
        });
    }

    // 4. Fetch rooms from backend
    async function fetchRooms() {
        try {
            roomsList.innerHTML = `
                <div class="empty-state">
                    Locating nearby rooms...
                </div>
            `;

            const location = await getUserLocation();
            
            let url = '/api/rooms';
            if (location) {
                url += `?lat=${location.latitude}&lng=${location.longitude}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch rooms');
            }
            const rooms = await response.json();
            renderRooms(rooms);
        } catch (error) {
            console.error('Error fetching rooms:', error);
            roomsList.innerHTML = `
                <div class="empty-state" style="color: #e53e3e; border-color: #fc8181; background: #fff5f5;">
                    Cannot connect to server. Please try again later.
                </div>
            `;
        }
    }

    // Initial fetch
    fetchRooms();

    // 5. Geolocation functionality
    function getUserLocation() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                console.warn('Geolocation is not supported by your browser');
                resolve(null);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    console.warn('Geolocation error or denied:', error.message);
                    resolve(null); // Resolve with null to let user continue without location
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        });
    }

    // 6. Modal Logic for Creating a Room
    const createBtn = document.getElementById('btn-create-room');
    const modal = document.getElementById('create-room-modal');
    const cancelBtn = document.getElementById('btn-cancel-room');
    const submitBtn = document.getElementById('btn-submit-room');
    const newRoomName = document.getElementById('new-room-name');
    const newRoomCategory = document.getElementById('new-room-category');

    createBtn.addEventListener('click', () => {
        modal.classList.add('active');
        newRoomName.focus();
    });

    function closeModal() {
        modal.classList.remove('active');
        newRoomName.value = '';
        newRoomCategory.value = '';
        submitBtn.textContent = 'Start Room';
        submitBtn.disabled = false;
        newRoomName.style.borderColor = '';
    }

    cancelBtn.addEventListener('click', closeModal);

    // Close modal if clicking outside the card
    modal.addEventListener('click', (e) => {
        if(e.target === modal) closeModal();
    });

    submitBtn.addEventListener('click', async () => {
        const name = newRoomName.value.trim();
        const category = newRoomCategory.value.trim() || 'General';
        
        if (!name) {
            newRoomName.style.borderColor = '#e53e3e';
            return;
        }

        // Show loading state
        submitBtn.textContent = 'Locating...';
        submitBtn.disabled = true;

        try {
            // Wait for user location
            const location = await getUserLocation();

            submitBtn.textContent = 'Creating...';

            const roomData = {
                roomName: name,
                category: category,
                latitude: location ? location.latitude : undefined,
                longitude: location ? location.longitude : undefined
            };

            const response = await fetch('/api/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(roomData)
            });

            if (!response.ok) {
                throw new Error('Server error when creating a room');
            }

            // Successfully created, fetch updated list
            await fetchRooms();
            closeModal();
            
        } catch (error) {
            console.error('Error creating room:', error);
            alert('Failed to start room. Please check your connection.');
            submitBtn.textContent = 'Start Room';
            submitBtn.disabled = false;
        }
    });
});

// Helper for navigating to chat page
function joinRoom(roomId, roomName) {
    // Store selected room info so the chat page knows what to display
    localStorage.setItem('localChat_currentRoomId', roomId);
    localStorage.setItem('localChat_currentRoomName', roomName);
    window.location.href = 'chat.html';
}

// Simple HTML escaper to prevent injection from user created rooms
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag])
    );
}
