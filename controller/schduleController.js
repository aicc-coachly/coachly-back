const database = require("../../database/database");

exports.postPtSchedule = async (req, res) => {
  const { class_date, class_time, class_address } = req.body;

  try {
    await database.query(
      "INSERT INTO schedule_records (class_date, class_time, class_address) VALUES ($1, $2, $3)",
      [class_date, class_time, class_address]
    );
    return res
      .status(200)
      .json({ message: "PT Schedule information saved successfully" });
  } catch (error) {
    console.error("Database query error:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getPtSchedules = async (req, res) => {
  const {
    schedule_number,
    user_number,
    trainer_number,
    start_date,
    end_date,
    status,
  } = req.query;
  let query = await database.query("SELECT * FROM schedule_records WHERE 1=1");
  const values = [];
  let paramCount = 1;

  // 특정 일정 번호로 조회å
  if (schedule_number) {
    query += ` AND schedule_number = $${paramCount}`;
    values.push(schedule_number);
    paramCount++;
  }

  // 특정 사용자의 일정 조회
  if (user_number) {
    query += ` AND user_number = $${paramCount}`;
    values.push(user_number);
    paramCount++;
  }

  // 특정 트레이너의 일정 조회
  if (trainer_number) {
    query += ` AND trainer_number = $${paramCount}`;
    values.push(trainer_number);
    paramCount++;
  }

  // 날짜 범위로 조회
  if (start_date) {
    query += ` AND class_date >= $${paramCount}`;
    values.push(start_date);
    paramCount++;
  }
  if (end_date) {
    query += ` AND class_date <= $${paramCount}`;
    values.push(end_date);
    paramCount++;
  }

  // 특정 상태의 일정 조회
  if (status) {
    query += ` AND status = $${paramCount}`;
    values.push(status);
    paramCount++;
  }

  // 정렬 (최신 일정부터)
  query += " ORDER BY class_date DESC, time DESC";

  try {
    const result = await database.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No schedules found" });
    }

    return res.status(200).json({
      message: "PT schedules retrieved successfully",
      schedules: result.rows,
    });
  } catch (error) {
    console.error("Database query error:", error);
    return res.status(500).json({ error: "Failed to retrieve PT schedules" });
  }
};
