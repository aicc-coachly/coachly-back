const path = require("path");
const { spawn } = require("child_process");
const database = require("../database/database");

exports.AiChatRequest = (req, res) => {
  const sendQuestion = req.body.question;
  console.log(sendQuestion);

  const execPython = path.join(__dirname, "../", "aichat.py");
  const pythonPath = path.join(
    "/Users/jeongminseog/conda/miniconda3/envs/recom_env/bin/python"
  );

  const net = spawn(pythonPath, [execPython, sendQuestion]);

  let output = "";

  net.stdout.on("data", function (data) {
    output += data.toString();
  });

  net.on("close", (code) => {
    if (code === 0) {
      res.status(200).json({ answer: output });
    } else {
      res.status(500).send("Something went wrong");
    }
  });

  net.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });
};

// 채팅방 생성
exports.createChatRoom = async (req, res) => {
  const { user_number, trainer_number } = req.body;
  try {
    const result = await database.query(
      "INSERT INTO chat_room (user_number, trainer_number) VALUES ($1, $2) RETURNING *",
      [user_number, trainer_number]
    );

    const roomId = result.rows[0].room_id;

    // 고정 메시지 생성
    const fixedMessage = {
      roomId,
      content: "채팅을 통해 원하는 정보를 물어보세요!",
      senderName: "시스템", // 고정 메시지 발신자
      timestamp: new Date(),
    };

    // 방에 고정 메시지 전송
    io.to(roomId).emit("messageReceived", fixedMessage);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 메시지 전송
exports.sendMessage = async (req, res) => {
  const { room_id } = req.params; // URL 파라미터에서 방 ID 가져오기
  const { content } = req.body; // 요청 본문에서 내용 가져오기
  const sender_number = req.params.id; // 로그인한 사용자의 ID 가져오기
  const sender_name =
    req.params.role === "trainer" ? req.user.name : req.body.sender_name; // 발신자 이름 설정

  try {
    const result = await database.query(
      "INSERT INTO chat_message (sender_name, content, room_id) VALUES ($1, $2, $3) RETURNING *",
      [sender_name, content, room_id]
    );
    res.status(201).json(result.rows[0]); // 성공적으로 전송된 메시지 반환
  } catch (error) {
    res.status(500).json({ error: error.message }); // 에러 발생 시 메시지 반환
  }
};

// 메시지 상태 업데이트 (읽음)
exports.readMessage = async (req, res) => {
  const { message_number } = req.params;

  try {
    const result = await database.query(
      "UPDATE chat_message SET status = 'read' WHERE message_number = $1 RETURNING *",
      [message_number]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Message not found" });
    }

    return res.status(200).json({
      message: "Message marked as read",
      updatedMessage: result.rows[0],
    });
  } catch (error) {
    console.error("Database query error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// 메시지 상태 업데이트 (삭제)
exports.deleteMessage = async (req, res) => {
  const { message_number } = req.params;

  try {
    const result = await database.query(
      "UPDATE chat_message SET status = 'deleted' WHERE message_number = $1 RETURNING *",
      [message_number]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Message not found" });
    }

    return res.status(200).json({
      message: "Message soft deleted successfully",
      deletedMessage: result.rows[0],
    });
  } catch (error) {
    console.error("Database query error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// 채팅방 비활성화
exports.deleteChatRoom = async (req, res) => {
  const { room_id } = req.params;

  try {
    const result = await database.query(
      "UPDATE chat_room SET status = 'deleted', delete_at = CURRENT_TIMESTAMP WHERE room_id = $1 RETURNING *",
      [room_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Chat room not found" });
    }

    // 모든 메시지 상태 업데이트
    await database.query(
      "UPDATE chat_message SET status = 'deleted' WHERE room_id = $1",
      [room_id]
    );

    return res.status(200).json({
      message: "Chat room and its messages soft deleted successfully",
      chatRoom: result.rows[0],
    });
  } catch (error) {
    console.error("Database query error:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getMessages = async (req, res) => {
  const { room_id } = req.params; // URL 파라미터에서 방 ID 가져오기

  try {
    const result = await database.query(
      "SELECT * FROM chat_message WHERE room_id = $1 ORDER BY timestamp ASC",
      [room_id]
    );

    res.status(200).json(result.rows); // 메시지 목록 반환
  } catch (error) {
    res.status(500).json({ error: error.message }); // 에러 발생 시 메시지 반환
  }
};
