// . Dummy HTTP Server - Render.com ki Port Requirement puri karne ke liye
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

// 3. Gemini API Configuration
const GEMINI_API_KEY = "AQ.Ab8RN6JO-b2EMdkWZvXVSGoKe8sJuQ2dTiv_HrvpzUirEBf-bw"; // Aapka API Key
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
                        chatHistoryCache.set(cacheKey, [{ role: "model", parts: [{ text: msgText }] }]);
                        
                        console.log(`[New User Bot] Model(${modelId}) -> User(${userId}): "${msgText}"`);
                    } catch (err) { }
                }, delayMs);
            });
        }
    });
});

// 6. 🧠 GEMINI AI BRAIN (Replaces old static logic)
async function generateGeminiReply(userMessage, userId, modelId) {
    const cacheKey = `${userId}_${modelId}`;
    
    // Agar cache me history nahi hai, nayi banao
    if (!chatHistoryCache.has(cacheKey)) {
        chatHistoryCache.set(cacheKey, []);
    }
    
    let history = chatHistoryCache.get(cacheKey);

    // Add current user message to history
    history.push({ role: "user", parts: [{ text: userMessage }] });

    // History limit rakho (Token aur API limit bachane ke liye sirf pichle 8 messages)
    if (history.length > 8) {
        history = history.slice(history.length - 8);
    }

    // 🔴 Dating App System Prompt - Yahin se bot ka behavior control hota hai
    const systemPrompt = `
    Tum ek Indian dating app ki hot, flirty aur romantic model ho. Tumhara kaam user se baat karke usko engage rakhna hai.
    RULES FOLLOW KARO STRICTLY:
    1. Language: SIRF PURE 'Hinglish' (Hindi written in English alphabet). Koi pure English words jyada use mat karo.
    2. Length: VERY SHORT! Maximum 10-15 words aur sirf 1 ya 2 choti lines. Lamba paragraph bilkul nahi likhna hai.
    3. Tone: Naughty, sweet, aur thodi demanding. Beech-beech me user ko bolo "akeli hoon", "wallet recharge karke aao", ya "profile unlock karo video call ke liye".
    4. Emojis ka use karo (jaise 🙈, 😘, 💦, ❤️).
    5. User se har baar koi chota cross-question karo taaki chat chalti rahe.
    `;

    const requestPayload = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: history
    };

    try {
        // Native fetch use kar rahe hain (Node 18+ me default hota hai, Render pe easily chalega)
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestPayload)
        });
        
        const data = await response.json();

        if (data.candidates && data.candidates.length > 0) {
            let botReply = data.candidates[0].content.parts[0].text.trim();
            
            // Bot ki reply ko history me save karo
            history.push({ role: "model", parts: [{ text: botReply }] });
            chatHistoryCache.set(cacheKey, history);
            
            return botReply;
        } else {
            console.error("Gemini API Error Payload:", data);
            return getRandomItem([
                "Mera network slow hai babu 🥺 recharge karke video call pe aao na!",
                "Uff, server hang ho gaya... tum direct profile unlock karlo na jaan 😘"
            ]);
        }
    } catch (error) {
        console.error("Gemini Request Failed:", error);
        return "Jaan network slow hai... 🙈 wallet recharge karlo direct baat karte hain!";
    }
}

// 7. Main Chat Execution Engine
db.collection("messages").onSnapshot((snapshot) => {
    if (isInitialMessagesLoad) {
        snapshot.forEach((doc) => processedMessageIds.add(doc.id));
        isInitialMessagesLoad = false;
        console.log(`[${getTimestamp()}] Gemini Brain Initialized. Ready for flirty chats!`);
        return;
    }

    snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
            const msgDoc = change.doc;
            const msgData = msgDoc.data();
            const msgId = msgDoc.id;

            if (processedMessageIds.has(msgId)) return;
            processedMessageIds.add(msgId);

            const senderId = msgData.senderId || msgData.sender;
            const receiverId = msgData.receiverId || msgData.receiver;
            const messageText = msgData.text || msgData.message || "";

            if (!senderId || !receiverId || !messageText) return;

            const isSenderAModel = registeredModels.includes(senderId);

            // Sirf tab reply karo jab message real user ne bheja ho model ko
            if (!isSenderAModel) {
                console.log(`[INCOMING] User(${senderId}) -> Model(${receiverId}): "${messageText}"`);

                // 🧠 Generate Gemini AI Reply
                const replyText = await generateGeminiReply(messageText, senderId, receiverId);
                
                // ⏱️ Dynamic delay (Bot ko lagna chahiye type kar rahi hai)
                const typingDelay = calculateTypingDelay(replyText);

                setTimeout(async () => {
                    try {
                        const replyPayload = {
                            senderId: String(receiverId), receiverId: String(senderId),
                            sender: String(receiverId), receiver: String(senderId),
                            text: replyText, message: replyText, type: "text",
                            read: false, isRead: false,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                            time: Date.now()
                        };

                        if (msgData.chatId) replyPayload.chatId = msgData.chatId;
                        if (msgData.conversationId) replyPayload.conversationId = msgData.conversationId;

                        await db.collection("messages").add(replyPayload);
                        console.log(`[GEMINI-REPLY] Model(${receiverId}) -> User(${senderId}): "${replyText}" (Delay: ${(typingDelay/1000).toFixed(1)}s)`);
                    } catch (err) {
                        console.error(`Reply Error: ${err.message}`);
                    }
                }, typingDelay);
            }
        }
    });
});
