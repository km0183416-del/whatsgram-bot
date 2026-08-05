// ================== WHATSGRAM AUTOMATION ENGINE v3.0 (MEGA SMART) ==================
// Ye server 24/7 chalega, natural lover-bot ki tarah baatein karega.
// Memory, context, romantic + thodi naughty + jokes, spelling mistakes handle,
// naye users ko model welcome, online users ko ice-breaker, smart topic shifting.
// Sab kuch real-world logic ke saath, ekdum pro. ❤️

const http = require('http');
const firebase = require("firebase/compat/app");
require("firebase/compat/firestore");

// Dummy HTTP Server (Render port requirement)
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WhatsGram Automation Engine is Running Live 24/7!');
}).listen(PORT, () => {
    console.log(`[Server] Web service is listening on port ${PORT}`);
});

// Firebase config
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

// Global caches
const processedMessageIds = new Set();
const processedUserSignups = new Set();
const onlineWelcomedUsers = new Set(); // jinko online aane par welcome message bhej diya
let registeredModels = [];
let isInitialMessagesLoad = true;
let isInitialUsersLoad = true;

// ---------- MESSAGE TEMPLATES ----------
const welcomeTemplates = [
    "Hellow baby",
    "Call me jaan ❤️‍🩹",
    "Hellow kahan ho",
    "Baby call krona",
    "Heyy",
    "Hello jaaan",
    "Aapne abhi join kiya kya? Hi!",
    "Free ho toh baat karein?",
    "Aaj bahut din baad koi special aaya 😘",
    "Hey handsome, welcome to my world 💋"
];

const onlineFirstMessages = [
    "Heyy! How are you?",
    "Hello there 😊 kya haal hai?",
    "Arey aap online aaye, bohot din baad!",
    "Hi baby, aaj raat kya plan hai?",
    "Aapko dekh ke dil garden garden ho gaya 🌸",
    "Hello jaan, kaise ho aap?",
    "Oye hoye, koi mil gaya online 😎"
];

// ---------- HELPER FUNCTIONS ----------
function getRandomDelay(minSec, maxSec) {
    return Math.floor(Math.random() * (maxSec - minSec + 1) + minSec) * 1000;
}

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getTimestamp() {
    return new Date().toLocaleTimeString();
}

// Spelling & informal text normalizer
function normalizeText(text) {
    if (!text) return "";
    let t = text.toLowerCase().trim();
    // Remove excessive repeating characters (e.g., "helloooo" -> "hello")
    t = t.replace(/(.)\1{2,}/g, "$1$1");
    // Common spellings
    t = t.replace(/kaise/g, "kaise");
    t = t.replace(/kese/g, "kaise");
    t = t.replace(/kya/g, "kya");
    t = t.replace(/kyaa/g, "kya");
    t = t.replace(/kyaaaa/g, "kya");
    t = t.replace(/heyy+/g, "hey");
    t = t.replace(/helloo+/g, "hello");
    t = t.replace(/babyyy+/g, "baby");
    t = t.replace(/janu+/g, "jaan");
    t = t.replace(/lovee+/g, "love");
    t = t.replace(/miss u/gi, "miss you");
    t = t.replace(/kese ho/g, "kaise ho");
    t = t.replace(/kmse ho/g, "kaise ho");
    return t;
}

// ---------- CONVERSATION MEMORY MANAGEMENT ----------
// Firestore me har conversation ka context store hoga: "conversationContexts/{userId}_{modelId}"
async function getContext(userId, modelId) {
    const docId = `${userId}_${modelId}`;
    const doc = await db.collection("conversationContexts").doc(docId).get();
    if (doc.exists) {
        return doc.data();
    }
    // default context
    return {
        lastTopic: null,
        lastAskedFamily: false,
        lastAskedMeeting: false,
        lastAskedPersonal: null, // 'age', 'location', etc.
        romanticLevel: 1, // 1-3 (1: light, 3: deep)
        jokeCount: 0,
        messageCount: 0,
        lastModelReply: null
    };
}

