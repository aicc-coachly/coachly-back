const database = require("../database/database");
const got = require("got"); // got v11 사용

// PT 결제 생성 함수
exports.postPtPayment = async (req, res) => {
  const { user_number, trainer_number, payment_option, amount_number } =
    req.body;

  const client = await database.connect();

  try {
    console.log("데이터베이스 연결 성공");

    await client.query("BEGIN");
    console.log("트랜잭션 시작");

    // PT 스케줄 생성
    const scheduleResult = await client.query(
      `INSERT INTO pt_schedule (status, user_number, trainer_number, amount_number) 
       VALUES ($1, $2, $3, $4) 
       RETURNING pt_number`,
      ["progress", user_number, trainer_number, amount_number]
    );

    console.log("PT 스케줄 생성 결과:", scheduleResult.rows);

    const pt_number = scheduleResult.rows[0].pt_number;

    // 결제 정보 생성 및 payment_number 반환
    const paymentResult = await client.query(
      `INSERT INTO pt_payment (payment_option, pt_number, payments_status) 
       VALUES ($1, $2, $3)
       RETURNING payment_number`,
      [payment_option, pt_number, true]
    );
    console.log("PT 결제 정보 생성 결과:", paymentResult.rows);

    const payment_number = paymentResult.rows[0].payment_number;

    await client.query("COMMIT");
    console.log("Request Body:", req.body);
    console.log("트랜잭션 커밋 성공");

    res.status(201).json({
      message: "PT schedule created and payment initiated",
      pt_number: pt_number,
      payment_number: payment_number,
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

// PT 결제 완료 및 시크릿 키 검증 함수
exports.ptPaymentCompleted = async (req, res) => {
  const { paymentKey, orderId, amount, ptNumber } = req.body;
  console.log("Received data from client:", { paymentKey, orderId, amount });

  if (!paymentKey || !orderId || !amount) {
    console.log("Missing required parameters");
    res.status(400).json({ error: "Missing required parameters" });
    return;
  }
  const secretKey = process.env.WIDGET_SECRET_KEY;
  const authHeader = "Basic " + Buffer.from(secretKey + ":").toString("base64");
  const client = await database.connect();

  let response; // response를 try 블록 외부에 선언

  try {
    await client.query("BEGIN");
    console.log("Transaction started");

    // TossPayments API 호출로 결제 검증
    try {
      response = await got.post(
        "https://api.tosspayments.com/v1/payments/confirm",
        {
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
          json: {
            paymentKey,
            orderId,
            amount: parseInt(amount),
          },
          responseType: "json",
        }
      );
      console.log("TossPayments API Response:", response.body);
    } catch (error) {
      console.error(
        "Payment processing error response:",
        error.response ? error.response.body : error.message
      );
      await client.query("ROLLBACK");
      res
        .status(500)
        .json({ error: "Failed to verify payment with TossPayments" });
      return;
    }

    // TossPayments 응답 확인 후 성공 처리
    if (response && response.body.status === "DONE") {
      console.log("Payment confirmed by TossPayments");
      const paymentResult = await client.query(
        `UPDATE pt_payment SET payments_status = TRUE
         WHERE pt_number = $1
         RETURNING payment_number`,
        [ptNumber]
      );

      if (paymentResult.rows.length === 0) {
        throw new Error("Payment not found");
      }

      const payment_number = paymentResult.rows[0].payment_number;

      await client.query(
        `INSERT INTO payment_completed (payments_key,payment_number, order_id, amount) 
         VALUES ($1, $2, $3,$4)`,
        [paymentKey, payment_number, orderId, amount]
      );

      await client.query("COMMIT");
      console.log("Transaction committed successfully");
      res
        .status(200)
        .json({ message: "Payment processed successfully", payment_number });
    } else {
      // 결제 실패 시 처리
      await client.query(
        `UPDATE pt_schedule SET status = 'cancelled' 
         WHERE pt_number = $1`,
        [orderId]
      );
      await client.query("COMMIT");
      console.log("Payment failed");
      res.status(400).json({ message: "Payment failed" });
    }
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Payment processing error:", error.message);
    res.status(500).json({ error: "Error processing payment" });
  } finally {
    client.release();
  }
};

exports.getPtSchedule = async (req, res) => {
  const { user_number, trainer_number } = req.query;

  if (!user_number && !trainer_number) {
    return res
      .status(400)
      .json({ error: "유저 번호 또는 트레이너 번호가 필요합니다." });
  }

  try {
    const result = await database.query(
      `SELECT 
        ps.pt_number,
        ps.created_at,
        ps.status,
        u.name AS user_name,
        u.user_number,
        t.name AS trainer_name,
        t.trainer_number AS  trainer_number,
        p.amount AS amount,
        p.frequency AS frequency
      FROM 
        pt_schedule ps
      LEFT JOIN 
        users u ON ps.user_number = u.user_number
      LEFT JOIN 
        trainers t ON ps.trainer_number = t.trainer_number
      LEFT JOIN 
        pt_cost_option p ON ps.amount_number = p.amount_number
      WHERE 
        (ps.user_number = $1 OR ps.trainer_number = $2)`,
      [user_number || null, trainer_number || null] // user_number나 trainer_number가 없으면 null로 처리
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
