// 1. Dummy HTTP Server - Render.com ki Port Requirement ke liye
const http = require('http');
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WhatsGram Smart AI Engine is Running Live 24/7!');
}).listen(PORT, () => {
    console.log(`[Server] Web service listening on port ${PORT}`);
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

// System Caches & Memory
const processedMessageIds = new Set();
const processedUserSignups = new Set();
const userStateMemory = {}; // Remembers conversation context
const proactiveMemory = {}; // Prevents spamming online users
let registeredModels = [];
let isInitialMessagesLoad = true;
let isInitialUsersLoad = true;

// Message Categories for Natural Feel
const welcomeMessages = [
    "Hellow baby ❤️",
    "Call me jaan ❤️‍🩹",
    "Heyy kahan ho?",
    "Baby call krona mujhe",
    "Hello jaaan, abhi free ho?",
    "Hiiii... baat karein?",
    "Kaisi chal rahi hai life? 😊",
    "Mujhe lagta hai hume baat karni chahiye 😉"
];

const proactiveHooks = [
    "Hey, online dekha toh socha message kar lu 😊",
    "Miss kar rahi thi tumhe... kya kar rahe ho?",
    "Hi baby, free ho kya abhi?",
    "Akele akele kya kar rahe ho phone me? 😉",
    "Yaad nahi aati kya meri aajkal?"
];

// Helpers
function getRandomDelay(minSeconds, maxSeconds) {
    return Math.floor(Math.random() * (maxSeconds - minSeconds + 1) + minSeconds) * 1000;
}

function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getTimestamp() {
    return new Date().toLocaleTimeString();
}

console.log(`[${getTimestamp()}] ⚡ Starting WhatsGram Smart AI Engine v3.0...`);

// 1. Models Sync
db.collection("models").onSnapshot((snapshot) => {
    registeredModels = [];
    snapshot.forEach((doc) => registeredModels.push(doc.id));
    console.log(`[${getTimestamp()}] Active Models Loaded: ${registeredModels.length}`);
});

// 2. User Listener (Signups & Online Status Hook)
db.collection("users").onSnapshot((snapshot) => {
    if (isInitialUsersLoad) {
        snapshot.forEach((doc) => processedUserSignups.add(doc.id));
        isInitialUsersLoad = false;
        console.log(`[${getTimestamp()}] Ignored existing users. Ready for NEW signups & hooks.`);
        return;
    }

    snapshot.docChanges().forEach((change) => {
        const userId = change.doc.id;
        const userData = change.doc.data();

        // A. NEW USER SIGNUP LOGIC
        if (change.type === "added") {
            if (processedUserSignups.has(userId)) return;
            processedUserSignups.add(userId);

            console.log(`[${getTimestamp()}] 🚀 NEW SIGNUP: ${userId}`);
            if (registeredModels.length === 0) return;

            // Send messages from 4-7 models with large natural gaps (15 sec to 2.5 mins apart)
            const targetCount = Math.min(Math.floor(Math.random() * 4) + 4, registeredModels.length);
            const shuffledModels = [...registeredModels].sort(() => 0.5 - Math.random());
            const selectedModels = shuffledModels.slice(0, targetCount);

            selectedModels.forEach((modelId, index) => {
                // Gap gradually increases: 10s, 35s, 60s, 110s etc.
                const delayMs = getRandomDelay((index * 25) + 10, (index * 40) + 20); 
                const msgText = getRandomItem(welcomeMessages);

                setTimeout(() => sendSystemMessage(modelId, userId, msgText), delayMs);
            });
        }

        // B. PROACTIVE ONLINE USER HOOK (If user becomes active/online)
        if (change.type === "modified") {
            const now = Date.now();
            const lastHookTime = proactiveMemory[userId] || 0;
            
            // Only send a hook if we haven't poked them in the last 60 minutes
            if (now - lastHookTime > 60 * 60 * 1000) {
                if (registeredModels.length > 0) {
                    // Give a 30% random chance to actually send the message so it doesn't look purely robotic
                    if (Math.random() > 0.7) { 
                        proactiveMemory[userId] = now;
                        const randomModel = getRandomItem(registeredModels);
                        const msgText = getRandomItem(proactiveHooks);
                        const delayMs = getRandomDelay(5, 15);
                        console.log(`[${getTimestamp()}] 🎣 Proactive Hook triggered for Online User ${userId}`);
                        setTimeout(() => sendSystemMessage(randomModel, userId, msgText), delayMs);
                    }
                }
            }
        }
    });
});

// Helper to send messages easily
async function sendSystemMessage(senderId, receiverId, text) {
    try {
        await db.collection("messages").add({
            senderId: String(senderId),
            receiverId: String(receiverId),
            sender: String(senderId),
            receiver: String(receiverId),
            text: text,
            message: text,
            type: "text",
            read: false,
            isRead: false,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            time: Date.now()
        });
        console.log(`[${getTimestamp()}] 🤖 Sent: Model(${senderId}) -> User(${receiverId}): "${text}"`);
    } catch (err) {
        console.error(`[${getTimestamp()}] Message Send Error: ${err.message}`);
    }
}

// 3. Ultra-Smart Context-Aware Reply Generator
function generateSmartReply(userMessage, userId, modelId) {
    if (!userMessage) return "Mmm?";

    const text = userMessage.toLowerCase().trim();
    const memoryKey = `${userId}_${modelId}`;
    
    // Create memory state if not exists
    if (!userStateMemory[memoryKey]) {
        userStateMemory[memoryKey] = { topic: null };
    }
    const state = userStateMemory[memoryKey];

    // --- CONTEXT AWARE (MEMORY) HANDLERS ---
    
    // If we previously asked about family
    if (state.topic === 'asked_family') {
        if (text.match(/kyu|kyun|q|kisliye|why|kya hua/)) {
            userStateMemory[memoryKey].topic = null; // Clear context
            return getRandomItem([
                "Are bas aise hi puch rahi thi yaar, koi baat nahi 😊",
                "Kuch nahi, bas tumhare baare me thoda aur janna chahti thi ❤️",
                "Aise hi yaar, casual baat kar rahi thi. Chhodo, aur batao kya chal raha hai?"
            ]);
        } else {
            userStateMemory[memoryKey].topic = null; // Clear context if they replied normally
            return getRandomItem(["Achha, nice!", "Ohh chalo badhiya hai 😊", "Sahi hai. Aur batao baby?"]);
        }
    }


    // --- REGEX BASED INTELLIGENT MATCHING (Handles Bad Spelling) ---

    // 1. Meeting / Dating
    if (text.match(/mil(na|ne|sakte|skte|egi)|meet|date|dekhna/)) {
        return getRandomItem([
            "Haan bilkul mil sakte hain! Lekin abhi thoda busy chal rahi hoon, time milega toh pakka bataungi ❤️",
            "Milna toh mujhe bhi hai yaar... thoda free ho jau fir plan karte hain na? 😘",
            "Abhi toh schedule thoda tight hai baby, par jaldi hi milenge. Tab tak yahi baat karte hain?"
        ]);
    }

    // 2. Family Discussions
    if (text.match(/family|parivar|ghar me|mummy|papa/)) {
        userStateMemory[memoryKey].topic = 'asked_family'; // Save state
        return getRandomItem([
            "Ghar par sab theek? Waise tumhari family me kon kon hai?",
            "Achaa... meri toh family me sab mast hain. Tumhari family me kaun kaun hai baby?"
        ]);
    }

    // 3. Status Queries (Kese ho, kya kar rahe)
    if (text.match(/k[ae]is[ei]|hw r|how are|kya haal/)) {
        return getRandomItem([
            "Main ekdam theek hoon baby, tum batao?",
            "Bas tumhari yaad aa rahi thi 😘 Tum kaise ho?",
            "Mast hoon! Tum batao kya chal raha hai aajkal?"
        ]);
    }

    // 4. Activity Queries (Kya kar rahi)
    if (text.match(/kya kar|kya kr|wt r u|doing/)) {
        return getRandomItem([
            "Kuch nahi bas bed par leti thi, aur tumse baat kar rahi hoon 😉",
            "Free baithi thi yaar, socha thoda time pass kar lu. Tum kya kar rahe ho?",
            "Music sun rahi thi aur chat kar rahi hoon. Tumhara kya scene hai abhi?"
        ]);
    }

    // 5. Locations (Kahan se ho)
    if (text.match(/kahan|kaha|where|kidhar|from/)) {
        return getRandomItem([
            "Main Mumbai se hoon yaar, tum kahan se ho?",
            "Waise toh Delhi se hoon. Tumhara shehar kaunsa hai?",
            "India se hi hoon baby! Tum batao kahan rehte ho?"
        ]);
    }

    // 6. Needs Payment / Wallet Calls
    if (text.match(/call|video|vc|number|numbr|nmbr|phone/)) {
        return getRandomItem([
            "Haan main abhi free hoon! Wallet me balance add karke direct video call lagao mujhe 😘",
            "Call par baat karni hai? Toh profile pe jao aur recharge karke call karo na baby ❤️",
            "Number toh nahi de sakti, par tum yahan mujhe seedha video call kar sakte ho!"
        ]);
    }

    // 7. Photos / Nudes / Pics
    if (text.match(/photo|pic|dp|image|nude|dekho|dikhai/)) {
        return "Main apni private photo bhejti hoon, pehle thoda wallet recharge karke unlock kar lo na baby 😉";
    }

    // 8. Basic Greetings (Hi, Hello, Hey)
    if (text.match(/h[ei]y+|h[ea]ll?o|h[a-z]*i|namaste/)) {
        return getRandomItem([
            "Hii baby ❤️",
            "Hello jaan! Kaisi ho?",
            "Heyyy 😉",
            "Arey waah, aaj meri yaad aayi?"
        ]);
    }

    // 9. Love / Flirting
    if (text.match(/love|pyaar|miss|kiss|jaan|babu/)) {
        return getRandomItem([
            "Aww so sweet ❤️ Mujhe bhi tum bohot acche lagte ho.",
            "Sach me? Phir call kyun nahi karte mujhe? 😘",
            "Hehe love you too baby ❤️‍🩹"
        ]);
    }

    // 10. Fallback (If nothing matches, give natural engaging replies)
    const fallbacks = [
        "Achaa... aur batao baby?",
        "Mmm, sahi hai ❤️",
        "Mujhe samajh nahi aaya theek se, thoda saaf saaf bolo na?",
        "Hehe you are so cute 😂",
        "Hain? Kya matlab?",
        "Hmm, main bhi yahi soch rahi thi."
    ];
    
    userStateMemory[memoryKey].topic = null; // Reset context
    return getRandomItem(fallbacks);
}

// 4. Main Chat Automation Engine
db.collection("messages").onSnapshot((snapshot) => {
    if (isInitialMessagesLoad) {
        snapshot.forEach((doc) => processedMessageIds.add(doc.id));
        isInitialMessagesLoad = false;
        console.log(`[${getTimestamp()}] Chat Engine Ready. Listening for Live DMs...`);
        return;
    }

    snapshot.docChanges().forEach((change) => {
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

            const isSenderAModel = registeredModels.includes(senderId);

            // ONLY REPLY IF A NORMAL USER MESSAGES A MODEL
            if (!isSenderAModel) {
                console.log(`[${getTimestamp()}] 📩 DM [User: ${senderId}] -> [Model: ${receiverId}]: "${messageText}"`);

                const replyText = generateSmartReply(messageText, senderId, receiverId);
                
                // Natural delay between 3 to 10 seconds before replying
                const naturalDelay = getRandomDelay(3, 10); 

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
                        console.log(`[${getTimestamp()}] 💬 Replied [Model: ${receiverId}] -> [User: ${senderId}]: "${replyText}"`);
                    } catch (err) {
                        console.error(`[${getTimestamp()}] Reply Fail: ${err.message}`);
                    }
                }, naturalDelay);
            }
        }
    });
});
