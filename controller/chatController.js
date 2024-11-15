const path = require("path");
const { spawn } = require("child_process");
const pool = require("../database/database"); // pool만 가져오기


let io; // io 객체를 저장할 변수
const chatCache = {}; // room_id별 메시지를 저장하는 캐시 객체

// io 객체 초기화 함수
exports.initializeIo = (socketIo) => {
  io = socketIo;
};

// 채팅방 리스트 조회
exports.getChatRooms = async (req, res) => {
  const userNumber = req.query.userNumber || null;
  const trainerNumber = req.query.trainerNumber || null;

  console.log("userNumber:", userNumber);
  console.log("trainerNumber:", trainerNumber);

  if (!userNumber && !trainerNumber) {
    return res.status(400).json({ error: "user_number 또는 trainer_number 중 하나는 제공되어야 합니다." });
  }

  const client = await pool.connect();
  try {
    let query, values;
    if (userNumber) {
      query = `
        SELECT cr.room_id, cr.user_number, cr.trainer_number, cr.status, t.name AS other_party_name
        FROM chat_room cr
        LEFT JOIN trainers t ON cr.trainer_number = t.trainer_number
        WHERE cr.user_number = $1 AND cr.status = 'active'
      `;
      values = [userNumber];
    } else {
      query = `
        SELECT cr.room_id, cr.user_number, cr.trainer_number, cr.status, u.name AS other_party_name
        FROM chat_room cr
        LEFT JOIN users u ON cr.user_number = u.user_number
        WHERE cr.trainer_number = $1 AND cr.status = 'active'
      `;
      values = [trainerNumber];
    }

    const result = await client.query(query, values);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching chat rooms:", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

// 특정 채팅방 조회
exports.getChatRoom = async (roomId, userNumber = null, trainerNumber = null) => {
  const client = await pool.connect();
  try {
    let query, values;

    if (userNumber !== null) {
      // 유저가 채팅방에 있는 경우, 트레이너의 이름을 가져옴
      query = `
        SELECT cr.room_id, cr.user_number, cr.trainer_number, cr.status, t.name AS other_party_name
        FROM chat_room cr
        LEFT JOIN trainers t ON cr.trainer_number = t.trainer_number
        WHERE cr.room_id = $1 AND cr.user_number = $2 AND cr.status = 'active'
      `;
      values = [roomId, userNumber];
    } else if (trainerNumber !== null) {
      // 트레이너가 채팅방에 있는 경우, 유저의 이름을 가져옴
      query = `
        SELECT cr.room_id, cr.user_number, cr.trainer_number, cr.status, u.name AS other_party_name
        FROM chat_room cr
        LEFT JOIN users u ON cr.user_number = u.user_number
        WHERE cr.room_id = $1 AND cr.trainer_number = $2 AND cr.status = 'active'
      `;
      values = [roomId, trainerNumber];
    } else {
      throw new Error("userNumber 또는 trainerNumber 중 하나는 제공되어야 합니다.");
    }

    console.log("Executing query:", query, "with values:", values);
    const result = await client.query(query, values);
    console.log("Query result:", result.rows);

    return result.rows[0] || null; // 결과가 없으면 null 반환
  } catch (error) {
    console.error("Error fetching specific chat room:", error);
    throw new Error(error.message);
  } finally {
    client.release();
  }
};


// 일반 채팅방 생성
exports.createChatRoom = async (req, res) => {
  const { user_number, trainer_number } = req.body;
  if (!user_number) {
    return res.status(400).json({ error: "user_number는 필수입니다." });
  }

  const client = await pool.connect();
  try {
    // 트레이너 여부 확인
    let type = "AI"; // 기본값: AI
    if (trainer_number) {
      const trainerCheckQuery = "SELECT * FROM trainers WHERE trainer_number = $1";
      const trainerCheckResult = await client.query(trainerCheckQuery, [trainer_number]);
      if (trainerCheckResult.rows.length > 0) {
        type = "trainer"; // 트레이너가 존재하면 타입을 트레이너로 설정
      }
    }

    // 기존 채팅방 여부 확인
    const checkQuery = "SELECT * FROM chat_room WHERE user_number = $1 AND trainer_number = $2";
    const checkResult = await client.query(checkQuery, [user_number, trainer_number || null]);

    if (checkResult.rows.length > 0) {
      return res.status(200).json(checkResult.rows[0]);
    }

    // 새로운 채팅방 생성
    const insertQuery = `
      INSERT INTO chat_room (user_number, trainer_number, type) 
      VALUES ($1, $2, $3) 
      RETURNING *`;
    const result = await client.query(insertQuery, [user_number, trainer_number || null, type]);
    const roomId = result.rows[0].room_id;

    // 시스템 메시지 생성
    const systemMessage = {
      roomId,
      content: type === "trainer" 
        ? "트레이너와의 채팅방입니다. 질문을 해보세요!" 
        : "AI와의 채팅방입니다. 무엇이든 물어보세요!",
      senderName: "시스템",
      timestamp: new Date(),
    };

    io.to(roomId).emit("messageReceived", systemMessage);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating chat room:", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};


// 메시지 목록 조회
exports.getMessages = async (req, res) => {
  const roomId = req.params.room_id;
  const client = await pool.connect();
  try {
    const query = `
      SELECT content, sender_name, timestamp 
      FROM chat_message 
      WHERE room_id = $1 
      ORDER BY timestamp ASC
    `;
    const result = await client.query(query, [roomId]);
    console.log("Query result:", result.rows); // 로깅하여 확인
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};


// 메시지 전송
exports.sendMessage = (req, res) => {
  const { room_id } = req.params;
  const { sender_name, content } = req.body;

  if (!chatCache[room_id]) {
    chatCache[room_id] = [];
  }

  const message = {
    sender_name,
    content,
    timestamp: new Date(),
  };
  chatCache[room_id].push(message);

  res.status(201).json({ message: "Message stored in memory" });
};

// 사용자가 채팅방을 나갈 때 대화 내용을 저장
exports.leaveChatRoom = async (req, res) => {
  const { room_id } = req.params;

  // 캐시에 메시지가 있는지 확인
  if (!chatCache[room_id] || chatCache[room_id].length === 0) {
    return res.status(200).json({ message: "No messages to save" });
  }

  const client = await pool.connect();
  try {
    // 캐시에서 메시지 가져오기
    const messages = chatCache[room_id];

    // 여러 메시지를 한 번에 저장하는 트랜잭션
    await client.query("BEGIN");
    const query = "INSERT INTO chat_message (room_id, sender_name, content) VALUES ($1, $2, $3)";

    for (let message of messages) {
      await client.query(query, [room_id, message.sender_name, message.content]);
    }

    // 트랜잭션 커밋
    await client.query("COMMIT");

    // 메시지를 저장 후 캐시에서 삭제
    delete chatCache[room_id];
    res.status(200).json({ message: "Messages saved to database and removed from memory" });
  } catch (error) {
    // 오류 발생 시 트랜잭션 롤백
    await client.query("ROLLBACK");
    console.error("Error saving messages:", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

