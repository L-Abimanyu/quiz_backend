const Room = require("../models/room");
const { v4: uuidv4 } = require("uuid");
const { fetchAvailableRooms } = require("./room");

const questions = [
  { question: "What is the capital of France?", answer: "paris" },
  { question: "What is the capital of India?", answer: "newdelhi" },
  { question: "Name the National bird of India ?", answer: "peacock" },
  { question: "Name the National animal of India ?", answer: "tiger" },
  {
    question: "Which festival in India is called the festival of colours ?",
    answer: "holi",
  },
  { question: "What does CPU stand for?", answer: "Central Processing Unit" },
  {
    question:
      "Which programming language is known as the language of the web ?",
    answer: "javascript",
  },
];

function getRandomQuestions() {
  return questions.sort(() => 0.5 - Math.random()).slice(0, 5);
}

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("New client connected");

    fetchAvailableRooms().then((rooms) => {
      socket.emit("availableRooms", rooms);
    });

    socket.on("createRoom", async (name) => {
      const existingRoom = await Room.findOne({ users: name });

      if (existingRoom) {
        socket.emit("errorName", "This name is already taken.");
        return;
      }

      const roomId = uuidv4();
      const newRoom = new Room({
        roomId,
        users: [name],
        state: "waiting",
      });
      await newRoom.save();
      socket.join(roomId);
      socket.emit("roomCreated", roomId);

      fetchAvailableRooms().then((rooms) => {
        io.emit("availableRooms", rooms);
      });
    });

    socket.on("joinRoom", async (joinName, roomId) => {
      try {
        const existingRoom = await Room.findOne({ roomId });

        const checkName = existingRoom.users.includes(joinName);

        if (checkName) {
          socket.emit("errorName", "This name is already taken.");
          return;
        }

        if (roomId) {
          const room = await Room.findOne({ roomId, state: "waiting" });

          if (room) {
            const uniqueUsers = new Set(room.users);
            uniqueUsers.add(joinName);
            room.users = Array.from(uniqueUsers);

            if (room.users.length === 2) {
              room.state = "ready";
            }
            await room.save();
            socket.join(roomId);
            socket.emit("roomJoined", roomId);

            if (room.users.length === 2) {
              io.to(roomId).emit("navigateToGame", roomId);
            }

            fetchAvailableRooms().then((rooms) => {
              io.emit("availableRooms", rooms);
            });
          } else {
            socket.emit("noRoomsAvailable");
          }
        }
      } catch (error) {
        console.error("Error in joinRoom handler:", error);
        socket.emit("error", "An error occurred while joining the room.");
      }
    });

    socket.on("startGame", async (roomId) => {
      const room = await Room.findOne({ roomId });
      console.log("triggred");
      if (room && room.state === "ready" && room.users.length === 2) {
        const updatedRoom = await Room.findOneAndUpdate(
          { roomId, state: "ready" },
          {
            users: room.users,
            state: "playing",
            questions: getRandomQuestions(),
            currentQuestionIndex: 0,
            scores: room.users.reduce((acc, userId) => {
              acc[userId] = 0;
              return acc;
            }, {}),
          },
          { new: true }
        );
      }

      if (room && room.state === "playing" && room.users.length === 2) {
        console.log(true);
        sendNextQuestion(room.roomId);
      }
    });

    socket.on("answer", async (roomId, answer, name) => {
      const room = await Room.findOne({ roomId });
      if (room && room.state === "playing") {
        const currentQuestion = room.questions[room?.currentQuestionIndex];
        if (currentQuestion?.answer.toLowerCase() === answer?.toLowerCase()) {
          room.scores[name] += 10;
        }

        const updatedRoom = await Room.findOneAndUpdate(
          { roomId, state: "playing" },
          {
            $set: {
              currentQuestionIndex: room.currentQuestionIndex + 1,
            },
            $inc: {
              [`scores.${name}`]:
                currentQuestion.answer.toLowerCase()?.trim() ===
                answer.toLowerCase()?.trim()
                  ? 10
                  : 0,
            },
          },
          { new: true }
        );

        if (updatedRoom.currentQuestionIndex < updatedRoom.questions.length) {
          sendNextQuestion(roomId);
        } else {
          socket.join(roomId);
          io.to(roomId).emit("navigateToResult", roomId);
        }
      }
    });

    socket.on("getUserScores", async (roomId) => {
      const room = await Room.findOne({ roomId: roomId });
      socket.join(roomId);
      io.to(roomId).emit("userScores", room);
    });

    socket.on("endGame", async (roomId) => {
      await Room.deleteOne({ roomId }).exec();

      fetchAvailableRooms().then((rooms) => {
        io.emit("availableRooms", rooms);
      });
    });

    async function sendNextQuestion(roomId) {
      console.log(roomId);
      Room.findOne({ roomId })
        .then((room) => {
          if (
            room &&
            room.questions &&
            room.currentQuestionIndex < room.questions.length
          ) {
            const nextQuestion = room.questions[room.currentQuestionIndex];

            if (nextQuestion) {
              socket.join(roomId);
              io.to(roomId).emit("question", nextQuestion.question);
              // room.timer = setTimeout(() => {
              //   if (room.currentQuestionIndex < room.questions.length - 1) {
              //     room.currentQuestionIndex += 1;
              //     room.save().then(() => {
              //       sendNextQuestion(roomId);
              //     });
              //   }
              // }, 15000);
            } else {
              console.error(
                `No question found at index ${room.currentQuestionIndex} in room ${roomId}`
              );
            }
          } else {
            console.error(`Room ${roomId} not found or no questions available`);
          }
        })
        .catch((err) => {
          console.error(`Error fetching room ${roomId}:`, err);
        });
    }
  });

  function endGame(roomId) {
    Room.findOne({ roomId }).then((room) => {
      io.to(roomId).emit("gameOver", room.scores);
      Room.deleteOne({ roomId }).exec();

      fetchAvailableRooms().then((rooms) => {
        io.emit("availableRooms", rooms);
      });
    });
  }
};
