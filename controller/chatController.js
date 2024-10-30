const path = require("path");
const { spawn } = require("child_process");

exports.handleChatRequest = (req, res) => {
  const sendQuestion = req.body.question;
  console.log(sendQuestion);

  const execPython = path.join(__dirname, "..", "aichat.py");
  const pythonPath = path.join(
    "C:",
    "conda",
    "envs",
    "recom_env",
    "python.exe"
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
