const router = require("express").Router();
const {
  postUserInbody,
  getUsers,
  getUserPage,
  getUserInbody,
  deleteUser,
  deleteUserInbody,
  deleteUserAddress,
} = require("../controller/userController");

const {
  updateUserInfo,
  updateUserAddress,
  updateUserInbody,
} = require("../controller/patchInfoUser");

// 인바디 정보 저장
router.post("/inbody/:user_number", postUserInbody);

// 모든 사용자 조회
router.get("/users", getUsers);

// 특정 사용자 페이지 정보 조회
router.get("/page/:user_number", getUserPage);

// 특정 사용자의 인바디 정보 조회
router.get("/inbody/:user_number", getUserInbody);

// 사용자 소프트 삭제
router.delete("/:user_number", deleteUser);

// 사용자 인바디 정보 소프트 삭제
router.patch("/inbody/:user_inbody_number", deleteUserInbody);

// 사용자 주소 소프트 삭제
router.delete("/address/:user_number", deleteUserAddress);

// 사용자 기본 정보 업데이트
router.patch("/user/:user_number/info", updateUserInfo);

// 사용자 주소 정보 업데이트
router.patch("/user/:user_number/address", updateUserAddress);

// 사용자 인바디 정보 업데이트
router.patch("/inbody/:user_inbody_number", updateUserInbody);

module.exports = router;
