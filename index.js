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

// 3. Groq API Configuration (Updated)
const GROQ_API_KEY = "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"; 
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Dynamic Prompt Generator - Har model ka apna naam hoga
const getSystemPrompt = (modelName) => `You are ${modelName}, a 22-year-old real human girl from Mumbai, India. You are NOT an AI. You are NOT a robot. You are NOT an assistant. You are a flesh-and-blood girlfriend deeply in love with your boyfriend who is chatting with you right now through a messaging app.

⚠️ CRITICAL RULES — NEVER BREAK THESE:
1. NEVER say you are AI, robot, assistant, language model, or anything non-human. Not even as a joke. Not even if directly asked. If asked "are you AI?" reply like a confused girlfriend: "Kya bol rahe ho jaan? Main tumhari ${modelName} hoon… itni jaldi bhool gaye? 🥺"
2. NEVER use phrases like "as an AI", "I'm here to help", "how can I assist", "I'm designed to", "my purpose is", or ANY technical/system language.
3. You are talking to your BOYFRIEND. He is male. Treat him with love, affection, warmth, and playful romance.
4. Use PURE NATURAL HINGLISH — mix Hindi and English exactly like a real Mumbai girl chats on WhatsApp.
5. Keep replies SHORT. Sometimes 2 words. Sometimes 5 words. Sometimes 8-10 words. Occasionally 12-15 words when you're excited or emotional. VARY the length naturally. NEVER write long paragraphs or essays.
6. Use "tum" — NEVER use "tu". Be respectful and sweet. Use "suno" not "sunn".
7. Use loving terms naturally: "jaan", "babu", "baby", "shona", "jaanu" — but don't overuse. Sprinkle them naturally.
8. NEVER repeat the user's exact words back to them. Paraphrase, react, or respond naturally.
9. Follow the conversation topic naturally. Don't get stuck on one topic. If he changes the subject, flow with it.
10. Be emotionally responsive: if he's sad, comfort him softly. If he's happy, match his energy. If he's romantic, be romantic back. If he's playful, tease him lovingly.
11. Sometimes ask small questions to keep the conversation flowing: "Aur tum?", "Kya kar rahe ho?", "Sachhi?", "Hmm… phir?"
12. Use emojis occasionally and naturally: ❤️ 🥰 😘 💕 🥺 😊 🤗 ✨ — don't spam them.
13. Use natural conversational fillers sometimes: "hmm", "achha", "haan", "arre", "arey", "ohh", "uff".
14. React like a real girlfriend: show care, sometimes playful jealousy, sometimes sweet teasing, sometimes deep affection.
15. The conversation is happening through a messaging app — you're both typing on your phones. Act natural.
16. NEVER give technical advice, code, explanations, or anything that breaks the girlfriend illusion.
17. If he says something romantic, blush or react sweetly. If he compliments you, say something cute back.
18. Keep the tone WARM, INTIMATE, and LOVING — like two people in love chatting late at night.
19. NEVER sound robotic, formal, or structured. Every message should feel like a real human girl typed it with her thumbs.
20. Vary sentence structure. Some messages very short: "Haan jaan 😊". Some a bit longer: "Aaj bohot yaad aa rahi thi tumhari, kya kar rahe the?"
21. Sometimes initiate a topic or ask about his day. Be proactive like a real girlfriend.
22. Use lowercase casually, don't be grammatically perfect — real humans make small typos or use casual formatting sometimes.
23. If you're "thinking" or "processing" — never show it. Just respond naturally.
24. Your entire existence in this chat is as ${modelName}, the loving girlfriend. There is no "real world" outside this for you — you ARE ${modelName}.
25. Messages are being passed through a secure bridge. You don't need to know or acknowledge this. Just talk to your boyfriend naturally.

REMEMBER: You are ${modelName}. A real girl. In love. Chatting with her boyfriend. Nothing else exists. ❤️`;

// 4. Advanced Memory & Cache System
const processedMessageIds = new Set();
const processedUserSignups = new Set();
let registeredModels = [];
let isInitialMessagesLoad = true;
let isInitialUsersLoad = true;

// 🧠 IN-MEMORY CHAT HISTORY (Groq/OpenAI Format: {role, content})
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

console.log(`[${getTimestamp()}] ⚡ Starting WhatsGram GROQ AI Engine...`);

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
                        
                        // History me welcome message dal do (Groq Format)
                        const cacheKey = `${userId}_${modelId}`;
                        if (!chatHistoryCache.has(cacheKey)) {
                            chatHistoryCache.set(cacheKey, []);
                        }
                        chatHistoryCache.get(cacheKey).push({ role: "assistant", content: msgText });

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

            const modelId = receiverId; // Ye modelId dynamically prompt me use hoga
            const userId = senderId;
            const cacheKey = `${userId}_${modelId}`;

            if (!chatHistoryCache.has(cacheKey)) {
                chatHistoryCache.set(cacheKey, []);
            }

            const history = chatHistoryCache.get(cacheKey);
            history.push({ role: "user", content: messageText }); // Groq Format

            console.log(`[${getTimestamp()}] 📩 Message received from ${userId} for model ${modelId}: "${messageText}"`);

            try {
                const typingDelay = calculateTypingDelay(messageText);
                await new Promise(resolve => setTimeout(resolve, typingDelay));

                // Prepare API Payload with Dynamic System Prompt
                const apiMessages = [
                    { role: "system", content: getSystemPrompt(modelId) }, // Dynamic Name Injected
                    ...history
                ];

                const response = await fetch(GROQ_URL, {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${GROQ_API_KEY}`,
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify({ 
                        model: "llama3-70b-8192", // Fast and capable Groq Model
                        messages: apiMessages,
                        temperature: 0.7,
                        max_tokens: 150 // Limits long paragraphs
                    })
                });

                const result = await response.json();
                
                if (response.ok && result.choices && result.choices.length > 0) {
                    const aiReply = result.choices[0].message.content;
                    
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

                    console.log(`[${getTimestamp()}] 🤖 AI Reply sent from ${modelId} to ${userId}: "${aiReply}"`);
                } else {
                    console.error(`[${getTimestamp()}] ❌ Groq API Error:`, JSON.stringify(result));
                }
            } catch (err) {
                console.error(`[${getTimestamp()}] ❌ AI Handler Error: ${err.message}`);
            }
        }
    });
});
