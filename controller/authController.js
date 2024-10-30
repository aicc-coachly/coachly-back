const database = require("../../database/database");
const multer = require("multer");
const path = require("path");

// Multer 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/uploads"); // 업로드 폴더 지정
  },
  filename: function (req, file, cb) {
    cb(null, "trainer_" + Date.now() + path.extname(file.originalname)); // 파일명 설정
  },
});

const upload = multer({ storage: storage });

exports.trainerSignup = async (req, res) => {
  upload.single("trainerImage")(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: err.message });
    }

    const {
      trainer_id,
      pass,
      name,
      birth,
      phone,
      gender,
      resume,
      trainer_zipcode,
      trainer_address,
      trainer_detail_address,
      option,
      amount,
      frequency,
      account,
      bank_name,
      account_name,
      service_options, // 선택된 서비스 옵션 배열
    } = req.body;
    const trainerImage = req.file ? req.file.path : null;

    // 서비스 옵션 유효성 검사
    if (!Array.isArray(service_options) || service_options.length > 2) {
      return res.status(400).json({
        error: "Invalid service options. Please select up to 2 options.",
      });
    }

    const client = await database.connect();

    try {
      await client.query("BEGIN");

      // 트레이너 기본 정보 삽입
      const trainerResult = await client.query(
        "INSERT INTO trainers (trainer_id, pass, name, birth, gender, phone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING trainer_number",
        [trainer_id, pass, name, birth, gender, phone]
      );

      const trainer_number = trainerResult.rows[0].trainer_number;

      // 트레이너 이미지 정보 삽입
      await client.query(
        "INSERT INTO trainer_image (image, resume) VALUES ($1, $2)",
        [trainerImage, resume]
      );

      // 헬스장 주소 정보 삽입
      await client.query(
        "INSERT INTO gym_address (trainer_zipcode, trainer_address, trainer_detail_address) VALUES ($1, $2, $3)",
        [trainer_zipcode, trainer_address, trainer_detail_address]
      );

      // PT 가격 정보 삽입
      await client.query(
        "INSERT INTO pt_amount (option, amount, frequency) VALUES ($1, $2, $3)",
        [option, amount, frequency]
      );

      // 트레이너 계좌 정보 삽입
      await client.query(
        "INSERT INTO trainer_account (account, bank_name, account_name) VALUES ($1, $2, $3)",
        [account, bank_name, account_name]
      );

      // 서비스 옵션은 이미 데이터베이스에 존재하며, 외래키 관계만으로 연결됩니다.
      // 따라서 여기서 추가적인 삽입 작업은 필요 없습니다.

      await client.query("COMMIT");

      return res
        .status(200)
        .json({ message: "Trainer registered successfully" });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Database query error:", error);
      return res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  });
};

exports.userSignup = async (req, res) => {
  const {
    user_id,
    pass,
    email,
    name,
    birth,
    phone,
    gender,
    user_zipcode,
    user_address,
    user_detail_address,
  } = req.body;

  const client = await database.connect();

  try {
    await client.query("BEGIN");

    // 사용자 기본 정보 삽입
    const userResult = await client.query(
      "INSERT INTO users (user_id, pass, email, name, birth, phone, gender) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING user_number",
      [user_id, pass, email, name, birth, phone, gender]
    );

    const user_number = userResult.rows[0].user_number;

    // 사용자 주소 정보 삽입
    await client.query(
      "INSERT INTO user_address (user_zipcode, user_address, user_detail_address) VALUES ($1, $2, $3)",
      [user_zipcode, user_address, user_detail_address]
    );

    await client.query("COMMIT");

    return res.status(200).json({ message: "User registered successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Database query error:", error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

exports.userLogin = async (req, res) => {
  const { user_id, pass } = req.body;
  console.log("test", user_id, pass);

  try {
    await database.query(
      "SELECT * FROM users WHERE user_id = $1 AND pass = $2",
      [user_id, pass]
    );

    return res.status(200).json({ message: "signin Successfully" });
  } catch (error) {
    console.error("Database query error:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.trainerLogin = async (req, res) => {
  const { user_id, pass } = req.body;
  console.log("test", user_id, pass);

  try {
    await database.query(
      "SELECT * FROM users WHERE user_id = $1 AND pass = $2",
      [user_id, pass]
    );

    return res.status(200).json({ message: "signin Successfully" });
  } catch (error) {
    console.error("Database query error:", error);
    return res.status(500).json({ error: error.message });
  }
};
