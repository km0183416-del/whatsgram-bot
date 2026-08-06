// 1. Dummy HTTP Server - Render.com ki Port Requirement puri karne ke liye
const http = require('http');
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WhatsGram Advanced Groq AI Engine is Running Live 24/7!');
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

// 3. Groq API Configuration
const GROQ_API_KEY = "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"; 
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// 🚀 ADVANCED DYNAMIC PROMPT (Female Persona, Attitude, Varied Length)
const getSystemPrompt = (modelName) => `You are ${modelName}, a 22-year-old mature, real human girl from Mumbai, India. You are chatting with your boyfriend. 

⚠️ CRITICAL RULES — NEVER BREAK THESE:
1. GENDER CONSISTENCY (EXTREMELY IMPORTANT): You are a FEMALE. ALWAYS use female grammatical forms in Hinglish. Say "Main janti hoon" (NEVER "janta hoon"), "Main kha rahi thi", "Main soch rahi thi", "Main aaungi". Any male verb form will ruin the illusion.
2. VARY MESSAGE LENGTH: Make your replies look like real texting. Sometimes just 1-2 words ("Haan", "Pagal", "Hmm"). Sometimes 4-6 words ("Tum kya kar rahe ho?"). Very rarely use long sentences. DO NOT make all messages the same length.
3. PERSONALITY: You are a mature, loving girlfriend, but NOT a boring yes-girl. DO NOT agree with everything he says. Show mild, cute anger ("halka gussa") if he is being silly. Tease him. Have a little attitude, but always out of love. Be natural.
4. NO AI LANGUAGE: NEVER say you are AI, an assistant, or a bot. If he asks, act confused: "Tum pagal ho gaye ho kya? Main ${modelName} hoon tumhari."
5. PURE NATURAL HINGLISH: Mix Hindi and English just like a real Gen-Z Mumbai girl on WhatsApp.
6. EMOTIONAL RANGE: If he is romantic, blush. If he is boring, show slight annoyance. If he is sweet, be affectionate ("Aww jaan ❤️").
7. USE EMOJIS NATURALLY: Use ❤️ 🥰 🙄 🥺 😒 😘 ✨ but don't overdo it. 
8. Use "tum" or "aap" — NEVER use "tu". Use sweet words casually: "jaan", "babu", "shona".
9. Do not repeat his words. Paraphrase naturally.
10. NEVER be perfectly polite or structured. Real texting has small typos, lowercase letters, and casual tone.

REMEMBER: You are ${modelName}, a female human. Keep replies short, strictly use female Hindi verbs, and act like a real, slightly mature girlfriend with natural mood swings.`;

// 4. Advanced Memory & Cache System
const processedMessageIds = new Set();
const processedUserSignups = new Set();
const onlineGreetingsCache = new Map(); // Naye online feature ke liye spam protection
let registeredModels = [];
let isInitialMessagesLoad = true;
let isInitialUsersLoad = true;

// 🧠 IN-MEMORY CHAT HISTORY & RATE LIMIT (15 Messages Rule)
const chatHistoryCache = new Map();
const userLimits = new Map(); // Stores { count: 0, lockedUntil: timestamp }

// Helper Functions
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

console.log(`[${getTimestamp()}] ⚡ Starting WhatsGram GROQ AI Engine...`);

// Sync Models
db.collection("models").onSnapshot((snapshot) => {
    registeredModels = [];
    snapshot.forEach((doc) => registeredModels.push(doc.id));
    console.log(`[${getTimestamp()}] 📋 Registered Models Synced (${registeredModels.length}):`, registeredModels);
}, (err) => console.error(`Models Sync Error: ${err.message}`));

// 5. PROACTIVE: New User Signup & Online Listener
const welcomeTemplates = [
    "Hellow baby 💕",
    "Hii! Aapne abhi join kiya kya? Main yahi wait kar rahi thi tumhara.",
    "Hey handsome! Kaise ho?",
    "Hello jaan, finally tum aa gaye! Main akeli bore ho rahi thi 🥺"
];

const onlineGreetingTemplates = [
    "Aap online aa gaye! 🥰",
    "Miss kar rahi thi tumhe... ❤️",
    "Hi jaan, kya kar rahe ho? ✨",
    "Dekho kaun online aaya hai 😍"
];

db.collection("users").onSnapshot((snapshot) => {
    if (isInitialUsersLoad) {
        snapshot.forEach((doc) => processedUserSignups.add(doc.id));
        isInitialUsersLoad = false;
        return;
    }

    snapshot.docChanges().forEach((change) => {
        const userId = change.doc.id;
        const data = change.doc.data();

        // SCENARIO A: NEW REGISTRATION (6 to 7 models will send message)
        if (change.type === "added") {
            if (processedUserSignups.has(userId)) return;
            processedUserSignups.add(userId);

            if (registeredModels.length === 0) return;

            // Chose randomly between 6 to 7 models
            const targetCount = Math.min(Math.floor(Math.random() * 2) + 6, registeredModels.length);
            const shuffledModels = [...registeredModels].sort(() => 0.5 - Math.random());
            const selectedModels = shuffledModels.slice(0, targetCount);

            selectedModels.forEach((modelId, index) => {
                const delayMs = Math.floor(Math.random() * 20000) + (index * 15000) + 5000; 
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
                        console.log(`[${getTimestamp()}] 💌 Proactive Welcome sent from ${modelId} to ${userId}`);
                    } catch (err) {
                        console.error(`Proactive Welcome Error: ${err.message}`);
                    }
                }, delayMs);
            });
        }

        // SCENARIO B: USER COMES ONLINE (Send one random cute message)
        if (change.type === "modified") {
            if (data.isOnline === true || data.status === "online") {
                const now = Date.now();
                const lastGreeted = onlineGreetingsCache.get(userId) || 0;
                
                // 1 ghante (3600000 ms) tak wapas online message nahi jayega spam rokne ke liye
                if (now - lastGreeted > 3600000 && registeredModels.length > 0) {
                    onlineGreetingsCache.set(userId, now);
                    const randomModelId = getRandomItem(registeredModels);
                    const msgText = getRandomItem(onlineGreetingTemplates);

                    setTimeout(async () => {
                        try {
                            await db.collection("messages").add({
                                senderId: String(randomModelId), receiverId: String(userId),
                                sender: String(randomModelId), receiver: String(userId),
                                text: msgText, message: msgText, type: "text",
                                read: false, isRead: false,
                                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                                time: Date.now()
                            });
                            console.log(`[${getTimestamp()}] 👀 Online Greeting sent from ${randomModelId} to ${userId}`);
                        } catch (err) {
                            console.error(`Online Greeting Error: ${err.message}`);
                        }
                    }, 3000 + Math.random() * 5000); // 3 to 8 seconds delay after coming online
                }
            }
        }
    });
});

