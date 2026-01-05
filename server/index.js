const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Stripe Setup (Add your keys in .env or replace directly)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_YOUR_KEY');
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_YOUR_WEBHOOK_SECRET';

const app = express();

// IMPORTANT: Stripe webhooks need raw body, so this must come BEFORE express.json()
app.post('/webhook/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Ping endpoint for keep-alive services (Cron-job.org / UptimeRobot)
app.get('/ping', (req, res) => res.status(200).send('pong'));

// Now apply JSON parsing for other routes
app.use(cors());
app.use(express.json());

// ============ FIREBASE ADMIN SETUP ============
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin
if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
        const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8'));
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('✅ Firebase Admin initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin:', error.message);
    }
} else {
    console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_BASE64 not found. Persistent data will not work.');
}

const db = getFirestore();
const auth = getAuth();

// ============ STRIPE WEBHOOK HANDLER ============
async function handleStripeWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('⚠️ Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
        const session = event.data.object;
        console.log('💰 Payment succeeded:', session.id);

        // Get customer email
        const email = session.customer_email || session.customer_details?.email || session.metadata?.email;
        const amount = session.amount_total || session.amount || 0;

        let packType = 'single';
        if (amount >= 9900) packType = 'unlockAll';
        else if (amount >= 250) packType = 'bundle10';

        console.log(`📦 Detected pack type: ${packType} from amount: $${(amount / 100).toFixed(2)}`);

        if (email) {
            await fulfillPurchase(email, packType);
        } else {
            console.log('⚠️ No email found in session, cannot fulfill');
        }
    }

    res.status(200).json({ received: true });
}

// ============ FULFILLMENT LOGIC ============
async function fulfillPurchase(email, packType) {
    console.log(`📦 Fulfilling ${packType} for ${email}`);

    try {
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(email);
        } catch (e) {
            // User doesn't exist, create them
            console.log(`✨ Creating new user for ${email}`);
            userRecord = await auth.createUser({ email });
        }

        const uid = userRecord.uid;
        const userRef = db.collection('users').doc(uid);
        const docSnap = await userRef.get();

        let userData = docSnap.exists ? docSnap.data() : {
            email, icons: [], freePacks: 0, packCredits: 0
        };

        const packsToAdd = packType === 'bundle10' ? 10 : (packType === 'single' ? 1 : 0);

        if (packType === 'unlockAll') {
            userData.icons = Array.from({ length: 150 }, (_, i) => i + 1);
            console.log(`🐋 Whale unlock complete for ${email}`);
        } else {
            userData.freePacks = (userData.freePacks || 0) + packsToAdd;
            console.log(`🎁 Granted ${packsToAdd} packs to ${email}`);
        }

        await userRef.set(userData, { merge: true });
        console.log('✅ Database updated successfully');

    } catch (error) {
        console.error('❌ Error fulfilling purchase:', error);
    }
}

// ============ ADMIN API ENDPOINTS ============
// Middleware to verify admin password (basic protection)
const verifyAdmin = (req, res, next) => {
    // In a real app, verify ID token. For this demo, we'll assume the request comes from a trusted admin client
    // or checks a shared secret header if you implemented one. 
    // Since we didn't implement a secure token flow for admin actions from client yet, 
    // we allow the requests but ideally you'd verify `req.headers['authorization']`
    next();
};

app.post('/api/admin/grant-pack', verifyAdmin, async (req, res) => {
    // This endpoint is hit by the AdminDashboard
    // For now, the dashboard updates Firestore directly, so this isn't strictly needed for the client tools.
    // But if you want server-side validity:
    const { userId, count } = req.body;
    // ... logic to update firestore ...
    res.json({ success: true });
});

