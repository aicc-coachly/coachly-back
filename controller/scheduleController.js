const database = require("../database/database");

exports.postPtSchedule = async (req, res) => {
  const { pt_number } = req.params; // PT 스케줄 번호
  const { class_date, class_time, class_address } = req.body;

  const client = await database.connect();

  try {
    await client.query("BEGIN");

    // 새로운 스케줄 등록
    const result = await client.query(
      `INSERT INTO schedule_records (class_date, time, address, pt_number) 
       VALUES ($1, $2, $3, $4) 
       RETURNING schedule_number`,
      [class_date, class_time, class_address, pt_number]
    );

    const scheduleNumber = result.rows[0].schedule_number;

    // pt_schedule에서 트레이너와 회원 정보 가져오기
    const ptScheduleResult = await client.query(
      `SELECT pt_schedule.trainer_number, pt_schedule.user_number, pt_cost_option.frequency
       FROM pt_schedule
       JOIN pt_cost_option ON pt_cost_option.amount_number = pt_schedule.amount_number
       WHERE pt_schedule.pt_number = $1`,
      [pt_number]
    );

    if (ptScheduleResult.rows.length === 0) {
      throw new Error("PT 스케줄을 찾을 수 없습니다.");
    }

    const { trainer_number, user_number, frequency } = ptScheduleResult.rows[0];

    // 현재 해당 pt_number의 등록된 수업 횟수 가져오기
    const scheduleCountResult = await client.query(
      `SELECT COUNT(*) as count 
       FROM schedule_records 
       WHERE pt_number = $1`,
      [pt_number]
    );

    const registeredCount = parseInt(scheduleCountResult.rows[0].count, 10) + 1;

    // 총 횟수와 등록된 횟수가 일치하면 pt_schedule 상태를 "completed"로 변경
    if (registeredCount === frequency) {
      await client.query(
        `UPDATE pt_schedule 
         SET status = 'completed' 
         WHERE pt_number = $1`,
        [pt_number]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({
      message: "PT schedule record created successfully",
      schedule_number: scheduleNumber,
      registeredCount,
      totalSessions: frequency,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating PT schedule record:", error);
    res.status(500).json({ error: "Failed to create PT schedule record" });
  } finally {
    client.release();
  }
};

exports.completePtSchedule = async (req, res) => {
  const { schedule_number } = req.params;

  try {
    // 1. PT 스케줄 상태를 'completed'로 변경
    await database.query(
      "UPDATE schedule_records SET status = 'completed' WHERE schedule_number = $1",
      [schedule_number]
    );

    // 2. 트레이너의 계좌 정보를 조회
    const trainerInfoResult = await database.query(
      "SELECT t.trainer_number, b.trainer_account_number FROM pt_schedule p JOIN trainer_bank_account b ON p.trainer_number = b.trainer_number WHERE p.pt_number = (SELECT pt_number FROM schedule_records WHERE schedule_number = $1)",
      [schedule_number]
    );

    if (trainerInfoResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "트레이너 정보를 찾을 수 없습니다." });
    }

    const { trainer_account_number } = trainerInfoResult.rows[0];

    // 3. 페이 체크 테이블에 기록 추가
    await database.query(
      "INSERT INTO paycheck (schedule_number, trainer_account_number) VALUES ($1, $2)",
      [schedule_number, trainer_account_number]
    );

    return res.status(200).json({ message: "PT Schedule marked as completed" });
  } catch (error) {
    console.error("Error completing PT schedule:", error);
    return res.status(500).json({ error: "Failed to complete PT schedule" });
  }
};

exports.completePaycheck = async (req, res) => {
  const { paycheck_number } = req.params;

  try {
    // 페이 체크 상태를 'completed'로 변경
    await database.query(
      "UPDATE paycheck SET status = TRUE WHERE paycheck_number = $1",
      [paycheck_number]
    );

    return res.status(200).json({ message: "Paycheck marked as completed" });
  } catch (error) {
    console.error("Error completing paycheck:", error);
    return res.status(500).json({ error: "Failed to complete paycheck" });
  }
};

exports.updatePtSchedule = async (req, res) => {
  const { schedule_number } = req.params;
  const { class_date, class_time, class_address } = req.body;

  try {
    // PT 스케줄 업데이트
    const result = await database.query(
      "UPDATE schedule_records SET class_date = $1, class_time = $2, class_address = $3 WHERE schedule_number = $4",
      [class_date, class_time, class_address, schedule_number]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    return res
      .status(200)
      .json({ message: "PT Schedule updated successfully" });
  } catch (error) {
    console.error("Error updating PT schedule:", error);
    return res.status(500).json({ error: "Failed to update PT schedule" });
  }
};

exports.deletePtSchedule = async (req, res) => {
  const { schedule_number } = req.params;

  try {
    // PT 스케줄 상태를 'deleted'로 변경 (소프트 삭제)
    const result = await database.query(
      "UPDATE schedule_records SET status = 'deleted', delete_at = CURRENT_TIMESTAMP WHERE schedule_number = $1",
      [schedule_number]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    return res
      .status(200)
      .json({ message: "PT Schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting PT schedule:", error);
    return res.status(500).json({ error: "Failed to delete PT schedule" });
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
      return res.status(404).json({ message: "PT 스케줄을 찾을 수 없습니다." });
    }

    const ptScheduleData = ptScheduleResult.rows[0];

    // schedule_records 정보 가져오기
    const scheduleRecordsResult = await database.query(
      `SELECT 
          sr.schedule_number,
          sr.class_date,
          sr.time,
          sr.address,
          sr.status,
          sr.created_at
       FROM 
          schedule_records sr
       WHERE 
          sr.pt_number = $1
       ORDER BY 
          sr.class_date, sr.time`,
      [pt_number]
    );

    const scheduleRecords = scheduleRecordsResult.rows;

    res.status(200).json({
      pt_schedule: ptScheduleData,
      schedule_records: scheduleRecords,
    });
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({ error: "Failed to fetch schedule records" });
  }
};
