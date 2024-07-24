const express = require('express');
const { createRoom,joinRoom, getAvailableRooms } = require('../controllers/room');
const router = express.Router();

router.post('/create', createRoom);
router.post('/join', joinRoom);
router.get('/available', getAvailableRooms);

module.exports = router;
