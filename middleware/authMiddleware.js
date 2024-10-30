const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "토큰이 제공되지 않았습니다." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "유효하지 않은 토큰입니다." });
    }

    req.user = decoded;
    next();
  });
};

module.exports = authMiddleware;
