const express = require("express");
const router = express.Router();
const { handleChatRequest } = require("../controller/chatController");

router.post("/aichat", handleChatRequest);

module.exports = router;
