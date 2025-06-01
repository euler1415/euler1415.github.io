import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import { serverTimestamp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-database.js";
import { Timestamp, getFirestore, collection, addDoc, query, getDocs } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";


// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDPN5czGwm9NPwVG2yu_KNKk63Ggqko5uc",
    authDomain: "webpage-ccd22.firebaseapp.com",
    projectId: "webpage-ccd22",
    storageBucket: "webpage-ccd22.firebasestorage.app",
    messagingSenderId: "211531738009",
    appId: "1:211531738009:web:bbc8179a4b43770976c108",
    measurementId: "G-FQQ0R01TDZ"
};

// Initialize Firebase
console.log(firebaseConfig)
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 1. Initialize Firestore with the app instance
const db = getFirestore(app);
console.log(`db ${db}`)

// Reference to the fireworks instance (will be initialized in DOMContentLoaded)
let fireworks;

// Function to trigger the fireworks animation
function triggerFireworks() {
    if (fireworks) {
        fireworks.start();
        setTimeout(() => {
            fireworks.stop();
        }, 3000);
    } else {
        console.warn("Fireworks object not initialized yet.");
    }
}

// Function to write a new message
async function writeNewMessage(username, messageText) {
    try {
        const messagesCollection = collection(db, "messages");

        const docRef = await addDoc(messagesCollection, {
            text: messageText,
            timestamp: Timestamp.now(),
            username: username,
        });

        console.log("Document written with ID: ", docRef.id);
        triggerFireworks();
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

async function readAll() {
    const messagesCollectionRef = collection(db, "messages");
    const q = query(messagesCollectionRef);

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        if (data.timestamp && typeof data.timestamp.toDate === 'function') {
            data.timestamp = data.timestamp.toDate().getTime();
        }
        return data;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const viewCountElement = document.getElementById('view-count');
    const chatMessagesElement = document.getElementById('chat-messages');
    const chatInputElement = document.getElementById('chat-input');
    const sendButtonElement = document.getElementById('send-button');

    // --- View Counter ---
    async function fetchAndUpdateViewCount() {
        try {
            let currentViews = localStorage.getItem('simulatedViews');
            if (!sessionStorage.getItem('viewIncremented')) {
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

    // --- Chat Room Functions ---
    function displayMessage(user, message, timestamp) {
        const messageElement = document.createElement('div');
        let timeString = '';
        if (timestamp) {
            const date = new Date(timestamp);
            const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
            timeString = date.toLocaleDateString(undefined, options);
        }
        messageElement.innerHTML = `${timeString ? `<span class="timestamp">[${timeString}]</span> ` : ''}<strong>${user}:</strong> ${message}`;
        chatMessagesElement.appendChild(messageElement);
        chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
    }

    async function loadInitialMessages() {
        try {
            const messages = await readAll();
            messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

            messages.forEach(msg => {
                displayMessage(msg.username, msg.text, msg.timestamp);
            });
        } catch (error) {
            console.error("Error loading initial messages:", error);
        }
    }

    // Send a new message
    sendButtonElement.addEventListener('click', () => {
        const messageText = chatInputElement.value.trim();
        if (messageText) {
            displayMessage('Anonymous', messageText, Date.now());
            writeNewMessage('Anonymous', messageText);
            chatInputElement.value = '';
        }
    });

    chatInputElement.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendButtonElement.click();
        }
    });

    // Initialize chat and view count
    loadInitialMessages();

    // --- Firework Animation Setup ---
    let fireworksContainer = document.getElementById('fireworks-container');
    if (!fireworksContainer) {
        fireworksContainer = document.createElement('div');
        fireworksContainer.id = 'fireworks-container';
        Object.assign(fireworksContainer.style, {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 9999,
            pointerEvents: 'none'
        });
        document.body.appendChild(fireworksContainer);
    }

    fireworks = new Fireworks.default(fireworksContainer, {
        autoresize: true,
        opacity: 0.5,
        acceleration: 1.05,
        friction: 0.97,
        gravity: 1.5,
        particles: 50,
        trace: 3,
        traceSpeed: 10,
        explode: 5,
        mouse: {
            click: false,
            move: false,
            max: 1
        },
        sound: {
            enabled: false,
        }
    });

    // ===========================================
    // ======== JAVASCRIPT GAME ADDITION =========
    // ===========================================

    // Get game elements
    const guessGameContainer = document.getElementById('guess-game-container');
    if (guessGameContainer) { // Only run game logic if the container exists
        const guessInput = document.getElementById('guess-input');
        const guessButton = document.getElementById('guess-button');
        const guessMessage = document.getElementById('guess-message');
        const restartButton = document.getElementById('restart-game-button');

        let secretNumber;
        let attempts;
        const maxAttempts = 5; // You can adjust this

        function startGame() {
            secretNumber = Math.floor(Math.random() * 20) + 1; // Number between 1 and 20
            attempts = 0;
            guessMessage.textContent = 'Guess a number between 1 and 20!';
            guessInput.value = '';
            guessInput.disabled = false;
            guessButton.disabled = false;
            restartButton.style.display = 'none'; // Hide restart button initially
        }

        function checkGuess() {
            const userGuess = parseInt(guessInput.value);

            if (isNaN(userGuess) || userGuess < 1 || userGuess > 20) {
                guessMessage.textContent = 'Please enter a valid number between 1 and 20.';
                return;
            }

            attempts++;

            if (userGuess === secretNumber) {
                guessMessage.textContent = `Congratulations! You guessed the number ${secretNumber} in ${attempts} attempts!`;
                guessInput.disabled = true;
                guessButton.disabled = true;
                restartButton.style.display = 'block'; // Show restart button
                triggerFireworks(); // Optional: Trigger fireworks on win
            } else if (userGuess < secretNumber) {
                guessMessage.textContent = `Too low! Attempts left: ${maxAttempts - attempts}`;
            } else {
                guessMessage.textContent = `Too high! Attempts left: ${maxAttempts - attempts}`;
            }

            if (attempts >= maxAttempts && userGuess !== secretNumber) {
                guessMessage.textContent = `Game Over! You ran out of attempts. The number was ${secretNumber}.`;
                guessInput.disabled = true;
                guessButton.disabled = true;
                restartButton.style.display = 'block'; // Show restart button
            }
            guessInput.value = ''; // Clear input after guess
        }

        // Event listeners for the game
        if (guessButton) {
            guessButton.addEventListener('click', checkGuess);
        }
        if (guessInput) {
            guessInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    checkGuess();
                }
            });
        }
        if (restartButton) {
            restartButton.addEventListener('click', startGame);
        }

        // Start the game when the page loads
        startGame();
    }
});
