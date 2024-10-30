const database = require("../../database/database");
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.trainerSignup = async (req, res) => {
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

    return res.status(200).json({ message: "Trainer registered successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Database query error:", error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

exports.trainerLogin = async (req, res) => {
  const { trainer_id, pass } = req.body;
  console.log("test", trainer_id, pass);

  try {
    await database.query(
      "SELECT * FROM trainers WHERE trainer_id = $1 AND pass = $2",
      [trainer_id, pass]
    );

    return res.status(200).json({ message: "signin Successfully" });
  } catch (error) {
    console.error("Database query error:", error);
    return res.status(500).json({ error: error.message });
  }
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

    // 비밀번호 해싱
    const hashedPass = await bcrypt.hash(pass, 10);

    // 사용자 기본 정보 삽입
    const userResult = await client.query(
      "INSERT INTO users (user_id, pass, email, name, birth, phone, gender) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING user_number",
      [user_id, hashedPass, email, name, birth, phone, gender]
    );

    const user_number = userResult.rows[0].user_number;

    // 사용자 주소 정보 삽입
    await client.query(
      "INSERT INTO user_address (user_number, user_zipcode, user_address, user_detail_address) VALUES ($1, $2, $3, $4)",
      [user_number, user_zipcode, user_address, user_detail_address]
    );

    await client.query("COMMIT");

    return res
      .status(200)
      .json({ message: "사용자가 성공적으로 등록되었습니다." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("데이터베이스 쿼리 오류:", error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

exports.userLogin = async (req, res) => {
  const { user_id, pass } = req.body;

  try {
    const result = await database.query(
      "SELECT * FROM users WHERE user_id = $1",
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "잘못된 자격 증명입니다." });
    }

    const user = result.rows[0];

    // 해싱된 비밀번호와 입력된 비밀번호 비교
    const isMatch = await bcrypt.compare(pass, user.pass);

    if (!isMatch) {
      return res.status(401).json({ error: "잘못된 자격 증명입니다." });
    }

    // JWT 생성
    const token = jwt.sign(
      { user_id: user.user_id, user_number: user.user_number },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({ message: "로그인 성공", token });
  } catch (error) {
    console.error("데이터베이스 쿼리 오류:", error);
    return res.status(500).json({ error: error.message });
  }
};
