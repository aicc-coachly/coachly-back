const router = require("express").Router();
const multer = require("multer");
const path = require("path");

// Multer 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads")); // 상대 경로 사용
  },
  filename: function (req, file, cb) {
    cb(null, "trainer_" + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

const {
  trainerSignup,
  userSignup,
  userLogin,
  trainerLogin,
} = require("../controller/authController");
const { authMiddleware } = require("../middleware/authMiddleware");

// 트레이너 회원가입
router.post("/trainer/signup", upload.single("trainerImage"), trainerSignup);
// 사용자 회원가입
router.post("/user/signup", userSignup);
// 사용자 로그인
router.post("/user/login", userLogin);
// 트레이너 로그인
router.post("/trainer/login", trainerLogin);
router.get("/protected", authMiddleware);

module.exports = router;
