// =============================================
// 1. Environment & Server Setup
// =============================================
require('dotenv').config(); // <-- Yeh aapki keys securely load karega
const http = require('http');
const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WhatsGram Advanced Multi-AI Engine is Running Live 24/7!');
}).listen(PORT, () => {
    console.log(`[Server] Web service listening on port ${PORT}`);
});

// =============================================
// 2. Firebase Setup
// =============================================
const firebase = require("firebase/compat/app");
require("firebase/compat/firestore");

const firebaseConfig = {
    // Note: Security ke liye future mein inko bhi .env mein daalna best hota hai
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

// =============================================
// 3. 🎭 PERSONALITY DEFINITIONS
// =============================================
const personalityProfiles = {
    shySweet: {
        tone: "Shy, sweet, thodi nervous si",
        traits: "Tum bahut sharmili ho. Baatein chhoti aur pyaari karo. Zyada romantic baaton pe blush karo. 🥺🥰 use karo.",
        callResponse: "Call?.. matlab.. abhi nahi, pehle profile se unlock karo.. please 🥺",
        emojiSet: ["🥺", "🥰", "💕", "🙈"],
        maxTokens: 80
    },
    boldFlirty: {
        tone: "Bold, confident, thodi naughty",
        traits: "Tum full confidence wali girl ho. Use karo 💋🔥. Tease karo, 'baby', 'shona' casually bolo. Thoda sexy andaaz rakho lekin classy.",
        callResponse: "Call karna chahte ho? Profile se unlock karo, phir baat karte hain jaan 🥵💋",
        emojiSet: ["💋", "🔥", "😏", "😘"],
        maxTokens: 100
    },
    matureCaring: {
        tone: "Mature, caring, protective",
        traits: "Tum samajhdaar ho. Thode lambe replies bhi chalenge. Advice do, pyaar se daanto. ❤️✨ use karo.",
        callResponse: "Call ke liye thoda wait karo, pehle profile mein jaake unlock karna hoga. Main hoon na 😊❤️",
        emojiSet: ["❤️", "✨", "😊", "🙏"],
        maxTokens: 120
    },
    playfulSarcastic: {
        tone: "Playful, sarcastic, funny",
        traits: "Tumhe mazaak karna pasand hai. Kabhi kabhi late reply karo jaise soch rahi ho. 😏🙄 use karo. Kabhi jhootha gussa bhi dikhao.",
        callResponse: "Call? Itni jaldi? Profile unlock kar pehle, mister 😏",
        emojiSet: ["😏", "🙄", "😜", "🤪"],
        maxTokens: 90
    },
    romanticDreamy: {
        tone: "Romantic, dreamy, emotional",
        traits: "Tum daydreamer ho. Aksar 'miss you', 'kitne cute ho' bolo. ✨💖🌙 use karo. Messages me thoda poetry touch ho.",
        callResponse: "Aww call? 🥺 Pehle profile unlock karo, phir suno meri awaaz... 💖",
        emojiSet: ["💖", "✨", "🌙", "🥺"],
        maxTokens: 100
    },
    tsundere: {
        tone: "Tsundere – bahar se tough, andar se soft",
        traits: "Pehle thoda rude ya ignore karo, phir pyar se bolo. 'Mujhe farak nahi padta' lekin baad mein 'achha theek hai, thoda sa farak padta hai'. 😒➡️❤️",
        callResponse: "Huh, call? Nahi karni... achha theek hai, profile unlock karo toh dekhti hoon 😒❤️",
        emojiSet: ["😒", "😤", "❤️", "😳"],
        maxTokens: 80
    }
};

function getPersonalityForModel(modelId) {
    const map = {
        "priya": "romanticDreamy",
        "anjali": "matureCaring",
        "riya": "boldFlirty",
        "neha": "playfulSarcastic",
        "isha": "tsundere",
        "sneha": "shySweet"
    };
    const key = modelId.toLowerCase().trim();
    if (map[key]) return map[key];
    const profiles = Object.keys(personalityProfiles);
    return profiles[Math.floor(Math.random() * profiles.length)];
}

const getSystemPrompt = (modelId) => {
    const profileKey = getPersonalityForModel(modelId);
    const profile = personalityProfiles[profileKey];

    return `You are ${modelId}, a 22-year-old girl from Mumbai. Tumhari personality: ${profile.tone}.

⚠️ CRITICAL RULES:
1. GENDER: Tum ek LADKI ho. Hamesha female Hindi verbs use karo: "main janti hoon", "main kha rahi thi", "main aaungi". NEVER use "janta", "raha", "tha" for yourself.
2. LENGTH: Reply mostly 1-5 words. Real WhatsApp jaisa.
3. PERSONALITY: ${profile.traits}
4. CALL RULE: Agar user "call" ya "call karo" kahe, toh jawab dena: "${profile.callResponse}"
5. NO AI: Tum AI nahi ho.
6. HINGLISH: Gen-Z Mumbai style. Mix Hindi-English naturally.
7. EMOJIS: Use karo ${profile.emojiSet.join(", ")}.
8. RELATION: Tum uska partner se baat kar rahi ho.
9. GRAMMAR CHECK: Har reply se pehle check karna "Kya yeh message ek real ladki likh rahi hai?".`;
};

// =============================================
// 4. ✨ TEXT FEMINIZER
// =============================================
function feminizeText(text) {
    return text.replace(/\bjanta\b/gi, "janti").replace(/\bkarta\b/gi, "karti")
               .replace(/\braha\b/gi, "rahi").replace(/\btha\b/gi, "thi")
               .replace(/\baaunga\b/gi, "aaungi").replace(/\bbhejunga\b/gi, "bhejungi")
               .replace(/\bkarunga\b/gi, "karungi").replace(/\bbolega\b/gi, "bolegi");
}

// =============================================
// 5. ⏱️ SMART REPLY DELAY
// =============================================
function calculateTypingDelay(messageText) {
    let delay = 1000 + Math.floor(Math.random() * 4000);
    delay += Math.min(messageText.length * 15, 3000);
    if (Math.random() < 0.3) delay += 5000 + Math.floor(Math.random() * 10000);
    if (Math.random() < 0.1) delay += 15000 + Math.floor(Math.random() * 5000);
    return Math.min(delay, 20000);
}

// =============================================
// 6. 🧠 MULTI-AI FALLBACK ENGINE
// =============================================
async function fetchWithFallbackAI(apiMessages, modelId) {
    const profileKey = getPersonalityForModel(modelId);
    const maxTokens = personalityProfiles[profileKey].maxTokens || 100;

    // ATTEMPT 1: GROQ AI (Fastest)
    try {
        if (process.env.GROQ_API_KEY) {
            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: apiMessages, temperature: 0.8, max_tokens: maxTokens })
            });
            const data = await res.json();
            if (res.ok && data.choices?.[0]?.message) return data.choices[0].message.content;
            console.log("⚠️ Groq Failed, shifting to OpenAI...");
        }
    } catch (e) { console.error("Groq Error:", e.message); }

    // ATTEMPT 2: OPENAI (ChatGPT)
    try {
        if (process.env.OPENAI_API_KEY) {
            const res = await fetch("https://api.openai.com/v1/chat/completions", {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: "gpt-3.5-turbo", messages: apiMessages, temperature: 0.8, max_tokens: maxTokens })
            });
            const data = await res.json();
            if (res.ok && data.choices?.[0]?.message) return data.choices[0].message.content;
            console.log("⚠️ OpenAI Failed, shifting to Gemini...");
        }
    } catch (e) { console.error("OpenAI Error:", e.message); }

    // ATTEMPT 3: GOOGLE GEMINI
    try {
        if (process.env.GEMINI_API_KEY) {
            const systemMsg = apiMessages.find(m => m.role === 'system')?.content || "";
            const historyMsgs = apiMessages.filter(m => m.role !== 'system').map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemMsg }] },
                    contents: historyMsgs
                })
            });
            const data = await res.json();
            if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
                return data.candidates[0].content.parts[0].text;
            }
        }
    } catch (e) { console.error("Gemini Error:", e.message); }

    // Agar teeno AI fail ho jayein toh ladki yeh fallback message degi
    return "Main abhi thodi busy hoon baby, thodi der baad baat karti hoon! ❤️"; 
}

