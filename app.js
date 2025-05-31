document.addEventListener('DOMContentLoaded', () => {
    const viewCountElement = document.getElementById('view-count');
    const chatMessagesElement = document.getElementById('chat-messages');
    const chatInputElement = document.getElementById('chat-input');
    const sendButtonElement = document.getElementById('send-button');

    // --- View Counter (Still needs a backend to be truly persistent and accurate) ---
    async function fetchAndUpdateViewCount() {
        try {
            // For a real counter:
            // 1. On page load, your JS could call an endpoint like '/api/increment-view'
            // await fetch('/api/increment-view', { method: 'POST' });

            // 2. Then fetch the total count
            // const response = await fetch('/api/get-views');
            // const data = await response.json();
            // viewCountElement.textContent = data.views;

            // Using localStorage for a simple, non-shared demo:
            let currentViews = localStorage.getItem('simulatedViews');
            if (!sessionStorage.getItem('viewIncremented')) { // Increment once per session
                currentViews = currentViews ? parseInt(currentViews) + 1 : 1;
                localStorage.setItem('simulatedViews', currentViews);
                sessionStorage.setItem('viewIncremented', 'true');
            } else {
                currentViews = currentViews ? parseInt(currentViews) : 0;
            }
            viewCountElement.textContent = currentViews || '0';

        } catch (error) {
            console.error('Error with view count:', error);
            viewCountElement.textContent = 'Error';
        }
    }
    fetchAndUpdateViewCount();


    // --- Chat Room with Backend Persistence ---

    function getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Helper function to display a message
    function displayMessage(user, message, timestamp) {
        const messageElement = document.createElement('div');
        const timeString = timestamp ? new Date(timestamp).toLocaleTimeString() : '';
        messageElement.innerHTML = `${timeString ? `<span class="timestamp">[${timeString}]</span> ` : ''}<strong>${user}:</strong> ${message}`;
        chatMessagesElement.appendChild(messageElement);
        chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
    }

    // **1. Connect to your chat backend (e.g., using Socket.IO or Firebase)**
    // Example using a hypothetical Socket.IO client:
    // const socket = io(); // This would connect to your Socket.IO server

    // **2. Load existing messages when the page loads**
    async function loadInitialMessages() {
        try {
            // Using Fetch API to get messages from your backend
            // const response = await fetch('/api/chat/messages');
            // const messages = await response.json(); // Assuming server returns an array of messages
            // messages.forEach(msg => displayMessage(msg.user, msg.text, msg.timestamp));

            // --- SIMULATED FOR DEMO (Replace with actual fetch) ---
            console.log("Simulating fetching initial messages...");
            // In a real app, these would come from your server/database
            const mockMessages = [
                // { user: "OldUser", text: "This is an older message.", timestamp: Date.now() - 100000 },
                // { user: "AnotherUser", text: "Hello from the past!", timestamp: Date.now() - 50000 }
            ];
            mockMessages.forEach(msg => displayMessage(msg.user, msg.text, msg.timestamp));
            displayMessage('System', 'Chat connected.');
            
            displayMessage('euler1415', 'Hello, I hope you have a lot of fun on this website!!!',
                          Date.now() - 3600 * 3 - getRandomInt(900, 1800)
                          );
            displayMessage('Gauss430', 'wut is this',
                          Date.now() - 3600 * 2 - getRandomInt(900, 1800)
                          );
            displayMessage('euler1415', 'This is MY website.',
                          Date.now() - 3600 * 1 - getRandomInt(900, 1800)
                          );
            displayMessage('euler1415', 'This chat might not work sometimes.',
                          Date.now() - getRandomInt(900, 1800)
                          );
            // --- END SIMULATION ---

        } catch (error) {
            console.error("Error loading initial messages:", error);
            displayMessage('System', 'Could not load previous messages.');
        }
    }

    // **3. Listen for new messages from the server**
    // Example with Socket.IO:
    // socket.on('newMessage', (data) => { // 'newMessage' is a custom event name
    //     displayMessage(data.user, data.text, data.timestamp);
    // });

    // --- SIMULATED INCOMING MESSAGE (Replace with actual WebSocket/listener) ---
    function simulateIncomingMessage() {
        setTimeout(() => {
            // This would be triggered by your backend (e.g., Socket.IO server.emit)
            // const randomMessage = { user: "ServerUser", text: "This is a message from the server!", timestamp: Date.now() };
            // displayMessage(randomMessage.user, randomMessage.text, randomMessage.timestamp);
        }, 5000);
    }
    // --- END SIMULATION ---


    // **4. Send a new message**
    sendButtonElement.addEventListener('click', () => {
        const messageText = chatInputElement.value.trim();
        if (messageText) {
            const messageData = {
                // user: "You", // The server should ideally set the user based on authentication
                text: messageText,
                // timestamp: Date.now() // Server should set the definitive timestamp
            };

            // Send to server (e.g., using Socket.IO)
            // socket.emit('sendMessage', messageData);

            // --- SIMULATED SENDING (Replace with actual emit/POST) ---
            console.log("Simulating sending message:", messageData);
            displayMessage('You', messageText, Date.now()); // Optimistic update (display your own message immediately)
            // In a real app, you might wait for server confirmation or handle it differently
            // --- END SIMULATION ---

            chatInputElement.value = '';
        }
    });

    chatInputElement.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendButtonElement.click();
        }
    });

    // Initialize
    loadInitialMessages();
    // simulateIncomingMessage(); // Start listening for simulated messages

});
