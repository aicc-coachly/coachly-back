const database = require("../database/database");
const CoolsmsMessageService = require("coolsms-node-sdk").default; // CoolSMS 가져오기
const messageService = new CoolsmsMessageService(
  process.env.SMS_API_KEY,
  process.env.SMS_SECRET_KEY,
  { mode: 'test' }
);
const nodemailer = require("nodemailer");


// Nodemailer 설정
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.postPtSchedule = async (req, res) => {
  const { pt_number, class_date, class_time, address } = req.body;
  const client = await database.connect();

  // Nodemailer 설정
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await client.query('BEGIN');

    // pt_schedule 및 관련 정보 조회
    const ptScheduleResult = await client.query(
      `SELECT 
         pt_schedule.trainer_number,
         pt_schedule.user_number,
         pt_cost_option.frequency,
         users.phone AS user_phone,
         trainers.phone AS trainer_phone
       FROM pt_schedule
       JOIN pt_cost_option ON pt_cost_option.amount_number = pt_schedule.amount_number
       JOIN users ON users.user_number = pt_schedule.user_number
       JOIN trainers ON trainers.trainer_number = pt_schedule.trainer_number
       WHERE pt_schedule.pt_number = $1`,
      [pt_number]
    );

    if (ptScheduleResult.rows.length === 0) {
      throw new Error('PT 스케줄을 찾을 수 없습니다.');
    }

    const {
      trainer_number,
      user_number,
      frequency,
      user_phone,
      trainer_phone,
    } = ptScheduleResult.rows[0];

    // 새로운 스케줄 등록
    const result = await client.query(
      `INSERT INTO schedule_records (class_date, class_time, address, pt_number) 
       VALUES ($1, $2, $3, $4) 
       RETURNING schedule_number`,
      [class_date, class_time, address, pt_number]
    );

    const scheduleNumber = result.rows[0].schedule_number;

    // 등록된 수업 횟수 확인
    const scheduleCountResult = await client.query(
      `SELECT COUNT(*) AS count 
       FROM schedule_records 
       WHERE pt_number = $1`,
      [pt_number]
    );

    const registeredCount = parseInt(scheduleCountResult.rows[0].count, 10);

    // 횟수와 등록 횟수가 일치할 경우, pt_schedule 상태를 "completed"로 업데이트
    if (registeredCount === frequency) {
      await client.query(
        `UPDATE pt_schedule 
         SET status = 'completed' 
         WHERE pt_number = $1`,
        [pt_number]
      );
    }

    // (1) 유저 이메일 조회
    const userQuery = "SELECT email FROM users WHERE user_number = $1";

    const { rows: userRows } = await client.query(userQuery, [user_number]);
    const userEmail = userRows[0]?.email;

    if (!userEmail) {
      throw new Error('User email not found');

    }

    // (2) 이메일 내용 설정
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: "새로운 PT 수업 일정이 등록되었습니다",

      html: `
        <h1>PT 수업 일정이 등록되었습니다!</h1>
        <p><strong>일정 날짜:</strong> ${class_date}</p>
        <p><strong>일정 시간:</strong> ${class_time}</p>
        <p><strong>장소:</strong> ${address}</p>
        <p>더 자세한 내용은 앱에서 확인하세요.</p>
      `,
    };

    // (3) 이메일 전송
    await transporter.sendMail(mailOptions);


    await client.query("COMMIT");

    // 문자 메시지 전송 (회원과 트레이너에게)
    const messagePromises = [
      messageService.sendOne({
        to: user_phone, // 사용자 전화번호
        from: "01094137012", // 발신 번호 (인증된 번호)
        text: `회원님, ${class_date} ${class_time}에 PT 수업이 예약되었습니다.`,
      }),
      messageService.sendOne({
        to: trainer_phone, // 트레이너 전화번호
        from: "01094137012", // 발신 번호 (인증된 번호)
        text: `트레이너님, ${class_date} ${class_time}에 PT 수업이 예약되었습니다.`,
      }),
    ];

    // 문자 전송 결과 확인
    await Promise.all(messagePromises)
      .then((results) => {
        results.forEach((res) => console.log("문자 전송 성공:", res));
      })
      .catch((err) => {
        console.error("문자 전송 오류:", err);
      });

    // 성공 응답 반환
    res.status(201).json({
      message: "PT schedule record created successfully and messages sent",

      schedule_number: scheduleNumber,
      registeredCount,
      totalSessions: frequency,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating PT schedule record or sending email:', error);
    res
      .status(500)
      .json({ error: 'Failed to create PT schedule record or send email' });
  } finally {
    client.release();
  }
};

