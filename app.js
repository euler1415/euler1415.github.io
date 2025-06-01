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
        console.warn("Fireworks object not initialized yet. Cannot trigger fireworks.");
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
    console.log("DOM fully loaded and parsed.");

    const viewCountElement = document.getElementById('view-count');
    const chatMessagesElement = document.getElementById('chat-messages');
    const chatInputElement = document.getElementById('chat-input');
    const sendButtonElement = document.getElementById('send-button');

    if (!chatInputElement) console.error("Chat input element not found!");
    if (!sendButtonElement) console.error("Send button element not found!");

    // --- Barrel Roll Functionality ---
    function addBarrelRollStyles() {
        const styleId = 'barrel-roll-dynamic-style';
        if (document.getElementById(styleId)) {
            console.log("Barrel roll styles already added.");
            return;
        }
        const style = document.createElement('style');
        style.id = styleId;
        // Added !important for debugging CSS override issues
        style.textContent = `
            body.barrel-roll-effect {
                transition: transform 0.7s ease-in-out !important;
                transform: rotate(360deg) !important;
            }
        `;
        document.head.appendChild(style);
        console.log("Barrel roll CSS styles added to head.");
    }
    addBarrelRollStyles();

    let isRolling = false;

    function doBarrelRoll() {
        console.log("doBarrelRoll function called.");
        if (isRolling) {
            console.log("Barrel roll attempted but already in progress.");
            return;
        }

        const body = document.body;
        if (!body) {
            console.error("document.body not found in doBarrelRoll!");
            return;
        }
        console.log("Attempting barrel roll. Current body classes:", body.className);

        isRolling = true;
        body.classList.add('barrel-roll-effect');
        console.log("Added 'barrel-roll-effect' class to body. New classes:", body.className);
        
        // For debugging: Check computed style right after adding class
        // const computedTransform = window.getComputedStyle(body).transform;
        // console.log("Computed transform immediately after adding class:", computedTransform);

        setTimeout(() => {
            body.classList.remove('barrel-roll-effect');
            // Explicitly reset transform to ensure it's ready for the next roll
            body.style.transform = 'rotate(0deg)'; 
            console.log("Removed 'barrel-roll-effect' class and reset body.style.transform to rotate(0deg).");
            
            // Force a reflow, might help in some edge cases but usually not needed
            // void body.offsetWidth; 

            isRolling = false;
            console.log("Barrel roll sequence finished. isRolling set to false.");
        }, 700); // This duration MUST match the CSS transition duration (0.7s = 700ms)
    }
    // --- End Barrel Roll Functionality ---


    // --- View Counter ---
    // ... (view counter code remains the same) ...
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
            if(viewCountElement) viewCountElement.textContent = currentViews || '0';
        } catch (error) {
            console.error('Error with view count:', error);
            if(viewCountElement) viewCountElement.textContent = 'Error';
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
        if (chatMessagesElement) {
            chatMessagesElement.appendChild(messageElement);
            chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
        } else {
            console.error("chatMessagesElement not found, cannot display message.");
        }
    }

    async function loadInitialMessages() {
        try {
            const messages = await readAll();
            if(chatMessagesElement) chatMessagesElement.innerHTML = '';
            messages.forEach(msg => {
                displayMessage(msg.username, msg.text, msg.timestamp);
            });
            if(chatMessagesElement) chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
        } catch (error) {
            console.error("Error loading initial messages:", error);
        }
    }

    // Send a new message
    if (sendButtonElement) {
        sendButtonElement.addEventListener('click', () => {
            console.log("Send button clicked.");
            const messageText = chatInputElement.value.trim();
            console.log(`Message text entered: "${messageText}"`);
            if (messageText) {
                if (messageText.toLowerCase() === 'barrel roll') {
                    console.log("'barrel roll' command detected.");
                    doBarrelRoll();
                }
                displayMessage('Anonymous', messageText, Date.now());
                writeNewMessage('Anonymous', messageText);
                chatInputElement.value = '';
            } else {
                console.log("Send button clicked, but message text is empty.");
            }
        });
    }


    if (chatInputElement) {
        chatInputElement.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                console.log("Enter key pressed in chat input.");
                // Ensure sendButtonElement exists before trying to click it
                if (sendButtonElement) {
                    sendButtonElement.click(); 
                } else {
                    console.error("Send button not found, cannot process Enter key press.");
                }
            }
        });
    }

    loadInitialMessages();

    // --- Firework Animation Setup ---
    // ... (fireworks setup code remains the same, ensure Fireworks library is loaded) ...
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
        console.log("Fireworks library found. Initializing fireworks.");
        fireworks = new Fireworks.default(fireworksContainer, {
            autoresize: true, opacity: 0.5, acceleration: 1.05, friction: 0.97,
            gravity: 1.5, particles: 50, trace: 3, traceSpeed: 10,
            explode: 5, 
            mouse: { click: false, move: false, max: 1 },
            sound: { enabled: false }
        });
    } else {
        console.warn("Fireworks library (Fireworks.default) not loaded or found. Fireworks features will be unavailable.");
    }
    // ... (rest of your game code) ...
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
                    triggerFireworks(); 
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
                    guessButton.disabled_true = true; // Typo: should be guessButton.disabled = true;
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
    } else {
        console.log("guess-game-container not found. Game not initialized.");
    }

});

// Minor typo fix in your original game logic:
// In checkGuess, if attempts >= maxAttempts:
// guessButton.disabled_true = true; should be guessButton.disabled = true;
// I've corrected this in the code block above.
