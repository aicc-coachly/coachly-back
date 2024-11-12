// database.js
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

// 채팅방 리스트 조회
const getChatRoomsByUserOrTrainer = async (userNumber, trainerNumber) => {
  let query, values;
  if (userNumber) {
    query = "SELECT * FROM chat_room WHERE user_number = $1 AND status = true"; // status가 true인 경우만 조회
    values = [userNumber];
  } else if (trainerNumber) {
    query =
      "SELECT * FROM chat_room WHERE trainer_number = $1 AND status = true"; // status가 true인 경우만 조회
    values = [trainerNumber];
  } else {
    throw new Error(
      "user_number 또는 trainer_number 중 하나는 제공되어야 합니다."
    );
  }
  const result = await pool.query(query, values);
  return result.rows;
};

// 특정 채팅방 조회
const getChatRoomByUserAndTrainer = async (userNumber, trainerNumber) => {
  const query = `
    SELECT * FROM chat_room
    WHERE user_number = $1 AND trainer_number = $2 AND status = true
  `;
  const result = await pool.query(query, [userNumber, trainerNumber]);
  return result.rows[0];
};
// 모든 함수를 포함한 module.exports 객체 생성
module.exports = {
  pool, // pool도 내보내기
  getChatRoomsByUserOrTrainer,
  getChatRoomByUserAndTrainer,

  // 채팅방 생성
  createChatRoom: async (user_number, trainer_number = null, type) => {
    const query = trainer_number
      ? "INSERT INTO chat_room (user_number, trainer_number, type) VALUES ($1, $2, $3) RETURNING *"
      : "INSERT INTO chat_room (user_number, type) VALUES ($1, $2) RETURNING *";
    const values = trainer_number
      ? [user_number, trainer_number, type]
      : [user_number, type];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // 메시지 저장
  saveMessage: async (room_id, sender_name, content) => {
    const query =
      "INSERT INTO chat_message (room_id, sender_name, content) VALUES ($1, $2, $3) RETURNING *";
    const values = [room_id, sender_name, content];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // 메시지 목록 조회
  getMessages: async (room_id) => {
    const query =
      "SELECT * FROM chat_message WHERE room_id = $1 ORDER BY timestamp ASC";
    const result = await pool.query(query, [room_id]);
    return result.rows;
  },

  // // 메시지 읽음 상태 업데이트
  // markMessageAsRead: async (message_number) => {
  //   const query = "UPDATE chat_message SET status = 'read' WHERE message_number = $1 RETURNING *";
  //   const result = await pool.query(query, [message_number]);
  //   return result.rows[0];
  // },

  // // 메시지 삭제 (soft delete)
  // deleteMessage: async (message_number) => {
  //   const query = "UPDATE chat_message SET status = 'deleted' WHERE message_number = $1 RETURNING *";
  //   const result = await pool.query(query, [message_number]);
  //   return result.rows[0];
  // },

  // // 채팅방 비활성화
  // deactivateChatRoom: async (room_id) => {
  //   const query = "UPDATE chat_room SET status = 'deleted', delete_at = CURRENT_TIMESTAMP WHERE room_id = $1 RETURNING *";
  //   const result = await pool.query(query, [room_id]);
  //   return result.rows[0];
  // },

  // 채팅방 유형 확인
  getChatRoomType: async (room_id) => {
    const query = "SELECT type FROM chat_room WHERE room_id = $1";
    const result = await pool.query(query, [room_id]);
    return result.rows[0]?.type;
  },
};

module.exports = pool; // pool 객체를 내보내기
