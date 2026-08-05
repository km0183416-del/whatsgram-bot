// 1. Dummy HTTP Server - Render.com ki Port Requirement puri karne ke liye
const http = require('http');
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WhatsGram Automation Engine is Running Live 24/7!');
}).listen(PORT, () => {
    console.log(`[Server] Web service is listening on port ${PORT}`);
});

// 2. Firebase Setup (Fixed 'Const' to 'const')
const firebase = require("firebase/compat/app");
require("firebase/compat/firestore");

// Firebase Config
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

// System Caches
const processedMessageIds = new Set();
const processedUserSignups = new Set();
let registeredModels = [];
let isInitialMessagesLoad = true;
let isInitialUsersLoad = true;

// Predefined Welcome Templates for New Users
const welcomeMessages = [
    "Hellow baby",
    "Call me jaan ❤️‍🩹",
    "Hellow kahan ho",
    "Baby call krona",
    "Heyy",
    "Hello jaaan",
    "Aapne abhi join kiya kya? Hi!",
    "Free ho toh baat karein?"
];

// Helper: Random Delay Generator (in milliseconds)
function getRandomDelay(minSeconds, maxSeconds) {
    return Math.floor(Math.random() * (maxSeconds - minSeconds + 1) + minSeconds) * 1000;
}

// Helper: Get Random Item from Array
function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Helper: Format Timestamp
function getTimestamp() {
    return new Date().toLocaleTimeString();
}

console.log(`[${getTimestamp()}] ⚡ Starting WhatsGram Automation Engine v2.0...`);

// 1. Models Sync
db.collection("models").onSnapshot((snapshot) => {
    registeredModels = [];
    snapshot.forEach((doc) => {
        registeredModels.push(doc.id);
    });
    console.log(`[${getTimestamp()}] Active Models Loaded: ${registeredModels.length}`);
}, (err) => {
    console.error(`[${getTimestamp()}] Models Sync Error: ${err.message}`);
});

// 2. New User Signup Listener (5-7 Models Send Natural Delayed Welcome Messages)
db.collection("users").onSnapshot((snapshot) => {
    if (isInitialUsersLoad) {
        snapshot.forEach((doc) => processedUserSignups.add(doc.id));
        isInitialUsersLoad = false;
        console.log(`[${getTimestamp()}] Ignored ${processedUserSignups.size} existing users. Listening for NEW signups...`);
        return;
    }

    snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
            const userId = change.doc.id;
            if (processedUserSignups.has(userId)) return;
            processedUserSignups.add(userId);

            console.log(`[${getTimestamp()}] 🚀 NEW USER SIGNUP DETECTED: ${userId}`);

            if (registeredModels.length === 0) return;

            // Pick 5 to 7 unique random models
            const targetCount = Math.min(Math.floor(Math.random() * 3) + 5, registeredModels.length);
            const shuffledModels = [...registeredModels].sort(() => 0.5 - Math.random());
            const selectedModels = shuffledModels.slice(0, targetCount);

            // Send messages with natural staggered delays
            selectedModels.forEach((modelId, index) => {
                // Base delay increases per model to avoid spamming at once
                const delayMs = getRandomDelay((index * 5) + 3, (index * 8) + 10);
                const msgText = getRandomItem(welcomeMessages);

                setTimeout(async () => {
                    try {
                        await db.collection("messages").add({
                            senderId: String(modelId),
                            receiverId: String(userId),
                            sender: String(modelId),
                            receiver: String(userId),
                            text: msgText,
                            message: msgText,
                            type: "text",
                            read: false,
                            isRead: false,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                            time: Date.now()
                        });
                        console.log(`[${getTimestamp()}] [Welcome Bot] Model (${modelId}) -> User (${userId}): "${msgText}" (Delay: ${delayMs / 1000}s)`);
                    } catch (err) {
                        console.error(`[${getTimestamp()}] Welcome Send Error: ${err.message}`);
                    }
                }, delayMs);
            });
        }
    });
});

