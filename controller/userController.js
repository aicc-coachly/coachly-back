const database = require('../database/database');

exports.postUserInbody = async (req, res) => {
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
    await database.query(
      'INSERT INTO user_inbody (user_height, user_weight, user_body_fat_percentage, user_body_fat_mass, user_muscle_mass, user_metabolic_rate, user_abdominal_fat_amount, user_visceral_fat_level, user_total_body_water, user_protein, user_measurement_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
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
      ]
    );

    return res.status(200).json({
      status: 'success',
      message: 'Inbody information saved successfully',
    });
  } catch (error) {
    console.error('Database query error:', error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const result = await database.query('SELECT * FROM users');
    return res.status(200).json(result.rows);
  } catch (error) {
    return res.status(500).json({ msg: 'Get Items Fail' + error });
  }
};

exports.getUserPage = async (req, res) => {
  const user_id = req.params.user_id;

  try {
    // 사용자 정보와 주소 정보 조회
    const result = await database.query(
      `
      SELECT 
        u.user_number,
        u.user_id,
        u.user_name,
        u.user_email,
        u.user_date_of_birth,
        u.user_phone,
        u.user_gender,
        a.user_zipcode,
        a.user_address,
        a.user_detail_address
      FROM users u
      LEFT JOIN user_address a ON u.user_number = a.user_number
      WHERE u.user_id = $1
      `,
      [user_id]
    );

    // 사용자가 존재하지 않을 경우 처리
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: '사용자를 찾을 수 없습니다.' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    return res
      .status(500)
      .json({ msg: '사용자 정보를 가져오는 데 실패했습니다.' + error.message });
  }
};

exports.getUserInbody = async (req, res) => {
  const user_id = req.params.user_id;

  try {
    // 사용자 번호를 가져오는 쿼리
    const userResult = await database.query(
      'SELECT user_number FROM users WHERE user_id = $1',
      [user_id]
    );

    // 사용자가 존재하지 않을 경우 처리
    if (userResult.rows.length === 0) {
      return res.status(404).json({ msg: '사용자를 찾을 수 없습니다.' });
    }

    const user_number = userResult.rows[0].user_number;

    // 인바디 정보를 가져오는 쿼리 (user_number를 외래키로 사용)
    const inbodyResult = await database.query(
      'SELECT * FROM user_inbody WHERE user_inbody_number = $1', // user_inbody_number가 아닌 user_number를 사용해야 합니다
      [user_number]
    );

    // 사용자의 인바디 정보가 없을 경우 처리
    if (inbodyResult.rows.length === 0) {
      return res
        .status(404)
        .json({ msg: '사용자의 인바디 정보를 찾을 수 없습니다.' });
    }

    return res.status(200).json(inbodyResult.rows);
  } catch (error) {
    return res
      .status(500)
      .json({ msg: '인바디 정보를 가져오는 데 실패했습니다.' + error.message });
  }
};

exports.deleteUser = async (req, res) => {
  const { user_number } = req.params;

  try {
    // 유저 상태를 false로 업데이트
    const result = await database.query(
      'UPDATE users SET status = FALSE, delete_at = CURRENT_TIMESTAMP WHERE user_number = $1 RETURNING *',
      [user_number]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 관련된 인바디 정보의 상태를 false로 업데이트
    await database.query(
      'UPDATE user_inbody SET status = FALSE WHERE user_number = $1',
      [user_number]
    );

    // 관련된 주소 정보의 상태를 false로 업데이트
    await database.query(
      'UPDATE user_address SET status = FALSE WHERE user_number = $1',
      [user_number]
    );

    // 추가적으로 필요한 테이블이 있다면 여기에 추가

    return res.status(200).json({
      status: 'success',
      message: 'User soft deleted successfully',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Database query error:', error);
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteUserInbody = async (req, res) => {
  const { user_number } = req.params;

  try {
    const result = await database.query(
      'UPDATE user_inbody SET status = FALSE, delete_at = CURRENT_TIMESTAMP WHERE user_number = $1 RETURNING *',
      [user_number]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      message: 'User inbody information soft deleted successfully',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Database query error:', error);
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteUserAddress = async (req, res) => {
  const { user_number } = req.params;

  try {
    const result = await database.query(
      'UPDATE user_address SET status = FALSE, delete_at = CURRENT_TIMESTAMP WHERE user_number = $1 RETURNING *',
      [user_number]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User address not found' });
    }

    return res.status(200).json({
      status: 'success',
      message: 'User address soft deleted successfully',
      address: result.rows[0],
    });
  } catch (error) {
    console.error('Database query error:', error);
    return res.status(500).json({ error: error.message });
  }
};
