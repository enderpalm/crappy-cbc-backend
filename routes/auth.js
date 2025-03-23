const express = require("express");
const {
  register,
  login,
  logout,
  getMe,
  updateUser,
} = require("../controllers/auth");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.get("/logout", verifyToken, logout);
router.get("/me", verifyToken, getMe);
router.put("/update", verifyToken, updateUser);

module.exports = router;
