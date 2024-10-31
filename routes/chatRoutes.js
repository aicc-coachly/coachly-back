const express = require("express");
const router = express.Router();
const {
  AiChatRequest,
  createChatRoom,
  sendMessage,
  readMessage,
  deleteMessage,
  deleteChatRoom,
  getMessages,
} = require("../controller/chatController");

router.post("/aichat", AiChatRequest);

// 채팅방 생성
router.post("/chat-room", createChatRoom);

// 메시지 전송
router.post("/chat-room/:room_id/messages", sendMessage);

// 메시지 읽음 처리
router.patch("/messages/:message_number/read", readMessage);

// 메시지 삭제
router.delete("/messages/:message_number", deleteMessage);

// 채팅방 비활성화
router.delete("/chat-room/:room_id", deleteChatRoom);

// 메시지 조회 엔드포인트
router.get("/chat-room/:room_id/messages", getMessages);

module.exports = router;
