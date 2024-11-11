const express = require('express');
const router = express.Router();

const {
  postPtPayment,
  ptPaymentCompleted,
  getPtSchedule,
} = require("../controller/paymentController");

// PT 결제 생성
router.post('/pt-payments', postPtPayment);

// PT 결제 완료 처리
router.post("/pt-payments/:payment_number/completed", ptPaymentCompleted);

// PT 결제정보 가져오기
router.get("/pt-schedules", getPtSchedule);

module.exports = router;