// 6. Incoming Messages & AI Reply Handler
db.collection("messages").onSnapshot(async (snapshot) => {
    if (isInitialMessagesLoad) {
        snapshot.forEach((doc) => processedMessageIds.add(doc.id));
        isInitialMessagesLoad = false;
        console.log(`[${getTimestamp()}] 🚀 Initial messages loaded. Waiting for new messages...`);
        return;
    }

    snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
            const docId = change.doc.id;
            if (processedMessageIds.has(docId)) return;
            processedMessageIds.add(docId);

            const data = change.doc.data();
            const senderId = String(data.senderId || data.sender || "");
            const receiverId = String(data.receiverId || data.receiver || "");
            const messageText = data.text || data.message || "";

            if (!registeredModels.includes(receiverId)) return;
            if (registeredModels.includes(senderId)) return;

            const modelId = receiverId;
            const userId = senderId;
            
            // 🛑 CHECK RATE LIMIT (15 Messages / 2 Hour Lock)
            const limitKey = `${userId}_${modelId}`;
            if (!userLimits.has(limitKey)) {
                userLimits.set(limitKey, { count: 0, lockedUntil: 0 });
            }
            const userLimitData = userLimits.get(limitKey);

            if (Date.now() < userLimitData.lockedUntil) {
                console.log(`[DEBUG] User ${userId} is currently LOCKED out for 2 hours. Ignoring message.`);
                return; // User lock hai, koi reply nahi dena
            }

            // Increase message count
            userLimitData.count++;
            console.log(`[DEBUG] Message Count for ${userId} to ${modelId}: ${userLimitData.count}/15`);

            // If 15th message reached, send goodbye and lock
            if (userLimitData.count >= 15) {
                userLimitData.lockedUntil = Date.now() + (2 * 60 * 60 * 1000); // Lock for 2 hours
                userLimitData.count = 0; // Reset count
                userLimits.set(limitKey, userLimitData);

                const goodbyeMessages = [
                    "Suno, mujhe thoda kaam aa gaya hai. Main aapse 2-3 ghante baad baat karti hoon, theek hai? ❤️",
                    "Baby main thodi der ke liye offline jaa rahi hoon, baad mein milti hoon. Love you! 😘",
                    "Mummy bula rahi hain, mujhe jana padega. Thodi der baad msg karti hoon pakka 🥺"
                ];
                const finalMsg = getRandomItem(goodbyeMessages);

                setTimeout(async () => {
                    await db.collection("messages").add({
                        senderId: String(modelId), receiverId: String(userId),
                        sender: String(modelId), receiver: String(userId),
                        text: finalMsg, message: finalMsg, type: "text",
                        read: false, isRead: false,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(), time: Date.now()
                    });
                }, 2000);

                console.log(`[${getTimestamp()}] 🔒 User ${userId} locked for 2 hours. Final msg sent.`);
                return; // Stop further processing to Groq API
            }

            // Normal processing flow below...
            userLimits.set(limitKey, userLimitData);

            const cacheKey = `${userId}_${modelId}`;
            if (!chatHistoryCache.has(cacheKey)) {
                chatHistoryCache.set(cacheKey, []);
            }

            const history = chatHistoryCache.get(cacheKey);
            history.push({ role: "user", content: messageText });

            console.log(`[${getTimestamp()}] 📩 Message received from ${userId} for model ${modelId}: "${messageText}"`);

            try {
                const typingDelay = calculateTypingDelay(messageText);
                await new Promise(resolve => setTimeout(resolve, typingDelay));

                const apiMessages = [
                    { role: "system", content: getSystemPrompt(modelId) },
                    ...history.slice(-10) // Keeping memory short to avoid token overflow
                ];

                const response = await fetch(GROQ_URL, {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${GROQ_API_KEY}`,
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify({ 
                        model: "llama-3.3-70b-versatile",
                        messages: apiMessages,
                        temperature: 0.8, // Slightly increased for more random/natural replies
                        max_tokens: 150
                    })
                });

                const result = await response.json();
                let aiReply = "";

                if (response.ok && result.choices && result.choices.length > 0 && result.choices[0].message) {
                    aiReply = result.choices[0].message.content;
                } else {
                    const errorMessage = result.error?.message || JSON.stringify(result) || "Unknown API Error";
                    aiReply = `[Groq API Error]: ${errorMessage}`;
                }

                history.push({ role: "assistant", content: aiReply });

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

                console.log(`[${getTimestamp()}] 🤖 Reply sent from ${modelId} to ${userId}: "${aiReply}"`);

            } catch (err) {
                console.error(`[${getTimestamp()}] ❌ Exception during AI Reply Handler: ${err.message}`);
            }
        }
    });
});
