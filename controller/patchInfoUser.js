const database = require('../database/database');

// 사용자 기본 정보 업데이트
exports.updateUserInfo = async (req, res) => {
  const user_number = parseInt(req.params.user_number, 10); // URL에서 user_number를 정수로 변환
  const { email, name, phone, gender } = req.body;

  try {
    // 유효한 user_number인지 확인
    const userCheck = await database.query(
      'SELECT * FROM users WHERE user_number = $1',
      [user_number]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await database.query(
      "UPDATE users SET email = COALESCE(NULLIF($1, ''), email), name = COALESCE(NULLIF($2, ''), name), phone = COALESCE(NULLIF($3, ''), phone), gender = COALESCE(NULLIF($4, ''), gender), updated_at = CURRENT_TIMESTAMP WHERE user_number = $5 RETURNING *",
      [email, name, phone, gender, user_number]
    );

    return res.status(200).json({
      status: 'success',
      message: 'User information updated successfully',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Database query error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// 사용자 주소 정보 업데이트
exports.updateUserAddress = async (req, res) => {
  const { user_number } = req.params;
  const { user_zipcode, user_address, user_detail_address } = req.body;

  try {
    // 유효한 user_number인지 확인
    const userCheck = await database.query(
      'SELECT * FROM user_address WHERE user_number = $1',
      [user_number]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User address not found' });
    }

    const result = await database.query(
      'UPDATE user_address SET user_zipcode = COALESCE($1, user_zipcode), user_address = COALESCE($2, user_address), user_detail_address = COALESCE($3, user_detail_address), updated_at = CURRENT_TIMESTAMP WHERE user_number = $4 RETURNING *',
      [user_zipcode, user_address, user_detail_address, user_number]
    );

    return res.status(200).json({
      status: 'success',
      message: 'User address updated successfully',
      address: result.rows[0],
    });
  } catch (error) {
    console.error('Database query error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// 사용자 인바디 정보 업데이트
exports.updateUserInbody = async (req, res) => {
  const { user_number } = req.params;
  const {
    user_height,
    user_weight,
    user_body_fat_percentage,
    user_body_fat_mass,
    user_muscle_mass,
    user_metabolic_rate,
    user_abdominal_fat_amount,
    user_visceral_fat_level,
    user_total_body_water,
    user_protein,
    user_measurement_date,
  } = req.body;

  try {
    // 유효한 user_number인지 확인
    const userCheck = await database.query(
      'SELECT * FROM user_inbody WHERE user_number = $1',
      [user_number]
    );

    if (userCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ error: 'User inbody information not found' });
    }

    const result = await database.query(
      `UPDATE user_inbody SET 
        user_height = COALESCE($1, user_height),
        user_weight = COALESCE($2, user_weight),
        user_body_fat_percentage = COALESCE($3, user_body_fat_percentage),
        user_body_fat_mass = COALESCE($4, user_body_fat_mass),
        user_muscle_mass = COALESCE($5, user_muscle_mass),
        user_metabolic_rate = COALESCE($6, user_metabolic_rate),
        user_abdominal_fat_amount = COALESCE($7, user_abdominal_fat_amount),
        user_visceral_fat_level = COALESCE($8, user_visceral_fat_level),
        user_total_body_water = COALESCE($9, user_total_body_water),
        user_protein = COALESCE($10, user_protein),
        user_measurement_date = COALESCE($11, user_measurement_date),
        updated_at = CURRENT_TIMESTAMP
      WHERE user_number = $12 RETURNING *`,
      [
        user_height,
        user_weight,
        user_body_fat_percentage,
        user_body_fat_mass,
        user_muscle_mass,
        user_metabolic_rate,
        user_abdominal_fat_amount,
        user_visceral_fat_level,
        user_total_body_water,
        user_protein,
        user_measurement_date,
        user_number,
      ]
    );

    return res.status(200).json({
      status: 'success',
      message: 'User inbody information updated successfully',
      inbody: result.rows[0],
    });
  } catch (error) {
    console.error('Database query error:', error);
    return res.status(500).json({ error: error.message });
  }
};
