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

    const globalRoomsList = document.getElementById('global-rooms-list');
    const nearbyRoomsList = document.getElementById('nearby-rooms-list');

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
        globalRoomsList.innerHTML = '';
        nearbyRoomsList.innerHTML = '';
        
        const globalRooms = rooms.filter(r => r.isGlobal);
        const nearbyRooms = rooms.filter(r => !r.isGlobal);
        
        if (globalRooms.length === 0) {
            globalRoomsList.innerHTML = `
                <div class="empty-state">
                    No global rooms available at the moment.
                </div>
            `;
        } else {
            renderRoomList(globalRooms, globalRoomsList);
        }

        if (nearbyRooms.length === 0) {
            nearbyRoomsList.innerHTML = `
                <div class="empty-state">
                    No nearby rooms found. Create one to start chatting!
                </div>
            `;
        } else {
            renderRoomList(nearbyRooms, nearbyRoomsList);
        }

        // Add event listeners to dynamically created join buttons
        document.querySelectorAll('.btn-join').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const name = e.target.getAttribute('data-name');
                joinRoom(id, name);
            });
        });

        // Add event listeners for share buttons
        document.querySelectorAll('.btn-share').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const currentBtn = e.currentTarget;
                const id = currentBtn.getAttribute('data-id');
                const name = currentBtn.getAttribute('data-name');
                
                const shareUrl = `${window.location.origin}/?roomId=${id}&roomName=${encodeURIComponent(name)}`;
                
                navigator.clipboard.writeText(shareUrl).then(() => {
                    const originalHTML = currentBtn.innerHTML;
                    currentBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                    currentBtn.classList.add('copied');
                    
                    setTimeout(() => {
                        currentBtn.innerHTML = originalHTML;
                        currentBtn.classList.remove('copied');
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                });
            });
        });
    }

    function renderRoomList(roomArray, container) {
        roomArray.forEach(room => {
            const card = document.createElement('div');
            card.className = 'room-card';
            
            const timeLeft = formatTimeLeft(room.expiresAt);
            
            let badgeHtml = '';
            if (room.isGlobal) {
                badgeHtml = '<span class="tag" style="background:var(--accent);color:white;">Global</span>';
            } else if (room.distance != null) {
                badgeHtml = `📍 ${room.distance}m away`;
            } else {
                badgeHtml = `📍 Nearby`;
            }

            card.innerHTML = `
                <div class="room-info">
                    <h3 class="room-name">${escapeHTML(room.roomName)}</h3>
                    <div class="room-meta">
                        <span class="tag">${escapeHTML(room.category)}</span>
                        <span class="meta-item">👥 ${room.activeUsers}</span>
                        ${room.isGlobal ? '' : `<span class="meta-item">⏳ ${timeLeft}</span>`}
                        <span class="meta-item" style="color: var(--accent); font-weight: 500;">${badgeHtml}</span>
                    </div>
                </div>
                <div class="room-actions">
                    <button class="btn-icon btn-share" data-id="${room._id}" data-name="${escapeHTML(room.roomName)}" title="Copy Link">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                    </button>
                    <button class="btn-join" data-id="${room._id}" data-name="${escapeHTML(room.roomName)}">Join</button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    // 4. Fetch rooms from backend
    async function fetchRooms() {
        try {
            globalRoomsList.innerHTML = '<div class="empty-state">Loading global rooms...</div>';
            nearbyRoomsList.innerHTML = '<div class="empty-state">Locating nearby rooms...</div>';

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
            globalRoomsList.innerHTML = '';
            nearbyRoomsList.innerHTML = `
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
