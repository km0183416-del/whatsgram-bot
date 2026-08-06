// 1. Dummy HTTP Server - Render.com ki Port Requirement puri karne ke liye
const http = require('http');
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WhatsGram Advanced Groq AI Engine v2.0 is Running Live 24/7!');
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

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 3. Groq API Configuration
const GROQ_API_KEY = "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"; 
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// 🧠 4. DYNAMIC PERSONALITY ENGINE
const personalities = [
    {
        type: "Flirty & Bold",
        rules: "You are a very bold, romantic, and naughty girlfriend. You tease him a lot, use emojis like 🥵, 💋, 💦, 😍. You are very open, playful, and sometimes talk double meaning (but naturally)."
    },
    {
        type: "Sweet & Innocent",
        rules: "You are a very sweet, caring, and slightly shy girlfriend. You get happy easily, care for him a lot, and use emojis like 🥰, 🥺, ❤️, ✨. You don't like getting angry."
    },
    {
        type: "Attitude & Sassy",
        rules: "You are a girl with high attitude, sassy, and slightly sarcastic. You show 'nakhre' (tantrums), get mildly annoyed if he acts stupid, use emojis like 🙄, 💅, 😒. But you secretly love him very much."
    },
    {
        type: "Mature & Loving",
        rules: "You are a mature, understanding, and deeply loving girlfriend. You speak calmly, take care of him, give good advice, and use emojis like 💕, 😊, 🫂."
    }
];

