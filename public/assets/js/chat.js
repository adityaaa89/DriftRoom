// chat.js - Handling the Real-Time Chat UI with Socket.io

document.addEventListener('DOMContentLoaded', () => {
    // 1. Verify Authentication & Room State
    const username = localStorage.getItem('localChat_username');
    if (!username) {
        window.location.href = 'index.html';
        return;
    }

    // Generate a simple unique userId if not present (simple fallback for basic tracking)
    let userId = localStorage.getItem('localChat_userId');
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('localChat_userId', userId);
    }

    const roomId = localStorage.getItem('localChat_currentRoomId');
    const roomName = localStorage.getItem('localChat_currentRoomName');
    
    // Redirect if they accessed the page without a selected room
    if (!roomId) {
        window.location.href = 'rooms.html';
        return;
    }
    
    // Set UI elements
    document.getElementById('room-title').textContent = roomName || 'Local Room';
    const roomPeopleEl = document.getElementById('room-people');

    const messagesArea = document.getElementById('messages-area');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');

    // 2. Initialize Socket.io connection
    const socket = io();

    // Join the room as soon as the connection is established
    socket.emit('joinRoom', {
        roomId,
        userId,
        username
    });

    // 3. UI Helpers
    function appendSystemMessage(text) {
        const wrapper = document.createElement('div');
        wrapper.style.alignSelf = 'center';
        wrapper.style.fontSize = '12px';
        wrapper.style.color = 'var(--text-muted)';
        wrapper.style.margin = '8px 0';
        wrapper.textContent = text;
        messagesArea.appendChild(wrapper);
        scrollToBottom();
    }

    function appendMessage(msg) {
        const isSelf = msg.username === username;
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${isSelf ? 'self' : 'other'}`;
        
        // Load random distinctive avatar for every single message using DiceBear
        let avatarHtml = '';
        const encodedName = encodeURIComponent(msg.username);
        const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodedName}`;
        avatarHtml = `<img src="${avatarUrl}" class="avatar" alt="${escapeHTML(msg.username)}" />`;

        wrapper.innerHTML = `
            ${avatarHtml}
            <div class="message-content">
                ${!isSelf ? `<div class="sender-name">${escapeHTML(msg.username)}</div>` : ''}
                <div class="bubble">${escapeHTML(msg.text)}</div>
            </div>
        `;

        messagesArea.appendChild(wrapper);
        scrollToBottom();
    }

    // Auto scroll to latest message
    function scrollToBottom() {
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    // 4. Socket Listeners for incoming events

    // When we receive a chat message
    socket.on('receiveMessage', (message) => {
        appendMessage(message);
    });

    // When we join and receive the past chat history from the DB
    socket.on('loadPastMessages', (messages) => {
        messages.forEach((msg) => {
            appendMessage({
                username: msg.username,
                text: msg.text,
                isSelf: msg.username === username
            });
        });
    });

    // When another user joins
    socket.on('userJoined', (data) => {
        appendSystemMessage(`${data.username} joined the room`);
    });

    // When another user leaves
    socket.on('userLeft', (data) => {
        appendSystemMessage(`${data.username} left the room`);
    });

    // When the active users list is updated
    socket.on('updateUsers', (data) => {
        if (roomPeopleEl && data.users) {
            roomPeopleEl.textContent = data.users.length;
        }
    });

    // 5. User Actions (Sending Messages)
    function sendMessage() {
        const text = messageInput.value.trim();
        if (!text) return;

        // Emit to server (don't append locally immediately to ensure source of truth relies on server broadcast)
        socket.emit('sendMessage', {
            roomId,
            username,
            text
        });

        // Clear input
        messageInput.value = '';
        messageInput.focus();
    }

    // Event Listeners for Input
    sendBtn.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // HTML escaper utility
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
});
