// main.js - Handling the Landing/Entry Page

document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('name-input');
    const continueBtn = document.getElementById('continue-btn');
    const errorMsg = document.getElementById('error-msg');

    // Pre-fill the input if the user has already entered their name before
    const savedName = localStorage.getItem('localChat_username');
    if (savedName) {
        nameInput.value = savedName;
    }

    function handleContinue() {
        const name = nameInput.value.trim();
        
        // Simple validation
        if (!name) {
            errorMsg.style.display = 'block';
            nameInput.style.borderColor = '#e53e3e';
            return;
        }

        // Reset error state
        errorMsg.style.display = 'none';
        nameInput.style.borderColor = '';

        // Save to localStorage
        localStorage.setItem('localChat_username', name);
        
        // Check if there's a shared room link
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('roomId');
        const roomName = urlParams.get('roomName');
        
        if (roomId && roomName) {
            localStorage.setItem('localChat_currentRoomId', roomId);
            localStorage.setItem('localChat_currentRoomName', roomName);
            window.location.href = 'chat.html';
        } else {
            // Proceed to rooms page
            window.location.href = 'rooms.html';
        }
    }

    // Event listeners
    continueBtn.addEventListener('click', handleContinue);

    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleContinue();
        }
    });
    
    // Clear validation error on type
    nameInput.addEventListener('input', () => {
        errorMsg.style.display = 'none';
        nameInput.style.borderColor = '';
    });
});
