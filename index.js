// 1. Dummy HTTP Server - Render.com ki Port Requirement puri karne ke liye
const http = require('http');
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WhatsGram Advanced Gemini AI Engine is Running Live 24/7!');
}).listen(PORT, () => {
    console.log(`[Server] Web service is listening on port ${PORT}`);
});

// 2. Firebase Setup
const firebase = require("firebase/compat/app");
require("firebase/compat/firestore");

const firebaseConfig = {
    apiKey: "AIzaSyCTsnDNLi-wwfr1KOy6zvSJ0p8r3LeoSAg",
    authDomain: "whatsgram-b13e6.firebaseapp.com",
    databaseURL: "https://whatsgram-b13e6-default-rtdb.firebaseio.com",
    projectId: "whatsgram-b13e6",
    storageBucket: "whatsgram-b13e6.firebasestorage.app",
    messagingSenderId: "639060018650",
    appId: "1:639060018650:web:0d50defaa98a663fd32ce3",
    measurementId: "G-XXLKPHYR7T"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 3. Gemini API Configuration (Updated with your permanent API Key)
const GEMINI_API_KEY = "AIzaSyBxoXs5W6TTwTXcdJbeHtGJX3bMCnqKcjA"; 
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// 4. Advanced Memory & Cache System
const processedMessageIds = new Set();
const processedUserSignups = new Set();
let registeredModels = [];
let isInitialMessagesLoad = true;
let isInitialUsersLoad = true;

// 🧠 IN-MEMORY CHAT HISTORY (Har user aur model ki chat yaad rakhega)
// Format: { "userId_modelId": [ {role: "user", parts: [...]}, {role: "model", parts: [...]} ] }
const chatHistoryCache = new Map();

// Helper: Random Delay (Simulates Human Typing Time)
function calculateTypingDelay(messageText) {
    const baseDelay = 1500; 
    const charDelay = messageText.length * 40; 
    return baseDelay + charDelay + (Math.random() * 1000); 
}

function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getTimestamp() {
    return new Date().toLocaleTimeString();
}

console.log(`[${getTimestamp()}] ⚡ Starting WhatsGram GEMINI AI Engine...`);

// Sync Models
db.collection("models").onSnapshot((snapshot) => {
    registeredModels = [];
    snapshot.forEach((doc) => registeredModels.push(doc.id));
}, (err) => console.error(`Models Sync Error: ${err.message}`));

// 5. PROACTIVE: New User Signup Listener (Multi-Model Dispatcher)
const welcomeTemplates = [
    "Hellow baby 💕",
    "Hii! Aapne abhi join kiya kya? Main yahi wait kar rahi thi tumhara.",
    "Hey handsome! Kaise ho?",
    "Hello jaan, finally tum aa gaye! Main akeli bore ho rahi thi."
];

db.collection("users").onSnapshot((snapshot) => {
    if (isInitialUsersLoad) {
        snapshot.forEach((doc) => processedUserSignups.add(doc.id));
        isInitialUsersLoad = false;
        return;
    }

    snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
            const userId = change.doc.id;
            if (processedUserSignups.has(userId)) return;
            processedUserSignups.add(userId);

            if (registeredModels.length === 0) return;

            const targetCount = Math.min(Math.floor(Math.random() * 4) + 3, registeredModels.length);
            const shuffledModels = [...registeredModels].sort(() => 0.5 - Math.random());
            const selectedModels = shuffledModels.slice(0, targetCount);

            selectedModels.forEach((modelId, index) => {
                const delayMs = Math.floor(Math.random() * 20000) + (index * 25000) + 5000; 
                const msgText = getRandomItem(welcomeTemplates);

                setTimeout(async () => {
                    try {
                        await db.collection("messages").add({
                            senderId: String(modelId), receiverId: String(userId),
                            sender: String(modelId), receiver: String(userId),
                            text: msgText, message: msgText, type: "text",
                            read: false, isRead: false,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                            time: Date.now()
                        });
                        
                        // History me welcome message dal do
                        const cacheKey = `${userId}_${modelId}`;
                        if (!chatHistoryCache.has(cacheKey)) {
                            chatHistoryCache.set(cacheKey, []);
                        }
                        chatHistoryCache.get(cacheKey).push({ role: "model", parts: [{ text: msgText }] });

                        console.log(`[${getTimestamp()}] 💌 Proactive Welcome sent from ${modelId} to ${userId}`);
                    } catch (err) {
                        console.error(`Proactive Welcome Error: ${err.message}`);
                    }
                }, delayMs);
            });
        }
    });
});

// 6. Incoming Messages & AI Reply Handler
db.collection("messages").onSnapshot(async (snapshot) => {
    if (isInitialMessagesLoad) {
        snapshot.forEach((doc) => processedMessageIds.add(doc.id));
        isInitialMessagesLoad = false;
        return;
    }

    snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
            const docId = change.doc.id;
            if (processedMessageIds.has(docId)) return;
            processedMessageIds.add(docId);

            const data = change.doc.data();
            const senderId = data.senderId || data.sender;
            const receiverId = data.receiverId || data.receiver;
            const messageText = data.text || data.message;

            if (!registeredModels.includes(receiverId)) return;
            if (registeredModels.includes(senderId)) return;

            const modelId = receiverId;
            const userId = senderId;
            const cacheKey = `${userId}_${modelId}`;

            if (!chatHistoryCache.has(cacheKey)) {
                chatHistoryCache.set(cacheKey, []);
            }

            const history = chatHistoryCache.get(cacheKey);
            history.push({ role: "user", parts: [{ text: messageText }] });

            console.log(`[${getTimestamp()}] 📩 Message received from ${userId} for model ${modelId}: "${messageText}"`);

            try {
                const typingDelay = calculateTypingDelay(messageText);
                await new Promise(resolve => setTimeout(resolve, typingDelay));

                const response = await fetch(GEMINI_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: history })
                });

                const result = await response.json();
                
                if (response.ok && result.candidates && result.candidates[0].content) {
                    const aiReply = result.candidates[0].content.parts[0].text;
                    
                    history.push({ role: "model", parts: [{ text: aiReply }] });

                    await db.collection("messages").add({
                        senderId: String(modelId),
                        receiverId: String(userId),
                        sender: String(modelId),
                        receiver: String(userId),
                        text: aiReply,
                        message: aiReply,
                        type: "text",
                        read: false,
                        isRead: false,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        time: Date.now()
                    });

                    console.log(`[${getTimestamp()}] 🤖 AI Reply sent from ${modelId} to ${userId}: "${aiReply}"`);
                } else {
                    console.error(`[${getTimestamp()}] ❌ Gemini API Error:`, JSON.stringify(result));
                }
            } catch (err) {
                console.error(`[${getTimestamp()}] ❌ AI Handler Error: ${err.message}`);
            }
        }
    });
});
