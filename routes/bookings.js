const express = require("express");
const {
  getBookings,
  getBooking,
  addBooking,
  deleteBooking,
  updateBooking,
  getCount,
} = require("../controllers/bookings");
const router = express.Router({ mergeParams: true });
const { verifyToken, authorize } = require("../middleware/auth");

router
  .route("/")
  .get(verifyToken, getBookings)
  .post(verifyToken, authorize("admin", "user"), addBooking);
router
  .route("/:id")
  .get(verifyToken, getBooking)
  .put(verifyToken, authorize("admin", "user"), updateBooking)
  .delete(verifyToken, authorize("admin", "user"), deleteBooking);

module.exports = router;
