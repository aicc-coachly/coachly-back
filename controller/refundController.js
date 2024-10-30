const database = require("../config/database"); // 데이터베이스 연결 설정 파일

// 환불 요청 생성 (환불 사유 포함)
exports.createRefundRequest = async (req, res) => {
  const { account, account_name, bank_name, refund_reason } = req.body;

  try {
    // 트랜잭션 시작
    await database.query("BEGIN");

    // user_refund 테이블에 데이터 삽입
    const refundResult = await database.query(
      "INSERT INTO user_refund (account, account_name, bank_name) VALUES ($1, $2, $3) RETURNING refund_number",
      [account, account_name, bank_name]
    );

    const refund_number = refundResult.rows[0].refund_number;

    // user_refund_reason 테이블에 데이터 삽입
    await database.query(
      "INSERT INTO user_refund_reason (refund_reason) VALUES ($1)",
      [refund_reason]
    );

    // 트랜잭션 커밋
    await database.query("COMMIT");

    return res.status(201).json({
      message: "환불 요청이 성공적으로 생성되었습니다.",
      refund_number: refund_number,
    });
  } catch (error) {
    // 오류 발생 시 트랜잭션 롤백
    await database.query("ROLLBACK");
    console.error("데이터베이스 쿼리 오류:", error);
    return res.status(500).json({ error: error.message });
  }
};

// 특정 환불 요청 조회 (환불 사유 포함)
exports.getRefundRequest = async (req, res) => {
  const { refund_number } = req.params;

  try {
    const result = await database.query(
      `SELECT ur.*, urr.refund_reason 
       FROM user_refund ur
       LEFT JOIN user_refund_reason urr ON ur.refund_number = urr.refund_number
       WHERE ur.refund_number = $1`,
      [refund_number]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "해당 환불 요청을 찾을 수 없습니다." });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("데이터베이스 쿼리 오류:", error);
    return res.status(500).json({ error: error.message });
  }
};

// 모든 환불 요청 목록 조회 (환불 사유 포함)
exports.getAllRefundRequests = async (req, res) => {
  try {
    const result = await database.query(
      `SELECT ur.*, urr.refund_reason 
       FROM user_refund ur
       LEFT JOIN user_refund_reason urr ON ur.refund_number = urr.refund_number
       ORDER BY ur.refund_date DESC`
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("데이터베이스 쿼리 오류:", error);
    return res.status(500).json({ error: error.message });
  }
};

// 환불 요청 수정 (환불 사유 포함)
exports.updateRefundRequest = async (req, res) => {
  const { refund_number } = req.params;
  const { account, account_name, bank_name, refund_reason } = req.body;

  try {
    // 트랜잭션 시작
    await database.query("BEGIN");

    // user_refund 테이블 업데이트
    await database.query(
      "UPDATE user_refund SET account = $1, account_name = $2, bank_name = $3 WHERE refund_number = $4",
      [account, account_name, bank_name, refund_number]
    );

    // user_refund_reason 테이블 업데이트
    await database.query(
      "UPDATE user_refund_reason SET refund_reason = $1 WHERE refund_number = $2",
      [refund_reason, refund_number]
    );

    // 트랜잭션 커밋
    await database.query("COMMIT");

    return res
      .status(200)
      .json({ message: "환불 요청이 성공적으로 수정되었습니다." });
  } catch (error) {
    // 오류 발생 시 트랜잭션 롤백
    await database.query("ROLLBACK");
    console.error("데이터베이스 쿼리 오류:", error);
    return res.status(500).json({ error: error.message });
  }
};
