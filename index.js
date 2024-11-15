const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const socketIo = require("socket.io");
const pool = require('./database/database'); // PostgreSQL 연결 풀 가져오기

require("dotenv").config();

const app = express();
const PORT = 8000;

const allowedOrigins = [process.env.REACT_APP_FRONT_URL , 'http://localhost:3000'];

app.use(cors());

app.options("*", cors()); // OPTIONS 요청 허용

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 명시적 CORS 헤더 추가
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.REACT_APP_FRONT_URL , "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const server = app.listen(PORT, () =>
  console.log(`Server is running on port ${PORT}`)
);

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});


app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(require('./routes/authRoutes'));
app.use(require('./routes/chatRoutes'));
app.use(require('./routes/trainerRoutes'));
app.use(require('./routes/userRoutes'));
app.use(require('./routes/authTokenRoutes'));
app.use(require('./routes/refundRoutes'));
app.use(require('./routes/scheduleRoutes'));
app.use(require('./routes/paymentsRoutes'));

const cache = {};

// 메시지 저장을 위한 함수 (데이터베이스에 연결)
async function saveMessagesToDatabase(roomId) {
  const messages = cache[roomId];
  if (!messages || messages.length === 0) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const query =
      'INSERT INTO chat_message (room_id, sender_name, content) VALUES ($1, $2, $3)';
    for (const message of messages) {
      console.log(
        `Saving message - Room ID: ${roomId}, Sender Name: ${message.sender_name}, Content: ${message.content}`
      );
      await client.query(query, [roomId, message.sender_name, message.content]);
    }
    await client.query('COMMIT');
    cache[roomId] = []; // 캐시 초기화
    console.log(`Messages for room ${roomId} saved to database.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error saving messages for room ${roomId}:`, error);
  } finally {
    client.release();
  }
}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRoom', (roomId) => {
    if (!socket.rooms.has(roomId)) {
      socket.join(roomId);
      console.log(`User joined room: ${roomId}`);
    }
  });


  socket.on('sendMessage', (message) => {
    console.log('Received message:', message); // 메시지 로깅 추가
    const { roomId, senderName, content, timestamp } = message;

    if (!cache[roomId]) cache[roomId] = [];
    const isDuplicate = cache[roomId].some(
      (msg) =>
        msg.content === content &&
        msg.senderName === senderName &&
        msg.timestamp === timestamp
    );

    if (!isDuplicate) {
      cache[roomId].push(message);
      io.to(roomId).emit('messageReceived', message);
    }
  });

  socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId);
    console.log(`User left room: ${roomId}`);
    saveMessagesToDatabase(roomId);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const rooms = Array.from(socket.rooms).filter((room) => room !== socket.id);
    rooms.forEach((roomId) => saveMessagesToDatabase(roomId));
  });
});
