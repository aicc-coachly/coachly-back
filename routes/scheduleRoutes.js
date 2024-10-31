const express = require("express");
const router = express.Router();

const {
  postPtSchedule,
  completePtSchedule,
  completePaycheck,
  updatePtSchedule,
  deletePtSchedule,
} = require("../controller/scheduleController");

// PT 일정 등록
router.post("/pt-schedules", postPtSchedule);

// PT 일정 완료
router.post("/pt-schedules/:schedule_number/completed", completePtSchedule);

// 페이 체크 완료
router.post("/paychecks/:paycheck_number/completed", completePaycheck);

// PT 일정 수정
router.patch("/pt-schedules/:schedule_number", updatePtSchedule);

// PT 일정 삭제
router.delete("/pt-schedules/:schedule_number", deletePtSchedule);

module.exports = router;