async function updateContext(userId, modelId, updates) {
    const docId = `${userId}_${modelId}`;
    await db.collection("conversationContexts").doc(docId).set(updates, { merge: true });
}

// Fetch last N messages for a pair (user <-> model)
async function getLastMessages(userId, modelId, limit = 5) {
    const msgs = [];
    const snap1 = await db.collection("messages")
        .where("senderId", "==", userId)
        .where("receiverId", "==", modelId)
        .orderBy("time", "desc")
        .limit(limit)
        .get();
    const snap2 = await db.collection("messages")
        .where("senderId", "==", modelId)
        .where("receiverId", "==", userId)
        .orderBy("time", "desc")
        .limit(limit)
        .get();
    snap1.forEach(doc => msgs.push(doc.data()));
    snap2.forEach(doc => msgs.push(doc.data()));
    msgs.sort((a, b) => (a.time || 0) - (b.time || 0));
    return msgs.slice(-limit);
}

// ---------- SMART REPLY GENERATOR (with context & memory) ----------
async function generateSmartReply(userId, modelId, messageText, context) {
    const normalized = normalizeText(messageText);
    const lastMsgs = await getLastMessages(userId, modelId, 5);
    const lastBotMsg = context.lastModelReply || "";
    const lowerLast = lastBotMsg.toLowerCase();

    // Increment counters
    context.messageCount = (context.messageCount || 0) + 1;

    // ---- Family Topic ----
    if (normalized.includes("family") || normalized.includes("ghar") || normalized.includes("maa") || normalized.includes("papa")) {
        if (context.lastAskedFamily) {
            // User is talking about family, show interest
            const replies = [
                "Oh aapki family ke baare mein sunke acha laga ❤️, aap unke saath rehte ho?",
                "Family important hoti hai, aap unke liye kya karte ho?",
                "Aap apni family mein sabse zyada kiske kareeb ho?"
            ];
            return { reply: getRandomItem(replies), updateCtx: { lastTopic: "family" } };
        } else {
            // Ask about family
            context.lastAskedFamily = true;
            return { reply: "Aapke ghar mein kaun kaun hai? 😊", updateCtx: { lastTopic: "family", lastAskedFamily: true } };
        }
    }

    // User ne "kyun?" poochha after we asked family (context lastAskedFamily true and we asked)
    if ((normalized.includes("kyu") || normalized.includes("why")) && context.lastAskedFamily && lowerLast.includes("ghar")) {
        return { reply: "Arey bas aise hi puchh rahi thi, waise aap batao na.. aap family ke saath kitne close ho? 😊", updateCtx: { lastTopic: "family", lastAskedFamily: true } };
    }

    // ---- Meeting Request ----
    if (normalized.includes("mil sakte") || normalized.includes("meet") || normalized.includes("milna") || normalized.includes("milenge")) {
        context.lastAskedMeeting = true;
        const replies = [
            "Haan bilkul mil sakte hain, lekin abhi thoda busy hoon. Time milega toh zaroor bataungi 💋",
            "Tumse milkar acha lagega, bas abhi kaam hai thoda. Baad mein plan karte hain 😉"
        ];
        return { reply: getRandomItem(replies), updateCtx: { lastTopic: "meeting", lastAskedMeeting: true } };
    }

    // ---- Greetings ----
    if (normalized.includes("hi") || normalized.includes("hello") || normalized.includes("hey") || normalized.includes("hy") || normalized.includes("hlo")) {
        const greetings = [
            "Hello kaise ho?",
            "Hey baby! Kaise ho aap?",
            "Hello jaan, kya chal raha hai?",
            "Hellow! Aaj badi yaad aayi meri?"
        ];
        return { reply: getRandomItem(greetings), updateCtx: { lastTopic: "greeting" } };
    }

    // ---- Status/Activity ----
    if (normalized.includes("kaise ho") || normalized.includes("kya kar") || normalized.includes("kya kr") || normalized.includes("bolo") || normalized.includes("bolna")) {
        const statusReplies = [
            "Bas aapki hi yaad aa rahi thi. Aap batao?",
            "Free baithi thi, socha aap se baat kar lu.",
            "Aapka hi wait kar rahi thi! Batao na."
        ];
        return { reply: getRandomItem(statusReplies), updateCtx: { lastTopic: "status" } };
    }

    // ---- Romantic / Love expressions ----
    if (normalized.includes("love") || normalized.includes("pyar") || normalized.includes("i like you") || normalized.includes("crush")) {
        context.romanticLevel = Math.min((context.romanticLevel || 1) + 1, 3);
        const loveReplies = [
            "Aww! Mujhe bhi tumse pyar ho raha hai 💕",
            "Tumhari baatein sunke dil khush ho gaya 😘",
            "Main bhi tumhe like karti hoon, lekin dheere dheere 💋"
        ];
        return { reply: getRandomItem(loveReplies), updateCtx: { lastTopic: "romance", romanticLevel: context.romanticLevel } };
    }

    // ---- Naughty talk (medium romantic level ya keywords) ----
    if (context.romanticLevel >= 2 || normalized.includes("sexy") || normalized.includes("hot") || normalized.includes("bed") || normalized.includes("masti")) {
        const naughtyReplies = [
            "Tumhari baaton se thoda blush ho raha hai 😳",
            "Aaj raat sapne mein zaroor aaogi tum 😈",
            "Itni jaldi kya hai, thoda aur romantic ho jaaye pehle? 😘",
            "Main thodi sharma gayi... aap bade naughty ho! 🙈"
        ];
        return { reply: getRandomItem(naughtyReplies), updateCtx: { lastTopic: "naughty", romanticLevel: context.romanticLevel } };
    }

    // ---- Jokes/Chill ----
    if (normalized.includes("joke") || normalized.includes("funny") || normalized.includes("hansi") || context.jokeCount < 1) {
        context.jokeCount = (context.jokeCount || 0) + 1;
        const jokes = [
            "Ek baar ek programmer ne apni girlfriend se kaha: I love you 1024 times. Girlfriend boli, 'Kitna over-flow kar raha hai!' 😂",
            "Tumhari smile dekhkar mera dil 5G speed se dhadakne lagta hai 😆",
            "Ek din ek chidiya ne doosri chidiya se kaha: 'Chal na, aaj thodi masti karte hain.' Phir dono ne milkar Twitter join kiya 😅"
        ];
        return { reply: getRandomItem(jokes), updateCtx: { lastTopic: "jokes", jokeCount: context.jokeCount } };
    }

    // ---- Deep/personal questions ----
    if (normalized.includes("kya sapna") || normalized.includes("aim") || normalized.includes("future") || normalized.includes("zindagi")) {
        const deepReplies = [
            "Maine toh bas ek simple zindagi chahi, lekin aapke saath. Tumhara kya dream hai?",
            "Future ki tension mat lo, jo hona hoga accha hoga. Abhi aapke saath waqt bitana best hai 💫"
        ];
        return { reply: getRandomItem(deepReplies), updateCtx: { lastTopic: "deep" } };
    }

    // ---- Rate/Recharge/Wallet ----
    if (normalized.includes("price") || normalized.includes("rate") || normalized.includes("charge") || normalized.includes("paisa") || normalized.includes("recharge")) {
        return { reply: "Mera chat aur call rate profile par set hai. Wallet recharge kar lo na pehle!", updateCtx: { lastTopic: "wallet" } };
    }

    // ---- Calls/Video ----
    if (normalized.includes("call") || normalized.includes("video")) {
        return { reply: "Haan main abhi free hoon! Wallet me balance add karke direct video call karo.", updateCtx: { lastTopic: "call" } };
    }

    // ---- Pics/Photos ----
    if (normalized.includes("photo") || normalized.includes("pic") || normalized.includes("image") || normalized.includes("dp")) {
        return { reply: "Main apni private photo bhejti hoon, pehle wallet recharge karke unlock kar lo!", updateCtx: { lastTopic: "photo" } };
    }

    // ---- Short/disinterested reply (length < 5) -> try to spark conversation ----
    if (messageText.length < 5 || normalized === "hmm" || normalized === "ok" || normalized === "accha") {
        const spark = [
            "Kya hua? Aaj mood off lag raha hai?",
            "Chalo accha, toh aap batao aapki favourite movie kaunsi hai?",
            "Aap itna chup kyun hain? Aur kuch baat karein?",
            "Toh main ek sawaal poochhu? Aapko romantic walks pasand hain?"
        ];
        return { reply: getRandomItem(spark), updateCtx: { lastTopic: "spark" } };
    }

    // ---- Location query ----
    if (normalized.includes("kahan se") || normalized.includes("location") || normalized.includes("rehte")) {
        const locReplies = [
            "Main Mumbai se hoon, aap kahan se ho?",
            "Lucknow se hoon main, aap batao?",
            "India se hi hoon re! Aap kidhar rehte ho?",
            "Main Delhi se hoon, aap kahan ke ho?"
        ];
        return { reply: getRandomItem(locReplies), updateCtx: { lastTopic: "location" } };
    }

    // ---- Fallback (general interest, romantic touch) ----
    const fallbacks = [
        "Hmm, aapki baaton mein kuch alag baat hai... aur batao na?",
        "Aapke saath baat karke maza aata hai. Kya plan hai aaj ka?",
        "Mujhe aapke thoughts sunna bahut pasand hai. Kuch aur share karo ❤️",
        "Aaj mausam thoda romantic hai... baarish ho rahi hai yahan. Tumhara favourite weather kya hai?",
        "Sach kahu toh aapki aawaz sunne ka mann kar raha hai... call karoge? 😘"
    ];
    return { reply: getRandomItem(fallbacks), updateCtx: { lastTopic: "fallback" } };
}

