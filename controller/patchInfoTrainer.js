const database = require("../../database/database");

exports.updateTrainerInfo = async (req, res) => {
  const { trainer_number } = req.params;
  const { name, birth, phone, gender } = req.body;

  try {
    const result = await database.query(
      `UPDATE trainers 
       SET name = COALESCE($1, name),
           birth = COALESCE($2, birth),
           phone = COALESCE($3, phone),
           gender = COALESCE($4, gender),
           updated_at = CURRENT_TIMESTAMP
       WHERE trainer_number = $5
       RETURNING *`,
      [name, birth, phone, gender, trainer_number]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Trainer not found" });
    }

    res.status(200).json({
      message: "Trainer basic information updated successfully",
      trainer: result.rows[0],
    });
  } catch (error) {
    console.error("Database query error:", error);
    res
      .status(500)
      .json({ error: "Failed to update trainer basic information" });
  }
};

exports.updateTrainerAddress = async (req, res) => {
  const { trainer_number } = req.params;
  const { trainer_zipcode, trainer_address, trainer_detail_address } = req.body;

  try {
    const result = await database.query(
      `UPDATE gym_address 
       SET trainer_zipcode = COALESCE($1, trainer_zipcode),
           trainer_address = COALESCE($2, trainer_address),
           trainer_detail_address = COALESCE($3, trainer_detail_address),
           updated_at = CURRENT_TIMESTAMP
       WHERE trainer_number = $4
       RETURNING *`,
      [trainer_zipcode, trainer_address, trainer_detail_address, trainer_number]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Trainer address not found" });
    }

    res.status(200).json({
      message: "Trainer address updated successfully",
      address: result.rows[0],
    });
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({ error: "Failed to update trainer address" });
  }
};

exports.updateTrainerPtAmount = async (req, res) => {
  const { trainer_number } = req.params;
  const { option, amount, frequency } = req.body;

  try {
    const result = await database.query(
      `UPDATE pt_amount 
       SET option = COALESCE($1, option),
           amount = COALESCE($2, amount),
           frequency = COALESCE($3, frequency),
           updated_at = CURRENT_TIMESTAMP
       WHERE trainer_number = $4
       RETURNING *`,
      [option, amount, frequency, trainer_number]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "PT amount information not found" });
    }

    res.status(200).json({
      message: "PT amount information updated successfully",
      ptAmount: result.rows[0],
    });
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({ error: "Failed to update PT amount information" });
  }
};

exports.updateTrainerAccount = async (req, res) => {
  const { trainer_number } = req.params;
  const { account, bank_name, account_name } = req.body;

  try {
    const result = await database.query(
      `UPDATE trainer_account 
       SET account = COALESCE($1, account),
           bank_name = COALESCE($2, bank_name),
           account_name = COALESCE($3, account_name),
           updated_at = CURRENT_TIMESTAMP
       WHERE trainer_number = $4
       RETURNING *`,
      [account, bank_name, account_name, trainer_number]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Trainer account information not found" });
    }

    res.status(200).json({
      message: "Trainer account information updated successfully",
      account: result.rows[0],
    });
  } catch (error) {
    console.error("Database query error:", error);
    res
      .status(500)
      .json({ error: "Failed to update trainer account information" });
  }
};
