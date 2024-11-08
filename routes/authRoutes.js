const router = require("express").Router();
const multer = require("multer");
const path = require("path");

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const trainerName = req.body.name;
    const formattedName = trainerName.replace(/ /g, "_");
    const uniqueFileName = `${formattedName}_${Date.now()}${path.extname(
      file.originalname
    )}`;
    cb(null, uniqueFileName);
  },
});

const upload = multer({ storage: storage });

const {
  trainerSignup,
  userSignup,
  userLogin,
  trainerLogin,
} = require("../controller/authController");

// 트레이너 회원가입
router.post("/trainer/signup", upload.single("trainer_image"), trainerSignup);

// 트레이너 로그인
router.post("/trainer/login", trainerLogin);

// 사용자 회원가입
router.post("/user/signup", userSignup);

// 사용자 로그인
router.post("/user/login", userLogin);

module.exports = router;
