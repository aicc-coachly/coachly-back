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

module.exports = {
  // 채팅방 생성
  createChatRoom: async (user_number, trainer_number = null, type) => {
    const query = trainer_number
      ? "INSERT INTO chat_room (user_number, trainer_number, type) VALUES ($1, $2, $3) RETURNING *"
      : "INSERT INTO chat_room (user_number, type) VALUES ($1, $2) RETURNING *";
    const values = trainer_number ? [user_number, trainer_number, type] : [user_number, type];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // 메시지 저장
  saveMessage: async (room_id, sender_name, content) => {
    const query = "INSERT INTO chat_message (room_id, sender_name, content) VALUES ($1, $2, $3) RETURNING *";
    const values = [room_id, sender_name, content];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // 메시지 목록 조회
  getMessages: async (room_id) => {
    const query = "SELECT * FROM chat_message WHERE room_id = $1 ORDER BY timestamp ASC";
    const result = await pool.query(query, [room_id]);
    return result.rows;
  },

  // 메시지 읽음 상태 업데이트
  markMessageAsRead: async (message_number) => {
    const query = "UPDATE chat_message SET status = 'read' WHERE message_number = $1 RETURNING *";
    const result = await pool.query(query, [message_number]);
    return result.rows[0];
  },

  // 메시지 삭제 (soft delete)
  deleteMessage: async (message_number) => {
    const query = "UPDATE chat_message SET status = 'deleted' WHERE message_number = $1 RETURNING *";
    const result = await pool.query(query, [message_number]);
    return result.rows[0];
  },

  // 채팅방 비활성화
  deactivateChatRoom: async (room_id) => {
    const query = "UPDATE chat_room SET status = 'deleted', delete_at = CURRENT_TIMESTAMP WHERE room_id = $1 RETURNING *";
    const result = await pool.query(query, [room_id]);
    return result.rows[0];
  },

  // 채팅방 유형 확인
  getChatRoomType: async (room_id) => {
    const query = "SELECT type FROM chat_room WHERE room_id = $1";
    const result = await pool.query(query, [room_id]);
    return result.rows[0]?.type;
  }
};

// 주석추가
module.exports = pool; // {} 로 감쌀 경우 pool 변수를 적어서 사용해야 한다.
