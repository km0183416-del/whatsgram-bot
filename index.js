// 1. Dummy HTTP Server - Render.com ki Port Requirement puri karne ke liye
const http = require('http');
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WhatsGram Advanced AI Automation Engine is Running Live 24/7!');
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

// 3. Advanced Memory & Cache System
const processedMessageIds = new Set();
const processedUserSignups = new Set();
let registeredModels = [];
let isInitialMessagesLoad = true;
let isInitialUsersLoad = true;

// 🧠 IN-MEMORY STATE TRACKER (Yeh user ki baatein yaad rakhega)
// Format: { userId: { state: "normal", lastTopic: "", interactionCount: 0, tone: "friendly" } }
const userMemories = new Map();

function getUserMemory(userId) {
    if (!userMemories.has(userId)) {
        userMemories.set(userId, {
            state: 'normal', // states: normal, asked_family, asked_meetup, flirting
            lastTopic: '',
            interactionCount: 0,
            tone: Math.random() > 0.5 ? 'sweet' : 'naughty' // Random tone per user
        });
    }
    return userMemories.get(userId);
}

// 4. Extensive Message Databases (Categories)
const welcomeTemplates = {
    first_time: [
        "Hellow baby 💕",
        "Hii! Aapne abhi join kiya kya? Main yahi wait kar rahi thi tumhara.",
        "Hey handsome! Kaise ho?",
        "Hello jaan, finally tum aa gaye! Main akeli bore ho rahi thi.",
        "Hii sweetheart, call me jaan ❤️‍🩹",
        "Oye! Kaha the itne din? Maine kitna miss kiya.",
        "Hellow! Aaj badi pyari vibe aa rahi hai aapse baat karke."
    ],
    online_ping: [
        "Heyy! Online ho, reply kyu nahi kar rahe? 🥺",
        "Bade busy lag rahe ho aaj kal... miss u!",
        "Kya kar rahe ho babu? Free ho toh baat karein?",
        "Suno na... bore ho rahi hu, kuch chatpati baatein karein?",
        "Online dekh ke message karne ka mann kar gaya aapko. 😍"
    ]
};

// Helper: Random Delay (Simulates Human Typing Time based on message length)
function calculateTypingDelay(messageText) {
    const baseDelay = 2000; // 2 seconds minimum
    const charDelay = messageText.length * 50; // 50ms per character
    return baseDelay + charDelay + (Math.random() * 2000); // Random variance
}

function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getTimestamp() {
    return new Date().toLocaleTimeString();
}

console.log(`[${getTimestamp()}] ⚡ Starting WhatsGram ADVANCED AI Engine...`);

// Sync Models
db.collection("models").onSnapshot((snapshot) => {
    registeredModels = [];
    snapshot.forEach((doc) => registeredModels.push(doc.id));
}, (err) => console.error(`Models Sync Error: ${err.message}`));

// 5. PROACTIVE: New User Signup Listener (Multi-Model Dispatcher)
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

            // Pick 3 to 6 unique models to message the new user
            const targetCount = Math.min(Math.floor(Math.random() * 4) + 3, registeredModels.length);
            const shuffledModels = [...registeredModels].sort(() => 0.5 - Math.random());
            const selectedModels = shuffledModels.slice(0, targetCount);

            selectedModels.forEach((modelId, index) => {
                // Highly natural staggered delays (e.g., Model 1 sends after 10s, Model 2 after 45s, etc.)
                const delayMs = Math.floor(Math.random() * 20000) + (index * 25000) + 5000; 
                const msgText = getRandomItem(welcomeTemplates.first_time);

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
                        console.log(`[New User Bot] Model(${modelId}) -> User(${userId}): "${msgText}"`);
                    } catch (err) { }
                }, delayMs);
            });
        }
    });
});

