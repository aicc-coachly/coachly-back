const router = require("express").Router();

const {
  getTrainers,
  getTrainer,
  getTrainerPtAmount,
  getTrainerGymAddress,
  getTrainerAccount,
  deleteTrainer,
  deleteTrainerPtamount,
  deleteTrainerAddress,
  deleteTrainerAccount,
} = require("../controller/trainerController");

const {
  updateTrainerInfo,
  updateTrainerAddress,
  updateTrainerPtAmount,
  updateTrainerAccount,
} = require("../controller/patchInfoTrainer");

// 모든 트레이너 조회
router.get("/trainers", getTrainers);

// 특정 트레이너 조회
router.get("/trainer/:trainer_number", getTrainer);

// 특정 트레이너의 PT 가격 정보 조회
router.get("/trainer/:trainer_number/pt-cost-option", getTrainerPtAmount);

// 특정 트레이너의 헬스장 주소 조회
router.get("/trainer/:trainer_number/gym-address", getTrainerGymAddress);

// 특정 트레이너의 계좌 정보 조회
router.get("/trainer/:trainer_number/account", getTrainerAccount);

// 트레이너 소프트 삭제
router.delete("/trainer/:trainer_number", deleteTrainer);

// 트레이너 PT 가격 정보 소프트 삭제
router.delete("/trainer/:trainer_number/pt-cost-option", deleteTrainerPtamount);

// 트레이너 헬스장 주소 소프트 삭제
router.delete("/trainer/:trainer_number/gym-address", deleteTrainerAddress);

// 트레이너 계좌 정보 소프트 삭제
router.delete("/trainer/:trainer_number/account", deleteTrainerAccount);

// 트레이너 정보 업데이트
router.patch("/trainer/:trainer_number/info", updateTrainerInfo);

// 트레이너 주소 업데이트
router.patch("/trainer/:trainer_number/gym-address", updateTrainerAddress);

// 트레이너 PT 가격 정보 업데이트
router.patch("/trainer/:trainer_number/pt-cost-option", updateTrainerPtAmount);

// 트레이너 계좌 정보 업데이트
router.patch("/trainer/:trainer_number/account", updateTrainerAccount);

module.exports = router;
