const express = require("express");
const router = express.Router();
const {
  createRefund,
  getRefund,
  getAllRefund,
  updateRefund,
  deleteRefund,
} = require("../controller/refundController");

// 환불 사유 생성
router.post("/refund-reasons", createRefund);

// 모든 환불 사유 조회
router.get("/refund-reasons", getAllRefund);

// 특정 환불 사유 조회
router.get("/refund-reasons/:refund_number", getRefund);

// 환불 사유 수정
router.patch("/refund-reasons/:refund_number", updateRefund);

// 환불 사유 상태 변경 (삭제)
router.delete("/refund-reasons/:refund_number", deleteRefund);

module.exports = router;
