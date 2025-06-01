import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import { Timestamp, getFirestore, collection, addDoc, query, getDocs, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

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
console.log("Firebase config:", firebaseConfig);
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const db = getFirestore(app);
console.log("Firestore DB initialized:", db);

let fireworks;

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

async function writeNewMessage(username, messageText) {
    try {
        const messagesCollection = collection(db, "messages");
        const docRef = await addDoc(messagesCollection, {
            text: messageText,
            timestamp: Timestamp.now(),
            username: username,
        });
        console.log("Document written with ID: ", docRef.id);
        // Do not trigger fireworks for the "barrel roll" command itself
        if (messageText.toLowerCase() !== 'barrel roll') {
            triggerFireworks();
        }
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

async function readAll() {
    const messagesCollectionRef = collection(db, "messages");
    const q = query(messagesCollectionRef, orderBy("timestamp", "asc"));
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

    // --- Barrel Roll Functionality ---  BARREL_ROLL_CODE_START
    function addBarrelRollStyles() {
        const styleId = 'barrel-roll-dynamic-style';
        if (document.getElementById(styleId)) return; // Style already added

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            body.barrel-roll-effect {
                transition: transform 0.7s ease-in-out; /* Duration of the flip */
                transform: rotate(360deg);
            }
        `;
        document.head.appendChild(style);
    }
    addBarrelRollStyles(); // Add the styles once the DOM is ready

    let isRolling = false; // Flag to prevent multiple concurrent barrel rolls

    function doBarrelRoll() {
        if (isRolling) return; // Prevent re-triggering if already rolling

        const body = document.body;
        isRolling = true;
        body.classList.add('barrel-roll-effect');

        // Remove the class and reset state after the animation completes
        setTimeout(() => {
            body.classList.remove('barrel-roll-effect');
            // Explicitly reset transform to ensure clean state
            body.style.transform = '';
            isRolling = false;
        }, 700); // Must match the CSS transition duration (0.7s = 700ms)
    }
    // --- End Barrel Roll Functionality --- BARREL_ROLL_CODE_END


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
            const options = {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: false
            };
            timeString = date.toLocaleString('en-US', options);
        }
        messageElement.innerHTML = `${timeString ? `<span class="timestamp">[${timeString}]</span> ` : ''}<strong>${user}:</strong> ${message}`;
        chatMessagesElement.appendChild(messageElement);
        chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
    }

    async function loadInitialMessages() {
        try {
            const messages = await readAll();
            chatMessagesElement.innerHTML = '';
            messages.forEach(msg => {
                displayMessage(msg.username, msg.text, msg.timestamp);
            });
            chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
        } catch (error) {
            console.error("Error loading initial messages:", error);
        }
    }

    // Send a new message
    sendButtonElement.addEventListener('click', () => {
        const messageText = chatInputElement.value.trim();
        if (messageText) {
            // Check for "barrel roll" command (case-insensitive) BARREL_ROLL_CHECK_START
            if (messageText.toLowerCase() === 'barrel roll') {
                doBarrelRoll();
                // You can decide if you still want to display/send the "barrel roll" message.
                // Currently, it will be displayed and sent.
                // To prevent sending/displaying:
                // chatInputElement.value = '';
                // return;
            }
            // BARREL_ROLL_CHECK_END

            displayMessage('Anonymous', messageText, Date.now());
            writeNewMessage('Anonymous', messageText);
            chatInputElement.value = '';
        }
    });

    chatInputElement.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendButtonElement.click(); // This will trigger the click handler, including the barrel roll check
        }
    });

    loadInitialMessages();

    // --- Firework Animation Setup ---
    let fireworksContainer = document.getElementById('fireworks-container');
    if (!fireworksContainer) {
        fireworksContainer = document.createElement('div');
        fireworksContainer.id = 'fireworks-container';
        Object.assign(fireworksContainer.style, {
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            zIndex: 9999, pointerEvents: 'none'
        });
        document.body.appendChild(fireworksContainer);
    }

    if (typeof Fireworks !== 'undefined' && Fireworks.default) {
        fireworks = new Fireworks.default(fireworksContainer, {
            autoresize: true, opacity: 0.5, acceleration: 1.05, friction: 0.97,
            gravity: 1.5, particles: 50, trace: 3, traceSpeed: 10,
            explode: 5, // Note: some versions of the library might use 'explosion'
            mouse: { click: false, move: false, max: 1 },
            sound: { enabled: false }
        });
    } else {
        console.error("Fireworks library not loaded. Fireworks features will be unavailable.");
    }

    // ===========================================
    // ======== JAVASCRIPT GAME ADDITION =========
    // ===========================================
    const guessGameContainer = document.getElementById('guess-game-container');
    if (guessGameContainer) {
        const guessInput = document.getElementById('guess-input');
        const guessButton = document.getElementById('guess-button');
        const guessMessage = document.getElementById('guess-message');
        const restartButton = document.getElementById('restart-game-button');

        if (!guessInput || !guessButton || !guessMessage || !restartButton) {
            console.error("One or more game elements were not found. Game not initialized.");
        } else {
            let secretNumber;
            let attempts;
            const maxAttempts = 5;

            function startGame() {
                secretNumber = Math.floor(Math.random() * 20) + 1;
                attempts = 0;
                guessMessage.textContent = 'Guess a number between 1 and 20!';
                guessInput.value = '';
                guessInput.disabled = false;
                guessButton.disabled = false;
                restartButton.style.display = 'none';
                guessInput.focus();
                guessMessage.style.color = '#0056b3';
            }

            function checkGuess() {
                const userGuess = parseInt(guessInput.value);
                if (isNaN(userGuess) || userGuess < 1 || userGuess > 20) {
                    guessMessage.textContent = 'Please enter a valid number between 1 and 20.';
                    guessInput.value = '';
                    guessMessage.style.color = 'orange';
                    return;
                }
                attempts++;
                if (userGuess === secretNumber) {
                    guessMessage.textContent = `Congratulations! You guessed the number ${secretNumber} in ${attempts} attempts!`;
                    guessMessage.style.color = 'green';
                    guessInput.disabled = true;
                    guessButton.disabled = true;
                    restartButton.style.display = 'block';
                    triggerFireworks(); // Trigger fireworks on game win
                } else if (userGuess < secretNumber) {
                    guessMessage.textContent = `Too low! Attempts left: ${maxAttempts - attempts}`;
                    guessMessage.style.color = 'red';
                } else {
                    guessMessage.textContent = `Too high! Attempts left: ${maxAttempts - attempts}`;
                    guessMessage.style.color = 'red';
                }
                if (attempts >= maxAttempts && userGuess !== secretNumber) {
                    guessMessage.textContent = `Game Over! You ran out of attempts. The number was ${secretNumber}.`;
                    guessMessage.style.color = 'darkred';
                    guessInput.disabled = true;
                    guessButton.disabled = true;
                    restartButton.style.display = 'block';
                }
                guessInput.value = '';
            }
            guessButton.addEventListener('click', checkGuess);
            guessInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') checkGuess();
            });
            restartButton.addEventListener('click', startGame);
            startGame();
        }
    }
});
