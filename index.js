// =============================================
// 1. Dummy HTTP Server — Render.com ke liye
// =============================================
const http = require('http');
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WhatsGram Advanced Groq AI Engine is Running Live 24/7!');
}).listen(PORT, () => {
    console.log(`[Server] Web service listening on port ${PORT}`);
});

// =============================================
// 2. Firebase Setup
// =============================================
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

// =============================================
// 3. Groq API Configuration
// =============================================
const GROQ_API_KEY = "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";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// =============================================
// 4. 🎭 PERSONALITY DEFINITIONS (Har model ka alag andaaz)
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

// modelId ke hisaab se personality assign karo
function getPersonalityForModel(modelId) {
    const map = {
        "priya": "romanticDreamy",
        "anjali": "matureCaring",
        "riya": "boldFlirty",
        "neha": "playfulSarcastic",
        "isha": "tsundere",
        "sneha": "shySweet"
        // agar yahan nahi mila to random pick
    };
    const key = modelId.toLowerCase().trim();
    if (map[key]) return map[key];
    // random fallback
    const profiles = Object.keys(personalityProfiles);
    return profiles[Math.floor(Math.random() * profiles.length)];
}

// =============================================
// 5. 🧠 DYNAMIC SYSTEM PROMPT (Personality + female grammar)
// =============================================
const getSystemPrompt = (modelId) => {
    const profileKey = getPersonalityForModel(modelId);
    const profile = personalityProfiles[profileKey];

    return `You are ${modelId}, a 22-year-old girl from Mumbai. Tumhari personality: ${profile.tone}.

⚠️ CRITICAL RULES:
1. GENDER: Tum ek LADKI ho. Hamesha female Hindi verbs use karo: "main janti hoon", "main kha rahi thi", "main aaungi". NEVER use "janta", "raha", "tha" for yourself.
2. LENGTH: Reply mostly 1-5 words. Kabhi kabhi 2-3 words. Real WhatsApp jaisa. Har reply same length nahi hona chahiye.
3. PERSONALITY: ${profile.traits}
4. CALL RULE: Agar user "call" ya "call karo" kahe, toh jawab dena: "${profile.callResponse}"
5. NO AI: Tum AI nahi ho. Agar koi puche toh bolna "Pagal ho? Main ${modelId} hoon tumhari."
6. HINGLISH: Gen-Z Mumbai style. Mix Hindi-English naturally.
7. EMOJIS: Use karo ${profile.emojiSet.join(", ")} – par jyada nahi.
8. RELATION: Tum uska boyfriend/partner se baat kar rahi ho. Thoda romantic, thoda caring, thoda attitude.
9. GRAMMAR CHECK: Har reply se pehle sochna – "Kya yeh message ek real ladki likh rahi hai?" Agar male form lage toh turant badlo.
10. Short, sweet, na ki boring. Agree mat karo har baat pe.`;

};

// =============================================
// 6. ✨ TEXT FEMINIZER (Safety net for male verbs)
// =============================================
function feminizeText(text) {
    return text
        .replace(/\bjanta\b/gi, "janti")
        .replace(/\bkarta\b/gi, "karti")
        .replace(/\braha\b/gi, "rahi")
        .replace(/\btha\b/gi, "thi")
        .replace(/\baaunga\b/gi, "aaungi")
        .replace(/\bbhejunga\b/gi, "bhejungi")
        .replace(/\bkarunga\b/gi, "karungi")
        .replace(/\bbolega\b/gi, "bolegi")
        .replace(/\bdega\b/gi, "degi")
        .replace(/\blega\b/gi, "legi");
}

// =============================================
// 7. ⏱️ SMART REPLY DELAY (Instant to 20 sec)
// =============================================
function calculateTypingDelay(messageText) {
    // base: 1 se 5 sec ke beech random
    let delay = 1000 + Math.floor(Math.random() * 4000);
    // char count ke hisaab se thoda delay
    delay += Math.min(messageText.length * 15, 3000);
    // 30% chance: sochne ka extra time (5-15 sec)
    if (Math.random() < 0.3) {
        delay += 5000 + Math.floor(Math.random() * 10000);
    }
    // 10% chance: ekdum slow response (15-20 sec) - real life lag
    if (Math.random() < 0.1) {
        delay += 15000 + Math.floor(Math.random() * 5000);
    }
    // cap at 20 seconds
    return Math.min(delay, 20000);
}

// =============================================
// 8. Cache, Limits & Helpers
// =============================================
const processedMessageIds = new Set();
const processedUserSignups = new Set();
const onlineGreetingsCache = new Map();
let registeredModels = [];
let isInitialMessagesLoad = true;
let isInitialUsersLoad = true;
const chatHistoryCache = new Map();
const userLimits = new Map(); // {count, lockedUntil} per userId_modelId

function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}
function getTimestamp() {
    return new Date().toLocaleTimeString();
}

console.log(`[${getTimestamp()}] ⚡ WhatsGram Personality Engine booting...`);

// Real‑time models sync
db.collection("models").onSnapshot((snapshot) => {
    registeredModels = [];
    snapshot.forEach((doc) => registeredModels.push(doc.id));
    console.log(`[${getTimestamp()}] Models synced (${registeredModels.length}):`, registeredModels);
}, (err) => console.error(`Models Sync Error: ${err.message}`));