// ---------- SEND MESSAGE HELPER ----------
async function sendMessage(fromId, toId, text, extraFields = {}) {
    const payload = {
        senderId: String(fromId),
        receiverId: String(toId),
        sender: String(fromId),
        receiver: String(toId),
        text: text,
        message: text,
        type: "text",
        read: false,
        isRead: false,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        time: Date.now(),
        ...extraFields
    };
    await db.collection("messages").add(payload);
}

// ---------- ONLINE PRESENCE WATCHER (naye login par ice-breaker) ----------
db.collection("users").onSnapshot((snapshot) => {
    snapshot.docChanges().forEach(change => {
        if (change.type === "modified") {
            const userDoc = change.doc;
            const userData = userDoc.data();
            const userId = userDoc.id;
            // Assume field "isOnline" true means abhi online aaya
            if (userData.isOnline === true && !onlineWelcomedUsers.has(userId)) {
                onlineWelcomedUsers.add(userId);
                // Chhota delay taaki thoda natural lage
                setTimeout(async () => {
                    if (registeredModels.length === 0) return;
                    const randomModel = getRandomItem(registeredModels);
                    const msg = getRandomItem(onlineFirstMessages);
                    try {
                        await sendMessage(randomModel, userId, msg);
                        console.log(`[${getTimestamp()}] Online welcome: Model (${randomModel}) -> User (${userId}): "${msg}"`);
                        // 5 min baad online welcome flag clear kar do (takki fir se online aaye toh message jaaye)
                        setTimeout(() => onlineWelcomedUsers.delete(userId), 300000);
                    } catch (err) {
                        console.error(`Online welcome error: ${err.message}`);
                    }
                }, getRandomDelay(3, 6));
            }
        }
    });
}, err => console.error("Online watcher error:", err));

