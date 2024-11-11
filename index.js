const express = require("express");
const cors = require("cors");
const PORT = 8000;
const path = require("path");
const socketIo = require("socket.io");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const server = app.listen(PORT, () => console.log(`Server is running on ${PORT}`));

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header", "Content-Type"],
    credentials: true,
  },
});

// chatController에 io 객체 전달
const chatController = require("./controller/chatController");
chatController.initializeIo(io);

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  socket.on("sendMessage", (message) => {
    io.to(message.roomId).emit("messageReceived", message);
  });

  socket.on("leaveRoom", (roomId) => {
    socket.leave(roomId);
    console.log(`User left room: ${roomId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("server");
});

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

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
