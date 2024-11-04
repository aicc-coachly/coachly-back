const router = require("express").Router();

const { authMiddleware } = require("../middleware/authMiddleware");

// 보호된 라우트
router.get("/protected", authMiddleware);

module.exports = router;
