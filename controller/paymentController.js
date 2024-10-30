const database = require("../../database/database");

exports.postPtPayment = async (req, res) => {
  const { amount_number, user_number, trainer_number, payment_option } =
    req.body;

  const client = await database.connect();

  try {
    await client.query("BEGIN");

    // PT 스케줄 생성
    const scheduleResult = await client.query(
      `INSERT INTO pt_schedule (status) 
       VALUES ('progress') 
       RETURNING pt_number`
    );

    const pt_number = scheduleResult.rows[0].pt_number;

    // 결제 정보 생성
    await client.query(
      `INSERT INTO pt_payment (payment_option) 
       VALUES ($1)`,
      [payment_option]
    );

    await client.query("COMMIT");

    // 여기서 토스페이먼츠 결제 초기화 로직을 호출할 수 있습니다.
    // const paymentInitResult = await initializeTossPayment(pt_number, amount);

    res.status(201).json({
      message: "PT schedule created and payment initiated",
      pt_number: pt_number,
      // paymentInitResult: paymentInitResult // 토스페이먼츠 초기화 결과
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

exports.postPtPaymentCompleted = async (req, res) => {
  const { paymentKey, orderId, status } = req.body;

  // 웹훅 검증 로직 (토스페이먼츠 문서 참조)

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
        `INSERT INTO payment_completed (payments_key, order_id) 
         VALUES ($1, $2)`,
        [paymentKey, orderId]
      );

      // pt_schedule 상태 업데이트
      await client.query(
        `UPDATE pt_schedule SET status = 'progress' 
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
