const database = require("../database/database");

exports.postPtSchedule = async (req, res) => {
  const { schedule_number } = req.params;

  const { class_date, class_time, class_address } = req.body;

  try {
    // PT 스케줄 등록
    const result = await database.query(
      `UPDATE schedule_records 
       SET class_date = $1, 
           class_time = $2, 
           class_address = $3, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE schedule_number = $4`,
      [class_date, class_time, class_address, schedule_number]
    );

    return res.status(201).json({
      message: "PT Schedule information saved successfully",
      schedule_number: result.rows[0].schedule_number,
    });
  } catch (error) {
    console.error("Database query error:", error);
    return res.status(500).json({ error: error.message });
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
