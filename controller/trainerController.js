const database = require("../database/database");

exports.getTrainers = async (req, res) => {
  try {
    const result = await database.query(`
      SELECT 
        t.*, 
        ARRAY_AGG(DISTINCT jsonb_build_object(
            'amount_number', p.amount_number,  -- amount_number 추가
            'option', p.option, 
            'amount', p.amount, 
            'frequency', p.frequency
        )) AS pt_cost_options,  -- 가격 옵션 필드 추가
        g.trainer_address, 
        g.trainer_detail_address,
        ti.resume AS resume,
        ti.image AS image, -- 이미지 필드 추가
        ARRAY_AGG(DISTINCT s.service_name) AS service_options
      FROM trainers t
      LEFT JOIN pt_cost_option p ON t.trainer_number = p.trainer_number
      LEFT JOIN gym_address g ON t.trainer_number = g.trainer_number
      LEFT JOIN trainer_image ti ON t.trainer_number = ti.trainer_number
      LEFT JOIN service_link sl ON t.trainer_number = sl.trainer_number
      LEFT JOIN service_option s ON sl.service_number = s.service_number
      GROUP BY
        t.trainer_number, 
        g.trainer_address, 
        g.trainer_detail_address, 
        ti.resume, 
        ti.image -- 추가된 필드에 대한 GROUP BY
    `);

    return res.status(200).json(result.rows);
  } catch (error) {
    return res.status(500).json({ msg: "Get Trainers Fail: " + error });
  }
};

exports.getTrainer = async (req, res) => {
  const { trainer_number } = req.params;

  try {
    const result = await database.query(
      `SELECT 
        t.*, 
        ARRAY_AGG(DISTINCT jsonb_build_object(
            'option', p.option, 
            'amount', p.amount, 
            'frequency', p.frequency
        )) AS pt_cost_options, 
        g.trainer_address, 
        g.trainer_detail_address, 
        ti.resume AS resume,
        ti.image AS image,  
        ARRAY_AGG(DISTINCT s.service_name) AS service_options,
        jsonb_build_object(
          'bank_name', ba.bank_name,
          'account', ba.account,
          'account_name', ba.account_name
        ) AS bank_account  -- 계좌 정보 추가
      FROM 
        trainers t
      LEFT JOIN 
        pt_cost_option p ON t.trainer_number = p.trainer_number
      LEFT JOIN 
        gym_address g ON t.trainer_number = g.trainer_number
      LEFT JOIN 
        trainer_image ti ON t.trainer_number = ti.trainer_number
      LEFT JOIN 
        service_link sl ON t.trainer_number = sl.trainer_number
      LEFT JOIN 
        service_option s ON sl.service_number = s.service_number
      LEFT JOIN 
        trainer_bank_account ba ON t.trainer_number = ba.trainer_number  -- 계좌 정보 조인
      WHERE 
        t.trainer_number = $1
      GROUP BY 
        t.trainer_number, g.trainer_address, g.trainer_detail_address, ti.resume, ti.image, ba.bank_name, ba.account, ba.account_name`,
      [trainer_number]
    );

    // 결과가 없을 경우 처리
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "트레이너를 찾을 수 없습니다." });
    }

    return res.status(200).json(result.rows[0]); // 첫 번째 결과만 반환
  } catch (error) {
    return res.status(500).json({
      msg: "트레이너 정보를 가져오는 데 실패했습니다." + error.message,
    });
  }
};

exports.getTrainerPtAmount = async (req, res) => {
  const { trainer_number } = req.params; // URL 파라미터에서 trainer_number를 가져옵니다.

  try {
    console.log(`Fetching PT amount for trainer number: ${trainer_number}`); // 로깅 추가

    const result = await database.query(
      "SELECT * FROM pt_cost_option WHERE trainer_number = $1",
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
      "SELECT * FROM trainer_bank_account WHERE trainer_number = $1",
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
    // 트레이너 상태를 false로 업데이트 및 delete_at 설정
    const result = await database.query(
      "UPDATE trainers SET status = deleted, delete_at = CURRENT_TIMESTAMP WHERE trainer_number = $1 RETURNING *",
      [trainer_number]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Trainer not found" });
    }

    // 관련된 피티 가격 정보의 상태를 false로 업데이트 및 delete_at 설정
    await database.query(
      "UPDATE pt_cost_option SET status = FALSE, delete_at = CURRENT_TIMESTAMP WHERE trainer_number = $1",
      [trainer_number]
    );

    // 관련된 헬스장 주소의 상태를 false로 업데이트 및 delete_at 설정
    await database.query(
      "UPDATE gym_address SET status = FALSE, delete_at = CURRENT_TIMESTAMP WHERE trainer_number = $1",
      [trainer_number]
    );

    // 추가적으로 필요한 테이블이 있다면 여기에 추가

    return res.status(200).json({
      message: "Trainer soft deleted successfully",
      trainer: result.rows[0],
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