exports.completePtSchedule = async (req, res) => {
  const { schedule_number } = req.params;

  try {
    // 1. PT 스케줄 레코드 상태를 'completed'로 변경
    await database.query(
      "UPDATE schedule_records SET status = 'completed' WHERE schedule_number = $1",
      [schedule_number]
    );

    // 2. PT 스케줄 테이블에서 관련 PT 번호 가져오기
    const ptNumberResult = await database.query(
      'SELECT pt_number FROM schedule_records WHERE schedule_number = $1',
      [schedule_number]
    );

    if (ptNumberResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: 'PT 스케줄 정보를 찾을 수 없습니다.' });
    }

    const { pt_number } = ptNumberResult.rows[0];

    // 3. PT 스케줄 테이블 상태를 'completed'로 변경
    await database.query(
      "UPDATE pt_schedule SET status = 'completed' WHERE pt_number = $1",
      [pt_number]
    );

    // 4. 트레이너의 계좌 정보를 조회
    const trainerInfoResult = await database.query(
      'SELECT p.trainer_number, b.trainer_account_number FROM pt_schedule p JOIN trainer_bank_account b ON p.trainer_number = b.trainer_number WHERE p.pt_number = $1',
      [pt_number]
    );

    if (trainerInfoResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: '트레이너 정보를 찾을 수 없습니다.' });
    }

    const { trainer_account_number } = trainerInfoResult.rows[0];

    // 5. 페이 체크 테이블에 기록 추가
    await database.query(
      'INSERT INTO paycheck (schedule_number, trainer_account_number) VALUES ($1, $2)',
      [schedule_number, trainer_account_number]
    );

    return res.status(200).json({ message: 'PT Schedule marked as completed' });
  } catch (error) {
    console.error('Error completing PT schedule:', error);
    return res.status(500).json({ error: 'Failed to complete PT schedule' });
  }
};

exports.completePaycheck = async (req, res) => {
  const { paycheck_number } = req.params;

  try {
    // 페이 체크 상태를 'completed'로 변경
    await database.query(
      'UPDATE paycheck SET status = TRUE WHERE paycheck_number = $1',
      [paycheck_number]
    );

    return res.status(200).json({ message: 'Paycheck marked as completed' });
  } catch (error) {
    console.error('Error completing paycheck:', error);
    return res.status(500).json({ error: 'Failed to complete paycheck' });
  }
};

