const database = require("../database/database");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();
const CoolsmsMessageService = require("coolsms-node-sdk").default;

async function connectDatabase() {
  return await database.connect();
}

const messageService = new CoolsmsMessageService(
  process.env.SMS_API_KEY,
  process.env.SMS_SECRET_KEY,
  { mode: 'test' }
);

exports.trainerSignup = async (req, res) => {
  const {
    trainer_id,
    pass,
    name,
    phone,
    gender,
    resume,
    trainer_address,
    trainer_detail_address,
    account,
    bank_name,
    account_name,
    service_options,
    price_options,
  } = req.body;

  // Multer에서 업로드된 파일의 경로를 상대 경로로 변환
  const trainer_image = req.file ? `uploads/${req.file.filename}` : null;

  // 서비스 옵션 유효성 검사
  if (!Array.isArray(service_options) || service_options.length > 2) {
    return res
      .status(400)
      .json({ error: "서비스 옵션은 최대 2개까지 선택 가능합니다." });
  }

  // 가격 옵션 유효성 검사
  if (!Array.isArray(price_options) || price_options.length === 0) {
    return res
      .status(400)
      .json({ error: "최소 하나의 가격 옵션이 필요합니다." });
  }

  const client = await connectDatabase();

  try {
    await client.query("BEGIN");

    const hashedPass = await bcrypt.hash(pass, 10);

    const trainerResult = await client.query(
      "INSERT INTO trainers (trainer_id, pass, name, gender, phone) VALUES ($1, $2, $3, $4, $5) RETURNING trainer_number",
      [trainer_id, hashedPass, name, gender, phone]
    );

    const trainer_number = trainerResult.rows[0].trainer_number;

    // 트레이너 이미지와 이력서 저장
    await client.query(
      "INSERT INTO trainer_image (trainer_number, image, resume) VALUES ($1, $2, $3)",
      [trainer_number, trainer_image, resume]
    );

    await client.query(
      "INSERT INTO gym_address (trainer_number, trainer_address, trainer_detail_address) VALUES ($1, $2, $3)",
      [trainer_number, trainer_address, trainer_detail_address]
    );

    // 가격 정보 삽입
    for (const option of price_options) {
      const { option: optionName, amount, frequency } = JSON.parse(option);
      await client.query(
        "INSERT INTO pt_cost_option (trainer_number, option, amount, frequency) VALUES ($1, $2, $3, $4)",
        [trainer_number, optionName, amount, frequency]
      );
    }

    await client.query(
      "INSERT INTO trainer_bank_account (trainer_number, account, bank_name, account_name) VALUES ($1, $2, $3, $4)",
      [trainer_number, account, bank_name, account_name]
    );

    // 서비스 옵션 삽입
    for (const service_number of service_options) {
      await client.query(
        "INSERT INTO service_link (service_number, trainer_number) VALUES ($1, $2)",
        [service_number, trainer_number]
      );
    }

    await client.query("COMMIT");

    // 트레이너에게 회원가입 성공 메시지 전송
    await messageService
      .sendOne({
        to: phone,
        from: "01094137012", // 발신자 번호 (인증된 번호로 설정)
        text: `${name}님, 트레이너 회원가입이 완료되었습니다!`,
      })
      .then((res) => console.log(res));

    return res
      .status(200)
      .json({ message: "트레이너가 성공적으로 등록되었습니다." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("데이터베이스 쿼리 오류:", error);
    return res.status(500).json({ error: "서버 오류가 발생했습니다." });
  } finally {
    client.release();
  }
};

exports.trainerLogin = async (req, res) => {
  const { trainer_id, pass } = req.body;

  const client = await connectDatabase();

  try {
    const result = await client.query(
      "SELECT * FROM trainers WHERE trainer_id = $1",
      [trainer_id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "잘못된 자격 증명입니다." });
    }

    const trainer = result.rows[0];
    const isMatch = await bcrypt.compare(pass, trainer.pass);
    const trainer_number = trainer.trainer_number;

    if (!isMatch) {
      return res.status(401).json({ error: "잘못된 자격 증명입니다." });
    }

    const token = jwt.sign(
      {
        trainer_id: trainer.trainer_id,
        trainer_number: trainer.trainer_number,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res
      .status(200)
      .json({ message: "로그인 성공", trainer_number, trainer_id, token });
  } catch (error) {
    console.error("데이터베이스 쿼리 오류:", error);
    return res.status(500).json({ error: "서버 오류가 발생했습니다." });
  } finally {
    client.release();
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
    user_address,
    user_detail_address,
  } = req.body;

  const client = await connectDatabase();
  console.log("Received data:", req.body);

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
      "INSERT INTO user_address (user_number, user_address, user_detail_address) VALUES ($1, $2, $3)",
      [user_number, user_address, user_detail_address]
    );

    await client.query("COMMIT");

    await messageService
      .sendOne({
        to: phone,
        from: "01094137012", // 발신자 번호 (인증된 번호로 설정)
        text: `${name}님, coachly 회원가입이 완료되었습니다!`,
      })
      .then((res) => console.log(res));

    return res
      .status(200)
      .json({ message: "사용자가 성공적으로 등록되었습니다." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("데이터베이스 쿼리 오류:", error);
    return res.status(500).json({ error: "서버 오류가 발생했습니다." });
  } finally {
    client.release();
  }
};

exports.userLogin = async (req, res) => {
  const { user_id, pass } = req.body;

  const client = await connectDatabase();

  try {
    const result = await client.query(
      "SELECT * FROM users WHERE user_id = $1",
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "잘못된 자격 증명입니다." });
    }

    const user = result.rows[0];
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

    return res.status(200).json({
      message: "로그인 성공",
      user_number: user.user_number,
      user_id,
      token,
      user_name: user.name,
    });
  } catch (error) {
    console.error("데이터베이스 쿼리 오류:", error);
    return res.status(500).json({ error: "서버 오류가 발생했습니다." });
  } finally {
    client.release();
  }
};
