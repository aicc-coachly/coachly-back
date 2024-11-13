const express = require("express");
const cors = require("cors");
const PORT = 8000;
const path = require("path");
const socketIo = require("socket.io");
require("dotenv").config();

const app = express();
const server = app.listen(PORT, () => console.log(`Server is running on ${PORT}`));

// 전역 캐시 객체 정의
const cache = {}; // 각 roomId별로 메시지를 저장할 객체

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header", "Content-Type"],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(require("./routes/authRoutes"));
app.use(require("./routes/chatRoutes"));
app.use(require("./routes/trainerRoutes"));
app.use(require("./routes/userRoutes"));
app.use(require("./routes/authTokenRoutes"));
app.use(require("./routes/refundRoutes"));
app.use(require("./routes/scheduleRoutes"));
app.use(require("./routes/paymentsRoutes"));

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    // 방 입장 확인 및 중복 입장 방지
    if (Array.from(socket.rooms).includes(roomId)) {
      console.log(`Socket ${socket.id} is already in room ${roomId}`);
      return; // 이미 방에 들어가 있으면 중복 입장 방지
    }

    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);

    // 기존의 sendMessage 리스너를 모두 제거하고 재등록
    socket.removeAllListeners("sendMessage");

    // 메시지 전송 이벤트 리스너 추가
    socket.on("sendMessage", (message) => {
      console.log("Received message at server:", message);

      // 캐시에 메시지가 중복 저장되지 않도록 방어 코드 추가
      if (!cache[message.roomId]) {
        cache[message.roomId] = [];
      }

      const existingMessage = cache[message.roomId].find(
        (msg) => msg.content === message.content && msg.senderId === message.senderId && msg.timestamp === message.timestamp
      );

      if (!existingMessage) { // 중복된 메시지가 없을 때만 캐시에 추가
        cache[message.roomId].push(message);
        io.to(message.roomId).emit("messageReceived", message);
      }
    });
  });

  // leaveRoom 이벤트 리스너 등록
  socket.on("leaveRoom", (roomId) => {
    socket.leave(roomId);
    console.log(`User left room: ${roomId}`);
    socket.removeAllListeners("sendMessage"); // 해당 리스너 제거
  });

  // 소켓 연결 해제 시 모든 리스너 제거
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    socket.removeAllListeners(); // 모든 리스너 제거
  });
});
