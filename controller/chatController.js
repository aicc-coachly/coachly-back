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
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 메시지 전송
// 메시지 전송
exports.sendMessage = async (req, res) => {
  const { room_id } = req.params;
  const { content } = req.body;
  const sender_number = req.user.id; // 예시: 로그인한 사용자의 ID를 가져옴

  try {
    const result = await database.query(
      "INSERT INTO chat_message (sender_name, content, room_id) VALUES ($1, $2, $3) RETURNING *",
      [sender_number, content, room_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
