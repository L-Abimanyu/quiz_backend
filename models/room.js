const mongoose = require("mongoose");

const roomSchema = mongoose.Schema({
  roomId: String,
  users: [String],
  state: String,
  questions: Array,
  currentQuestionIndex: Number,
  scores: Object ,
  timer :Number
});


module.exports = mongoose.model('Room' , roomSchema);