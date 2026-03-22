const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    senderName: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        expires: 176400 // 49 hours in seconds (1 hour lifespan + 48 hours later)
    }
});

module.exports = mongoose.model('Message', messageSchema);
