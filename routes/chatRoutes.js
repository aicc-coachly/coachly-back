const express = require("express");
const router = express.Router();
const {
  AiChatRequest,
  createChatRoom,
  sendMessage,
  readMessage,
  deleteMessage,
  deleteChatRoom,
} = require("../controller/chatController");

router.post("/aichat", AiChatRequest);

// 채팅방 생성
router.post("/chat-rooms", createChatRoom);

// 메시지 전송
router.post("/chat-rooms/:room_id/messages", sendMessage);

// 메시지 읽음 처리
router.patch("/messages/:message_number/read", readMessage);

// 메시지 삭제
router.delete("/messages/:message_number", deleteMessage);

// 채팅방 비활성화
router.delete("/chat-rooms/:room_id", deleteChatRoom);

module.exports = router;
