const database = require("../database/database");

exports.getTrainers = async (req, res) => {
  try {
    const result = await database.query("SELECT * FROM trainers");
    return res.status(200).json(result.rows);
  } catch (error) {
    return res.status(500).json({ msg: "Get Items Fail" + error });
  }
};

exports.getTrainer = async (req, res) => {
  const { trainer_number } = req.params;

  try {
    const result = await database.query(
      "SELECT * FROM trainers WHERE trainer_number = $1",
      [trainer_number]
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    return res.status(500).json({ msg: "Get Items Fail" + error });
  }
};

exports.getTrainerPtAmount = async (req, res) => {
  const { trainer_number } = req.params; // URL 파라미터에서 trainer_number를 가져옵니다.

  try {
    const result = await database.query(
      "SELECT * FROM pt_amount WHERE trainer_number = $1",
      [trainer_number]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "PT amount information not found for this trainer" });
    }

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Database query error:", error);
    return res.status(500).json({
      message: "Failed to get PT amount information",
      error: error.message,
    });
  }
};

exports.getTrainerGymAddress = async (req, res) => {
  const { trainer_number } = req.params; // URL 파라미터에서 trainer_number를 가져옵니다.

  try {
    const result = await database.query(
      "SELECT * FROM gym_address WHERE trainer_number = $1",
      [trainer_number]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Gym Address information not found for this trainer",
      });
    }

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Database query error:", error);
    return res.status(500).json({
      message: "Failed to get PT amount information",
      error: error.message,
    });
  }
};

exports.getTrainerAccount = async (req, res) => {
  const { trainer_number } = req.params; // URL 파라미터에서 trainer_number를 가져옵니다.

  try {
    const result = await database.query(
      "SELECT * FROM trainer_account WHERE trainer_number = $1",
      [trainer_number]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Trainer Account information not found for this trainer",
      });
    }

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Database query error:", error);
    return res.status(500).json({
      message: "Failed to get PT amount information",
      error: error.message,
    });
  }
};

exports.deleteTrainer = async (req, res) => {
  const { trainer_number } = req.params;

  try {
    const result = await database.query(
      "UPDATE trainers SET status = FALSE, delete_at = CURRENT_TIMESTAMP WHERE trainer_number = $1 RETURNING *",
      [trainer_number]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Trainer not found" });
    }

    return res.status(200).json({
      message: "Trainer soft deleted successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Database query error:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteTrainerPtamount = async (req, res) => {
  const { trainer_number } = req.params;

  try {
    const result = await database.query(
      "UPDATE pt_amount SET status = FALSE, delete_at = CURRENT_TIMESTAMP WHERE trainer_number = $1 RETURNING *",
      [trainer_number]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Trainer not found" });
    }

    return res.status(200).json({
      message: "PT Amount information soft deleted successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Database query error:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteTrainerAddress = async (req, res) => {
  const { trainer_number } = req.params;

  try {
    const result = await database.query(
      "UPDATE gym_address SET status = FALSE, delete_at = CURRENT_TIMESTAMP WHERE trainer_number = $1 RETURNING *",
      [trainer_number]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Gym address not found" });
    }

    return res.status(200).json({
      message: "Gym address deleted successfully",
      address: result.rows[0],
    });
  } catch (error) {
    console.error("Database query error:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteTrainerAccount = async (req, res) => {
  const { trainer_number } = req.params;

  try {
    const result = await database.query(
      "UPDATE trainer_account SET status = FALSE, delete_at = CURRENT_TIMESTAMP WHERE trainer_number = $1 RETURNING *",
      [trainer_number]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Trainer Account not found" });
    }

    return res.status(200).json({
      message: "Trainer Account deleted successfully",
      address: result.rows[0],
    });
  } catch (error) {
    console.error("Database query error:", error);
    return res.status(500).json({ error: error.message });
  }
};