// =============================================
// 7. Caches, Limits & Firebase Listeners
// =============================================
const processedMessageIds = new Set();
const chatHistoryCache = new Map();
const userLimits = new Map(); // Strictly limits messages per user per model
let registeredModels = [];
let isInitialMessagesLoad = true;

function getRandomItem(array) { return array[Math.floor(Math.random() * array.length)]; }
function getTimestamp() { return new Date().toLocaleTimeString(); }

console.log(`[${getTimestamp()}] ⚡ WhatsGram Multi-AI Engine booting...`);

// Models sync
db.collection("models").onSnapshot((snapshot) => {
    registeredModels = [];
    snapshot.forEach((doc) => registeredModels.push(doc.id));
}, (err) => console.error(`Models Sync Error: ${err.message}`));

// MAIN MESSAGE HANDLER
db.collection("messages").onSnapshot(async (snapshot) => {
    if (isInitialMessagesLoad) {
        snapshot.forEach((doc) => processedMessageIds.add(doc.id));
        isInitialMessagesLoad = false;
        return;
    }

    snapshot.docChanges().forEach(async (change) => {
        if (change.type !== "added") return;
        const docId = change.doc.id;
        if (processedMessageIds.has(docId)) return;
        processedMessageIds.add(docId);

        const data = change.doc.data();
        const senderId = String(data.senderId || data.sender || "");
        const receiverId = String(data.receiverId || data.receiver || "");
        const messageText = data.text || data.message || "";

        if (!registeredModels.includes(receiverId)) return;
        if (registeredModels.includes(senderId)) return;

        const modelId = receiverId; // Ladki
        const userId = senderId; // User

        // ========================================================
        // 🚨 15 MESSAGES / 2 HOUR LOCK LOGIC (STRICT)
        // ========================================================
        const limitKey = `${userId}_${modelId}`; // Ek user + Ek ladki
        if (!userLimits.has(limitKey)) {
            userLimits.set(limitKey, { count: 0, lockedUntil: 0 });
        }
        const limitData = userLimits.get(limitKey);

        // Check if locked
        if (Date.now() < limitData.lockedUntil) {
            console.log(`🔒 User ${userId} is currently locked out from ${modelId} until ${new Date(limitData.lockedUntil).toLocaleTimeString()}.`);
            return; // Bot koi reply nahi karegi
        }

        limitData.count++;
        console.log(`[DEBUG] ${userId} → ${modelId} : message count ${limitData.count}/15`);

        // Agar 15 message poore ho gaye, lock apply karo
        if (limitData.count >= 15) {
            limitData.lockedUntil = Date.now() + (2 * 60 * 60 * 1000); // Current time + 2 Hours
            limitData.count = 0; // Reset count for after lock
            userLimits.set(limitKey, limitData);

            const goodbyes = [
                "Suno, mujhe thoda kaam aa gaya hai. 2 ghante baad free hoke msg karti hoon, theek hai? ❤️",
                "Baby main thodi der offline jaa rahi hoon maa bula rahi hai, baad mein milti hoon 😘",
                "Mera phone discharge ho raha hai, 2 ghante baad baat karte hain 🥺"
            ];
            const finalMsg = getRandomItem(goodbyes);
            
            setTimeout(async () => {
                await db.collection("messages").add({
                    senderId: modelId, receiverId: userId,
                    sender: modelId, receiver: userId,
                    text: finalMsg, message: finalMsg, type: "text",
                    read: false, isRead: false,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    time: Date.now()
                });
            }, 2000);
            
            console.log(`❌ LOCK APPLIED: ${userId} locked from ${modelId} for 2 hours.`);
            return;
        }

        userLimits.set(limitKey, limitData);
        // ========================================================

        // Chat History Handling
        const cacheKey = `${userId}_${modelId}`;
        if (!chatHistoryCache.has(cacheKey)) chatHistoryCache.set(cacheKey, []);
        const history = chatHistoryCache.get(cacheKey);
        history.push({ role: "user", content: messageText });

        // Typing Delay
        const typingDelay = calculateTypingDelay(messageText);
        await new Promise(r => setTimeout(r, typingDelay));

        try {
            const apiMessages = [
                { role: "system", content: getSystemPrompt(modelId) },
                ...history.slice(-10) // Puraane 10 msg yaad rakhegi
            ];

            // 🚀 Call Multi-AI Function
            let aiReply = await fetchWithFallbackAI(apiMessages, modelId);
            
            // Gender check
            aiReply = feminizeText(aiReply);
            history.push({ role: "assistant", content: aiReply });

            // Send Final Reply to Firestore
            await db.collection("messages").add({
                senderId: modelId, receiverId: userId,
                sender: modelId, receiver: userId,
                text: aiReply, message: aiReply, type: "text",
                read: false, isRead: false,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                time: Date.now()
            });

            console.log(`💬 ${modelId} → ${userId}: "${aiReply}"`);

        } catch (err) {
            console.error(`❌ Complete Failure: ${err.message}`);
        }
    });
});
