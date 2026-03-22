const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomName: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        default: 'General'
    },
    latitude: {
        type: Number,
        required: false // Optional for now, till frontend requests support it
    },
    longitude: {
        type: Number,
        required: false
    },
    activeUsers: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true,
        expires: 172800 // 48 hours in seconds
    },
    isGlobal: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Room', roomSchema);