// 3. Smart Dynamic Auto-Reply Generator
function generateSmartReply(userMessage) {
    if (!userMessage) return "Aapne kya bheja, mujhe samajh nahi aaya?";

    const text = userMessage.toLowerCase().trim();

    // Location Query Handling
    if (text.includes("kahan se") || text.includes("kaha se") || text.includes("where are you") || text.includes("location") || text.includes("kahan rehte")) {
        const locations = [
            "Main Mumbai se hoon, aap kahan se ho?",
            "Lucknow se hoon main, aap batao?",
            "India se hi hoon re! Aap kidhar rehte ho?",
            "Main Delhi se hoon, aap kahan ke ho?"
        ];
        return getRandomItem(locations);
    }

    // Greetings
    if (text.includes("hi") || text.includes("hello") || text.includes("hey") || text.includes("namaste") || text.includes("hy")) {
        const greetings = [
            "Hello kaise ho?",
            "Hey baby! Kaise ho aap?",
            "Hello jaaan, kya chal raha hai?",
            "Hellow! Aaj badi yaad aayi meri?"
        ];
        return getRandomItem(greetings);
    }

    // Status / Activity Queries
    if (text.includes("kaise ho") || text.includes("kya kar") || text.includes("kya kr") || text.includes("bolona") || text.includes("bolo")) {
        const statusReplies = [
            "Bas aapki hi yaad aa rahi thi. Aap batao?",
            "Free baithi thi, socha aap se baat kar lu.",
            "Aapka hi wait kar rahi thi! Batao na."
        ];
        return getRandomItem(statusReplies);
    }

    // Rates / Wallet
    if (text.includes("price") || text.includes("rate") || text.includes("charge") || text.includes("paisa") || text.includes("recharge")) {
        return "Mera chat aur call rate profile par set hai. Wallet recharge kar lo na pehle!";
    }

    // Calls
    if (text.includes("call") || text.includes("video")) {
        return "Haan main abhi free hoon! Wallet me balance add karke direct video call karo.";
    }

    // Photos / Pics
    if (text.includes("photo") || text.includes("pic") || text.includes("image") || text.includes("dp")) {
        return "Main apni private photo bhejti hoon, pehle wallet recharge karke unlock kar lo!";
    }

    // Fallback
    const fallbacks = [
        "Achaa... aur batao?",
        "Mmm, sahi hai!",
        "Mujhe samajh nahi aaya, thoda saaf bolo na?"
    ];
    return getRandomItem(fallbacks);
}

// 4. Main Chat Automation Engine
db.collection("messages").onSnapshot((snapshot) => {
    if (isInitialMessagesLoad) {
        snapshot.forEach((doc) => processedMessageIds.add(doc.id));
        isInitialMessagesLoad = false;
        console.log(`[${getTimestamp()}] Initialized. Skipped ${processedMessageIds.size} old messages. Ready for live DMs.`);
        return;
    }

    snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
            const msgDoc = change.doc;
            const msgData = msgDoc.data();
            const msgId = msgDoc.id;

            if (processedMessageIds.has(msgId)) return;
            processedMessageIds.add(msgId);

            const senderId = msgData.senderId || msgData.sender || msgData.userId || msgData.from;
            const receiverId = msgData.receiverId || msgData.receiver || msgData.modelId || msgData.to;
            const messageText = msgData.text || msgData.message || msgData.body || "";

            if (!senderId || !receiverId) return;

            // Reply ONLY if sender is a normal user (not a registered model)
            const isSenderAModel = registeredModels.includes(senderId);

            if (!isSenderAModel) {
                console.log(`[${getTimestamp()}] Incoming DM [User: ${senderId}] -> [Model: ${receiverId}]: "${messageText}"`);

                const replyText = generateSmartReply(messageText);
                const naturalDelay = getRandomDelay(3, 8); // 3 to 8 seconds delay

                setTimeout(async () => {
                    try {
                        const replyPayload = {
                            senderId: String(receiverId),
                            receiverId: String(senderId),
                            sender: String(receiverId),
                            receiver: String(senderId),
                            text: replyText,
                            message: replyText,
                            type: "text",
                            read: false,
                            isRead: false,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                            time: Date.now()
                        };

                        if (msgData.chatId) replyPayload.chatId = msgData.chatId;
                        if (msgData.conversationId) replyPayload.conversationId = msgData.conversationId;

                        await db.collection("messages").add(replyPayload);
                        console.log(`[${getTimestamp()}] Auto-Replied [Model: ${receiverId}] -> [User: ${senderId}]: "${replyText}"`);
                    } catch (err) {
                        console.error(`[${getTimestamp()}] Reply Fail: ${err.message}`);
                    }
                }, naturalDelay);
            }
        }
    });
}, (err) => {
    console.error(`[${getTimestamp()}] Engine Error: ${err.message}`);
});