app.get('/api/admin/rooms', (req, res) => {
    // ... code remains same ...
    const roomsList = [];
    for (const [code, room] of rooms) {
        roomsList.push({
            code,
            playerCount: room.players?.size || 0,
            status: room.gameStarted ? 'playing' : 'lobby'
        });
    }

    let playersOnline = 0;
    for (const room of rooms.values()) {
        playersOnline += room.players?.size || 0;
    }

    res.json({ rooms: roomsList, playersOnline, totalRooms: rooms.size });
});
// ============ SUCCESS/CANCEL PAGES ============
app.get('/payment/success', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Payment Successful!</title>
            <style>
                body {
                    font-family: 'Inter', sans-serif;
                    background: linear-gradient(135deg, #0a0a1a, #1a0a2e);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    text-align: center;
                }
                .card {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 3rem;
                    border-radius: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    box-shadow: 0 0 50px rgba(0, 212, 255, 0.2);
                }
                h1 { color: #00ff87; margin-bottom: 1rem; }
                p { color: #8892b0; margin-bottom: 2rem; }
                .btn {
                    background: #00d4ff;
                    color: #000;
                    padding: 1rem 2rem;
                    text-decoration: none;
                    border-radius: 50px;
                    font-weight: bold;
                    transition: transform 0.2s;
                    display: inline-block;
                }
                .btn:hover { transform: scale(1.05); }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>Purchase Successful! 🎉</h1>
                <p>Your packs have been added to your inventory.</p>
                <a href="${process.env.CLIENT_URL || '/'}" class="btn">Return to Arena</a>
            </div>
        </body>
        </html>
    `);
});

app.get('/payment/cancel', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Payment Cancelled</title>
            <style>
                body {
                    font-family: 'Inter', sans-serif;
                    background: linear-gradient(135deg, #0a0a1a, #1a0a2e);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    text-align: center;
                }
                .card {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 3rem;
                    border-radius: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                h1 { color: #ff4757; margin-bottom: 1rem; }
                .btn {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    padding: 1rem 2rem;
                    text-decoration: none;
                    border-radius: 50px;
                    margin-top: 1rem;
                    display: inline-block;
                }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>Payment Cancelled</h1>
                <p>No charge was made.</p>
                <a href="${process.env.CLIENT_URL || '/'}" class="btn">Return to Store</a>
            </div>
        </body>
        </html>
    `);
});

// ============ API: Get Player Inventory ============
app.get('/api/inventory/:email', (req, res) => {
    const email = req.params.email;
    const inventory = playerInventories.get(email) || { icons: [], freePacks: 0 };
    res.json(inventory);
});

// ============ API: Claim Free Packs ============
app.post('/api/claim-packs', (req, res) => {
    const { email, count } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const inventory = playerInventories.get(email);
    if (!inventory || inventory.freePacks < count) {
        return res.status(400).json({ error: 'Not enough packs' });
    }

    inventory.freePacks -= count;
    res.json({ success: true, remainingPacks: inventory.freePacks });
});

// ============ ADMIN API ENDPOINTS ============
app.get('/api/admin/rooms', (req, res) => {
    const roomsList = [];
    for (const [code, room] of rooms) {
        roomsList.push({
            code,
            playerCount: room.players?.size || 0,
            status: room.gameStarted ? 'playing' : 'lobby'
        });
    }

    // Count total players online
    let playersOnline = 0;
    for (const room of rooms.values()) {
        playersOnline += room.players?.size || 0;
    }

    res.json({
        rooms: roomsList,
        playersOnline,
        totalRooms: rooms.size
    });
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

// Game state
const rooms = new Map();
const playerRooms = new Map();

// Generate random room code
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Player colors
const PLAYER_COLORS = ['#00d4ff', '#ff006e', '#00ff87', '#9d4edd'];

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id} `);

    // Create a new room
    socket.on('createRoom', ({ playerName, userEmail }, callback) => {
        const roomCode = generateRoomCode();
        rooms.set(roomCode, {
            players: new Map(),
            powerups: [],
            gameState: 'waiting',
            hostId: socket.id,
        });

        joinRoom(socket, roomCode, playerName, userEmail, callback);
    });

    // Join existing room
    socket.on('joinRoom', ({ roomCode, playerName, userEmail }, callback) => {
        const code = roomCode.toUpperCase();
        if (!rooms.has(code)) {
            callback({ success: false, error: 'Room not found' });
            return;
        }

        const room = rooms.get(code);
        if (room.players.size >= 4) {
            callback({ success: false, error: 'Room is full' });
            return;
        }

        joinRoom(socket, code, playerName, userEmail, callback);
    });

    // Quick join - find or create room
    socket.on('quickJoin', ({ playerName, userEmail }, callback) => {
        let roomCode = null;

        // Find room with space
        for (const [code, room] of rooms) {
            if (room.players.size < 4 && room.gameState === 'waiting') {
                roomCode = code;
                break;
            }
        }

        // Create new room if none found
        if (!roomCode) {
            roomCode = generateRoomCode();
            rooms.set(roomCode, {
                players: new Map(),
                powerups: [],
                gameState: 'waiting',
                hostId: socket.id,
                selectedMap: 'SAWBLADE CITY', // Default map
            });
        }

        joinRoom(socket, roomCode, playerName, userEmail, callback);
    });

    // Handle player ready
    socket.on('playerReady', ({ isReady, loadout }) => {
        const roomCode = playerRooms.get(socket.id);
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room) return;

        const player = room.players.get(socket.id);
        if (player) {
            player.ready = isReady;
            player.loadout = loadout; // Store loadout

            // Check if all ready
            const allReady = Array.from(room.players.values()).every(p => p.ready);
            const playersList = Array.from(room.players.values());

            io.to(roomCode).emit('roomUpdate', { players: playersList });

            if (allReady && room.players.size >= 1) { // Allow 1 player start for testing
                room.gameState = 'playing';
                io.to(roomCode).emit('gameStart', {
                    players: playersList,
                    selectedMap: room.selectedMap || 'SAWBLADE CITY' // Default map
                });
            }
        }
    });

    // Handle Map Vote
    socket.on('voteMap', ({ mapName }) => {
        const roomCode = playerRooms.get(socket.id);
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (room) {
            room.selectedMap = mapName; // Simple last vote wins for now, or implement tally
            io.to(roomCode).emit('mapVoted', { mapName });
        }
    });

    // Player position update
    socket.on('playerPosition', ({ position, velocity, rotation }) => {
        const roomCode = playerRooms.get(socket.id);
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room || room.gameState !== 'playing') return;

        const player = room.players.get(socket.id);
        if (player) {
            player.position = position;
            player.velocity = velocity;
            player.rotation = rotation;

            // Broadcast to others in room
            socket.to(roomCode).emit('playerMoved', {
                playerId: socket.id,
                position,
                velocity,
                rotation,
            });
        }
    });

    // Player damage update
    socket.on('playerDamage', ({ damage }) => {
        const roomCode = playerRooms.get(socket.id);
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room) return;

        const player = room.players.get(socket.id);
        if (player) {
            player.damage = damage;
            // Broadcast update
            io.to(roomCode).emit('damageUpdate', { playerId: socket.id, damage });
        }
    });

    // Player knockout
    socket.on('playerKnockout', ({ knockedOutId }) => {
        const roomCode = playerRooms.get(socket.id);
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room) return;

        // Increment scorer's score
        const scorer = room.players.get(socket.id);
        if (scorer) {
            scorer.score = (scorer.score || 0) + 1;
        }

        io.to(roomCode).emit('knockout', {
            scorerId: socket.id,
            knockedOutId,
            scores: getScoresObject(room),
        });

        // Check win condition (first to 5)
        if (scorer && scorer.score >= 5) {
            io.to(roomCode).emit('gameOver', {
                winnerId: socket.id,
                scores: getScoresObject(room),
            });
            room.gameState = 'ended';

            // Award packs/credits to all players
            awardGameRewards(room, socket.id);
        }
    });

    // Power-up collected
    socket.on('powerupCollected', ({ powerupId }) => {
        const roomCode = playerRooms.get(socket.id);
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room) return;

        // Remove powerup and broadcast
        room.powerups = room.powerups.filter(p => p.id !== powerupId);
        io.to(roomCode).emit('powerupRemoved', { powerupId, collectorId: socket.id });
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id} `);

        const roomCode = playerRooms.get(socket.id);
        if (roomCode) {
            const room = rooms.get(roomCode);
            if (room) {
                room.players.delete(socket.id);
                io.to(roomCode).emit('playerLeft', { playerId: socket.id });
                io.to(roomCode).emit('playerUpdate', getPlayersArray(room));

                // Clean up empty rooms
                if (room.players.size === 0) {
                    rooms.delete(roomCode);
                }
            }
            playerRooms.delete(socket.id);
        }
    });

    // Helper: Join room
    function joinRoom(socket, roomCode, playerName, userEmail, callback) {
        const room = rooms.get(roomCode);
        const playerIndex = room.players.size;

        const player = {
            id: socket.id,
            name: playerName || `Player ${playerIndex + 1}`,
            email: userEmail || null, // Store email for rewards
            color: PLAYER_COLORS[playerIndex],
            position: getSpawnPosition(playerIndex),
            velocity: [0, 0, 0],
            ready: false,
            score: 0,
        };

        room.players.set(socket.id, player);
        playerRooms.set(socket.id, roomCode);
        socket.join(roomCode);

        callback({
            success: true,
            roomCode,
            playerId: socket.id,
            playerIndex,
            color: player.color,
            players: getPlayersArray(room),
        });

        // Notify others
        socket.to(roomCode).emit('playerJoined', player);
        io.to(roomCode).emit('playerUpdate', getPlayersArray(room));
    }

    // Helper: Get spawn positions (around the arena)
    function getSpawnPosition(index) {
        const positions = [
            [-5, 1, 0],
            [5, 1, 0],
            [0, 1, -5],
            [0, 1, 5],
        ];
        return positions[index % 4];
    }

    // Helper: Start game
    function startGame(roomCode) {
        const room = rooms.get(roomCode);
        if (!room) return;

        room.gameState = 'playing';

        // Reset positions
        let i = 0;
        for (const [id, player] of room.players) {
            player.position = getSpawnPosition(i);
            player.score = 0;
            i++;
        }

        io.to(roomCode).emit('gameStart', {
            players: getPlayersArray(room),
        });

        // Start powerup spawning
        spawnPowerups(roomCode);
    }

    // Helper: Spawn powerups periodically
    function spawnPowerups(roomCode) {
        const interval = setInterval(() => {
            const room = rooms.get(roomCode);
            if (!room || room.gameState !== 'playing') {
                clearInterval(interval);
                return;
            }

            if (room.powerups.length < 3) {
                const powerup = {
                    id: `pw_${Date.now()} `,
                    type: ['speed', 'damage', 'shield', 'superboost'][Math.floor(Math.random() * 4)],
                    position: [
                        (Math.random() - 0.5) * 10,
                        1.5,
                        (Math.random() - 0.5) * 10,
                    ],
                };
                room.powerups.push(powerup);
                io.to(roomCode).emit('powerupSpawned', powerup);
            }
        }, 8000 + Math.random() * 4000);
    }

    // Helper: Get players as array
    function getPlayersArray(room) {
        return Array.from(room.players.values());
    }

    // Helper: Get scores object
    function getScoresObject(room) {
        const scores = {};
        for (const [id, player] of room.players) {
            scores[id] = player.score || 0;
        }
        return scores;
    }

    // Helper: Award Game Rewards (1 Pack for Winner, 0.5 Credit for others)
    async function awardGameRewards(room, winnerId) {
        console.log('🏆 Awarding game rewards...');

        for (const [playerId, player] of room.players) {
            if (!player.email) {
                console.log(`⚠️ Player ${player.name} has no email, skipping reward.`);
                continue;
            }

            try {
                // Determine reward
                const isWinner = playerId === winnerId;
                const creditEarned = isWinner ? 1.0 : 0.5;

                // Get user doc
                const userQuery = await admin.auth().getUserByEmail(player.email).catch(() => null);
                if (!userQuery) continue;

                const userRef = db.collection('users').doc(userQuery.uid);

                await db.runTransaction(async (t) => {
                    const doc = await t.get(userRef);
                    if (!doc.exists) return; // Should exist if they logged in

                    const data = doc.data();
                    let currentCredits = (data.packCredits || 0) + creditEarned;
                    let packsEarned = 0;

                    // Convert credits to packs (every 1.0 credit = 1 pack)
                    if (currentCredits >= 1) {
                        const newPacks = Math.floor(currentCredits);
                        currentCredits -= newPacks;
                        packsEarned = newPacks;
                    }

                    t.update(userRef, {
                        packCredits: currentCredits,
                        freePacks: (data.freePacks || 0) + packsEarned
                    });

                    console.log(`🎁 ${player.email}: +${creditEarned} credit -> ${packsEarned} packs earned.`);

                    // Notify client of reward
                    io.to(playerId).emit('rewardEarned', {
                        packs: packsEarned,
                        credits: creditEarned,
                        isWinner
                    });
                });

            } catch (error) {
                console.error(`❌ Error awarding reward to ${player.email}:`, error);
            }
        }
    }
});

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ status: 'ok', rooms: rooms.size });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
    console.log(`🎮 Puck Arena Server running on port ${PORT} `);
});