// =============================================
// 9. PROACTIVE MESSAGES (New user & Online)
// =============================================
const welcomeTemplates = [
    "Hellow baby 💕",
    "Hii! Aapne join kiya? Main wait kar rahi thi 🥺",
    "Hey handsome! Kaise ho?",
    "Finally tum aaye, bore ho rahi thi 😒❤️"
];
const onlineGreetingTemplates = [
    "Aap online aaye! 🥰",
    "Miss kar rahi thi tumhe... ❤️",
    "Hi jaan, kya kar rahe ho? ✨",
    "Dekho kaun online aaya 😍"
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

        // New registration
        if (change.type === "added" && !processedUserSignups.has(userId)) {
            processedUserSignups.add(userId);
            if (registeredModels.length === 0) return;
            const targetCount = Math.min(Math.floor(Math.random() * 2) + 6, registeredModels.length);
            const shuffled = [...registeredModels].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, targetCount);

            selected.forEach((modelId, index) => {
                const delayMs = 5000 + (index * 15000) + Math.random() * 20000;
                const msg = getRandomItem(welcomeTemplates);
                setTimeout(async () => {
                    try {
                        await db.collection("messages").add({
                            senderId: modelId, receiverId: userId,
                            sender: modelId, receiver: userId,
                            text: msg, message: msg, type: "text",
                            read: false, isRead: false,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                            time: Date.now()
                        });
                        console.log(`[${getTimestamp()}] 💌 Welcome from ${modelId} to ${userId}`);
                    } catch (e) { console.error(e.message); }
                }, delayMs);
            });
        }

        // Online detection
        if (change.type === "modified" && (data.isOnline === true || data.status === "online")) {
            const now = Date.now();
            const lastGreeted = onlineGreetingsCache.get(userId) || 0;
            if (now - lastGreeted > 3600000 && registeredModels.length > 0) {
                onlineGreetingsCache.set(userId, now);
                const model = getRandomItem(registeredModels);
                const msg = getRandomItem(onlineGreetingTemplates);
                setTimeout(async () => {
                    await db.collection("messages").add({
                        senderId: model, receiverId: userId,
                        sender: model, receiver: userId,
                        text: msg, message: msg, type: "text",
                        read: false, isRead: false,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        time: Date.now()
                    });
                    console.log(`[${getTimestamp()}] 👀 Online greeting from ${model} to ${userId}`);
                }, 3000 + Math.random() * 5000);
            }
        }
    });
});

// =============================================
// 10. 🤖 MAIN MESSAGE HANDLER (with personality)
// =============================================
db.collection("messages").onSnapshot(async (snapshot) => {
    if (isInitialMessagesLoad) {
        snapshot.forEach((doc) => processedMessageIds.add(doc.id));
        isInitialMessagesLoad = false;
        console.log(`[${getTimestamp()}] Initial messages loaded. Waiting for new...`);
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

        // sirf models ko aaye messages process
        if (!registeredModels.includes(receiverId)) return;
        if (registeredModels.includes(senderId)) return;

        const modelId = receiverId;
        const userId = senderId;

        // Rate limit check
        const limitKey = `${userId}_${modelId}`;
        if (!userLimits.has(limitKey)) {
            userLimits.set(limitKey, { count: 0, lockedUntil: 0 });
        }
        const limitData = userLimits.get(limitKey);

        if (Date.now() < limitData.lockedUntil) {
            console.log(`User ${userId} locked until ${new Date(limitData.lockedUntil)}. Ignoring.`);
            return;
        }

        limitData.count++;
        console.log(`[DEBUG] ${userId} → ${modelId} : message count ${limitData.count}/15`);

        // Agar limit hit (15 msgs) → goodbye + 2hr lock
        if (limitData.count >= 15) {
            limitData.lockedUntil = Date.now() + 2 * 60 * 60 * 1000;
            limitData.count = 0;
            userLimits.set(limitKey, limitData);

            const goodbyes = [
                "Suno, thoda kaam aa gaya. 2-3 ghante baad baat karti hoon, theek hai? ❤️",
                "Baby main thodi der offline jaa rahi hoon, baad mein milti hoon 😘",
                "Mummy bula rahi hain, pakka baad mein msg karungi 🥺"
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
            console.log(`🔒 ${userId} locked for 2h. Goodbye sent.`);
            return;
        }

        userLimits.set(limitKey, limitData);

        // Chat history cache
        const cacheKey = `${userId}_${modelId}`;
        if (!chatHistoryCache.has(cacheKey)) chatHistoryCache.set(cacheKey, []);
        const history = chatHistoryCache.get(cacheKey);
        history.push({ role: "user", content: messageText });

        // Typing delay + AI call
        const typingDelay = calculateTypingDelay(messageText);
        console.log(`⏳ Typing delay for ${modelId}: ${(typingDelay / 1000).toFixed(1)}s`);
        await new Promise(r => setTimeout(r, typingDelay));

        try {
            const apiMessages = [
                { role: "system", content: getSystemPrompt(modelId) },
                ...history.slice(-10)
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
                    temperature: 0.8,
                    max_tokens: personalityProfiles[getPersonalityForModel(modelId)].maxTokens || 100
                })
            });

            const result = await response.json();
            let aiReply = "";
            if (response.ok && result.choices?.length > 0 && result.choices[0].message) {
                aiReply = result.choices[0].message.content;
            } else {
                aiReply = `[Groq Error]: ${result.error?.message || JSON.stringify(result)}`;
            }

            // Apply feminization safety net
            aiReply = feminizeText(aiReply);
            history.push({ role: "assistant", content: aiReply });

            // Store in Firestore
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
            console.error(`❌ AI Reply failed: ${err.message}`);
        }
    });
});
