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

// AI 채팅 요청 (비동기 처리)
router.post("/aichat", async (req, res) => {
  try {
    const aiResponse = await AiChatRequest(req.body); // 비동기 함수 호출
    res.status(200).json(aiResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 채팅방 생성
router.post("/chat-room", async (req, res) => {
  try {
    const response = await createChatRoom(req, res); // 비동기 함수 호출
    res.status(201).json(response); // 정상적으로 응답 반환
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 메시지 전송
router.post("/chat-room/:room_id/messages", async (req, res) => {
  try {
    const response = await sendMessage(req, res); // 비동기 함수 호출
    res.status(201).json(response); // 응답 반환
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 메시지 읽음 처리
router.patch("/messages/:message_number/read", async (req, res) => {
  try {
    const response = await readMessage(req, res); // 비동기 함수 호출
    res.status(200).json(response); // 응답 반환
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 메시지 삭제
router.delete("/messages/:message_number", async (req, res) => {
  try {
    const response = await deleteMessage(req, res); // 비동기 함수 호출
    res.status(200).json(response); // 응답 반환
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 채팅방 비활성화
router.delete("/chat-room/:room_id", async (req, res) => {
  try {
    const response = await deleteChatRoom(req, res); // 비동기 함수 호출
    res.status(200).json(response); // 응답 반환
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 메시지 조회 엔드포인트
router.get("/chat-room/:room_id/messages", async (req, res) => {
  try {
    const response = await getMessages(req, res); // 비동기 함수 호출
    res.status(200).json(response); // 응답 반환
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
