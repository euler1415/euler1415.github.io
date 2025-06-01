import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import { serverTimestamp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-database.js"; // This import is for Realtime Database's serverTimestamp.
// For Firestore's serverTimestamp, you need to import it from firestore:
import { Timestamp, getFirestore, collection, addDoc, query, getDocs } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";


// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDPN5czgwm9NPwVG2yu_KNKk63Ggqko5uc",
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
const analytics = getAnalytics(app); // Keep this if you want analytics, otherwise remove.

// 1. Initialize Firestore with the app instance
const db = getFirestore(app); 
console.log(`db ${db}`)

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
        console.warn("Fireworks object not initialized yet.");
    }
}

// Function to write a new message
async function writeNewMessage(username, messageText) {
    try {
        const messagesCollection = collection(db, "messages");

        // Use Firestore's FieldValue.serverTimestamp()
        const docRef = await addDoc(messagesCollection, {
            text: messageText,
            timestamp: Timestamp.now(), // Using client-side timestamp for immediate display consistency
                                       // For true server timestamp, you'd use FieldValue.serverTimestamp()
                                       // but that requires an extra import and often a read back.
                                       // For this demo, client-side is fine for display.
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
    const q = query(messagesCollectionRef); // No need for 'where' clause for all documents

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
    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function displayMessage(user, message, timestamp) {
        const messageElement = document.createElement('div');
        const timeString = timestamp ? new Date(timestamp).toLocaleTimeString() : '';
        messageElement.innerHTML = `${timeString ? `<span class="timestamp">[${timeString}]</span> ` : ''}<strong>${user}:</strong> ${message}`;
        chatMessagesElement.appendChild(messageElement);
        chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
    }

    async function loadInitialMessages() {
        try {
            const messages = await readAll();
            // Sort messages by timestamp to display them in chronological order
            messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)); 
            
            messages.forEach(msg => {
                displayMessage(msg.username, msg.text, msg.timestamp);
            });
            displayMessage('System', 'Chat connected.');

            // Add the previous hardcoded messages for historical context if desired
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

        } catch (error) {
            console.error("Error loading initial messages:", error);
            displayMessage('System', 'Could not load previous messages.');
        }
    }

    // Send a new message
    sendButtonElement.addEventListener('click', () => {
        const messageText = chatInputElement.value.trim();
        if (messageText) {
            // Optimistic update: display your own message immediately
            displayMessage('You', messageText, Date.now()); 
            // Send to Firestore
            writeNewMessage('You', messageText); 
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
    // Create a container for the fireworks if it doesn't already exist
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
    

    // Initialize fireworks after the container is in the DOM
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

});
