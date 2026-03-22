DriftRoom

A location-based temporary chat room web app
Link : https://driftroom.onrender.com/
🚀 Overview

DriftRoom is a real-time, location-based chat application that allows users to discover and join nearby temporary chat rooms without requiring sign-up or accounts.

Users can create or join rooms based on their location, chat instantly, and experience conversations that naturally fade away as rooms expire.

✨ Features
📍 Location-Based Rooms
Discover chat rooms near your current location
💬 Real-Time Messaging
Instant communication using Socket.io
⏳ Temporary Rooms
Rooms automatically expire after a set time
👤 Anonymous Users
No login required — just enter a name and start chatting
👥 Live Presence Tracking
See who joined/left in real-time
⚡ Lightweight & Fast
Built with vanilla JavaScript for simplicity and performance
🛠️ Tech Stack
Frontend
HTML
CSS
Vanilla JavaScript
Backend
Node.js
Express.js
Socket.io
Database
MongoDB Atlas
Mongoose

⚙️ Setup Instructions
1. Clone the repository
git clone https://github.com/your-username/driftroom.git
cd driftroom
2. Install dependencies
npm install
3. Setup environment variables

Create a .env file in the root directory:

MONGO_URI=your_mongodb_connection_string
PORT=3000
4. Run the server
node server.js
5. Open in browser
http://localhost:3000
🧠 How It Works
User enters a display name
App fetches nearby chat rooms using location
User joins or creates a room
Socket.io handles real-time messaging
Users are tracked in-memory for presence
Rooms automatically expire after inactivity
🔐 Data Handling
No user accounts or authentication
Username stored locally (localStorage)
Temporary session-based identity
Rooms and messages stored in MongoDB
Active users tracked in server memory
🧩 Future Improvements
📌 Map-based room visualization
⏱️ Auto-delete expired rooms (cron job)
😀 Emoji reactions
✍️ Typing indicators
🧹 Message cleanup after expiry
🔒 Basic moderation / profanity filter
🎯 Learning Outcomes

This project demonstrates:

Full-stack web development
REST API integration
Real-time communication with WebSockets
Database design using MongoDB
Location-based filtering
Session-based user handling
📌 Use Cases
College campus discussions
Event-based chat rooms
Study groups
Local community interaction
Temporary public conversations
🤝 Contributing

Contributions are welcome! Feel free to fork the repo and submit a pull request.


💡 Author

Aditya Gupta
