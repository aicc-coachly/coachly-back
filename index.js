const express = require("express"); // express 모듈 가져오기
const cors = require("cors"); // cors 모듈 가져오기
const PORT = 8080;
const { spawn } = require("child_process");
const path = require("path");
const socketIo = require("socket.io");
const bodyParser = require("body-parser");
const schedule = require("node-schedule");

const app = express(); // express 모듈을 사용하기 위해 app 변수에 할당한다.
const server = app.listen(PORT, () =>
  console.log(`Server is running on ${PORT}`)
);
// const io = socketIo(server);

app.use(cors()); //htpp, https 프로토콜을 사용하는 서버 간의 통신을 허용한다.
app.use(express.json()); // express 모듈의 json() 메소드를 사용한다.
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("");
});

// const job = schedule.scheduleJob('15 12 * * *', () => {
//   console.log('점심 먹을 시간이야 !');
// });

app.post("/chat", (req, res) => {
  const sendQuestion = req.body.question;
  console.log(sendQuestion);

  const execPython = path.join(__dirname, "aichat.py");
  const pythonPath = path.join(
    "C:",
    "conda",
    "envs",
    "recom_env",
    "python.exe"
  );

  const net = spawn(pythonPath, [execPython, sendQuestion]);

  output = "";

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
});

// app.listen(PORT, () => console.log(`Server is running on ${PORT}`));