exports.updatePtSchedule = async (req, res) => {
  const { schedule_number } = req.params;
  const { class_date, class_time, address } = req.body;

  try {
    // PT 스케줄 업데이트
    const result = await database.query(
      'UPDATE schedule_records SET class_date = $1, class_time = $2, address = $3, updated_at = NOW() WHERE schedule_number = $4',
      [class_date, class_time, address, schedule_number]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    return res
      .status(200)
      .json({ message: 'PT Schedule updated successfully' });
  } catch (error) {
    console.error('Error updating PT schedule:', error);
    return res.status(500).json({ error: 'Failed to update PT schedule' });
  }
};

exports.deletePtSchedule = async (req, res) => {
  const { schedule_number } = req.params;
  const { status } = req.body;

  console.log('Updating schedule with status:', status);

  // 상태가 'deleted'일 경우 delete_at을 현재 시간으로 업데이트
  const updateValues = [status];
  let query = 'UPDATE schedule_records SET status = $1';

  if (status === 'deleted') {
    query += ', delete_at = CURRENT_TIMESTAMP'; // delete_at을 현재 시간으로 설정
  }

  query += ' WHERE schedule_number = $2';
  updateValues.push(schedule_number);

  try {
    const result = await database.query(query, updateValues);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // schedule_number로 pt_number 조회
    const ptQuery = `
      SELECT pt_number 
      FROM schedule_records 
      WHERE schedule_number = $1
    `;
    const ptResult = await database.query(ptQuery, [schedule_number]);
    if (ptResult.rows.length === 0) {
      return res.status(404).json({ message: "PT number not found" });
    }
    const pt_number = ptResult.rows[0].pt_number;

    // pt_number로 pt_schedule 테이블에서 user_number와 trainer_number 조회
    const ptScheduleQuery = `
      SELECT user_number, trainer_number 
      FROM pt_schedule 
      WHERE pt_number = $1
    `;
    const ptScheduleResult = await database.query(ptScheduleQuery, [pt_number]);
    if (ptScheduleResult.rows.length === 0) {
      return res.status(404).json({ message: "User and trainer not found" });
    }
    const { user_number, trainer_number } = ptScheduleResult.rows[0];

    // user_number와 trainer_number로 phone 컬럼 조회
    const userPhoneQuery = `
      SELECT phone, name
      FROM users 
      WHERE user_number = $1
    `;
    const trainerPhoneQuery = `
      SELECT phone, name
      FROM trainers 
      WHERE trainer_number = $1
    `;
    const userPhoneResult = await database.query(userPhoneQuery, [user_number]);
    const trainerPhoneResult = await database.query(trainerPhoneQuery, [
      trainer_number,
    ]);

    if (
      userPhoneResult.rows.length === 0 ||
      trainerPhoneResult.rows.length === 0
    ) {
      return res.status(404).json({ message: "Phone numbers not found" });
    }
    const userPhone = userPhoneResult.rows[0].phone;
    const trainerPhone = trainerPhoneResult.rows[0].phone;
    const userName = userPhoneResult.rows[0].name;
    const trainerName = trainerPhoneResult.rows[0].name;

    // 일정 취소 메시지 생성
    // const messageContent = `안녕하세요, 일정이 취소되었습니다. 자세한 내용은 담당자에게 문의하세요.`;

    // 메시지 전송
    const messagePromises = [
      messageService.sendOne({
        to: userPhone, // 사용자 전화번호
        from: "01094137012", // 발신 번호 (인증된 번호)
        text: `${userName}님, PT 수업이 취소되었습니다.`,
      }),
      messageService.sendOne({
        to: trainerPhone, // 트레이너 전화번호
        from: "01094137012", // 발신 번호 (인증된 번호)
        text: `${trainerName}님, PT 수업이 취소되었습니다.`,
      }),
    ];

    // 문자 전송 결과 확인
    await Promise.all(messagePromises)
      .then((results) => {
        results.forEach((res) => console.log("문자 전송 성공:", res));
      })
      .catch((err) => {
        console.error("문자 전송 오류:", err);
      });

    return res.status(200).json({
      message: "PT Schedule status updated and notification sent successfully",
    });
  } catch (error) {
    console.error("Error updating PT schedule or sending SMS:", error);
    return res
      .status(500)
      .json({ error: "Failed to update PT schedule or send notification" });

  }
};

exports.getScheduleRecords = async (req, res) => {
  const { pt_number } = req.params;

  try {
    // pt_schedule 정보, 트레이너 이름, 유저 이름, 총 세션 수(frequency), amount 정보 가져오기
    const ptScheduleResult = await database.query(
      `SELECT 
          ps.pt_number,
          ps.status,
          ps.created_at,
          ps.trainer_number,
          ps.user_number,
          u.name AS user_name,
          t.name AS trainer_name,
          p.amount,
          p.frequency
       FROM 
          pt_schedule ps
       JOIN 
          users u ON ps.user_number = u.user_number
       JOIN 
          trainers t ON ps.trainer_number = t.trainer_number
       JOIN 
          pt_cost_option p ON ps.amount_number = p.amount_number
       WHERE 
          ps.pt_number = $1`,
      [pt_number]
    );

    if (ptScheduleResult.rows.length === 0) {
      return res.status(404).json({ message: 'PT 스케줄을 찾을 수 없습니다.' });
    }

    const ptScheduleData = ptScheduleResult.rows[0];

    // schedule_records와 유저, 트레이너 정보 조인하여 가져오기
    const scheduleRecordsResult = await database.query(
      `SELECT 
          sr.schedule_number,
          sr.class_date,
          sr.class_time,
          sr.address,
          sr.status,  -- status 추가
          sr.created_at,
          u.name AS user_name,
          u.user_number AS user_number,
          t.name AS trainer_name,
          t.trainer_number AS trainer_number
       FROM 
          schedule_records sr
       JOIN 
          pt_schedule ps ON sr.pt_number = ps.pt_number
       LEFT JOIN 
          users u ON ps.user_number = u.user_number
       LEFT JOIN 
          trainers t ON ps.trainer_number = t.trainer_number
       WHERE 
          sr.pt_number = $1
       ORDER BY 
          sr.class_date, sr.class_time`,
      [pt_number]
    );

    const scheduleRecords = scheduleRecordsResult.rows;

    res.status(200).json({
      pt_schedule: ptScheduleData,
      schedule_records: scheduleRecords,
    });
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Failed to fetch schedule records' });
  }
};
