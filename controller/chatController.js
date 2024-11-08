const path = require("path");
const { spawn } = require("child_process");
const database = require("../database/database");

// AI 채팅 요청 함수
exports.AiChatRequest = (data) => {
  const { question, user_id } = data;
  const execPython = path.join(__dirname, "../", "aichat.py");
  const pythonPath = path.join("/Users/jeongminseog/conda/miniconda3/envs/recom_env/bin/python");

  const net = spawn(pythonPath, [execPython, user_id, question]);
  let output = "";

  return new Promise((resolve, reject) => {
    net.stdout.on("data", (data) => {
      output += data.toString();
    });

    net.on("close", (code) => {
      if (code === 0) {
        resolve({ answer: output });
      } else {
        reject(new Error("Something went wrong"));
      }
    });

    net.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });
  });
};

// 채팅방 생성
exports.createChatRoom = async (req, res) => {
  const { user_number, trainer_number, type } = req.body;
  try {
    const query = type === "ai"
      ? "INSERT INTO chat_room (user_number, type) VALUES ($1, $2) RETURNING *"
      : "INSERT INTO chat_room (user_number, trainer_number, type) VALUES ($1, $2, $3) RETURNING *";

    const values = type === "ai" ? [user_number, type] : [user_number, trainer_number, type];
    const result = await database.query(query, values);
    const roomId = result.rows[0].room_id;

    // AI 채팅방 또는 트레이너 채팅방 고정 메시지 설정
    const fixedMessage = {
      roomId,
      content: type === "ai" ? "안녕하세요! AI와의 채팅방입니다. 궁금한 것을 물어보세요!" : "트레이너와의 채팅방입니다. 질문을 해보세요!",
      senderName: type === "ai" ? "AI 시스템" : "시스템",
      timestamp: new Date(),
    };

    // 고정 메시지를 방에 전송
    io.to(roomId).emit("messageReceived", fixedMessage);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 메시지 전송
exports.sendMessage = async (req, res) => {
  const { room_id } = req.params;
  const { content } = req.body;
  const sender_number = req.params.id;
  const sender_name = req.params.role === "trainer" ? req.user.name : req.body.sender_name;

  try {
    const roomResult = await database.query("SELECT type FROM chat_room WHERE room_id = $1", [room_id]);
    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: "Chat room not found" });
    }

    const roomType = roomResult.rows[0].type;

    if (roomType === "ai") {
      // AI 채팅방일 경우 AI 응답 생성
      const aiResponse = await exports.AiChatRequest({ question: content, user_id: sender_number });
      await database.query("INSERT INTO chat_message (sender_name, content, room_id) VALUES ($1, $2, $3)", [sender_name, content, room_id]);
      res.status(200).json(aiResponse);
    } else {
      // 일반 채팅방 메시지 저장
      const result = await database.query("INSERT INTO chat_message (sender_name, content, room_id) VALUES ($1, $2, $3) RETURNING *", [sender_name, content, room_id]);
      res.status(201).json(result.rows[0]);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 메시지 읽음 상태 업데이트
exports.readMessage = async (req, res) => {
  const { message_number } = req.params;
  try {
    const result = await database.query("UPDATE chat_message SET status = 'read' WHERE message_number = $1 RETURNING *", [message_number]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.status(200).json({ message: "Message marked as read", updatedMessage: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 메시지 삭제
exports.deleteMessage = async (req, res) => {
  const { message_number } = req.params;
  try {
    const result = await database.query("UPDATE chat_message SET status = 'deleted' WHERE message_number = $1 RETURNING *", [message_number]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.status(200).json({ message: "Message soft deleted successfully", deletedMessage: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 채팅방 비활성화
exports.deleteChatRoom = async (req, res) => {
  const { room_id } = req.params;
  try {
    const result = await database.query("UPDATE chat_room SET status = 'deleted', delete_at = CURRENT_TIMESTAMP WHERE room_id = $1 RETURNING *", [room_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Chat room not found" });
    }
    await database.query("UPDATE chat_message SET status = 'deleted' WHERE room_id = $1", [room_id]);
    res.status(200).json({ message: "Chat room and its messages soft deleted successfully", chatRoom: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 메시지 목록 조회
exports.getMessages = async (req, res) => {
  const { room_id } = req.params;
  try {
    const result = await database.query("SELECT * FROM chat_message WHERE room_id = $1 ORDER BY timestamp ASC", [room_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
