const jwt = require("jsonwebtoken");
require("dotenv").config();

const authMiddleware = async (req, res, next) => {
  console.log("Authorization header:", req.headers["authorization"]); // 추가

  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "토큰이 제공되지 않았습니다." });
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT 비밀키가 설정되지 않았습니다.");
    }

    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error(err);
    return res
      .status(err.name === "JsonWebTokenError" ? 403 : 500)
      .json({ error: err.message });
  }
};

module.exports = { authMiddleware };