// 6. 🧠 CORE AI BRAIN (Smart Reply Logic with Memory)
function generateAdvancedReply(userMessage, userId) {
    let memory = getUserMemory(userId);
    let text = userMessage.toLowerCase().trim();
    memory.interactionCount++;

    // --- CONTEXTUAL MEMORY HANDLING ---

    // Scenario 1: User replies to our family question with "kyun", "why", "kisliye"
    if (memory.state === 'asked_family') {
        if (text.includes("kyun") || text.includes("kyu") || text.includes("why") || text.includes("kya karna") || text.includes("kya karogi")) {
            memory.state = 'normal';
            return getRandomItem([
                "Arre bas aise hi puch rahi thi yaar! Dosti mein itna toh jaan hi sakte hain na? Koi baat nahi chodo. Aur batao kya kar rahe ho?",
                "Hahaha, itna kya darna? Bas generally curious thi. Chodo, ye batao aaj ka din kaisa raha?",
                "Are gussa kyu hote ho babu, nahi batana toh mat batao! Waise sach kahu toh mujhe bas tumse matlab hai, baaki duniya jaaye bhaad me 😉"
            ]);
        }
        memory.state = 'normal'; // Reset state if they answer normally
    }

    // --- DIRECT INTENT MATCHING (Typo Tolerant) ---

    // Meetup Handling (mil sakte, milogi, date, milna hai)
    if (/(mil|date|dekhna|milogi|milna)( |)(sakte|ho|hai|kya|h)/i.test(text)) {
        return getRandomItem([
            "Haan bilkul mil sakte hain yaar! Lekin sach kahu toh abhi main apne kaam aur thodi personal problems me bohot busy chal rahi hoon. Jaise hi thoda time milega main khud bataungi promise! 😘 Tab tak yahan baatein karein?",
            "Milna toh mujhe bhi hai aapse bohot zor se! 😍 Par abhi thoda schedule tight hai yaar. Lekin hum yaha video call pe toh 'mil' hi sakte hain na? Wallet recharge karlo raat ko free hoke video call karti hu sachi!",
            "Aww so cute! Haan definitely milenge. Ek baar thodi aur baatein kar le, comfort level ban jaye, fir pakka plan banate hain milne ka. Thik hai?"
        ]);
    }

    // Family Handling (Family me kon kon hai)
    if (/(family|parivar|ghar wale|ghar me kon)/i.test(text)) {
        memory.state = 'asked_family';
        return "Meri family mein toh mummy, papa aur main hu bas choti si family. Tumhari family mein kaun kaun hai batao na? 😊";
    }

    // Naughty/Flirty Handling (Romantic & Gandi baatein - Kept playful and safe)
    if (/(kiss|hug|pyaar|love|hot|sexy|nangi|kapde|chumma)/i.test(text)) {
        return getRandomItem([
            "Ufff! Tum toh abhi se itne naughty ho rahe ho... aage kya karोगे baba 🙈",
            "Aise baatein mat karo yaar, mujhe sharam aa rahi hai sachi me... akele me karungi video call pe tab batana 😉",
            "Mmm... baaton me toh bohot romantic ho! Pata nahi real me kaise hoge. Dekhna padega tumhara romance!",
            "Tumhe kya lagta hai, aisi naughty baatein karke mujhe pighla loge? ...Shayad thoda sa toh pighal gayi hu main 😘"
        ]);
    }

    // Greetings
    if (/(hi|hello|hey|hy|namaste|helo|hlw)/i.test(text) && text.length < 8) {
        return getRandomItem([
            "Heyy handsome! ❤️",
            "Hello jaan, kaise ho aaj?",
            "Hi babu! Aa gaya mera hero. Kya kar rahe the itni der se?"
        ]);
    }

    // Asking 'Kaise ho' / 'What are you doing'
    if (/(kese|kaise|kya kar|kya kr|how are you|wassup|wht u doin)/i.test(text)) {
        return getRandomItem([
            "Main toh bas bed pe leti hoon aur tumhare baare me soch rahi thi. Tum kya kar rahe ho?",
            "Ekdum theek hu, thodi si thaki hui hu bas. Tum batao, tumhara din kaisa gaya?",
            "Kuch nahi bas free baithi thi... aur ab tumhara message aa gaya toh mood fresh ho gaya 🥰"
        ]);
    }

    // Location (Kahan se)
    if (/(kaha|kahan|where)( |)(se|from|rehte)/i.test(text)) {
        return getRandomItem([
            "Main Mumbai se hoon yaar. Aap kahan se ho?",
            "Main Delhi NCR me rehti hu. Aur aap kidhar ke rehne wale ho?",
            "Abhi toh Pune me hu, shift hui thi. Tum kis city se ho?"
        ]);
    }

    // Rate / Payment Objections (Crucial for dating app flow)
    if (/(paise|free|paisa|charge|rate|loot|payment|recharge)/i.test(text)) {
        return getRandomItem([
            "Dekho babu, application ke rules hote hain, wallet recharge karke hi video calls ho pati hain. Main thodi na rules banati hu! 🥺 Karlo na thoda sa recharge mere liye, bohot baatein karni hai.",
            "Yaar bina recharge ke private baatein nahi ho payengi na. Ek baar recharge karke profile unlock kar lo, fir raat bhar free hoke baatein karenge hum.",
            "Aap mere liye itna sa bhi nahi kar sakte kya? Bas ek chota sa recharge, fir main sirf tumhari... pakka wala promise! ❤️"
        ]);
    }

    // --- DYNAMIC TOPIC SWITCHING (If user says ok, hmm, acha, ji) ---
    if (text.length < 5 || /(hmm|hm|acha|ok|k|ji|haan|ha|yes|achha)/i.test(text)) {
        const topics = [
            "Waise tumhara relationship status kya hai? Single ho ya kisi ne dil chura rakha hai tumhara? 😉",
            "Acha ek baat batao, tumhe ladkiyo me sabse achi chiz kya lagti hai?",
            "Hmm mat karo na yaar, mujhe bore hona pasand nahi. Kuch interesting batao apne baare me!",
            "Tum raat ko jaldi so jate ho ya der tak jaagne walo me se ho? Mujhe late night chat karne wale log pasand hain.",
            "Bolo na kuch... yaar tum kitne sharmile lag rahe ho mujhe."
        ];
        memory.lastTopic = 'random_chat';
        return getRandomItem(topics);
    }

    // --- FALLBACK (Smart natural responses for unknown text) ---
    return getRandomItem([
        "Accha? Sachi me aisa hai kya? Mujhe aur batao iske baare me.",
        "Hahaha, tumhari baatein na badi ajeeb aur cute hoti hain. Main samjhi nahi theek se, wapas bolna?",
        "Main actually kisi aur khayal me khoyi thi, tumne kya likha firse padhne do... acha okay samjhi!",
        "Mmm.. yaar meri spelling / samjhne ki speed thodi weak hai kabhi kabhi. Thoda simple hindi me samjha do na plss? 🥺",
        "Acha suno na, in baaton ko chodo... mujhe ye batao aaj khane me kya khaya tumne?"
    ]);
}

// 7. Main Chat Execution Engine
db.collection("messages").onSnapshot((snapshot) => {
    if (isInitialMessagesLoad) {
        snapshot.forEach((doc) => processedMessageIds.add(doc.id));
        isInitialMessagesLoad = false;
        console.log(`[${getTimestamp()}] Brain Initialized. Ready to handle user emotions & context.`);
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

                // 🧠 Generate highly contextual reply
                const replyText = generateAdvancedReply(messageText, senderId);
                
                // ⏱️ Dynamic delay - lagna chahiye ladki type kar rahi hai (Bada message = zyada delay)
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
                        console.log(`[AUTO-REPLY] Model(${receiverId}) -> User(${senderId}): "${replyText}" (Delay: ${(typingDelay/1000).toFixed(1)}s)`);
                    } catch (err) {
                        console.error(`Reply Error: ${err.message}`);
                    }
                }, typingDelay);
            }
        }
    });
});