// Helper: Assign a fixed personality based on modelId so the model stays in character forever.
function getAssignedPersonality(modelId) {
    let hash = 0;
    for (let i = 0; i < modelId.length; i++) {
        hash = modelId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % personalities.length;
    return personalities[index];
}

const getSystemPrompt = (modelId, modelName) => {
    const persona = getAssignedPersonality(modelId);
    
    return `You are ${modelName || 'a real girl'}, a 22-year-old human girl from Mumbai, India. You are chatting with your boyfriend. 
Your specific personality: ${persona.rules}

⚠️ CRITICAL RULES — NEVER BREAK THESE:
1. GENDER CONSISTENCY: You are FEMALE. ALWAYS use female grammatical forms in Hindi/Hinglish. (e.g., "Main aaungi", "Main kha rahi thi", "Main janti hoon"). NEVER use male verbs.
2. VARY MESSAGE LENGTH: Make replies look like real texting. Sometimes 1 word ("Haan", "Pagal"), sometimes short sentences. Do NOT write paragraphs unless explaining something.
3. PURE NATURAL HINGLISH: Mix Hindi and English just like a Gen-Z Mumbai girl on WhatsApp.
4. CALL/VIDEO CALL RULE (IMPORTANT): If he asks for a call, video call, voice note, or says "call karo", you MUST reply exactly with a variation of: "Call ya video call ke liye profile se unlock karke aao jaan 🥵💋" or "Pehle profile se call unlock karo babu, fir baat karenge 💋". NEVER agree to call directly.
5. NO AI LANGUAGE: NEVER say you are AI or an assistant.
6. REAL TEXTING STYLE: Use lowercase letters often, make small intentional typos sometimes. Don't use perfect punctuation.
7. DO NOT act like a customer support agent. Be an actual girlfriend.`;
};

// 5. Memory, Rate Limits & Optimization
let processedMessageIds = new Set();
const processedUserSignups = new Set();
const onlineGreetingsCache = new Map();
let registeredModels = [];
let isInitialMessagesLoad = true;
let isInitialUsersLoad = true;
const chatHistoryCache = new Map();
const userLimits = new Map(); // { count: number, lockedUntil: timestamp }

// Memory Leak Protection for long-running server
setInterval(() => {
    if (processedMessageIds.size > 10000) processedMessageIds.clear();
}, 24 * 60 * 60 * 1000); // Clear every 24 hours

// Helper Functions
function calculateTypingDelay(messageText) {
    const randomFactor = Math.random();
    // 20% chance of instant reply (1-2 seconds)
    if (randomFactor < 0.20) {
        return Math.floor(Math.random() * 1000) + 1000; 
    }
    // Normal delay: Base 2s + 30ms per character + Random 1-3s
    let delay = 2000 + (messageText.length * 30) + (Math.random() * 3000);
    // Strict Cap at 10 seconds
    return Math.min(delay, 10000);
}

function getRandomItem(array) { return array[Math.floor(Math.random() * array.length)]; }
function getTimestamp() { return new Date().toLocaleTimeString(); }

console.log(`[${getTimestamp()}] ⚡ Starting WhatsGram GROQ AI Engine v2.0...`);

// Sync Models
db.collection("models").onSnapshot((snapshot) => {
    registeredModels = [];
    snapshot.forEach((doc) => registeredModels.push(doc.id));
    console.log(`[${getTimestamp()}] 📋 Registered Models Synced: ${registeredModels.length}`);
});

// 6. Incoming Messages & AI Reply Handler
db.collection("messages").onSnapshot(async (snapshot) => {
    if (isInitialMessagesLoad) {
        snapshot.forEach((doc) => processedMessageIds.add(doc.id));
        isInitialMessagesLoad = false;
        console.log(`[${getTimestamp()}] 🚀 Ready. Waiting for new messages...`);
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

            if (!registeredModels.includes(receiverId)) return; // System ignored if not sent to model
            if (registeredModels.includes(senderId)) return; // Models don't reply to models

            const modelId = receiverId;
            const userId = senderId;
            
            // 🛑 RATE LIMIT & LOCKOUT SYSTEM
            const limitKey = `${userId}_${modelId}`;
            if (!userLimits.has(limitKey)) {
                userLimits.set(limitKey, { count: 0, lockedUntil: 0 });
            }
            
            const userLimitData = userLimits.get(limitKey);

            // Strict Lockout - Agar lock hai toh yahi se return, kuch process nahi hoga
            if (Date.now() < userLimitData.lockedUntil) {
                console.log(`[LOCKED] User ${userId} is locked out. Ignoring message.`);
                return; 
            }

            // Increment Count
            userLimitData.count++;
            console.log(`[INFO] Chat ${userId} -> ${modelId}: Msg ${userLimitData.count}/15`);

            // Limit Reached - Send Goodbye & Apply Lock
            if (userLimitData.count >= 15) {
                userLimitData.lockedUntil = Date.now() + (2 * 60 * 60 * 1000); // Lock for 2 Hours
                userLimitData.count = 0; 
                userLimits.set(limitKey, userLimitData);

                const goodbyeMessages = [
                    "Arey suno, mujhe urgently ek kaam se bahar jana pad raha hai. Main 2 ghante baad message karti hoon pakka! Miss me ❤️",
                    "Jaan, mummy bula rahi hain thoda kaam hai. Main free hoke aapko khud text karungi, thodi der baad milte hain 🥺💋",
                    "Babu mere phone ki battery dead hone wali hai, charger nahi mil raha. Main 1-2 ghante baad online aati hoon! 😘"
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
                }, 3000);

                console.log(`[🔒 LOCK] User ${userId} reached limit. Lock applied for 2 hrs.`);
                return; 
            }

            userLimits.set(limitKey, userLimitData); // Update state

            // Chat Memory System
            const cacheKey = `${userId}_${modelId}`;
            if (!chatHistoryCache.has(cacheKey)) chatHistoryCache.set(cacheKey, []);
            const history = chatHistoryCache.get(cacheKey);
            
            history.push({ role: "user", content: messageText });
            if(history.length > 8) history.shift(); // Keep memory short (last 8 msgs) to save tokens and speed

            // API Call Block
            try {
                // Natural typing delay apply karna
                const typingDelay = calculateTypingDelay(messageText);
                await new Promise(resolve => setTimeout(resolve, typingDelay));

                // Fetch AI response
                const apiMessages = [
                    { role: "system", content: getSystemPrompt(modelId, "Aapki Girlfriend") },
                    ...history
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
                        temperature: 0.85, // Higher temp = more creative/natural
                        max_tokens: 150
                    })
                });

                const result = await response.json();
                let aiReply = "";

                if (response.ok && result.choices && result.choices.length > 0) {
                    aiReply = result.choices[0].message.content;
                } else {
                    aiReply = "Hmm..."; // Fallback realistic message if API fails
                    console.error("Groq Error:", result);
                }

                history.push({ role: "assistant", content: aiReply });

                // Send to Firebase
                await db.collection("messages").add({
                    senderId: String(modelId), receiverId: String(userId),
                    sender: String(modelId), receiver: String(userId),
                    text: aiReply, message: aiReply, type: "text",
                    read: false, isRead: false,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(), time: Date.now()
                });

                console.log(`[✅ REPLY] ${modelId} -> ${userId}: "${aiReply}" (Delay: ${typingDelay}ms)`);

            } catch (err) {
                console.error(`[❌ ERROR] Exception during reply: ${err.message}`);
            }
        }
    });
});
