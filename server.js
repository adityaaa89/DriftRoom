// Load environment variables
require('dotenv').config();

const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const roomRoutes = require('./routes/roomRoutes');
const Message = require('./models/Message');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for development
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON bodies

// Serve Static Frontend Files
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/localchat';
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err.message));

// API Routes
app.use('/api/rooms', roomRoutes);

// In-memory room user tracking
// Structure: { roomId: [{ userId, username, socketId }] }
const roomUsers = {};

// Socket.io Real-time Chat Logic
io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // Context for this specific socket connection
    let currentRoomId = null;
    let currentUser = null;

    // 1. Join Room
    socket.on('joinRoom', async ({ roomId, userId, username }) => {
        socket.join(roomId);
        currentRoomId = roomId;
        currentUser = { userId, username, socketId: socket.id };

        // Initialize array if room doesn't exist in memory yet
        if (!roomUsers[roomId]) {
            roomUsers[roomId] = [];
        }
        
        // Add user to the room tracking list
        roomUsers[roomId].push(currentUser);

        // Fetch past messages and send only to the user who just joined
        try {
            const pastMessages = await Message.find({ roomId }).sort({ timestamp: 1 }).limit(100);
            const formattedMessages = pastMessages.map(msg => ({
                username: msg.senderName,
                text: msg.text,
                timestamp: msg.timestamp
            }));
            socket.emit('loadPastMessages', formattedMessages);
        } catch (err) {
            console.error('Error loading past messages:', err.message);
        }

        // System message to everyone else in the room
        socket.to(roomId).emit('userJoined', {
            username: currentUser.username,
            timestamp: new Date()
        });

        // Broadcast updated active users list to everyone in the room (including the new sender)
        io.to(roomId).emit('updateUsers', {
            users: roomUsers[roomId]
        });

        console.log(`User ${username} joined room ${roomId}`);
    });

    // 2. Send Message
    socket.on('sendMessage', async (data) => {
        // data contains: { roomId, username, text }
        const messageObj = {
            username: data.username,
            text: data.text,
            timestamp: new Date()
        };

        // Broadcast the message instantly to everyone in the room
        io.to(data.roomId).emit('receiveMessage', messageObj);

        // Optional: Save message to MongoDB asynchronously so it persists
        try {
            await Message.create({
                roomId: data.roomId,
                senderName: data.username,
                text: data.text
            });
        } catch (err) {
            console.error('Error saving message to DB:', err.message);
        }
    });

    // 3. User Disconnects
    socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
        
        if (currentRoomId && currentUser) {
            // Remove the user from the tracking array
            roomUsers[currentRoomId] = roomUsers[currentRoomId].filter(
                user => user.socketId !== socket.id
            );

            // Notify everyone else that the user left
            socket.to(currentRoomId).emit('userLeft', {
                username: currentUser.username,
                timestamp: new Date()
            });

            // Broadcast the updated user list
            io.to(currentRoomId).emit('updateUsers', {
                users: roomUsers[currentRoomId]
            });
            
            // Cleanup empty rooms from memory
            if (roomUsers[currentRoomId].length === 0) {
                delete roomUsers[currentRoomId];
            }
        }
    });
});

// Fallback to index.html for any unknown routes (SPA behavior if needed)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
