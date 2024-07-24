const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const roomRoutes = require("./route/room");

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


// databse connection
mongoose
  .connect(
    "mongodb+srv://AbiManyu:nqH5mc2slsy2WEOg@cluster0.ceq9y2l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => console.log("Databse connected Successfully"))
  .catch((err) => console.log(err));

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api", roomRoutes);

// Socket.io logic
require("./controllers/game")(io);

server.listen(8000, () => {
  console.log("Server is running on port 8000");
});
