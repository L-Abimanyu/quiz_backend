const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const roomRoutes = require("./route/room");

const PORT = process.env.PORT || 7000;
const MONGO_URL = process.env.MONGO_URL;

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// CORS middleware for Express
app.use(cors(corsOptions));
app.use(express.json());

// Test endpoint
app.get("/", (req, res) => {
  res.json("deployed");
});

// Room routes
app.use("/api", roomRoutes);

app.use((req, res, next) => {
  res.status(404).json({ message: "Resource not found" });
});

// Database connection
mongoose
  .connect(MONGO_URL)
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.error("Database connection error:", err));

// Socket.io logic
const io = socketIo(server, {
  cors: corsOptions,
});

require("./controllers/game")(io);

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