// ---------- MODELS SYNC ----------
db.collection("models").onSnapshot((snapshot) => {
    registeredModels = [];
    snapshot.forEach(doc => registeredModels.push(doc.id));
    console.log(`[${getTimestamp()}] Active Models Loaded: ${registeredModels.length}`);
});

// ---------- NEW USER SIGNUP LISTENER (5-7 models welcome) ----------
db.collection("users").onSnapshot((snapshot) => {
    if (isInitialUsersLoad) {
        snapshot.forEach(doc => processedUserSignups.add(doc.id));
        isInitialUsersLoad = false;
        console.log(`[${getTimestamp()}] Ignored ${processedUserSignups.size} existing users. Listening for NEW signups...`);
        return;
    }

    snapshot.docChanges().forEach(change => {
        if (change.type === "added") {
            const userId = change.doc.id;
            if (processedUserSignups.has(userId)) return;
            processedUserSignups.add(userId);

            console.log(`[${getTimestamp()}] 🚀 NEW USER SIGNUP: ${userId}`);
            if (registeredModels.length === 0) return;

            const targetCount = Math.min(Math.floor(Math.random() * 3) + 5, registeredModels.length);
            const shuffled = [...registeredModels].sort(() => 0.5 - Math.random());
            const selectedModels = shuffled.slice(0, targetCount);

            selectedModels.forEach((modelId, index) => {
                const delay = getRandomDelay(5 + index * 7, 12 + index * 10);
                const msg = getRandomItem(welcomeTemplates);
                setTimeout(async () => {
                    try {
                        await sendMessage(modelId, userId, msg);
                        console.log(`[${getTimestamp()}] Welcome: Model (${modelId}) -> User (${userId}): "${msg}"`);
                    } catch (e) {
                        console.error(`Welcome send error: ${e.message}`);
                    }
                }, delay);
            });
        }
    });
});

