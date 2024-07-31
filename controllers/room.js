const Room = require("../models/room");
const { v4: uuidv4 } = require("uuid");

exports.createRoom = async (req, res) => {
  try {
    const roomId = uuidv4();
    const newRoom = new Room({ roomId, users: [], state: "waiting" });
    await newRoom.save();
   res.status(200).json(newRoom)
  } catch (error) {
    console.log(error);
  }
};  

exports.joinRoom = async (req, res) => {
  try {
    const availableRoom = await Room.findOne({ state: "waiting" });
    if (availableRoom) {
      availableRoom.users.push(req.body.userId);
      if (availableRoom.users.length === 2) {
        availableRoom.state = "ready";
      }
      await availableRoom.save();
      res.status(200).json({ roomId: availableRoom.roomId });
    } else {
      res.status(404).json({ message: "No rooms available" });
    }
  } catch (error) {
    console.log(error);
  }
};


exports.getAvailableRooms = async (req, res) => {
  const availableRooms = await Room.find({ state: 'waiting' });
  res.status(200).json(availableRooms);
};


exports.fetchAvailableRooms= async (req, res) => {
  const availableRooms = await Room.find({ state: 'waiting' });
  return(availableRooms);
};