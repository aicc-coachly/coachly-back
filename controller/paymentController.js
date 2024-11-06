const database = require("../database/database");

exports.postPtPayment = async (req, res) => {
  const { amount_number, user_number, trainer_number, payment_option } =
    req.body;

  const client = await database.connect();

  try {
    await client.query("BEGIN");

    // PT 스케줄 생성
    const scheduleResult = await client.query(
      `INSERT INTO pt_schedule (status, amount_number, user_number, trainer_number) 
       VALUES ('progress', $1, $2, $3) 
       RETURNING pt_number`,
      [amount_number, user_number, trainer_number]
    );

    const pt_number = scheduleResult.rows[0].pt_number;

    // 결제 정보 생성
    await client.query(
      `INSERT INTO pt_payment (payment_option, pt_number) 
       VALUES ($1, $2)`,
      [payment_option, pt_number]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "PT schedule created and payment initiated",
      pt_number: pt_number,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating PT schedule and initiating payment:", error);
    res
      .status(500)
      .json({ error: "Failed to create PT schedule and initiate payment" });
  } finally {
    client.release();
  }
};

exports.ptPaymentCompleted = async (req, res) => {
  const { paymentKey, orderId, amount, status } = req.body;

  const client = await database.connect();

  try {
    await client.query("BEGIN");

    if (status === "DONE") {
      // pt_payment 테이블 업데이트
      const paymentResult = await client.query(
        `UPDATE pt_payment SET payments_status = TRUE 
         WHERE pt_number = $1
         RETURNING payment_number`,
        [orderId] // 여기서 orderId는 pt_number와 동일하다고 가정
      );

      if (paymentResult.rows.length === 0) {
        throw new Error("Payment not found");
      }

      const payment_number = paymentResult.rows[0].payment_number;

      // payment_completed 테이블에 데이터 삽입
      await client.query(
        `INSERT INTO payment_completed (payments_key, order_id, amount, payment_number) 
         VALUES ($1, $2, $3, $4)`,
        [paymentKey, orderId, amount, payment_number]
      );

      // pt_schedule 상태 업데이트
      await client.query(
        `UPDATE pt_schedule SET status = 'completed' 
         WHERE pt_number = $1`,
        [orderId]
      );
    } else {
      // 결제 실패 처리
      await client.query(
        `UPDATE pt_schedule SET status = 'cancelled' 
         WHERE pt_number = $1`,
        [orderId]
      );
    }

    await client.query("COMMIT");
    res.status(200).send("Webhook processed successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Payment webhook processing error:", error);
    res.status(500).send("Error processing webhook");
  } finally {
    client.release();
  }
};

exports.getPtSchedule = async (req, res) => {
  const { user_number, trainer_number, amount_number } = req.params;

  try {
    const result = await database.query(
      `SELECT 
        ps.pt_number,
        ps.created_at,
        ps.status,
        u.name AS user_name,    -- 유저 이름
        t.name AS trainer_name, -- 트레이너 이름
        p.amount AS amount,     -- 가격
        p.frequency AS frequency -- 횟수
      FROM 
        pt_schedule ps
      LEFT JOIN 
        users u ON ps.user_number = u.user_number
      LEFT JOIN 
        trainers t ON ps.trainer_number = t.trainer_number
      LEFT JOIN 
        pt_cost_option p ON ps.amount_number = p.amount_number
      WHERE 
        ps.user_number = $1 AND 
        ps.trainer_number = $2 AND 
        ps.amount_number = $3`,
      [user_number, trainer_number, amount_number]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "해당 조건에 맞는 PT 스케줄을 찾을 수 없습니다." });
    }

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching PT schedule:", error);
    return res
      .status(500)
      .json({ error: "PT 스케줄을 가져오는 중 오류가 발생했습니다." });
  }
};
