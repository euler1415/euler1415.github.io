import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
// No longer using serverTimestamp from realtime database, so this import is removed
// import { serverTimestamp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-database.js";
import { Timestamp, getFirestore, collection, addDoc, query, getDocs, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js"; // Added orderBy and limit for potential future use or better querying


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
console.log("Firebase config:", firebaseConfig); // More descriptive log
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Keep this if you want analytics, otherwise remove.

// 1. Initialize Firestore with the app instance
const db = getFirestore(app);
console.log("Firestore DB initialized:", db); // More descriptive log

// Reference to the fireworks instance (will be initialized in DOMContentLoaded)
let fireworks;

// Function to trigger the fireworks animation
function triggerFireworks() {
    if (fireworks) { // Ensure fireworks object exists
        fireworks.start();
        setTimeout(() => {
            fireworks.stop();
        }, 3000); // Stop fireworks after 3 seconds
    } else {
        console.warn("Fireworks object not initialized yet. Ensure 'new Fireworks.default' runs.");
    }
}

// Function to write a new message
async function writeNewMessage(username, messageText) {
    try {
        const messagesCollection = collection(db, "messages");

        const docRef = await addDoc(messagesCollection, {
            text: messageText,
            timestamp: Timestamp.now(), // Using client-side timestamp for immediate display consistency
            username: username,
        });

        console.log("Document written with ID: ", docRef.id);
        triggerFireworks(); // Trigger fireworks on successful message write
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

async function readAll() {
    const messagesCollectionRef = collection(db, "messages");
    // Order by timestamp to get messages in chronological order from Firestore
    const q = query(messagesCollectionRef, orderBy("timestamp", "asc"));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Firestore Timestamp to JavaScript Date object's milliseconds
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
            // Format to include Day, Month, Date, Year, Hours, Minutes, Seconds
            const options = {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: false // Use 24-hour format
            };
            timeString = date.toLocaleString('en-US', options); // Using 'en-US' or your desired locale
        }
        messageElement.innerHTML = `${timeString ? `<span class="timestamp">[${timeString}]</span> ` : ''}<strong>${user}:</strong> ${message}`;
        chatMessagesElement.appendChild(messageElement);
        chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight; // Scroll to bottom
    }

    async function loadInitialMessages() {
        try {
            const messages = await readAll();
            // Messages are already sorted by Firestore query (orderBy("timestamp", "asc"))
            // If you wanted to sort purely client-side without relying on Firestore order:
            // messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

            chatMessagesElement.innerHTML = ''; // Clear existing messages before loading
            messages.forEach(msg => {
                displayMessage(msg.username, msg.text, msg.timestamp);
            });
            // Ensure scroll to bottom after all initial messages are loaded
            chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
        } catch (error) {
            console.error("Error loading initial messages:", error);
            // No message displayed for system errors, as requested
        }
    }

    // Send a new message
    sendButtonElement.addEventListener('click', () => {
        const messageText = chatInputElement.value.trim();
        if (messageText) {
            // Optimistic update: display your own message immediately
            displayMessage('Anonymous', messageText, Date.now());
            // Send to Firestore
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
            zIndex: 9999, // Ensure it's on top
            pointerEvents: 'none' // Allows clicking through the container
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

    const guessGameContainer = document.getElementById('guess-game-container');

    if (guessGameContainer) {
        const guessInput = document.getElementById('guess-input');
        const guessButton = document.getElementById('guess-button');
        const guessMessage = document.getElementById('guess-message');
        const restartButton = document.getElementById('restart-game-button');

        // Robust check to ensure all game elements are found
        if (!guessInput || !guessButton || !guessMessage || !restartButton) {
            console.error("One or more game elements were not found in the HTML. Please check IDs.");
            return; // Stop game initialization if critical elements are missing
        }

        let secretNumber;
        let attempts;
        const maxAttempts = 5;

        function startGame() {
            secretNumber = Math.floor(Math.random() * 20) + 1;
            attempts = 0;
            guessMessage.textContent = 'Guess a number between 1 and 20!';
            guessInput.value = '';
            guessInput.disabled = false; // Ensure input is enabled
            guessButton.disabled = false; // Ensure button is enabled
            restartButton.style.display = 'none'; // Hide restart button
            guessInput.focus(); // Set focus to input field
            guessMessage.style.color = '#0056b3'; // Reset message color
        }

        function checkGuess() {
            const userGuess = parseInt(guessInput.value);

            if (isNaN(userGuess) || userGuess < 1 || userGuess > 20) {
                guessMessage.textContent = 'Please enter a valid number between 1 and 20.';
                guessInput.value = '';
                guessMessage.style.color = 'orange'; // Indicate warning
                return;
            }

            attempts++;

            if (userGuess === secretNumber) {
                guessMessage.textContent = `Congratulations! You guessed the number ${secretNumber} in ${attempts} attempts!`;
                guessMessage.style.color = 'green'; // Success color
                guessInput.disabled = true;
                guessButton.disabled = true;
                restartButton.style.display = 'block';
                triggerFireworks();
            } else if (userGuess < secretNumber) {
                guessMessage.textContent = `Too low! Attempts left: ${maxAttempts - attempts}`;
                guessMessage.style.color = 'red'; // Indicate wrong answer
            } else {
                guessMessage.textContent = `Too high! Attempts left: ${maxAttempts - attempts}`;
                guessMessage.style.color = 'red'; // Indicate wrong answer
            }

            if (attempts >= maxAttempts && userGuess !== secretNumber) {
                guessMessage.textContent = `Game Over! You ran out of attempts. The number was ${secretNumber}.`;
                guessMessage.style.color = 'darkred'; // Indicate game over
                guessInput.disabled = true;
                guessButton.disabled = true;
                restartButton.style.display = 'block';
            }
            guessInput.value = ''; // Clear input after guess
        }

        // Event listeners for the game
        guessButton.addEventListener('click', checkGuess);

        guessInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                checkGuess();
            }
        });

        restartButton.addEventListener('click', startGame);

        // Start the game when the page loads
        startGame();
    }
});