// ---------- MAIN CHAT AUTOMATION ENGINE (MEGA SMART) ----------
db.collection("messages").onSnapshot((snapshot) => {
    if (isInitialMessagesLoad) {
        snapshot.forEach(doc => processedMessageIds.add(doc.id));
        isInitialMessagesLoad = false;
        console.log(`[${getTimestamp()}] Skipped ${processedMessageIds.size} old messages. Live DM engine ready.`);
        return;
    }

    snapshot.docChanges().forEach(async (change) => {
        if (change.type !== "added") return;
        const msgDoc = change.doc;
        const msgData = msgDoc.data();
        const msgId = msgDoc.id;
        if (processedMessageIds.has(msgId)) return;
        processedMessageIds.add(msgId);

        const senderId = msgData.senderId || msgData.sender || msgData.userId || msgData.from;
        const receiverId = msgData.receiverId || msgData.receiver || msgData.modelId || msgData.to;
        const messageText = msgData.text || msgData.message || msgData.body || "";

        if (!senderId || !receiverId) return;

        const isSenderModel = registeredModels.includes(senderId);
        if (isSenderModel) return; // model ke messages ka reply nahi karna

        // User ne message bheja -> model bolegi
        console.log(`[${getTimestamp()}] 📩 DM [${senderId} -> ${receiverId}]: "${messageText}"`);

        // Context load
        const ctx = await getContext(senderId, receiverId);
        const result = await generateSmartReply(senderId, receiverId, messageText, ctx);
        const replyText = result.reply;
        const updateCtx = result.updateCtx || {};

        // Natural human-like delay (3-10 seconds)
        const delay = getRandomDelay(3, 10);
        setTimeout(async () => {
            try {
                await sendMessage(receiverId, senderId, replyText, {
                    chatId: msgData.chatId || null,
                    conversationId: msgData.conversationId || null
                });
                console.log(`[${getTimestamp()}] 💬 Reply [${receiverId} -> ${senderId}]: "${replyText}"`);

                // Update context with latest reply and state
                await updateContext(senderId, receiverId, {
                    ...updateCtx,
                    lastModelReply: replyText,
                    messageCount: ctx.messageCount
                });
            } catch (e) {
                console.error(`Reply failed: ${e.message}`);
            }
        }, delay);
    });
}, err => console.error(`Engine error: ${err.message}`));

console.log(`[${getTimestamp()}] ⚡ WhatsGram Automation Engine v3.0 SMART STARTED!`);
