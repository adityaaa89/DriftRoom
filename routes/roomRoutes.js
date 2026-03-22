const express = require('express');
const router = express.Router();
const Room = require('../models/Room');

// Helper function to calculate distance in meters using Haversine formula
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371e3; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// @route   GET /api/rooms
// @desc    Get all active rooms, optionally filtered by location
router.get('/', async (req, res) => {
    try {
        const { lat, lng } = req.query;
        // Find rooms where expiresAt is greater than now
        let rooms = await Room.find({ expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
        
        let roomsData = rooms.map(room => room.toObject());
        
        // Calculate distance and filter by 500 meters or isGlobal if lat and lng are provided
        if (lat && lng) {
            const userLat = parseFloat(lat);
            const userLng = parseFloat(lng);
            
            roomsData = roomsData.map(room => {
                if (!room.isGlobal && room.latitude && room.longitude) {
                    room.distance = Math.round(getDistanceInMeters(userLat, userLng, room.latitude, room.longitude));
                }
                return room;
            }).filter(room => {
                if (room.isGlobal) return true;
                return room.distance != null && room.distance <= 500;
            });
        }

        res.json(roomsData);
    } catch (err) {
        console.error('Error fetching rooms:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// @route   POST /api/rooms
// @desc    Create a new room
router.post('/', async (req, res) => {
    try {
        const { roomName, category, latitude, longitude, isGlobal } = req.body;

        // Calculate expiresAt (e.g., 1 hour from creation)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        const newRoom = new Room({
            roomName,
            category,
            latitude,
            longitude,
            expiresAt,
            isGlobal: isGlobal || false,
            activeUsers: 1 // Creator is the first user
        });

        const savedRoom = await newRoom.save();
        res.status(201).json(savedRoom);
    } catch (err) {
        console.error('Error creating room:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;
