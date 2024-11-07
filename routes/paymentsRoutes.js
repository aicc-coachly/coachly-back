const express = require('express');
const router = express.Router();

const {
  postPtPayment,
  ptPaymentCompleted,
} = require('../controller/paymentController');

// PT 결제 생성
router.post('/pt-payments', postPtPayment);

// PT 결제 완료 처리
router.post('/pt-payments/:payment_number/completed', ptPaymentCompleted);

module.exports = router;
