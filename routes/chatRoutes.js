const express = require("express");
const router = express.Router();
const {
  createChatRoom,
  sendMessage,
  getMessages,
  getChatRooms,
  getChatRoom,
  leaveChatRoom,
  // createAIChatRoom,
  // AiChatRequest,
  // readMessage,
  // deleteMessage,
  // deleteChatRoom,
} = require("../controller/chatController");

// 채팅방 리스트 조회
router.get("/chat-rooms", async (req, res) => {
  const userNumber = req.query.userNumber || null;
  const trainerNumber = req.query.trainerNumber || null;

  if (!userNumber && !trainerNumber) {
    return res.status(400).json({
      error: "user_number 또는 trainer_number 중 하나는 제공되어야 합니다.",
    });
  }

  try {
    const response = await getChatRooms(req, res);
    if (!res.headersSent) res.status(200).json(response);
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ error: error.message });
  }
});

// 특정 채팅방 조회
router.get("/chat-room/:roomId", async (req, res) => {
  const roomId = req.params.roomId;
  const userNumber = req.query.userNumber !== "null" ? req.query.userNumber : null;
  const trainerNumber = req.query.trainerNumber !== "null" ? req.query.trainerNumber : null;

  console.log("Received parameters:", { roomId, userNumber, trainerNumber });

  if (!roomId || (userNumber === null && trainerNumber === null)) {
    return res.status(400).json({ error: "roomId와 userNumber 또는 trainerNumber가 필요합니다." });
  }

  try {
    const chatRoom = await getChatRoom(roomId, userNumber, trainerNumber);
    if (chatRoom && !res.headersSent) {
      res.status(200).json(chatRoom);
    } else if (!res.headersSent) {
      res.status(404).json({ error: "해당 조건에 맞는 채팅방이 없습니다." });
    }
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ error: error.message });
  }
});




// ai 채팅방 생성
// router.post("/chat-room/ai", createAIChatRoom);

// 채팅방 생성
router.post("/chat-room", async (req, res) => {
  try {
    const response = await createChatRoom(req, res);
    if (!res.headersSent) res.status(201).json(response);
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ error: error.message });
  }
});

// 메시지 전송
router.post("/chat-room/:room_id/messages", async (req, res) => {
  try {
    const response = await sendMessage(req, res);
    if (!res.headersSent) res.status(201).json(response);
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ error: error.message });
  }
});

// 메시지 조회
router.get("/chat-room/:room_id/messages", async (req, res) => {
  try {
    const response = await getMessages(req, res);
    if (!res.headersSent) res.status(200).json(response);
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ error: error.message });
  }
});

// 사용자가 채팅방을 나갈 때 메시지를 저장하는 엔드포인트
router.post("/chat-room/:room_id/leave", async (req, res) => {
  try {
    const response = await leaveChatRoom(req, res);
    if (!res.headersSent) res.status(200).json(response);
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ error: error.message });
  }
});

module.exports = router;
