const database = require("../database/database");

// 유효한 트레이너 번호인지 확인하는 함수
const isValidTrainerNumber = async (trainer_number) => {
  const result = await database.query(
    "SELECT * FROM trainers WHERE trainer_number = $1",
    [trainer_number]
  );
  return result.rows.length > 0;
};

// 업데이트 공통 로직
const updateDatabase = async (query, params, notFoundMessage) => {
  const result = await database.query(query, params);
  if (result.rows.length === 0) {
    throw new Error(notFoundMessage);
  }
  return result.rows[0];
};

exports.updateTrainerInfo = async (req, res) => {
  const { trainer_number } = req.params;
  const { name, phone } = req.body; // birth는 제거

  try {
    // 트레이너 존재 여부 확인
    if (!(await isValidTrainerNumber(trainer_number))) {
      return res.status(404).json({ message: "Trainer not found" });
    }

    // 트레이너 정보 업데이트
    const updatedTrainer = await database.query(
      `UPDATE trainers 
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           updated_at = CURRENT_TIMESTAMP
       WHERE trainer_number = $3 AND status = 'active'
       RETURNING *`,
      [name, phone, trainer_number]
    );

    if (updatedTrainer.rows.length === 0) {
      return res.status(404).json({ message: "Trainer not found or inactive" });
    }

    res.status(200).json({
      message: "Trainer basic information updated successfully",
      trainer: updatedTrainer.rows[0],
    });
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateTrainerAddress = async (req, res) => {
  const { trainer_number } = req.params;
  const { trainer_address, trainer_detail_address } = req.body;

  try {
    if (!(await isValidTrainerNumber(trainer_number))) {
      return res.status(404).json({ message: "Trainer address not found" });
    }

    const updatedAddress = await updateDatabase(
      `UPDATE gym_address 
       SET trainer_address = COALESCE($1, trainer_address),
           trainer_detail_address = COALESCE($2, trainer_detail_address),
           updated_at = CURRENT_TIMESTAMP
       WHERE trainer_number = $3
       RETURNING *`,
      [trainer_address, trainer_detail_address, trainer_number],
      "Trainer address not found"
    );

    res.status(200).json({
      message: "Trainer address updated successfully",
      address: updatedAddress,
    });
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateTrainerPtAmount = async (req, res) => {
  const { trainer_number } = req.params;
  const { option, amount, frequency } = req.body;

  try {
    if (!(await isValidTrainerNumber(trainer_number))) {
      return res
        .status(404)
        .json({ message: "PT amount information not found" });
    }

    const updatedPtAmount = await updateDatabase(
      `UPDATE pt_cost_option 
       SET amount = COALESCE($1, amount),
           frequency = COALESCE($2, frequency),
           updated_at = CURRENT_TIMESTAMP
       WHERE trainer_number = $3 AND option = $4
       RETURNING *`,
      [amount, frequency, trainer_number, option],
      "PT amount information not found"
    );

    res.status(200).json({
      message: "PT amount information updated successfully",
      ptAmount: updatedPtAmount,
    });
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateTrainerAccount = async (req, res) => {
  const { trainer_number } = req.params;
  const { account, bank_name, account_name } = req.body;

  try {
    if (!(await isValidTrainerNumber(trainer_number))) {
      return res
        .status(404)
        .json({ message: "Trainer account information not found" });
    }

    const updatedAccount = await updateDatabase(
      `UPDATE trainer_bank_account 
       SET account = COALESCE($1, account),
           bank_name = COALESCE($2, bank_name),
           account_name = COALESCE($3, account_name),
           updated_at = CURRENT_TIMESTAMP
       WHERE trainer_number = $4
       RETURNING *`,
      [account, bank_name, account_name, trainer_number],
      "Trainer account information not found"
    );

    res.status(200).json({
      message: "Trainer account information updated successfully",
      account: updatedAccount,
    });
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateTrainerImage = async (req, res) => {
  const { trainer_number } = req.params;
  const { resume } = req.body;
  const trainer_image = req.file ? req.file.path : null; // 이미지 파일 업로드 경로

  try {
    // 트레이너 존재 여부 확인
    if (!(await isValidTrainerNumber(trainer_number))) {
      return res.status(404).json({ message: "Trainer not found" });
    }

    // 트레이너 이미지 및 이력서 업데이트
    const updatedImageAndResume = await updateDatabase(
      `UPDATE trainer_image 
       SET image = COALESCE($1, image),
           resume = COALESCE($2, resume),
           updated_at = CURRENT_TIMESTAMP
       WHERE trainer_number = $3
       RETURNING *`,
      [trainer_image, resume, trainer_number],
      "Trainer image and resume information not found"
    );
    // console.log(updatedImageAndResume);

    res.status(200).json({
      message: "Trainer image and resume updated successfully",
      data: updatedImageAndResume,
    });
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateTrainerStatus = async (req, res) => {
  const { trainer_number } = req.params;
  const { status } = req.body;

  if (!["active", "inactive"].includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    // 트레이너 존재 여부 확인
    if (!(await isValidTrainerNumber(trainer_number))) {
      return res.status(404).json({ message: "Trainer not found" });
    }

    // 트레이너 상태 업데이트
    const updatedTrainer = await database.query(
      `UPDATE trainers 
       SET status = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE trainer_number = $2
       RETURNING *`,
      [status, trainer_number]
    );

    if (updatedTrainer.rows.length === 0) {
      return res.status(404).json({ message: "Trainer not found" });
    }

    res.status(200).json({
      message: `Trainer status updated to ${status} successfully`,
      trainer: updatedTrainer.rows[0],
    });
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({ error: error.message });
  }
};
