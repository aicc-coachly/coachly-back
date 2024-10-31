const express = require("express"); // express 모듈 가져오기
const cors = require("cors"); // cors 모듈 가져오기
const PORT = 8080;
const { spawn } = require("child_process");
const path = require("path");
const socketIo = require("socket.io");
const bodyParser = require("body-parser");
const schedule = require("node-schedule");
require("dotenv").config();

const app = express(); // express 모듈을 사용하기 위해 app 변수에 할당한다.
const server = app.listen(PORT, () =>
  console.log(`Server is running on ${PORT}`)
);
// const io = socketIo(server);

app.get("/", (req, res) => {
  res.send("");
});

app.use(cors()); //htpp, https 프로토콜을 사용하는 서버 간의 통신을 허용한다.
app.use(express.json()); // express 모듈의 json() 메소드를 사용한다.
app.use(bodyParser.json());

app.use(require("./routes/authRoutes"));
app.use(require("./routes/chatRoutes"));
app.use(require("./routes/trainerRoutes"));
app.use(require("./routes/userRoutes"));
app.use(require("./routes/authTokenRoutes"));
app.use(require("./routes/refundRoutes"));
app.use(require("./routes/scheduleRoutes"));
app.use(require("./routes//paymentsRoutes"));

// const job = schedule.scheduleJob('15 12 * * *', () => {
//   console.log('점심 먹을 시간이야 !');
// });

// app.listen(PORT, () => console.log(`Server is running on ${PORT}`));
