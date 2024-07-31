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
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
});

app.get("/", async (req, res) => {
  res.json("deployed");
});

// databse connection
mongoose
  .connect(MONGO_URL)
  .then(() => console.log("Database connected Successfully"))
  .catch((err) => console.log(err));

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api", roomRoutes);

// Socket.io logic
require("./controllers/game")(io);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
