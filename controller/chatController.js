const path = require("path");
const { spawn } = require("child_process");
const database = require("../database/database");

let io; // io 객체를 저장할 변수


// io 객체 초기화 함수
exports.initializeIo = (socketIo) => {
  io = socketIo;
};

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
  const { user_number, trainer_number } = req.body;
  try {
    const isAIChat = !trainer_number;
    const query = isAIChat
      ? "INSERT INTO chat_room (user_number) VALUES ($1) RETURNING *"
      : "INSERT INTO chat_room (user_number, trainer_number) VALUES ($1, $2) RETURNING *";

    const values = isAIChat ? [user_number] : [user_number, trainer_number];
    const result = await database.query(query, values);
    const roomId = result.rows[0].room_id;

    const fixedMessage = {
      roomId,
      content: isAIChat
        ? "안녕하세요! AI와의 채팅방입니다. 궁금한 것을 물어보세요!"
        : "트레이너와의 채팅방입니다. 질문을 해보세요!",
      senderName: isAIChat ? "AI 시스템" : "시스템",
      timestamp: new Date(),
    };

    io.to(roomId).emit("messageReceived", fixedMessage); // io 사용
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating chat room:", error);
    res.status(500).json({ error: error.message });
  }
};

// 채팅방 리스트 조회
exports.getChatRooms = async (req, res) => {
  const userNumber = req.query.userNumber || null;
  const trainerNumber = req.query.trainerNumber || null;

  // 쿼리 파라미터 출력
  console.log("userNumber:", userNumber);
  console.log("trainerNumber:", trainerNumber);

  if (!userNumber && !trainerNumber) {
    return res.status(400).json({ error: "user_number 또는 trainer_number 중 하나는 제공되어야 합니다." });
  }

  try {
    const chatRooms = await database.getChatRoomsByUserOrTrainer(userNumber, trainerNumber);
    res.status(200).json(chatRooms);
  } catch (error) {
    console.error("Error fetching chat rooms:", error);
    res.status(500).json({ error: error.message });
  }
};

// 특정 채팅방 조회
exports.getChatRoom = async (userNumber, trainerNumber) => {
  if (!userNumber || !trainerNumber) {
    throw new Error("user_number와 trainer_number 모두 제공되어야 합니다.");
  }

  try {
    const chatRoom = await database.getChatRoomByUserAndTrainer(userNumber, trainerNumber);
    return chatRoom;
  } catch (error) {
    console.error("Error fetching specific chat room:", error);
    throw new Error(error.message);
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
    const result = await database.pool.query("SELECT * FROM chat_message WHERE room_id = $1 ORDER BY timestamp ASC", [room_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: error.message });
  }
};
